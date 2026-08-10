import { beforeEach, describe, expect, it } from "vitest";
import {
  batteryScaleForMax,
  loadBatteryMaxRaw,
  recordBatteryRaw,
  resetBatteryScaleTable
} from "../src/brand/batteryScale";

const STORAGE_KEY = "hac_battery_scale_v1";

describe("battery scale heuristic (decile firmware)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBatteryScaleTable();
  });

  it("treats a device whose max raw byte is ≤10 as decile scale (×10)", () => {
    // Verified on hardware: ReSound aid at ~full charge reports raw 10.
    const reading = recordBatteryRaw("aid-a", 10);
    expect(reading).toEqual({ raw: 10, scale: 10, percent: 100 });
  });

  it("treats a device reporting raw >10 as direct percent (×1)", () => {
    const reading = recordBatteryRaw("aid-b", 87);
    expect(reading).toEqual({ raw: 87, scale: 1, percent: 87 });
  });

  it("keeps the decile classification as partial decile values accumulate", () => {
    expect(recordBatteryRaw("aid-c", 4).percent).toBe(40);
    expect(recordBatteryRaw("aid-c", 9).percent).toBe(90);
    expect(recordBatteryRaw("aid-c", 10).percent).toBe(100);
    expect(loadBatteryMaxRaw("aid-c")).toBe(10);
  });

  it("reclassifies to percent once a raw byte >10 is seen (max only grows)", () => {
    recordBatteryRaw("aid-d", 10);
    expect(recordBatteryRaw("aid-d", 12)).toEqual({ raw: 12, scale: 1, percent: 12 });
    // …and it never flips back to decile for that device.
    expect(recordBatteryRaw("aid-d", 9)).toEqual({ raw: 9, scale: 1, percent: 9 });
  });

  it("clamps the scaled percent at 100", () => {
    expect(recordBatteryRaw("aid-e", 10).percent).toBe(100);
    expect(recordBatteryRaw("aid-f", 250).percent).toBe(100);
  });

  it("persists the learned scale per device id in localStorage", () => {
    recordBatteryRaw("aid-g", 10);
    recordBatteryRaw("aid-h", 80);

    const persisted: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted).toEqual({ "aid-g": 10, "aid-h": 80 });

    // A fresh read path (new session) sees the persisted maxima.
    expect(loadBatteryMaxRaw("aid-g")).toBe(10);
    expect(batteryScaleForMax(loadBatteryMaxRaw("aid-g"))).toBe(10);
    expect(batteryScaleForMax(loadBatteryMaxRaw("aid-h"))).toBe(1);
    expect(loadBatteryMaxRaw("never-seen")).toBe(0);
  });

  it("survives a corrupted storage payload", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json{{{");
    expect(loadBatteryMaxRaw("aid-i")).toBe(0);
    expect(recordBatteryRaw("aid-i", 10).percent).toBe(100);
  });
});
