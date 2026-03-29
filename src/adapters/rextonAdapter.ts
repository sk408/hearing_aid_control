import type { Operation } from "../domain/model";
import { BaseAdapter } from "./baseAdapter";
import type { DriverState } from "./types";

const REXTON_CHARS = {
  basicControl: "8b8276e8-0f0c-40bb-b422-3770fa72a864",
  activeProgram: "8b8225e0-0f0c-40bb-b422-3770fa72a864",
  battery: "ebee6f69-70b6-4bb9-b13b-9ba84953c233"
} as const;

export class RextonAdapter extends BaseAdapter {
  public readonly brand = "rexton" as const;

  protected async executeInternal(
    operation: Operation,
    args: Record<string, number | boolean | string>
  ): Promise<void> {
    switch (operation) {
      case "SetVolume": {
        const level = this.toByte(args.level, 50);
        await this.context.transport.write(REXTON_CHARS.basicControl, new Uint8Array([0x04, level]));
        return;
      }
      case "SetProgram": {
        const program = this.toByte(args.programId, 0);
        await this.context.transport.write(REXTON_CHARS.basicControl, new Uint8Array([0x05, program]));
        return;
      }
      case "SetMute":
        throw new Error("Rexton mute is blocked: advanced/FAPI path unresolved.");
      case "RefreshState":
      case "GetBatteryState":
      case "GetDeviceInfo":
      case "ProgramStep":
      case "VolumeStep":
        return;
      default: {
        const exhaustiveOperation: never = operation;
        throw new Error(`Unsupported operation for Rexton: ${String(exhaustiveOperation)}`);
      }
    }
  }

  public async refreshState(): Promise<DriverState> {
    const activeProgram = await this.context.transport.read(REXTON_CHARS.activeProgram);
    const battery = await this.context.transport.read(REXTON_CHARS.battery);

    return {
      activeProgram: activeProgram[0],
      batteryPercent: battery[0]
    };
  }

  private toByte(value: number | boolean | string | undefined, fallback: number): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return fallback;
    }
    return Math.max(0, Math.min(255, Math.round(value)));
  }
}
