import { describe, expect, it } from "vitest";
import { SafetyGate } from "../src/safety/safetyGate";
import type { CapabilityDecision } from "../src/domain/model";

function decision(status: CapabilityDecision["status"]): CapabilityDecision {
  return {
    brand: "philips",
    operation: "SetVolume",
    status,
    reason: "test"
  };
}

describe("safety gate", () => {
  it("allows supported operations", () => {
    const gate = new SafetyGate();
    expect(() => gate.assertExecutable(decision("supported"))).not.toThrow();
  });

  it("blocks partial operations by default", () => {
    const gate = new SafetyGate();
    expect(() => gate.assertExecutable(decision("partial"))).toThrow();
  });

  it("can allow partial operations in explicit mode", () => {
    const gate = new SafetyGate({ allowPartialSafeOperations: true });
    expect(() => gate.assertExecutable(decision("partial"))).not.toThrow();
  });
});
