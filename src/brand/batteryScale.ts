/**
 * Per-device battery scale heuristic.
 *
 * MFI_SPEC claims the LEA battery characteristic (24e1dff3) reports 0–100
 * percent, but live hardware proves otherwise: a ReSound aid at a physical
 * ~full charge reported raw byte 10 — i.e. this firmware reports DECILES
 * (0–10), so the true percent is raw ×10.
 *
 * The adapter therefore tracks the maximum raw byte ever seen per device:
 *  - max raw ≤ 10  → decile scale (×10)
 *  - max raw > 10  → direct percent scale (×1, the spec behavior)
 * The maximum is persisted per device id in localStorage so the learned
 * scale survives reloads and is stable across sessions.
 *
 * Raw bytes are kept alongside the scaled percent everywhere (DriverState)
 * so scaling decisions stay verifiable on hardware in the Advanced view.
 */

/** localStorage key: JSON map of device id → max raw battery byte seen. */
const BATTERY_SCALE_STORAGE_KEY = "hac_battery_scale_v1";

/** Raw-byte ceiling that still counts as a decile (0–10) report. */
const DECILE_MAX_RAW = 10;

export interface BatteryReading {
  /** Raw byte as reported by the characteristic. */
  readonly raw: number;
  /** Scale applied to raw to obtain the percent (1 or 10). */
  readonly scale: number;
  /** Scaled, clamped 0–100 percent. */
  readonly percent: number;
}

function readMaxMap(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(BATTERY_SCALE_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const map: Record<string, number> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        map[id] = value;
      }
    }
    return map;
  } catch {
    return {};
  }
}

function writeMaxMap(map: Record<string, number>): void {
  try {
    window.localStorage.setItem(BATTERY_SCALE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // persistence failure is non-fatal — the in-memory heuristic still applies
  }
}

/** Scale a device reports with, given the max raw byte ever seen for it. */
export function batteryScaleForMax(maxRawSeen: number): number {
  return maxRawSeen <= DECILE_MAX_RAW ? 10 : 1;
}

/** Persisted max raw byte seen for a device (0 when never seen). */
export function loadBatteryMaxRaw(deviceId: string): number {
  return readMaxMap()[deviceId] ?? 0;
}

/**
 * Record a newly observed raw byte for a device and return the scaled
 * reading. The persisted max only ever grows, so a device that once proved
 * to report direct percent (raw > 10) is never reclassified as decile.
 */
export function recordBatteryRaw(deviceId: string, raw: number): BatteryReading {
  const clampedRaw = Math.max(0, Math.min(255, Math.round(raw)));
  const map = readMaxMap();
  const maxRaw = Math.max(map[deviceId] ?? 0, clampedRaw);
  if (maxRaw !== map[deviceId]) {
    map[deviceId] = maxRaw;
    writeMaxMap(map);
  }
  const scale = batteryScaleForMax(maxRaw);
  return { raw: clampedRaw, scale, percent: Math.min(100, clampedRaw * scale) };
}

/** Test hook: clear the persisted scale table. */
export function resetBatteryScaleTable(): void {
  try {
    window.localStorage.removeItem(BATTERY_SCALE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
