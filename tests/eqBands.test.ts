import { describe, expect, it } from "vitest";
import { EQ_CANDIDATES, evaluateEqCandidate, findEqCandidate, type EqCandidate } from "../src/domain/eqBands";
import type { GattServiceInfo } from "../src/transport/types";

const GN_GAIN_DATA = "9062fd9d-153c-487f-acb8-6a5fe8aabcef";
const GN_ALL_GAIN_DATA = "400fc36c-abd9-40ed-95aa-cc186c73d02a";

function treeWith(uuid: string, properties: readonly string[]): readonly GattServiceInfo[] {
  return [{ uuid: "11111111-2222-3333-4444-555555555555", characteristics: [{ uuid, properties }] }];
}

describe("EQ candidate discovery (Bass/Treble gating)", () => {
  it("returns null when no known EQ characteristic is discovered", () => {
    expect(findEqCandidate([])).toBeNull();
    expect(findEqCandidate(treeWith("00002a29-0000-1000-8000-00805f9b34fb", ["read"]))).toBeNull();
  });

  it("matches the GN gain UUIDs case-insensitively", () => {
    const match = findEqCandidate(treeWith(GN_GAIN_DATA.toUpperCase(), ["read", "write", "notify"]));
    expect(match?.candidate.label).toBe("GNGainData");
    expect(match?.writable).toBe(true);
  });

  it("reports a discovered read-only candidate as not writable", () => {
    const match = findEqCandidate(treeWith(GN_ALL_GAIN_DATA, ["read"]));
    expect(match?.candidate.label).toBe("GNAllGainData");
    expect(match?.writable).toBe(false);
    expect(match?.usable).toBe(false);
  });

  it("keeps sliders hidden for GN blobs even when writable (no known-safe encoding)", () => {
    // The GN gain blob format/auth path is unknown — discovery-only.
    const match = findEqCandidate(treeWith(GN_GAIN_DATA, ["read", "write"]));
    expect(match?.writable).toBe(true);
    expect(match?.usable).toBe(false);
  });

  it("treats writeWithoutResponse as writable", () => {
    const candidate: EqCandidate = {
      uuid: "abcdefab-0000-1111-2222-333344445555",
      label: "FutureEq",
      notes: "test",
      encode: (bass, treble) => new Uint8Array([bass, treble])
    };
    const match = evaluateEqCandidate(candidate, treeWith(candidate.uuid, ["read", "writeWithoutResponse"]));
    expect(match?.writable).toBe(true);
    expect(match?.usable).toBe(true);
  });

  it("marks a candidate usable only when writable AND an encoder is registered", () => {
    const withEncoder: EqCandidate = {
      uuid: "abcdefab-0000-1111-2222-333344445555",
      label: "FutureEq",
      notes: "test",
      encode: (bass, treble) => new Uint8Array([bass, treble])
    };
    expect(evaluateEqCandidate(withEncoder, treeWith(withEncoder.uuid, ["write"]))?.usable).toBe(true);
    expect(evaluateEqCandidate(withEncoder, treeWith(withEncoder.uuid, ["read"]))?.usable).toBe(false);

    const withoutEncoder = EQ_CANDIDATES.find((item) => item.uuid === GN_GAIN_DATA);
    expect(withoutEncoder?.encode).toBeUndefined();
    expect(evaluateEqCandidate(withoutEncoder as EqCandidate, treeWith(GN_GAIN_DATA, ["write"]))?.usable).toBe(false);
  });
});
