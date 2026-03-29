import { describe, expect, it } from "vitest";
import { resolveCapability, type DeviceProfile } from "../src/capability/capabilityEngine";

describe("capability engine", () => {
  it("marks Philips SetVolume as supported when UUIDs exist", () => {
    const profile: DeviceProfile = {
      brand: "philips",
      discoveredServiceUuids: ["56772eaf-2153-4f74-acf3-4368d99fbf5a"],
      discoveredCharacteristicUuids: ["1454e9d6-f658-4190-8589-22aa9e3021eb"]
    };
    const decision = resolveCapability(profile, "SetVolume");
    expect(decision.status).toBe("supported");
  });

  it("blocks Rexton mute because registry marks it blocked", () => {
    const profile: DeviceProfile = {
      brand: "rexton",
      discoveredServiceUuids: ["c8f7a831-21b2-45b8-87f8-bd49a13eff49"],
      discoveredCharacteristicUuids: []
    };
    const decision = resolveCapability(profile, "SetMute");
    expect(decision.status).toBe("blocked");
  });
});
