import { describe, expect, it } from "vitest";
import { resolveCapability, type DeviceProfile } from "../src/capability/capabilityEngine";

describe("capability engine", () => {
  it("marks MFi SetVolume as supported when UUIDs exist", () => {
    const profile: DeviceProfile = {
      brand: "mfi",
      discoveredServiceUuids: ["7d74f4bd-c74a-4431-862c-cce884371592"],
      discoveredCharacteristicUuids: ["f3f594f9-e210-48f3-85e2-4b0cf235a9d3"]
    };
    const decision = resolveCapability(profile, "SetVolume");
    expect(decision.status).toBe("supported");
  });

  it("blocks mute when no registry entry matches the discovered UUIDs", () => {
    const profile: DeviceProfile = {
      brand: "mfi",
      discoveredServiceUuids: ["c8f7a831-21b2-45b8-87f8-bd49a13eff49"],
      discoveredCharacteristicUuids: []
    };
    const decision = resolveCapability(profile, "SetMute");
    expect(decision.status).toBe("blocked");
  });
});
