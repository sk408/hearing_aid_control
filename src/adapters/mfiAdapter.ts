/**
 * MFi / LEA universal hearing-aid adapter — Web Bluetooth port.
 *
 * Ported from the proven React Native implementation (reference/mfiAdapter.ts,
 * TASK13 live-tested against ReSound aids). Implements remote control using
 * ONLY the standardized MFi/LEA control surface — no brand-specific cores,
 * no GN crypto, no POLARIS, no ASHA. One adapter, any MFi hearing aid.
 *
 * Protocol reference: reference/MFI_SPEC.md (GN Palpatine6 firmware 6.7.4.1
 * GATT dump). LEA service: 7d74f4bd-c74a-4431-862c-cce884371592
 *
 * Key facts from the spec:
 *  - LEA control characteristics require only an ENCRYPTED (bonded) BLE link;
 *    they are NOT gated on MFi auth completion (spec §4.2). On the web there
 *    is no createBond(): Chrome triggers OS pairing implicitly on first
 *    access to an encrypted characteristic. The transport reconnects and
 *    re-discovers after the pairing-triggered disconnect.
 *  - Volume: 1-byte attenuation per channel, range 1–255, monotonic with
 *    loudness (spec §3.1). RC table reference points:
 *    {1,13,36,59,82,105,128,151,174,197,220,243,255}.
 *  - Programs: LEAAvailablePrograms is a 4-byte LE bitmask (bit N = program N
 *    fitted); firmware REJECTS writes of invalid indices (spec §3.2), so the
 *    index is validated against the bitmask before writing.
 *  - Mute: no dedicated characteristic — emulated by writing 0 to the mic
 *    attenuation and restoring the stored value on unmute (spec §3.1).
 *    EXPERIMENTAL: firmware treatment of 0 vs 1 is unconfirmed (spec §4.7).
 *  - Program names: write index to LEAProgramNameSelector, then read
 *    LEAProgramName (60-byte UTF-8) (spec §3.2).
 *
 * Binaural sets (port of RN TASK14):
 *  - One adapter can manage TWO GATT connections (a left+right pair). The
 *    primary rides the shared transport from AdapterContext; the secondary
 *    gets its own WebBleTransport instance.
 *  - Web has no background scan, so the secondary arrives either via an
 *    explicit "add other ear" requestDevice chooser (addSecondaryEar) or
 *    automatically from navigator.bluetooth.getDevices() when a previously
 *    granted device matches the set heuristics (see src/brand/mfiSets.ts).
 *  - Writes default to BOTH aids (`writeToBoth = true`): ear-to-ear sync is
 *    not universal, and on aids that DO sync the duplicated write is
 *    harmless. Per-ear writes are still possible via the ear selector.
 *  - Battery is read from BOTH aids. Single-sided operation degrades
 *    gracefully: if the secondary fails to connect — or drops mid-session —
 *    the adapter keeps controlling the surviving aid.
 *
 * This file intentionally imports NO brand-core code.
 */
import { isAuthError, pairingGuidance, type BondState } from "../brand/bond";
import { LEA_SERVICE_UUID, markVerifiedMfi, isVerifiedMfi, loadLastSet, saveLastSet, splitNameAndSide, suggestSetSibling } from "../brand/mfiSets";
import type { DeviceProfile } from "../capability/capabilityEngine";
import type { Operation } from "../domain/model";
import type { Transport } from "../transport/types";
import { WebBleTransport } from "../transport/webBleTransport";
import { BaseAdapter } from "./baseAdapter";
import type { AdapterContext, DriverState, ProgramInfo } from "./types";

// ── LEA (MFi Hearing Aid) characteristics (MFI_SPEC.md §1.1) ──

const LEA_SERVICE = LEA_SERVICE_UUID;

/** Mic path volume — R/W/N, 1 byte, 1–255 monotonic with loudness */
const LEA_MIC_ATTENUATION = "f3f594f9-e210-48f3-85e2-4b0cf235a9d3";
/** Streaming path volume — R/W/N, 1 byte, 1–255 */
const LEA_STREAM_ATTENUATION = "6ac46200-24ea-46d8-a136-81133c65840a";
/** Fitted programs — R, 4-byte LE bitmask, bit N = program N fitted */
const LEA_AVAILABLE_PROGRAMS = "21ff4275-c41d-4486-a0e3-dc11138bcde6";
/** Active program index — R/W/N, 1 byte */
const LEA_CURRENT_ACTIVE_PROGRAM = "a391c6f1-20bb-495a-abbf-2017098fbc61";
/** Battery percent — R/N, 1 byte, 0–100 */
const LEA_BATTERY_LEVEL = "24e1dff3-ae90-41bf-bfbd-2cf8df42bf87";
/** Mono side — R, 1 byte, 0=left / 1=right */
const LEA_LEFT_RIGHT = "8d17ac2f-1d54-4742-a49a-ef4b20784eb3";
/** Selects which program the name I/O applies to — R/W, 1 byte */
const LEA_PROGRAM_NAME_SELECTOR = "a28b6be1-2fa4-42f8-aeb2-b15a1dbd837a";
/** UTF-8 name of the selected program — R/W, 60-byte fixed field */
const LEA_PROGRAM_NAME = "7be94a55-8d91-4592-bc0f-ea3664ccd3a9";

