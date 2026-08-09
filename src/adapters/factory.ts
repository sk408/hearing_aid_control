import type { Brand, Operation } from "../domain/model";
import { resolveCapability, type DeviceProfile } from "../capability/capabilityEngine";
import type { DiagnosticsStream } from "../diagnostics/diagnostics";
import { MfiAdapter } from "./mfiAdapter";
import type { AdapterContext, BrandAdapter } from "./types";
import type { Transport } from "../transport/types";

export function createAdapter(
  brand: Brand,
  transport: Transport,
  profile: DeviceProfile,
  diagnostics: DiagnosticsStream
): BrandAdapter {
  const context: AdapterContext = {
    transport,
    diagnostics,
    capabilityResolver: (operation: Operation) => resolveCapability(profile, operation)
  };

  switch (brand) {
    case "mfi":
      return new MfiAdapter(context, profile);
    case "unknown":
      throw new Error("Unknown brand adapter is not implemented.");
    default: {
      const exhaustiveBrand: never = brand;
      throw new Error(`Unsupported brand: ${String(exhaustiveBrand)}`);
    }
  }
}
