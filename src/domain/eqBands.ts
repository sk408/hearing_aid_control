/**
 * Pluggable EQ (Bass/Treble) characteristic mapping.
 *
 * The standardized MFi/LEA control surface has NO tone control. The only
 * known gain/tone characteristics are GN proprietary (from the project's
 * ReSound RE notes — docs/resound_uuid_reference_master_2026-03-28.md):
 *
 *  - 400FC36C-ABD9-40ED-95AA-CC186C73D02A  GNAllGainData
 *  - 9062FD9D-153C-487F-ACB8-6A5FE8AABCEF  GNGainData (R/W/N, ~12000-byte blob)
 *
 * Their object schema, packet segmentation, and auth prerequisites are NOT
 * known (they sit behind the encrypted GN fitting path this app avoids), so
 * no encoder is registered for them: writing blind into a multi-KB fitting
 * blob could corrupt the aid's fitting. A candidate without an encoder is
 * "discovery-only" — the explorer still shows the characteristic, but the
 * Bass/Treble sliders stay hidden (never show dead controls).
 *
 * To support a future EQ characteristic with a KNOWN simple layout, add an
 * entry with an `encode` function — the sliders appear automatically when
 * the characteristic is discovered with the write property.
 */
import type { GattCharacteristicInfo, GattServiceInfo } from "../transport/types";

/** Encoder: bass/treble on a 0–100 UI scale → GATT payload. */
export type EqEncoder = (bass: number, treble: number) => Uint8Array;

export interface EqCandidate {
  readonly uuid: string;
  readonly label: string;
  /** Human note on what is known about the format/auth requirements. */
  readonly notes: string;
  /**
   * Payload encoder for the Bass/Treble sliders. Undefined when the format
   * is unknown/unsafe to write — the candidate is then discovery-only.
   */
  readonly encode?: EqEncoder;
}

/** Known/watched EQ candidate characteristics (uuid lowercase). */
export const EQ_CANDIDATES: readonly EqCandidate[] = [
  {
    uuid: "400fc36c-abd9-40ed-95aa-cc186c73d02a",
    label: "GNAllGainData",
    notes:
      "GN proprietary all-band gain blob. Format/auth unknown (encrypted GN fitting path) — discovery only, no writes."
  },
  {
    uuid: "9062fd9d-153c-487f-acb8-6a5fe8aabcef",
    label: "GNGainData",
    notes:
      "GN proprietary gain blob (~12000 bytes, R/W/N per RE registry). Object schema and auth prerequisites unknown — discovery only, no writes."
  }
];

export interface EqMatch {
  readonly candidate: EqCandidate;
  /** True when the characteristic exposes the write property. */
  readonly writable: boolean;
  /**
   * True only when the sliders may be shown: the characteristic is writable
   * AND an encoder is registered (writing a known-safe payload).
   */
  readonly usable: boolean;
}

function flatten(tree: readonly GattServiceInfo[]): readonly GattCharacteristicInfo[] {
  return tree.flatMap((service) => service.characteristics);
}

/** Evaluate ONE candidate against a discovered tree (null when absent). */
export function evaluateEqCandidate(candidate: EqCandidate, tree: readonly GattServiceInfo[]): EqMatch | null {
  const discovered = flatten(tree).find((info) => info.uuid.toLowerCase() === candidate.uuid);
  if (!discovered) return null;
  const writable = discovered.properties.includes("write") || discovered.properties.includes("writeWithoutResponse");
  return { candidate, writable, usable: writable && candidate.encode != null };
}

/**
 * Match a discovered GATT tree against the EQ candidate registry.
 * Returns the first candidate present on the device, or null — the caller
 * shows Bass/Treble sliders only when `match.usable` is true.
 */
export function findEqCandidate(tree: readonly GattServiceInfo[]): EqMatch | null {
  for (const candidate of EQ_CANDIDATES) {
    const match = evaluateEqCandidate(candidate, tree);
    if (match) return match;
  }
  return null;
}