/**
 * LEA characteristics that require an ENCRYPTED/bonded link (confirmed live
 * against ReSound GN aids: battery/side/DIS read fine unbonded, these fail).
 * Secured subscriptions are only armed once bondState === 'bonded'.
 */
const SECURED_CHARACTERISTICS: ReadonlySet<string> = new Set(
  [
    LEA_MIC_ATTENUATION,
    LEA_STREAM_ATTENUATION,
    LEA_AVAILABLE_PROGRAMS,
    LEA_CURRENT_ACTIVE_PROGRAM,
    LEA_PROGRAM_NAME_SELECTOR,
    LEA_PROGRAM_NAME
  ].map((uuid) => uuid.toLowerCase())
);

// ── Device Information Service (display only — no brand logic) ──

const DIS_MANUFACTURER_NAME = "00002a29-0000-1000-8000-00805f9b34fb";

/** Services declared up front when the secondary ear chooser is shown. */
const MFI_OPTIONAL_SERVICES: readonly BluetoothServiceUUID[] = [
  LEA_SERVICE,
  "0000180a-0000-1000-8000-00805f9b34fb",
  "0000180f-0000-1000-8000-00805f9b34fb"
];

// ── Volume mapping (spec §3.1) ──
//
// GATT byte range is 1–255, monotonic with loudness; the UI slider is 0–100.
// Linear map: 0 → 1 (min), 100 → 255 (max), 50 ≈ 128 (RC mid step 6).

const MFI_VOLUME_MIN = 1;
const MFI_VOLUME_MAX = 255;

export function volumeToMfi(level: number): number {
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  return MFI_VOLUME_MIN + Math.round((clamped * (MFI_VOLUME_MAX - MFI_VOLUME_MIN)) / 100);
}

export function mfiToVolume(mfi: number): number {
  const clamped = Math.max(MFI_VOLUME_MIN, Math.min(MFI_VOLUME_MAX, mfi));
  return Math.round(((clamped - MFI_VOLUME_MIN) * 100) / (MFI_VOLUME_MAX - MFI_VOLUME_MIN));
}

/** Decode a 60-byte fixed UTF-8 field, trimming at the first NUL */
function bytesToUtf8(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  const slice = end >= 0 ? bytes.slice(0, end) : bytes;
  return new TextDecoder("utf-8").decode(slice).trim();
}

/** Retry wrapper for transient BLE failures (pairing-triggered drops, GATT errors) */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

async function withRetry<T>(op: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await op();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (i + 1)));
      }
    }
  }
  throw lastError;
}

type Ear = "left" | "right";

/** One GATT link to a single aid (the adapter can hold two for a set) */
interface MemberLink {
  transport: Transport;
  id: string;
  name: string;
  battery: number | null;
}

// ── Adapter ──

export class MfiAdapter extends BaseAdapter {
  public readonly brand = "mfi" as const;

  // Primary aid link (write target by default) — the shared context transport.
  private readonly primaryId: string;
  private readonly primaryName: string;

  // Secondary aid link (binaural set member) — null in single-sided mode
  private secondary: MemberLink | null = null;

  /** Ear side of the primary aid (set mode). Default right. */
  public primarySide: Ear = "right";

  /** True once the primary's side was actually detected (side char or name marker). */
  private primarySideKnown = false;

  /**
   * Binaural write policy. The default (true) writes to BOTH aids: not all
   * sets sync volume/program ear-to-ear, and a wearer must never end up with
   * one ear changed and the other not. On sets that DO sync over their own
   * ear-to-ear link the duplicated write is harmless. Per-ear writes via the
   * 'left'/'right' ear selector always route to that specific aid regardless
   * of this flag; set false to restore primary-only writes.
   */
  public writeToBoth = true;

  // Cached state (seeded from reads, kept current by notifications).
  // In set mode these track the SET state — binaural aids sync between ears,
  // so notifications from either member update the shared cache.
  private cachedVolume = 50;
  private cachedStreamVolume = 50;
  private cachedMuted = false;
  private cachedProgram = 0;
  private cachedBattery: number | null = null;
  private cachedPrograms: readonly ProgramInfo[] = [];
  private availableProgramsMask: number | null = null;
  private manufacturerName: string | null = null;

