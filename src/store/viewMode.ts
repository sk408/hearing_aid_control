/**
 * Simple/Advanced view preference.
 *
 * The app's audience is hearing-aid WEARERS — many elderly, many technically
 * illiterate — so "simple" is the default for new users: big text, big
 * buttons, no jargon, essentials only. "advanced" exposes the full control
 * surface (per-ear sliders, stream volume, diagnostics, logs).
 *
 * Persisted in localStorage so the choice survives reloads.
 */
export type ViewMode = "simple" | "advanced";

const VIEW_MODE_STORAGE_KEY = "hac_view_mode_v1";

/** Load the persisted preference. Defaults to "simple" for new users. */
export function loadViewMode(): ViewMode {
  try {
    return window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "advanced" ? "advanced" : "simple";
  } catch {
    return "simple";
  }
}

/** Persist the preference (storage failure is non-fatal). */
export function saveViewMode(mode: ViewMode): void {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // persistence failure is non-fatal — the in-memory state still applies
  }
}
