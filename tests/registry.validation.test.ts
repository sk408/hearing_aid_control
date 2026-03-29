import { describe, expect, it } from "vitest";
import protocolRegistry from "../protocol_registry.json";
import { validateRegistry } from "../src/registry/schema";

describe("protocol registry schema", () => {
  it("validates the shipped registry", () => {
    expect(() => validateRegistry(protocolRegistry)).not.toThrow();
  });

  it("fails entries without blockReason when not supported", () => {
    const clone = JSON.parse(JSON.stringify(protocolRegistry)) as Array<Record<string, unknown>>;
    clone[0].status = "blocked";
    delete clone[0].blockReason;
    expect(() => validateRegistry(clone)).toThrow();
  });
});
