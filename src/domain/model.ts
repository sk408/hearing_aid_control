export type Brand = "philips" | "rexton" | "resound" | "starkey" | "unknown";

export type Operation =
  | "SetVolume"
  | "VolumeStep"
  | "SetProgram"
  | "ProgramStep"
  | "SetMute"
  | "GetBatteryState"
  | "GetDeviceInfo"
  | "RefreshState";

export type SafetyClass = "safe-control" | "state-read" | "fitting-risk" | "unresolved";

export type Confidence = "confirmed" | "partial" | "inferred" | "inactive-in-baseline";

export type CapabilityStatus = "supported" | "partial" | "blocked";

export interface ReadbackPattern {
  readonly levelByteIndex?: number;
  readonly muteByteIndex?: number;
  readonly muteWhenValueEquals?: number;
}

export interface ResponsePattern {
  readonly notifyEventIds?: readonly number[];
  readonly expectedHandles?: readonly number[];
  readonly readback?: ReadbackPattern;
}

export interface ProtocolRegistryEntry {
  readonly brand: Brand;
  readonly operation: Operation;
  readonly serviceUuid?: string;
  readonly characteristicUuid?: string;
  readonly commandChannel?: string;
  readonly notifyChannel?: string;
  readonly requestFrameTemplate: readonly (string | number)[];
  readonly responsePattern: ResponsePattern;
  readonly safetyClass: SafetyClass;
  readonly confidence: Confidence;
  readonly status: CapabilityStatus;
  readonly blockReason?: string;
  readonly sourceRefs: readonly string[];
}

export interface CapabilityDecision {
  readonly brand: Brand;
  readonly operation: Operation;
  readonly status: CapabilityStatus;
  readonly reason: string;
  readonly entry?: ProtocolRegistryEntry;
}
