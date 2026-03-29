import type { Brand, CapabilityDecision, Operation } from "../domain/model";
import type { DeviceInfoSummary, Transport } from "../transport/types";

export interface DriverState {
  readonly volume?: number;
  readonly muted?: boolean;
  readonly activeProgram?: number;
  readonly batteryPercent?: number;
  readonly deviceInfo?: DeviceInfoSummary;
}

export interface BrandAdapter {
  readonly brand: Brand;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(operation: Operation, args?: Record<string, number | boolean | string>): Promise<void>;
  refreshState(): Promise<DriverState>;
  getCapabilities(): readonly CapabilityDecision[];
}

export interface AdapterContext {
  readonly transport: Transport;
  readonly diagnostics: import("../diagnostics/diagnostics").DiagnosticsStream;
  readonly capabilityResolver: (operation: Operation) => CapabilityDecision;
}
