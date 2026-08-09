import type { Brand } from "../domain/model";

/** Standardized MFi / LEA hearing-aid control service (MFI_SPEC.md §1.1) */
const MFI_LEA_SERVICE = "7d74f4bd-c74a-4431-862c-cce884371592";

export function detectBrandFromServices(serviceUuids: readonly string[]): Brand {
  const normalized = serviceUuids.map((value) => value.toLowerCase());

  const has = (uuid: string): boolean => normalized.includes(uuid.toLowerCase());
  const hasPrefix = (prefix: string): boolean => normalized.some((item) => item.startsWith(prefix.toLowerCase()));

  // MFi / LEA universal control surface — the ONLY path. This app is the
  // universal remote: any device exposing the standardized LEA service gets
  // the MFi adapter. The March 2026 brand-specific cores were removed
  // (confirmed non-functional, Sk408 2026-08-09); if brand control is ever
  // needed for non-LEA aids, port from universal-ha's C# drivers instead.
  if (has(MFI_LEA_SERVICE)) {
    return "mfi";
  }

  return "unknown";
}
