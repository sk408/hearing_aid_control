import type { Brand } from "../domain/model";

export function detectBrandFromServices(serviceUuids: readonly string[]): Brand {
  const normalized = serviceUuids.map((value) => value.toLowerCase());

  const has = (uuid: string): boolean => normalized.includes(uuid.toLowerCase());
  const hasPrefix = (prefix: string): boolean => normalized.some((item) => item.startsWith(prefix.toLowerCase()));

  if (has("9a04f079-9840-4286-ab92-e65be0885f95")) {
    return "starkey";
  }
  if (hasPrefix("e0262760")) {
    return "resound";
  }
  if (has("56772eaf-2153-4f74-acf3-4368d99fbf5a")) {
    if (hasPrefix("8b82")) {
      return "rexton";
    }
    return "philips";
  }
  return "unknown";
}
