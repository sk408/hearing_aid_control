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

/** localStorage key for the persisted set of LEA-verified device ids. */
const VERIFIED_STORAGE_KEY = "@mfi_verified";

/** localStorage key for the last successfully connected binaural set. */
const LAST_SET_STORAGE_KEY = "@mfi_last_set";

// ── Persisted verified-MFi set ──

const verifiedIds = new Set<string>();
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

/** Load the persisted verified-MFi set into the session cache (idempotent). */
export function initVerifiedMfiSet(): void {
  if (verifiedLoaded) return;
  verifiedLoaded = true;
  const raw = readStorage(VERIFIED_STORAGE_KEY);
  if (!raw) return;
  try {
    const ids = JSON.parse(raw) as string[];
    for (const id of ids) verifiedIds.add(id.toUpperCase());
  } catch {
    // Corrupt storage — start empty
  }
}

/** True if this device id was previously confirmed to expose the LEA service. */
export function isVerifiedMfi(deviceId: string): boolean {
  initVerifiedMfiSet();
  return verifiedIds.has(deviceId.toUpperCase());
}

/**
 * Record a successful LEA-service confirmation (piggybacked on a real connect
 * flow). Updates the session cache and persists to localStorage.
 */
export function markVerifiedMfi(deviceId: string): void {
  initVerifiedMfiSet();
  const id = deviceId.toUpperCase();
  if (verifiedIds.has(id)) return;
  verifiedIds.add(id);
  writeStorage(VERIFIED_STORAGE_KEY, JSON.stringify(Array.from(verifiedIds)));
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
