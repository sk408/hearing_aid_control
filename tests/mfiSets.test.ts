import { beforeEach, describe, expect, it } from "vitest";
import {
  isVerifiedMfi,
  loadLastSet,
  markVerifiedMfi,
  saveLastSet,
  splitNameAndSide,
  suggestSetSibling
} from "../src/brand/mfiSets";

describe("splitNameAndSide", () => {
  it("strips common trailing side markers", () => {
    expect(splitNameAndSide("Steve's Aids L")).toEqual({ base: "Steve's Aids", side: "left" });
    expect(splitNameAndSide("Steve's Aids R")).toEqual({ base: "Steve's Aids", side: "right" });
    expect(splitNameAndSide("Vivia-L")).toEqual({ base: "Vivia", side: "left" });
    expect(splitNameAndSide("Vivia_R")).toEqual({ base: "Vivia", side: "right" });
    expect(splitNameAndSide("Aid (L)")).toEqual({ base: "Aid", side: "left" });
    expect(splitNameAndSide("Aid Left")).toEqual({ base: "Aid", side: "left" });
    expect(splitNameAndSide("Aid RE")).toEqual({ base: "Aid", side: "right" });
    expect(splitNameAndSide("Aid LE")).toEqual({ base: "Aid", side: "left" });
  });

  it("leaves names without a side marker intact", () => {
    expect(splitNameAndSide("Hearing Aid")).toEqual({ base: "Hearing Aid", side: null });
    expect(splitNameAndSide("L")).toEqual({ base: "L", side: null });
    expect(splitNameAndSide("Starkey")).toEqual({ base: "Starkey", side: null });
  });
});

describe("suggestSetSibling", () => {
  const primary = { id: "p1", name: "Steve's Aids R" };

  it("pairs devices with matching base names and opposite sides", () => {
    const candidates = [
      { id: "c1", name: "Steve's Aids L" },
      { id: "c2", name: "Other Aid L" }
    ];
    expect(suggestSetSibling(primary, candidates)?.id).toBe("c1");
  });

  it("never pairs two members with the same explicit side", () => {
    const candidates = [{ id: "c1", name: "Steve's Aids R" }];
    expect(suggestSetSibling(primary, candidates)).toBeNull();
  });

  it("falls back to a base-name match when sides are unknown", () => {
    const noSidePrimary = { id: "p1", name: "Vivia 9" };
    const candidates = [{ id: "c1", name: "Vivia 9" }];
    expect(suggestSetSibling(noSidePrimary, candidates)?.id).toBe("c1");
  });

  it("returns null when no base name matches", () => {
    const candidates = [{ id: "c1", name: "Something Else L" }];
    expect(suggestSetSibling(primary, candidates)).toBeNull();
  });

  it("ignores the primary itself and unusable names", () => {
    expect(suggestSetSibling(primary, [{ id: "p1", name: "Steve's Aids R" }])).toBeNull();
    expect(suggestSetSibling({ id: "p2", name: "X" }, [{ id: "c1", name: "X L" }])).toBeNull();
  });
});

describe("verified-MFi persistence (localStorage)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists verified ids across calls", () => {
    expect(isVerifiedMfi("dev-1")).toBe(false);
    markVerifiedMfi("dev-1");
    expect(isVerifiedMfi("dev-1")).toBe(true);
    expect(isVerifiedMfi("DEV-1")).toBe(true);
    expect(isVerifiedMfi("dev-2")).toBe(false);
    expect(window.localStorage.getItem("@mfi_verified")).toContain("DEV-1");
  });

  it("round-trips last-set metadata", () => {
    expect(loadLastSet()).toBeNull();
    saveLastSet({ primaryId: "p", secondaryId: "s", primarySide: "right" });
    expect(loadLastSet()).toEqual({ primaryId: "p", secondaryId: "s", primarySide: "right" });
  });
});
