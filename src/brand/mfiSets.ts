/**
 * MFi device filtering + binaural set grouping — Web Bluetooth port of the
 * RN branch's mfiSets.ts (TASK14/TASK16).
 *
 * Web adaptations vs the RN original:
 *  - Persistence is localStorage (keys mirror the RN AsyncStorage keys).
 *  - Web Bluetooth exposes NO RSSI and NO MAC address, so the RSSI-delta and
 *    OUI corroboration heuristics are dropped; grouping relies on normalized
 *    name + L/R side markers only. There is also no background scan, so there
 *    is no fast-list/sibling-window: set candidates come from
 *    `navigator.bluetooth.getDevices()` (previously granted devices) or an
 *    explicit second `requestDevice` chooser ("add other ear").
 */
import type { Brand } from "../domain/model";

/** Standardized MFi / LEA hearing-aid control service (MFI_SPEC.md §1.1) */
export const LEA_SERVICE_UUID = "7d74f4bd-c74a-4431-862c-cce884371592";

/** localStorage key for the persisted set of LEA-verified devices (id + name). */
const VERIFIED_STORAGE_KEY = "mfi_verified_v1";

/** Legacy ids-only key, migrated into mfi_verified_v1 on first load. */
const LEGACY_VERIFIED_STORAGE_KEY = "@mfi_verified";

/** localStorage key for the last successfully connected binaural set. */
const LAST_SET_STORAGE_KEY = "@mfi_last_set";

// ── Persisted verified-MFi set ──

interface VerifiedEntry {
  readonly id: string;
  readonly name: string;
}

/** id (uppercased) → last known advertised name */
const verifiedDevices = new Map<string, string>();
let verifiedLoaded = false;

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // persistence failure is non-fatal — session cache still holds it
  }
}

function persistVerified(): void {
  const entries: VerifiedEntry[] = Array.from(verifiedDevices, ([id, name]) => ({ id, name }));
  writeStorage(VERIFIED_STORAGE_KEY, JSON.stringify(entries));
}

/** Load the persisted verified-MFi set into the session cache (idempotent). */
export function initVerifiedMfiSet(): void {
  if (verifiedLoaded) return;
  verifiedLoaded = true;

  const raw = readStorage(VERIFIED_STORAGE_KEY);
  if (raw) {
    try {
      const entries = JSON.parse(raw) as VerifiedEntry[];
      for (const entry of entries) {
        if (typeof entry.id === "string") {
          verifiedDevices.set(entry.id.toUpperCase(), typeof entry.name === "string" ? entry.name : "");
        }
      }
      return;
    } catch {
      // Corrupt storage — fall through to legacy migration
    }
  }

  // One-time migration from the legacy ids-only key (@mfi_verified).
  const legacy = readStorage(LEGACY_VERIFIED_STORAGE_KEY);
  if (!legacy) return;
  try {
    const ids = JSON.parse(legacy) as string[];
    for (const id of ids) verifiedDevices.set(id.toUpperCase(), "");
    persistVerified();
  } catch {
    // Corrupt storage — start empty
  }
}

/** True if this device id was previously confirmed to expose the LEA service. */
export function isVerifiedMfi(deviceId: string): boolean {
  initVerifiedMfiSet();
  return verifiedDevices.has(deviceId.toUpperCase());
}

/** Last known advertised name of a verified device, or null when unknown. */
export function verifiedMfiName(deviceId: string): string | null {
  initVerifiedMfiSet();
  const name = verifiedDevices.get(deviceId.toUpperCase());
  return name ? name : null;
}

/**
 * Record a successful LEA-service confirmation (piggybacked on a real connect
 * flow). Updates the session cache and persists to localStorage.
 */
export function markVerifiedMfi(deviceId: string, deviceName = ""): void {
  initVerifiedMfiSet();
  const id = deviceId.toUpperCase();
  const existing = verifiedDevices.get(id);
  if (existing != null && (existing || !deviceName)) return;
  verifiedDevices.set(id, deviceName || existing || "");
  persistVerified();
}

// ── Last-set metadata ──

export interface MfiSetMetadata {
  readonly primaryId: string;
  readonly secondaryId: string;
  readonly primarySide: EarSide;
}