  /** Pre-mute attenuation for mute emulation restore (spec §3.1) */
  private preMuteMicAtt: number | null = null;

  /**
   * Inferred bond state of the primary link (web has no bond-state API — see
   * src/brand/bond.ts). 'bonded' once a secured read succeeds, 'needs-pairing'
   * when secured accesses fail while unsecured reads (battery/side) succeed.
   */
  private bondStateValue: BondState = "unknown";

  /** Optional UI hook (assigned by the app shell) fired on every bondState change. */
  public onBondStateChange: ((state: BondState) => void) | null = null;

  /**
   * Delay before the single lazy-pairing retry of the secured seed reads.
   * Some OS stacks complete pairing lazily on first secured access, so the
   * first attempt can fail while the link finishes bonding in the background.
   * Mutable for tests.
   */
  public lazyPairingRetryDelayMs = 2000;

  // Dedupes the post-reconnect bond probe across one restore pass.
  private lastBondProbeAt = 0;
  private lastBondProbe: Promise<boolean> | null = null;

  public constructor(
    context: AdapterContext,
    profile: Pick<DeviceProfile, "deviceId" | "deviceName"> = {}
  ) {
    super(context);
    this.primaryId = profile.deviceId ?? "unknown";
    this.primaryName = profile.deviceName ?? "MFi hearing aid";
  }

  /** True when managing a two-aid binaural set */
  public get isSet(): boolean {
    return this.secondary != null;
  }

  /** Inferred bond state of the link (see src/brand/bond.ts). */
  public get bondState(): BondState {
    return this.bondStateValue;
  }

  private setBondState(state: BondState): void {
    if (this.bondStateValue === state) return;
    this.bondStateValue = state;
    this.log(`Bond state: ${state}`);
    this.onBondStateChange?.(state);
  }

  private get primary(): Transport {
    return this.context.transport;
  }

  // ── Byte-level helpers ──

  /** Read a single-byte LEA characteristic from a specific aid */
  private async readByteFrom(transport: Transport, charUuid: string, retries = MAX_RETRIES): Promise<number> {
    const value = await withRetry(() => transport.read(charUuid), retries);
    if (value.length === 0) throw new Error(`MfiAdapter: empty read on ${charUuid}`);
    return value[0];
  }

  /** Write a single-byte LEA characteristic to a specific aid (Write Request) */
  private async writeByteTo(transport: Transport, charUuid: string, value: number): Promise<void> {
    await withRetry(() => transport.write(charUuid, new Uint8Array([value & 0xff])));
  }

  private readByte(charUuid: string, retries = MAX_RETRIES): Promise<number> {
    return this.readByteFrom(this.primary, charUuid, retries);
  }

  /**
   * Resolve which aids receive a write for the given ear selector.
   *  - Single-sided: always the one connected aid.
   *  - ear 'left'/'right' (unlinked UI sliders): that specific aid.
   *  - 'both': BOTH aids by default (writeToBoth = true — see the field
   *    comment), or the primary only when writeToBoth is disabled.
   * A set member whose link has dropped is skipped so the survivor keeps
   * working.
   */
  private writeTargets(ear: "left" | "right" | "both" | undefined): Transport[] {
    if (!this.secondary) return [this.primary];
    if (ear === "left" || ear === "right") {
      return [this.primarySide === ear ? this.primary : this.secondary.transport];
    }
    const targets = this.writeToBoth ? [this.primary, this.secondary.transport] : [this.primary];
    return targets.filter((target) => target.getConnectionState() !== "disconnected");
  }

  /**
   * Write one byte to every resolved target. A failing set member does not
   * abort the write to the others — the surviving aid must stay controllable
   * when its sibling drops. The first error is rethrown only when EVERY
   * target failed.
   */
  private async writeByteToTargets(targets: readonly Transport[], charUuid: string, value: number): Promise<void> {
    if (targets.length === 0) {
      throw new Error("MfiAdapter: no connected hearing aid available for this write");
    }
    let firstError: unknown = null;
    let succeeded = 0;
    for (const target of targets) {
      try {
        await this.writeByteTo(target, charUuid, value);
        succeeded += 1;
      } catch (error) {
        firstError = firstError ?? error;
        this.log(`Write to one set member failed (${charUuid}): ${(error as Error).message}`);
      }
    }
    if (succeeded === 0 && firstError) {
      throw firstError;
    }
  }

