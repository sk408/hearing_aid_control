import type { Brand } from "../domain/model";

/** Standardized MFi / LEA hearing-aid control service (MFI_SPEC.md §1.1) */
const MFI_LEA_SERVICE = "7d74f4bd-c74a-4431-862c-cce884371592";

export function detectBrandFromServices(serviceUuids: readonly string[]): Brand {
  const normalized = serviceUuids.map((value) => value.toLowerCase());

  const has = (uuid: string): boolean => normalized.includes(uuid.toLowerCase());
  const hasPrefix = (prefix: string): boolean => normalized.some((item) => item.startsWith(prefix.toLowerCase()));

  // 1. MFi / LEA universal control surface — checked FIRST. This app is the
  //    universal remote: ANY device exposing the standardized LEA service
  //    (including ReSound GN aids that also expose GN proprietary services)
  //    gets the MFi adapter. Brand-specific checks below only apply to
  //    devices WITHOUT the LEA service, which remain reachable as fallback.
  if (has(MFI_LEA_SERVICE)) {
    return "mfi";
  }

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
