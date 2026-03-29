import type { Brand, CapabilityDecision, Operation, ProtocolRegistryEntry } from "../domain/model";
import { getRegistryEntriesForBrand, getRegistryEntry } from "../registry/protocolRegistry";

const EXECUTABLE_SAFETY_CLASSES = new Set(["safe-control", "state-read"]);

export interface DeviceProfile {
  readonly brand: Brand;
  readonly discoveredServiceUuids: readonly string[];
  readonly discoveredCharacteristicUuids: readonly string[];
}

function includesUuid(uuids: readonly string[], uuid: string | undefined): boolean {
  if (!uuid) {
    return true;
  }
  const normalized = uuids.map((item) => item.toLowerCase());
  return normalized.includes(uuid.toLowerCase());
}

export function resolveCapability(profile: DeviceProfile, operation: Operation): CapabilityDecision {
  const entry = getRegistryEntry(profile.brand, operation);
  if (!entry) {
    return {
      brand: profile.brand,
      operation,
      status: "blocked",
      reason: "No registry mapping exists for this brand/operation."
    };
  }

  if (!includesUuid(profile.discoveredServiceUuids, entry.serviceUuid)) {
    return {
      brand: profile.brand,
      operation,
      status: "blocked",
      reason: "Required service UUID is not discovered on device.",
      entry
    };
  }

  if (!includesUuid(profile.discoveredCharacteristicUuids, entry.characteristicUuid)) {
    return {
      brand: profile.brand,
      operation,
      status: "blocked",
      reason: "Required characteristic UUID is not discovered on device.",
      entry
    };
  }

  if (!EXECUTABLE_SAFETY_CLASSES.has(entry.safetyClass)) {
    return {
      brand: profile.brand,
      operation,
      status: "blocked",
      reason: entry.blockReason ?? "Operation is safety-gated.",
      entry
    };
  }

  switch (entry.status) {
    case "supported":
      return {
        brand: profile.brand,
        operation,
        status: "supported",
        reason: "Operation is confirmed and enabled.",
        entry
      };
    case "partial":
      return {
        brand: profile.brand,
        operation,
        status: "partial",
        reason: entry.blockReason ?? "Operation is partial and requires caution.",
        entry
      };
    case "blocked":
      return {
        brand: profile.brand,
        operation,
        status: "blocked",
        reason: entry.blockReason ?? "Operation is blocked in registry.",
        entry
      };
    default: {
      const exhaustiveStatus: never = entry.status;
      throw new Error(`Unsupported capability status: ${String(exhaustiveStatus)}`);
    }
  }
}

export function resolveCapabilities(profile: DeviceProfile): readonly CapabilityDecision[] {
  return getRegistryEntriesForBrand(profile.brand).map((entry: ProtocolRegistryEntry) =>
    resolveCapability(profile, entry.operation)
  );
}