  /**
   * Read the LEAAvailablePrograms 4-byte LE bitmask.
   * Returns a u32 where bit N set = program N (0–15) fitted.
   */
  private async readAvailableProgramsMask(): Promise<number> {
    const bytes = await withRetry(() => this.primary.read(LEA_AVAILABLE_PROGRAMS));
    if (bytes.length === 0) throw new Error("MfiAdapter: empty AvailablePrograms read");
    let mask = 0;
    for (let i = 0; i < Math.min(4, bytes.length); i++) {
      mask |= bytes[i] << (8 * i);
    }
    // Convert to unsigned 32-bit
    this.availableProgramsMask = mask >>> 0;
    return this.availableProgramsMask;
  }

  /** True if program index is fitted per the available-programs bitmask */
  private isProgramFitted(index: number): boolean {
    if (index < 0 || index > 15) return false;
    if (this.availableProgramsMask == null) return true; // not read yet — don't block
    return (this.availableProgramsMask & (1 << index)) !== 0;
  }

  /** Opportunistic read of the mono-side characteristic (0=left / 1=right) */
  private async readSide(transport: Transport): Promise<Ear | null> {
    try {
      const value = await this.readByteFrom(transport, LEA_LEFT_RIGHT);
      return value === 0 ? "left" : "right";
    } catch {
      return null;
    }
  }

  // ── Connection ──

  /**
   * Set up the primary aid. The transport is already connected and discovered
   * by the app shell; here we seed state and arm notifications.
   * Bonding note (web): there is no createBond(). The LEA control
   * characteristics require an encrypted/bonded link (confirmed live), and
   * Chrome on Windows does not reliably auto-trigger OS pairing on secured
   * access — so the secured seed reads double as the bond probe: if they fail
   * while the unsecured reads (battery/side/DIS) succeed, bondState becomes
   * 'needs-pairing' and the UI shows pairing guidance. One lazy retry rides
   * out stacks that complete pairing in the background on first secured
   * access.
   */
  public override async connect(): Promise<void> {
    // Piggyback verification (TASK16 port): this adapter is only constructed
    // after detection found the LEA service, so the id goes straight into the
    // verified-MFi set.
    markVerifiedMfi(this.primaryId, this.primaryName);

    // Unsecured reads first — their success is the control signal that
    // distinguishes "link up but unbonded" from a broken link.

    // DIS manufacturer name for display only (no brand logic — spec §1)
    try {
      const value = await this.primary.read(DIS_MANUFACTURER_NAME);
      this.manufacturerName = bytesToUtf8(value) || null;
      this.log(`DIS manufacturer: ${this.manufacturerName ?? "unavailable"}`);
    } catch {
      this.log("DIS manufacturer name not available");
    }

    // Mono side (used for set primary/secondary assignment and L/R labels).
    // Prefer the 8d17ac2f side characteristic; fall back to the advertised
    // name's L/R marker when the read is unavailable.
    const side = await this.readSide(this.primary);
    if (side) {
      this.primarySide = side;
      this.primarySideKnown = true;
    } else {
      const nameSide = splitNameAndSide(this.primaryName).side;
      if (nameSide) {
        this.primarySide = nameSide;
        this.primarySideKnown = true;
        this.log(`Side characteristic unreadable — using name marker: ${nameSide}`);
      }
    }

    let unsecuredOk = side != null;
    try {
      this.cachedBattery = await this.readByte(LEA_BATTERY_LEVEL);
      unsecuredOk = true;
    } catch {
      this.log("Initial battery read failed");
    }

    // Secured seed reads (bond probe) with one lazy-pairing retry.
    let securedOk = await this.seedSecuredState();
    if (!securedOk) {
      this.log(`Secured reads failed — waiting ${this.lazyPairingRetryDelayMs}ms for lazy OS pairing, then retrying once`);
      await new Promise<void>((resolve) => setTimeout(resolve, this.lazyPairingRetryDelayMs));
      securedOk = await this.seedSecuredState();
    }

    if (securedOk) {
      this.setBondState("bonded");
    } else if (unsecuredOk) {
      // The insufficient-authentication pattern: unsecured reads work, every
      // secured read fails → the aids are not paired with this computer.
      this.setBondState("needs-pairing");
      this.log(pairingGuidance(this.primaryName));
    } else {
      this.setBondState("unknown");
      this.log("Secured reads failed and unsecured reads failed too — link problem, not (only) pairing");
    }

    // Battery notify is unsecured — always arm it. The secured notification
    // subscriptions are queued until bondState === 'bonded'.
    this.subscribePrimaryNotifications();

    // Gate post-reconnect re-subscribes through the bond probe.
    this.installResubscribeFilter(this.primary);

    // Auto-merge a binaural set member when one is already granted
    // (getDevices) and matches the grouping heuristics / last-set metadata.
    await this.tryAutoSecondary();

    this.log("Primary connection setup complete");
  }

