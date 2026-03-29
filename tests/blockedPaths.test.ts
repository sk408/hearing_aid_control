import { describe, expect, it } from "vitest";
import { ResoundAdapter } from "../src/adapters/resoundAdapter";
import { StarkeyAdapter } from "../src/adapters/starkeyAdapter";
import { DiagnosticsStream } from "../src/diagnostics/diagnostics";
import { resolveCapability, type DeviceProfile } from "../src/capability/capabilityEngine";
import type { AdapterContext } from "../src/adapters/types";
import type { Operation } from "../src/domain/model";
import { MockTransport } from "./helpers";

function createContext(profile: DeviceProfile, transport: MockTransport): AdapterContext {
  return {
    transport,
    diagnostics: new DiagnosticsStream(),
    capabilityResolver: (operation: Operation) => resolveCapability(profile, operation)
  };
}

describe("blocked write controls", () => {
  it("blocks ReSound write operations", async () => {
    const profile: DeviceProfile = {
      brand: "resound",
      discoveredServiceUuids: ["e0262760-08c2-11e1-9073-0e8ac72ea010"],
      discoveredCharacteristicUuids: [
        "1959a468-3234-4c18-9e78-8daf8d9dbf61",
        "8b51a2ca-5bed-418b-b54b-22fe666aadd2"
      ]
    };
    const adapter = new ResoundAdapter(createContext(profile, new MockTransport()));
    await expect(adapter.execute("SetProgram", { programId: 1 })).rejects.toThrow();
  });

  it("blocks Starkey write operations", async () => {
    const profile: DeviceProfile = {
      brand: "starkey",
      discoveredServiceUuids: ["9a04f079-9840-4286-ab92-e65be0885f95"],
      discoveredCharacteristicUuids: []
    };
    const adapter = new StarkeyAdapter(createContext(profile, new MockTransport()));
    await expect(adapter.execute("SetVolume", { level: 10 })).rejects.toThrow();
  });
});
