import type { Operation } from "../domain/model";
import { BaseAdapter } from "./baseAdapter";
import type { DriverState } from "./types";

const STARKEY_SERVICE = "9a04f079-9840-4286-ab92-e65be0885f95";

export class StarkeyAdapter extends BaseAdapter {
  public readonly brand = "starkey" as const;

  protected async executeInternal(
    operation: Operation,
    _args: Record<string, number | boolean | string>
  ): Promise<void> {
    switch (operation) {
      case "RefreshState":
      case "GetBatteryState":
      case "GetDeviceInfo":
        return;
      case "SetVolume":
      case "SetProgram":
      case "SetMute":
      case "ProgramStep":
      case "VolumeStep":
        throw new Error("Starkey writes are blocked until native transport framing is confirmed.");
      default: {
        const exhaustiveOperation: never = operation;
        throw new Error(`Unsupported operation for Starkey: ${String(exhaustiveOperation)}`);
      }
    }
  }

  public async refreshState(): Promise<DriverState> {
    // Read-only placeholder for MVP scaffolding.
    await Promise.resolve(STARKEY_SERVICE);
    return {};
  }
}
