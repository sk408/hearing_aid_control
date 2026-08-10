import { beforeEach, describe, expect, it } from "vitest";
import { MfiAdapter, mfiToVolume, volumeToMfi } from "../src/adapters/mfiAdapter";
import type { AdapterContext } from "../src/adapters/types";
import { resolveCapability, type DeviceProfile } from "../src/capability/capabilityEngine";
import { DiagnosticsStream } from "../src/diagnostics/diagnostics";
import type { Operation } from "../src/domain/model";
import { MockTransport } from "./helpers";

const LEA = "7d74f4bd-c74a-4431-862c-cce884371592";
const DIS = "0000180a-0000-1000-8000-00805f9b34fb";
const MIC_ATT = "f3f594f9-e210-48f3-85e2-4b0cf235a9d3";
const STREAM_ATT = "6ac46200-24ea-46d8-a136-81133c65840a";
const AVAILABLE_PROGRAMS = "21ff4275-c41d-4486-a0e3-dc11138bcde6";
const CURRENT_PROGRAM = "a391c6f1-20bb-495a-abbf-2017098fbc61";
const BATTERY = "24e1dff3-ae90-41bf-bfbd-2cf8df42bf87";
const SIDE = "8d17ac2f-1d54-4742-a49a-ef4b20784eb3";
const DIS_MANUFACTURER = "00002a29-0000-1000-8000-00805f9b34fb";

function seedMock(transport: MockTransport): void {
  transport.setRead(MIC_ATT, [200]);
  transport.setRead(STREAM_ATT, [128]);
  transport.setRead(CURRENT_PROGRAM, [0]);
  transport.setRead(AVAILABLE_PROGRAMS, [0x03, 0, 0, 0]); // programs 0 and 1 fitted
  transport.setRead(BATTERY, [87]);
  transport.setRead(SIDE, [1]); // right
  transport.setRead(DIS_MANUFACTURER, [71, 78]); // "GN"
}

function makeAdapter(transport: MockTransport): MfiAdapter {
  const profile: DeviceProfile = {
    brand: "mfi",
    discoveredServiceUuids: [LEA, DIS],
    discoveredCharacteristicUuids: [MIC_ATT, STREAM_ATT, AVAILABLE_PROGRAMS, CURRENT_PROGRAM, BATTERY],
    deviceId: "test-aid-r",
    deviceName: "Test Aid R"
  };
  const context: AdapterContext = {
    transport,
    diagnostics: new DiagnosticsStream(),
    capabilityResolver: (operation: Operation) => resolveCapability(profile, operation)
  };
  return new MfiAdapter(context, profile);
}

function lastWrite(transport: MockTransport, uuid: string): Uint8Array | undefined {
  const writes = transport.writes.filter((item) => item.uuid === uuid);
  return writes.length > 0 ? writes[writes.length - 1].value : undefined;
}

describe("MFi volume mapping (MFI_SPEC §3.1)", () => {
  it("maps UI 0–100 linearly onto GATT 1–255", () => {
    expect(volumeToMfi(0)).toBe(1);
    expect(volumeToMfi(50)).toBe(128);
    expect(volumeToMfi(100)).toBe(255);
    expect(mfiToVolume(1)).toBe(0);
    expect(mfiToVolume(128)).toBe(50);
    expect(mfiToVolume(255)).toBe(100);
  });
});

describe("MfiAdapter", () => {
  let transport: MockTransport;
  let adapter: MfiAdapter;

  beforeEach(async () => {
    window.localStorage.clear();
    transport = new MockTransport();
    seedMock(transport);
    adapter = makeAdapter(transport);
    await adapter.connect();
  });

  it("writes mic attenuation on SetVolume", async () => {
    await adapter.execute("SetVolume", { level: 100, ear: "both" });
    expect(Array.from(lastWrite(transport, MIC_ATT) ?? [])).toEqual([255]);

    await adapter.execute("SetVolume", { level: 0, ear: "both" });
    expect(Array.from(lastWrite(transport, MIC_ATT) ?? [])).toEqual([1]);
  });

  it("writes stream attenuation on SetStreamVolume", async () => {
    await adapter.execute("SetStreamVolume", { level: 50 });
    expect(Array.from(lastWrite(transport, STREAM_ATT) ?? [])).toEqual([128]);
  });

  it("validates the program index against the fitted bitmask before writing", async () => {
    await expect(adapter.execute("SetProgram", { programId: 5 })).rejects.toThrow(/not fitted/);
    expect(lastWrite(transport, CURRENT_PROGRAM)).toBeUndefined();

    await adapter.execute("SetProgram", { programId: 1 });
    expect(Array.from(lastWrite(transport, CURRENT_PROGRAM) ?? [])).toEqual([1]);
  });

  it("emulates mute with attenuation 0 and restores the previous value", async () => {
    await adapter.execute("SetMute", { isMuted: true });
    expect(Array.from(lastWrite(transport, MIC_ATT) ?? [])).toEqual([0]);

    await adapter.execute("SetMute", { isMuted: false });
    expect(Array.from(lastWrite(transport, MIC_ATT) ?? [])).toEqual([200]);
  });

  it("reports battery, programs and single-sided state on refresh", async () => {
    const state = await adapter.refreshState();
    expect(state.batteryPercent).toBe(87);
    expect(state.batteryPercentSecondary).toBeUndefined();
    expect(state.setActive).toBe(false);
    expect(state.volume).toBe(mfiToVolume(200));
    expect(state.programs?.map((item) => item.index)).toEqual([0, 1]);
    expect(state.deviceInfo?.name).toBe("MFi hearing aid (GN)");
  });

  it("reports bonded when the secured seed reads succeed", () => {
    expect(adapter.bondState).toBe("bonded");
  });
});

describe("MfiAdapter bond state (unbonded link)", () => {
  let transport: MockTransport;
  let adapter: MfiAdapter;

  beforeEach(async () => {
    window.localStorage.clear();
    transport = new MockTransport();
    // Only the UNSECURED characteristics respond — the insufficient-
    // authentication pattern seen live on unpaired ReSound GN aids.
    transport.setRead(BATTERY, [87]);
    transport.setRead(SIDE, [1]);
    transport.setRead(DIS_MANUFACTURER, [71, 78]);
    adapter = makeAdapter(transport);
    adapter.lazyPairingRetryDelayMs = 0;
    await adapter.connect();
  });

  it("detects needs-pairing when secured reads fail but unsecured reads succeed", () => {
    expect(adapter.bondState).toBe("needs-pairing");
  });

  it("recovers to bonded via retryBondedSetup once secured reads succeed", async () => {
    expect(adapter.bondState).toBe("needs-pairing");
    transport.setRead(MIC_ATT, [200]);
    transport.setRead(STREAM_ATT, [128]);
    transport.setRead(CURRENT_PROGRAM, [0]);
    transport.setRead(AVAILABLE_PROGRAMS, [0x03, 0, 0, 0]);

    await expect(adapter.retryBondedSetup()).resolves.toBe("bonded");
    expect(adapter.bondState).toBe("bonded");
  });

  it("maps auth-type write failures to pairing guidance while unbonded", async () => {
    transport.failWrites = true;
    await expect(adapter.execute("SetVolume", { level: 50 })).rejects.toThrow(/Pairing required/);
    expect(adapter.bondState).toBe("needs-pairing");
  });
});
