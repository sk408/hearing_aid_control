import type { CapabilityDecision } from "../domain/model";

export class CapabilityError extends Error {
  public readonly code = "CAPABILITY_BLOCKED";
}

export interface SafetyGateOptions {
  readonly allowPartialSafeOperations: boolean;
}

const DEFAULT_OPTIONS: SafetyGateOptions = {
  allowPartialSafeOperations: false
};

export class SafetyGate {
  private readonly options: SafetyGateOptions;

  public constructor(options: Partial<SafetyGateOptions> = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
  }

  public assertExecutable(decision: CapabilityDecision): void {
    switch (decision.status) {
      case "supported":
        return;
      case "partial":
        if (this.options.allowPartialSafeOperations) {
          return;
        }
        throw new CapabilityError(`Partial operation blocked: ${decision.reason}`);
      case "blocked":
        throw new CapabilityError(`Blocked operation: ${decision.reason}`);
      default: {
        const exhaustiveStatus: never = decision.status;
        throw new CapabilityError(`Unknown capability status: ${String(exhaustiveStatus)}`);
      }
    }
  }
}