export function saveLastSet(metadata: MfiSetMetadata): void {
  writeStorage(LAST_SET_STORAGE_KEY, JSON.stringify(metadata));
}

export function loadLastSet(): MfiSetMetadata | null {
  const raw = readStorage(LAST_SET_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MfiSetMetadata;
    if (typeof parsed.primaryId === "string" && typeof parsed.secondaryId === "string") {
      return parsed;
    }
  } catch {
    // corrupt — ignore
  }
  return null;
}

export function clearLastSet(): void {
  try {
    window.localStorage.removeItem(LAST_SET_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Binaural set grouping ──

export type EarSide = "left" | "right";

interface NameParts {
  base: string;
  side: EarSide | null;
}

/**
 * Strip a trailing L/R side marker from a device name.
 * Handles: "X L", "X R", "X-L", "X_R", "X (L)", "X Left", "X LE", "X RE",
 * and a bare trailing "L"/"R" after whitespace/punctuation.
 * Brand-agnostic: purely lexical. (Identical to the RN branch.)
 */
export function splitNameAndSide(name: string): NameParts {
  const trimmed = name.trim();
  const patterns: Array<[RegExp, EarSide]> = [
    [/[\s_\-\(]+(left|l|le)\)?$/i, "left"],
    [/[\s_\-\(]+(right|r|re)\)?$/i, "right"]
  ];
  for (const [re, side] of patterns) {
    const m = trimmed.match(re);
    if (m && trimmed.length > m[0].length) {
      return { base: trimmed.slice(0, trimmed.length - m[0].length).trim(), side };
    }
  }
  return { base: trimmed, side: null };
}

/** Minimal device shape needed for grouping (Web Bluetooth gives id + name). */
export interface MfiDeviceCandidate {
  readonly id: string;
  readonly name: string;
  readonly brand?: Brand;
}

/**
 * Suggest a binaural sibling for a primary device among already-granted
 * devices. Web port of the RN grouping heuristics with the RSSI/OUI signals
 * removed (unavailable in Web Bluetooth):
 *  - normalized base names must match (min 2 chars), AND
 *  - when both devices carry explicit side markers, the sides must differ
 *    (same explicit side is never paired).
 * Candidates should already be MFi-verified (see isVerifiedMfi).
 */
export function suggestSetSibling(
  primary: MfiDeviceCandidate,
  candidates: readonly MfiDeviceCandidate[]
): MfiDeviceCandidate | null {
  const primaryParts = splitNameAndSide(primary.name);
  if (primaryParts.base.length < 2) return null;

  let fallback: MfiDeviceCandidate | null = null;

  for (const candidate of candidates) {
    if (candidate.id === primary.id) continue;
    const parts = splitNameAndSide(candidate.name);
    if (parts.base.toLowerCase() !== primaryParts.base.toLowerCase()) continue;

    const sidesKnown = primaryParts.side != null && parts.side != null;
    if (sidesKnown && primaryParts.side === parts.side) continue; // same side — not a pair
    if (sidesKnown) return candidate; // explicit opposite sides — best match
    fallback = fallback ?? candidate; // base match, side unknown — keep as fallback
  }

  return fallback;
}

// ── Scan identity selection ──
//
// GN aids broadcast TWO identities (confirmed live): the fitting endpoint
// named exactly "GN" (never useful for MFi control) and the MFi/phone endpoint
// "<Name>'s Hearing Aids". The 128-bit LEA service UUID is NOT in either
// advertisement (MFI_SPEC §4.4 — confirmed absent), so a strict services
// filter finds nothing and the app falls back to acceptAllDevices. These
// heuristics rank/filter any device list the app itself renders (the Chrome
// chooser cannot be filtered beyond services).

/**
 * True for the GN fitting-broadcast identity (exactly "GN" or "GN …").
 * These endpoints are for fitting software — deprioritize or hide them.
 */
export function isFittingBroadcastName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed === "GN" || trimmed.startsWith("GN ");
}

/** True for names that look like an MFi phone-side identity. */
export function looksLikeMfiHearingAidName(name: string): boolean {
  return /hearing aid/i.test(name);
}
