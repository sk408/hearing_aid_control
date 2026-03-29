import type { Brand, Operation } from "../domain/model";
import { resolveCapability, type DeviceProfile } from "../capability/capabilityEngine";
import type { DiagnosticsStream } from "../diagnostics/diagnostics";
import { PhilipsAdapter } from "./philipsAdapter";
import { ResoundAdapter } from "./resoundAdapter";
import { RextonAdapter } from "./rextonAdapter";
import { StarkeyAdapter } from "./starkeyAdapter";
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
    case "philips":
      return new PhilipsAdapter(context);
    case "rexton":
      return new RextonAdapter(context);
    case "resound":
      return new ResoundAdapter(context);
    case "starkey":
      return new StarkeyAdapter(context);
    case "unknown":
      throw new Error("Unknown brand adapter is not implemented.");
    default: {
      const exhaustiveBrand: never = brand;
      throw new Error(`Unsupported brand: ${String(exhaustiveBrand)}`);
    }
  }
}