  /**
   * Seed state from the secured LEA characteristics. Returns true when the
   * core secured reads succeeded (i.e. the link is bonded). Seed reads use a
   * single attempt each — the caller's lazy-pairing retry is the recovery
   * path, and auth failures are not helped by immediate retries.
   */
  private async seedSecuredState(): Promise<boolean> {
    let ok = true;
    try {
      this.cachedVolume = mfiToVolume(await this.readByte(LEA_MIC_ATTENUATION, 1));
    } catch {
      this.log("Initial mic attenuation read failed");
      ok = false;
    }
    try {
      this.cachedStreamVolume = mfiToVolume(await this.readByte(LEA_STREAM_ATTENUATION, 1));
    } catch {
      this.log("Initial stream attenuation read failed");
      ok = false;
    }
    try {
      this.cachedProgram = await this.readByte(LEA_CURRENT_ACTIVE_PROGRAM, 1);
    } catch {
      this.log("Initial program read failed");
      ok = false;
    }
    try {
      await this.readAvailableProgramsMask();
      this.log(`Available programs mask: 0x${(this.availableProgramsMask ?? 0).toString(16)}`);
    } catch {
      this.log("AvailablePrograms read failed");
      ok = false;
    }
    if (ok) {
      // Program names ride the secured characteristics too — only attempt
      // them on a bonded link.
      try {
        this.cachedPrograms = await this.readProgramNames();
      } catch {
        this.log("Program name reads failed");
      }
    }
    return ok;
  }

  /**
   * Retry the secured-read sequence after the user has paired the aids in the
   * OS Bluetooth settings (wired to the pairing banner's Retry button). On
   * success the queued secured subscriptions are armed.
   */
  public async retryBondedSetup(): Promise<BondState> {
    if (this.bondState === "bonded") return this.bondState;
    const ok = await this.seedSecuredState();
    if (ok) {
      this.setBondState("bonded");
      this.subscribeSecuredPrimary();
    } else {
      this.setBondState("needs-pairing");
      this.log(pairingGuidance(this.primaryName));
    }
    return this.bondState;
  }

  /** Subscribe to notifications so the cache tracks hardware button presses */
  private subscribePrimaryNotifications(): void {
    // Unsecured — always armed.
    void this.trySubscribe(this.primary, LEA_BATTERY_LEVEL, (value) => {
      this.cachedBattery = value[0];
      this.log(`Battery notify (primary): ${this.cachedBattery}%`);
    });

    if (this.bondState === "bonded") {
      this.subscribeSecuredPrimary();
    } else {
      this.log("Secured subscriptions queued until the link is bonded");
    }
  }

  /** Secured notification subscriptions — only armed on a bonded link. */
  private subscribeSecuredPrimary(): void {
    void this.trySubscribe(this.primary, LEA_MIC_ATTENUATION, (value) => {
      this.cachedVolume = mfiToVolume(value[0]);
      this.log(`Mic attenuation notify: ${value[0]} (${this.cachedVolume}%)`);
    });
    void this.trySubscribe(this.primary, LEA_STREAM_ATTENUATION, (value) => {
      this.cachedStreamVolume = mfiToVolume(value[0]);
      this.log(`Stream attenuation notify: ${value[0]} (${this.cachedStreamVolume}%)`);
    });
    void this.trySubscribe(this.primary, LEA_CURRENT_ACTIVE_PROGRAM, (value) => {
      this.cachedProgram = value[0];
      this.log(`Program notify: ${this.cachedProgram}`);
    });
  }

  /**
   * Install the transport's post-reconnect resubscribe gate: unsecured
   * subscriptions (battery) are always re-armed; secured ones only after a
   * probe secured read succeeds. On probe failure the adapter goes through
   * the pairing-guidance path instead of logging dead re-subscribe errors.
   */
  private installResubscribeFilter(transport: Transport): void {
    transport.resubscribeFilter = async (uuid: string): Promise<boolean> => {
      if (!SECURED_CHARACTERISTICS.has(uuid.toLowerCase())) return true;
      if (await this.probeBond(transport)) return true;
      this.setBondState("needs-pairing");
      this.log(`Re-subscribe of ${uuid} deferred — link is not bonded`);
      return false;
    };
  }

  /**
   * Probe the bond state with a single secured read. Probes are deduped
   * across one restore pass (the transport queries the filter per
   * subscription, sequentially).
   */
  private probeBond(transport: Transport): Promise<boolean> {
    const now = Date.now();
    if (this.lastBondProbe && now - this.lastBondProbeAt < 5000) {
      return this.lastBondProbe;
    }
    this.lastBondProbeAt = now;
    this.lastBondProbe = this.readByteFrom(transport, LEA_MIC_ATTENUATION, 1)
      .then(() => {
        this.setBondState("bonded");
        return true;
      })
      .catch(() => false);
    return this.lastBondProbe;
  }

