import registryJson from "../../protocol_registry.json";
import type { Brand, Operation, ProtocolRegistryEntry } from "../domain/model";
import { validateRegistry } from "./schema";

validateRegistry(registryJson);

const registry = registryJson as ProtocolRegistryEntry[];

export function getRegistry(): readonly ProtocolRegistryEntry[] {
  return registry;
}

export function getRegistryEntriesForBrand(brand: Brand): readonly ProtocolRegistryEntry[] {
  return registry.filter((entry) => entry.brand === brand);
}

export function getRegistryEntry(brand: Brand, operation: Operation): ProtocolRegistryEntry | undefined {
  return registry.find((entry) => entry.brand === brand && entry.operation === operation);
}
