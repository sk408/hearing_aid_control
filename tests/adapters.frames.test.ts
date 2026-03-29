import { describe, expect, it } from "vitest";
import { PhilipsAdapter } from "../src/adapters/philipsAdapter";
import { RextonAdapter } from "../src/adapters/rextonAdapter";
import { DiagnosticsStream } from "../src/diagnostics/diagnostics";
import type { AdapterContext } from "../src/adapters/types";
import { MockTransport } from "./helpers";
import type { DeviceProfile } from "../src/capability/capabilityEngine";
import { resolveCapability } from "../src/capability/capabilityEngine";
import type { Operation } from "../src/domain/model";

function context(brand: DeviceProfile["brand"], transport: MockTransport, profile: DeviceProfile): AdapterContext {
  return {
    transport,
    diagnostics: new DiagnosticsStream(),
    capabilityResolver: (operation: Operation) => resolveCapability({ ...profile, brand }, operation)
  };
}

describe("adapter frame builders", () => {
  it("builds Philips volume payload [level, notMuted]", async () => {
    const transport = new MockTransport();
    const profile: DeviceProfile = {
      brand: "philips",
      discoveredServiceUuids: ["56772eaf-2153-4f74-acf3-4368d99fbf5a"],
      discoveredCharacteristicUuids: [
        "1454e9d6-f658-4190-8589-22aa9e3021eb",
        "50632720-4c0f-4bc4-960a-2404bdfdfbca",
        "535442f7-0ff7-4fec-9780-742f3eb00eda",
        "58bbccc5-5a57-4e00-98d5-18c6a0408dfd"
      ]
    };
    const adapter = new PhilipsAdapter(context("philips", transport, profile));
    await adapter.execute("SetVolume", { level: 42, isMuted: false });
    expect(transport.writes).toHaveLength(1);
    expect(Array.from(transport.writes[0].value)).toEqual([42, 1]);
  });

  it("builds Rexton program payload [0x05, program]", async () => {
    const transport = new MockTransport();
    const profile: DeviceProfile = {
      brand: "rexton",
      discoveredServiceUuids: ["8b82105d-0f0c-40bb-b422-3770fa72a864"],
      discoveredCharacteristicUuids: ["8b8276e8-0f0c-40bb-b422-3770fa72a864"]
    };
    const adapter = new RextonAdapter(context("rexton", transport, profile));
    await adapter.execute("SetProgram", { programId: 3 });
    expect(Array.from(transport.writes[0].value)).toEqual([0x05, 3]);
  });
});
