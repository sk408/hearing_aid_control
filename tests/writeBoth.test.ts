import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceInfoSummary } from "../src/transport/types";

const LEA = "7d74f4bd-c74a-4431-862c-cce884371592";
const MIC_ATT = "f3f594f9-e210-48f3-85e2-4b0cf235a9d3";
const STREAM_ATT = "6ac46200-24ea-46d8-a136-81133c65840a";
const AVAILABLE_PROGRAMS = "21ff4275-c41d-4486-a0e3-dc11138bcde6";
const CURRENT_PROGRAM = "a391c6f1-20bb-495a-abbf-2017098fbc61";
const BATTERY = "24e1dff3-ae90-41bf-bfbd-2cf8df42bf87";
const SIDE = "8d17ac2f-1d54-4742-a49a-ef4b20784eb3";
const DIS_MANUFACTURER = "00002a29-0000-1000-8000-00805f9b34fb";

// The adapter constructs its own WebBleTransport for the secondary ear
// (addSecondaryEar). Substitute a controllable mock; the latest instance is
// captured so tests can drive the secondary link directly.
const captured = vi.hoisted(() => ({ secondary: null as import("./helpers").MockTransport | null }));

vi.mock("../src/transport/webBleTransport", async () => {
  const { MockTransport } = await import("./helpers");
  class FakeSecondaryTransport extends MockTransport {
    public constructor() {
      super();
      // Left aid: side char 0=left, own battery level.
      this.setRead(SIDE, [0]);
      this.setRead(BATTERY, [65]);
      captured.secondary = this;
    }

    public override async connect(): Promise<DeviceInfoSummary> {
      await super.connect();
      return { id: "test-aid-l", name: "Test Aid L" };
    }

    public override async discover(): Promise<{ services: string[]; characteristics: string[] }> {
      return { services: [LEA], characteristics: [] };
    }
  }
  return { WebBleTransport: FakeSecondaryTransport };
});

// Imported AFTER the mock registration so MfiAdapter picks up the fake.
const { MfiAdapter } = await import("../src/adapters/mfiAdapter");
const { resolveCapability } = await import("../src/capability/capabilityEngine");
const { DiagnosticsStream } = await import("../src/diagnostics/diagnostics");
const { MockTransport } = await import("./helpers");
import type { AdapterContext } from "../src/adapters/types";
import type { DeviceProfile } from "../src/capability/capabilityEngine";
import type { Operation } from "../src/domain/model";

function seedPrimary(transport: InstanceType<typeof MockTransport>): void {
  transport.setRead(MIC_ATT, [200]);
  transport.setRead(STREAM_ATT, [128]);
  transport.setRead(CURRENT_PROGRAM, [0]);
  transport.setRead(AVAILABLE_PROGRAMS, [0x03, 0, 0, 0]); // programs 0 and 1 fitted
  transport.setRead(BATTERY, [87]);
  transport.setRead(SIDE, [1]); // right
  transport.setRead(DIS_MANUFACTURER, [71, 78]); // "GN"
}

function makeAdapter(transport: InstanceType<typeof MockTransport>): InstanceType<typeof MfiAdapter> {
  const profile: DeviceProfile = {
    brand: "mfi",
    discoveredServiceUuids: [LEA],
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

function writes(transport: InstanceType<typeof MockTransport>, uuid: string): Uint8Array[] {
  return transport.writes.filter((item) => item.uuid === uuid).map((item) => item.value);
}

describe("MfiAdapter write-both routing (binaural set)", () => {
  let primary: InstanceType<typeof MockTransport>;
  let adapter: InstanceType<typeof MfiAdapter>;

  beforeEach(async () => {
    window.localStorage.clear();
    captured.secondary = null;
    primary = new MockTransport();
    seedPrimary(primary);
    adapter = makeAdapter(primary);
    await adapter.connect();
    await adapter.addSecondaryEar();
    expect(captured.secondary).not.toBeNull();
  });

  it("detects sides: primary right, secondary left", async () => {
    const state = await adapter.refreshState();
    expect(state.setActive).toBe(true);
    expect(state.primarySide).toBe("right");
    expect(state.secondaryConnected).toBe(true);
    expect(state.batteryPercentSecondary).toBe(65);
  });

  it("writes BOTH aids by default (writeToBoth = true)", async () => {
    expect(adapter.writeToBoth).toBe(true);
    await adapter.execute("SetVolume", { level: 100, ear: "both" });
    expect(writes(primary, MIC_ATT)).toEqual([new Uint8Array([255])]);
    expect(writes(captured.secondary as InstanceType<typeof MockTransport>, MIC_ATT)).toEqual([
      new Uint8Array([255])
    ]);
  });

  it("writes the primary only when writeToBoth is disabled", async () => {
    adapter.writeToBoth = false;
    await adapter.execute("SetVolume", { level: 50, ear: "both" });
    expect(writes(primary, MIC_ATT)).toEqual([new Uint8Array([128])]);
    expect(writes(captured.secondary as InstanceType<typeof MockTransport>, MIC_ATT)).toEqual([]);
  });

  it("routes per-ear writes to the correct physical aid", async () => {
    const secondary = captured.secondary as InstanceType<typeof MockTransport>;
    await adapter.execute("SetVolume", { level: 80, ear: "left" });
    expect(writes(secondary, MIC_ATT)).toEqual([new Uint8Array([204])]);
    expect(writes(primary, MIC_ATT)).toEqual([]);

    await adapter.execute("SetVolume", { level: 20, ear: "right" });
    expect(writes(primary, MIC_ATT)).toEqual([new Uint8Array([52])]);
    expect(writes(secondary, MIC_ATT)).toEqual([new Uint8Array([204])]);
  });

  it("writes program changes to both aids by default", async () => {
    const secondary = captured.secondary as InstanceType<typeof MockTransport>;
    await adapter.execute("SetProgram", { programId: 1 });
    expect(writes(primary, CURRENT_PROGRAM)).toEqual([new Uint8Array([1])]);
    expect(writes(secondary, CURRENT_PROGRAM)).toEqual([new Uint8Array([1])]);
  });

  it("keeps controlling the surviving aid when one member's writes fail", async () => {
    const secondary = captured.secondary as InstanceType<typeof MockTransport>;
    secondary.failWrites = true;
    await adapter.execute("SetVolume", { level: 60, ear: "both" });
    expect(writes(primary, MIC_ATT)).toEqual([new Uint8Array([153])]);
  });

  it("skips a dropped set member and reports it in refreshState", async () => {
    const secondary = captured.secondary as InstanceType<typeof MockTransport>;
    await secondary.disconnect();

    await adapter.execute("SetVolume", { level: 70, ear: "both" });
    expect(writes(primary, MIC_ATT)).toEqual([new Uint8Array([179])]);
    expect(writes(secondary, MIC_ATT)).toEqual([]);

    const state = await adapter.refreshState();
    expect(state.setActive).toBe(true);
    expect(state.secondaryConnected).toBe(false);
  });

  it("still throws when every write target fails", async () => {
    primary.failWrites = true;
    (captured.secondary as InstanceType<typeof MockTransport>).failWrites = true;
    await expect(adapter.execute("SetVolume", { level: 50, ear: "both" })).rejects.toThrow();
  });
});
