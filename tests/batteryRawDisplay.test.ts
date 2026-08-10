import { beforeEach, describe, expect, it } from "vitest";
import { MfiAdapter } from "../src/adapters/mfiAdapter";
import type { AdapterContext } from "../src/adapters/types";
import { resolveCapability, type DeviceProfile } from "../src/capability/capabilityEngine";
import { DiagnosticsStream } from "../src/diagnostics/diagnostics";
import type { Operation } from "../src/domain/model";
import { MockTransport } from "./helpers";

const LEA = "7d74f4bd-c74a-4431-862c-cce884371592";
const MIC_ATT = "f3f594f9-e210-48f3-85e2-4b0cf235a9d3";
const STREAM_ATT = "6ac46200-24ea-46d8-a136-81133c65840a";
const AVAILABLE_PROGRAMS = "21ff4275-c41d-4486-a0e3-dc11138bcde6";
const CURRENT_PROGRAM = "a391c6f1-20bb-495a-abbf-2017098fbc61";
const BATTERY = "24e1dff3-ae90-41bf-bfbd-2cf8df42bf87";
const SIDE = "8d17ac2f-1d54-4742-a49a-ef4b20784eb3";

function makeAdapter(transport: MockTransport, deviceId: string): MfiAdapter {
  const profile: DeviceProfile = {
    brand: "mfi",
    discoveredServiceUuids: [LEA],
    discoveredCharacteristicUuids: [MIC_ATT, STREAM_ATT, AVAILABLE_PROGRAMS, CURRENT_PROGRAM, BATTERY],
    deviceId,
    deviceName: "Test Aid"
  };
  const context: AdapterContext = {
    transport,
    diagnostics: new DiagnosticsStream(),
    capabilityResolver: (operation: Operation) => resolveCapability(profile, operation)
  };
  return new MfiAdapter(context, profile);
}

function seedMock(transport: MockTransport, batteryRaw: number): void {
  transport.setRead(MIC_ATT, [200]);
  transport.setRead(STREAM_ATT, [128]);
  transport.setRead(CURRENT_PROGRAM, [0]);
  transport.setRead(AVAILABLE_PROGRAMS, [0x01, 0, 0, 0]);
  transport.setRead(BATTERY, [batteryRaw]);
  transport.setRead(SIDE, [1]);
}

describe("MfiAdapter battery raw/scale reporting (decile firmware)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("scales a decile-reporting device and exposes raw + scale on DriverState", async () => {
    // Verified on hardware: ReSound aid at ~full charge reports raw 10.
    const transport = new MockTransport();
    seedMock(transport, 10);
    const adapter = makeAdapter(transport, "decile-aid");
    await adapter.connect();

    const state = await adapter.refreshState();
    expect(state.batteryPercent).toBe(100);
    expect(state.batteryRaw).toBe(10);
    expect(state.batteryScale).toBe(10);
  });

  it("passes a percent-reporting device through unchanged (×1)", async () => {
    const transport = new MockTransport();
    seedMock(transport, 87);
    const adapter = makeAdapter(transport, "percent-aid");
    await adapter.connect();

    const state = await adapter.refreshState();
    expect(state.batteryPercent).toBe(87);
    expect(state.batteryRaw).toBe(87);
    expect(state.batteryScale).toBe(1);
  });

  it("learns the scale per device id across adapter instances (localStorage)", async () => {
    const first = new MockTransport();
    seedMock(first, 7);
    const adapterOne = makeAdapter(first, "persist-aid");
    await adapterOne.connect();
    expect((await adapterOne.refreshState()).batteryPercent).toBe(70);

    // Second session, same device id: the persisted max (7 → decile) applies.
    const second = new MockTransport();
    seedMock(second, 10);
    const adapterTwo = makeAdapter(second, "persist-aid");
    await adapterTwo.connect();
    const state = await adapterTwo.refreshState();
    expect(state.batteryPercent).toBe(100);
    expect(state.batteryScale).toBe(10);
  });
});