  private async trySubscribe(
    transport: Transport,
    charUuid: string,
    onValue: (value: Uint8Array) => void
  ): Promise<void> {
    try {
      await transport.subscribe(charUuid, (notification) => {
        if (notification.value.length === 0) return;
        onValue(notification.value);
      });
    } catch {
      this.log(`Subscription not available: ${charUuid}`);
    }
  }

  /**
   * Explicit "add other ear" flow: shows a second MFi-only requestDevice
   * chooser (must be called from a user-gesture handler). On failure the
   * adapter keeps running single-sided; the error is rethrown so the UI can
   * report it.
   */
  public async addSecondaryEar(): Promise<void> {
    if (this.secondary) return;
    const transport = new WebBleTransport(this.context.diagnostics);
    try {
      const info = await transport.connect([{ services: [LEA_SERVICE] }], MFI_OPTIONAL_SERVICES);
      await this.setupSecondary(transport, info.id, info.name);
    } catch (error) {
      await transport.disconnect().catch(() => undefined);
      this.secondary = null;
      throw error;
    }
  }

  /**
   * Auto-suggest/merge path: if a previously granted device (getDevices)
   * matches the last-set metadata or the grouping heuristics, connect it as
   * the secondary without any chooser. All failures are swallowed — the
   * adapter degrades to single-sided operation.
   */
  private async tryAutoSecondary(): Promise<void> {
    if (this.secondary) return;
    if (!("bluetooth" in navigator) || typeof navigator.bluetooth.getDevices !== "function") return;

    let granted: BluetoothDevice[];
    try {
      granted = await navigator.bluetooth.getDevices();
    } catch {
      return;
    }
    const others = granted.filter((device) => device.id !== this.primaryId);
    if (others.length === 0) return;

    // 1. Last-set metadata: the exact sibling this primary was paired with before.
    const last = loadLastSet();
    let candidate: BluetoothDevice | undefined;
    if (last && last.primaryId === this.primaryId) {
      candidate = others.find((device) => device.id === last.secondaryId);
    }

    // 2. Grouping heuristics over verified-MFi granted devices.
    if (!candidate) {
      const verified = others
        .filter((device) => isVerifiedMfi(device.id))
        .map((device) => ({ id: device.id, name: device.name ?? "" }));
      const suggestion = suggestSetSibling({ id: this.primaryId, name: this.primaryName }, verified);
      if (suggestion) {
        candidate = others.find((device) => device.id === suggestion.id);
      }
    }
    if (!candidate) return;

    const transport = new WebBleTransport(this.context.diagnostics);
    try {
      const info = await transport.connectGrantedDevice(candidate);
      await this.setupSecondary(transport, info.id, info.name);
      this.log(`Auto-merged set sibling: ${info.name}`);
    } catch {
      await transport.disconnect().catch(() => undefined);
      this.secondary = null;
      this.log("Auto secondary connect failed — continuing single-sided");
    }
  }

  /**
   * Shared secondary setup: verify LEA, seed battery, observe notifications.
   * Mirrors connectOne()/connectSet() secondary handling on the RN branch.
   */
  private async setupSecondary(transport: WebBleTransport, id: string, name: string): Promise<void> {
    const discovery = await transport.discover();
    const hasLea = discovery.services.some((uuid) => uuid.toLowerCase() === LEA_SERVICE);
    if (!hasLea) {
      throw new Error("MfiAdapter: LEA (MFi hearing aid) service not found on secondary device");
    }
    markVerifiedMfi(id, name);

    const link: MemberLink = { transport, id, name, battery: null };
    this.secondary = link;

    // Side reconciliation: prefer the primary's own side read; otherwise
    // infer primary as the opposite of the secondary's side.
    const secondarySide = await this.readSide(transport);
    if (secondarySide) this.primarySideKnown = true;
    if (secondarySide && this.primarySide === secondarySide) {
      this.primarySide = secondarySide === "left" ? "right" : "left";
    }

    try {
      link.battery = await this.readByteFrom(transport, LEA_BATTERY_LEVEL);
    } catch {
      this.log("Secondary initial battery read failed");
    }

    // Observe the secondary aid: battery (unsecured — always), plus
    // volume/program notifications (the set syncs over the ear-to-ear link,
    // so secondary notifications confirm the primary's writes took effect
    // across both ears). Secured subscriptions follow the bond state.
    void this.trySubscribe(transport, LEA_BATTERY_LEVEL, (value) => {
      link.battery = value[0];
      this.log(`Battery notify (secondary): ${value[0]}%`);
    });
    if (this.bondState === "bonded") {
      void this.trySubscribe(transport, LEA_MIC_ATTENUATION, (value) => {
        this.cachedVolume = mfiToVolume(value[0]);
        this.log(`Mic attenuation notify (secondary): ${value[0]}`);
      });
      void this.trySubscribe(transport, LEA_CURRENT_ACTIVE_PROGRAM, (value) => {
        this.cachedProgram = value[0];
        this.log(`Program notify (secondary): ${value[0]}`);
      });
    } else {
      this.log("Secondary secured subscriptions queued until the link is bonded");
    }

    // Gate post-reconnect re-subscribes on the secondary link too.
    this.installResubscribeFilter(transport);

    saveLastSet({ primaryId: this.primaryId, secondaryId: id, primarySide: this.primarySide });
    this.log("Secondary connection setup complete — set active");
  }

