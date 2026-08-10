import type { Brand, CapabilityDecision, Operation } from "../domain/model";
import type { DeviceInfoSummary, Transport } from "../transport/types";

export interface ProgramInfo {
  readonly index: number;
  readonly name: string;
}

export interface DriverState {
  readonly volume?: number;
  readonly muted?: boolean;
  readonly activeProgram?: number;
  readonly batteryPercent?: number;
  /**
   * Battery of the secondary aid in a binaural set (MFi adapter only).
   * Present when one adapter manages two GATT connections.
   */
  readonly batteryPercentSecondary?: number;
  readonly deviceInfo?: DeviceInfoSummary;
  /** Streaming-path volume 0–100 (MFi adapter only). */
  readonly streamVolume?: number;
  /** True when the adapter drives a two-aid binaural set (MFi adapter only). */
  readonly setActive?: boolean;
  /**
   * Ear side of the primary aid, when detected (8d17ac2f side characteristic
   * or an L/R marker in the advertised name). Undefined when unknown.
   */
  readonly primarySide?: "left" | "right";
  /**
   * False when a connected binaural set member has dropped its link (the
   * adapter keeps controlling the surviving aid). Undefined single-sided.
   */
  readonly secondaryConnected?: boolean;
  /** Fitted program names read via the LEA name selector (MFi adapter only). */
  readonly programs?: readonly ProgramInfo[];
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
