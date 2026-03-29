import type {
  Brand,
  CapabilityStatus,
  Confidence,
  Operation,
  ProtocolRegistryEntry,
  SafetyClass
} from "../domain/model";

const BRANDS: readonly Brand[] = ["philips", "rexton", "resound", "starkey", "unknown"];
const OPERATIONS: readonly Operation[] = [
  "SetVolume",
  "VolumeStep",
  "SetProgram",
  "ProgramStep",
  "SetMute",
  "GetBatteryState",
  "GetDeviceInfo",
  "RefreshState"
];
const SAFETY_CLASSES: readonly SafetyClass[] = ["safe-control", "state-read", "fitting-risk", "unresolved"];
const CONFIDENCE_LEVELS: readonly Confidence[] = ["confirmed", "partial", "inferred", "inactive-in-baseline"];
const CAPABILITY_STATUSES: readonly CapabilityStatus[] = ["supported", "partial", "blocked"];

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);

const isTemplateArray = (value: unknown): value is Array<string | number> =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => typeof item === "string" || (typeof item === "number" && Number.isFinite(item)));

export function validateRegistryEntry(entry: unknown): entry is ProtocolRegistryEntry {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }

  const candidate = entry as Record<string, unknown>;

  if (!BRANDS.includes(candidate.brand as Brand)) {
    return false;
  }
  if (!OPERATIONS.includes(candidate.operation as Operation)) {
    return false;
  }
  if (!SAFETY_CLASSES.includes(candidate.safetyClass as SafetyClass)) {
    return false;
  }
  if (!CONFIDENCE_LEVELS.includes(candidate.confidence as Confidence)) {
    return false;
  }
  if (!CAPABILITY_STATUSES.includes(candidate.status as CapabilityStatus)) {
    return false;
  }
  if (!isStringArray(candidate.sourceRefs)) {
    return false;
  }
  if (!isTemplateArray(candidate.requestFrameTemplate)) {
    return false;
  }
  if (typeof candidate.responsePattern !== "object" || candidate.responsePattern === null) {
    return false;
  }

  if (
    candidate.serviceUuid !== undefined &&
    !isNonEmptyString(candidate.serviceUuid) &&
    candidate.serviceUuid !== null
  ) {
    return false;
  }
  if (
    candidate.characteristicUuid !== undefined &&
    !isNonEmptyString(candidate.characteristicUuid) &&
    candidate.characteristicUuid !== null
  ) {
    return false;
  }
  if (candidate.commandChannel !== undefined && !isNonEmptyString(candidate.commandChannel)) {
    return false;
  }
  if (candidate.notifyChannel !== undefined && !isNonEmptyString(candidate.notifyChannel)) {
    return false;
  }

  if (candidate.status !== "supported" && !isNonEmptyString(candidate.blockReason)) {
    return false;
  }

  return true;
}

export function validateRegistry(entries: unknown): asserts entries is ProtocolRegistryEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("Protocol registry must be a non-empty array.");
  }

  const invalidIndex = entries.findIndex((entry) => !validateRegistryEntry(entry));
  if (invalidIndex >= 0) {
    throw new Error(`Invalid protocol registry entry at index ${invalidIndex}.`);
  }
}