  public override async disconnect(): Promise<void> {
    if (this.secondary) {
      try {
        await this.secondary.transport.disconnect();
      } catch {
        // may already be disconnected
      }
      this.secondary = null;
    }
    await super.disconnect();
  }

  // ── Controls ──

  /**
   * Set mic-path volume (0–100 UI scale → 1–255 GATT attenuation byte).
   * Spec §3.1: byte is monotonic with loudness; GATT clients may write the
   * full 1–255 range (the 13-step RC table quantizes only the physical RC).
   *
   * In set mode: 'left'/'right' writes that specific aid; 'both' (default)
   * writes BOTH aids (writeToBoth default) so non-syncing sets stay balanced.
   */
  public async setVolume(level: number, ear?: "left" | "right" | "both"): Promise<void> {
    const att = volumeToMfi(level);
    await this.writeByteToTargets(this.writeTargets(ear), LEA_MIC_ATTENUATION, att);
    this.cachedVolume = Math.max(0, Math.min(100, Math.round(level)));
  }

  /**
   * Set streaming-path volume (0–100 UI scale → 1–255 GATT byte).
   * Applies while the aid is streaming (spec §3.1).
   */
  public async setStreamingVolume(level: number): Promise<void> {
    const att = volumeToMfi(level);
    await this.writeByteToTargets(this.writeTargets("both"), LEA_STREAM_ATTENUATION, att);
    this.cachedStreamVolume = Math.max(0, Math.min(100, Math.round(level)));
  }

  /**
   * Mute emulation (spec §3.1) — EXPERIMENTAL.
   * Mute: store current mic attenuation, write 0.
   * Unmute: restore the stored value (fallback: mid-scale 128).
   * Note: firmware treatment of byte 0 vs 1 is unconfirmed (spec §4.7 #4).
   * In set mode writes follow the same target policy as setVolume('both').
   */
  public async setMute(muted: boolean): Promise<void> {
    const targets = this.writeTargets("both");
    if (muted) {
      try {
        this.preMuteMicAtt = await this.readByte(LEA_MIC_ATTENUATION);
      } catch {
        this.preMuteMicAtt = volumeToMfi(this.cachedVolume);
      }
      await this.writeByteToTargets(targets, LEA_MIC_ATTENUATION, 0);
    } else {
      const restore = this.preMuteMicAtt ?? 128;
      await this.writeByteToTargets(targets, LEA_MIC_ATTENUATION, restore);
      this.preMuteMicAtt = null;
    }
    this.cachedMuted = muted;
  }

  /**
   * Switch program. Validates the index against the LEAAvailablePrograms
   * bitmask before writing — firmware rejects invalid indices (spec §3.2).
   * In set mode writes follow the same target policy as setVolume('both').
   */
  public async setProgram(index: number): Promise<void> {
    if (this.availableProgramsMask == null) {
      try {
        await this.readAvailableProgramsMask();
      } catch {
        // mask unavailable — attempt the write anyway and let firmware decide
      }
    }
    if (!this.isProgramFitted(index)) {
      throw new Error(
        `MfiAdapter: program ${index} is not fitted (mask 0x${(this.availableProgramsMask ?? 0).toString(16)})`
      );
    }
    await this.writeByteToTargets(this.writeTargets("both"), LEA_CURRENT_ACTIVE_PROGRAM, index);
    this.cachedProgram = index;
  }

