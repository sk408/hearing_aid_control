import { beforeEach, describe, expect, it } from "vitest";
import { loadViewMode, saveViewMode } from "../src/store/viewMode";
import { useAppStore } from "../src/store/appStore";

const STORAGE_KEY = "hac_view_mode_v1";

describe("view mode preference (simple/advanced)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to simple for new users", () => {
    expect(loadViewMode()).toBe("simple");
  });

  it("treats unknown stored values as simple", () => {
    window.localStorage.setItem(STORAGE_KEY, "expert-mode-3000");
    expect(loadViewMode()).toBe("simple");
  });

  it("round-trips a persisted advanced preference", () => {
    saveViewMode("advanced");
    expect(loadViewMode()).toBe("advanced");
    saveViewMode("simple");
    expect(loadViewMode()).toBe("simple");
  });

  it("store setViewMode updates state and persists to localStorage", () => {
    useAppStore.getState().setViewMode("advanced");
    expect(useAppStore.getState().viewMode).toBe("advanced");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("advanced");

    useAppStore.getState().setViewMode("simple");
    expect(useAppStore.getState().viewMode).toBe("simple");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("simple");
  });
});