  /**
   * Enumerate fitted programs from the bitmask, then read each name via
   * ProgramNameSelector → ProgramName (spec §3.2). Falls back to
   * "Program N+1" when a name read fails.
   */
  private async readProgramNames(): Promise<ProgramInfo[]> {
    const mask = await this.readAvailableProgramsMask();
    const programs: ProgramInfo[] = [];
    for (let i = 0; i < 16; i++) {
      if ((mask & (1 << i)) === 0) continue;

      let name = `Program ${i + 1}`;
      try {
        await this.writeByteTo(this.primary, LEA_PROGRAM_NAME_SELECTOR, i);
        const value = await withRetry(() => this.primary.read(LEA_PROGRAM_NAME));
        const decoded = bytesToUtf8(value);
        if (decoded) name = decoded;
      } catch {
        // keep placeholder name
      }
      programs.push({ index: i, name });
    }
    return programs;
  }

  /** Read LEABatteryLevel (0–100) from the primary aid. Returns -1 on failure. */
  public async getBattery(): Promise<number> {
    try {
      this.cachedBattery = await this.readByte(LEA_BATTERY_LEVEL);
      return this.cachedBattery;
    } catch {
      return this.cachedBattery ?? -1;
    }
  }

  /** Read LEABatteryLevel from the secondary aid (set mode). -1 on failure. */
  public async getBatterySecondary(): Promise<number> {
    const link = this.secondary;
    if (!link) return -1;
    try {
      link.battery = await this.readByteFrom(link.transport, LEA_BATTERY_LEVEL);
      return link.battery;
    } catch {
      return link.battery ?? -1;
    }
  }

  // ── BrandAdapter interface ──

  protected async executeInternal(
    operation: Operation,
    args: Record<string, number | boolean | string>
  ): Promise<void> {
    try {
      await this.executeSecured(operation, args);
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  /**
   * Map insufficient-authentication write failures to actionable pairing
   * guidance instead of a bare "GATT operation failed". Only applied when the
   * link is not known to be bonded — on a bonded link the same error text is
   * more likely a genuine GATT failure.
   */
  private mapWriteError(error: unknown): Error {
    const err = error instanceof Error ? error : new Error(String(error));
    if (this.bondState !== "bonded" && isAuthError(err)) {
      this.setBondState("needs-pairing");
      return new Error(pairingGuidance(this.primaryName));
    }
    return err;
  }

  private async executeSecured(
    operation: Operation,
    args: Record<string, number | boolean | string>
  ): Promise<void> {
    switch (operation) {
      case "SetVolume": {
        const ear = args.ear === "left" || args.ear === "right" ? args.ear : "both";
        await this.setVolume(Number(args.level ?? 50), ear);
        return;
      }
      case "SetStreamVolume":
        await this.setStreamingVolume(Number(args.level ?? 50));
        return;
      case "SetProgram":
        await this.setProgram(Number(args.programId ?? 0));
        return;
      case "SetMute":
        await this.setMute(Boolean(args.isMuted));
        return;
      case "GetBatteryState":
      case "GetDeviceInfo":
      case "RefreshState":
        // Reads are performed by refreshState(), which the app shell calls
        // after every execute().
        return;
      case "VolumeStep":
      case "ProgramStep":
        throw new Error("Step operations are not mapped for MFi; use absolute setters.");
      default: {
        const exhaustiveOperation: never = operation;
        throw new Error(`Unsupported operation for MFi: ${String(exhaustiveOperation)}`);
      }
    }
  }

  public async refreshState(): Promise<DriverState> {
    const [volume, activeProgram, batteryPercent] = await Promise.all([
      this.readByte(LEA_MIC_ATTENUATION)
        .then(mfiToVolume)
        .then((value) => {
          this.cachedVolume = value;
          return value;
        })
        .catch(() => undefined as number | undefined),
      this.readByte(LEA_CURRENT_ACTIVE_PROGRAM)
        .then((value) => {
          this.cachedProgram = value;
          return value;
        })
        .catch(() => undefined as number | undefined),
      this.getBattery().catch(() => -1)
    ]);

    const secondaryBattery = this.secondary ? await this.getBatterySecondary().catch(() => -1) : -1;

    return {
      volume,
      muted: this.cachedMuted,
      activeProgram,
      batteryPercent: batteryPercent >= 0 ? batteryPercent : undefined,
      batteryPercentSecondary: secondaryBattery >= 0 ? secondaryBattery : undefined,
      streamVolume: this.cachedStreamVolume,
      setActive: this.isSet,
      primarySide: this.primarySideKnown ? this.primarySide : undefined,
      secondaryConnected: this.secondary
        ? this.secondary.transport.getConnectionState() === "connected"
        : undefined,
      programs: this.cachedPrograms,
      deviceInfo: {
        id: this.primaryId,
        name: this.manufacturerName ? `MFi hearing aid (${this.manufacturerName})` : "MFi hearing aid"
      }
    };
  }

  private log(detail: string): void {
    this.context.diagnostics.emit({
      type: "transport.connect",
      brand: this.brand,
      detail: `[MfiAdapter] ${detail}`
    });
  }
}
