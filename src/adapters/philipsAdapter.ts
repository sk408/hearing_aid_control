import type { Operation } from "../domain/model";
import { BaseAdapter } from "./baseAdapter";
import type { DriverState } from "./types";

const PHILIPS_CHARS = {
  mainVolume: "1454e9d6-f658-4190-8589-22aa9e3021eb",
  streamVolume: "50632720-4c0f-4bc4-960a-2404bdfdfbca",
  programSelect: "535442f7-0ff7-4fec-9780-742f3eb00eda",
  programRead: "535442f7-0ff7-4fec-9780-742f3eb00eda",
  volumeRange: "58bbccc5-5a57-4e00-98d5-18c6a0408dfd"
} as const;

export class PhilipsAdapter extends BaseAdapter {
  public readonly brand = "philips" as const;

  protected async executeInternal(
    operation: Operation,
    args: Record<string, number | boolean | string>
  ): Promise<void> {
    switch (operation) {
      case "SetVolume": {
        const level = this.toByte(args.level, 50);
        const isMuted = Boolean(args.isMuted ?? false);
        const payload = new Uint8Array([level, isMuted ? 0 : 1]);
        await this.context.transport.write(PHILIPS_CHARS.mainVolume, payload);
        return;
      }
      case "SetMute": {
        const level = this.toByte(args.level, 50);
        const isMuted = Boolean(args.isMuted ?? true);
        const payload = new Uint8Array([level, isMuted ? 0 : 1]);
        await this.context.transport.write(PHILIPS_CHARS.streamVolume, payload);
        return;
      }
      case "SetProgram": {
        const target = this.toByte(args.programId, 0);
        await this.context.transport.write(PHILIPS_CHARS.programSelect, new Uint8Array([target]));
        return;
      }
      case "RefreshState":
      case "GetBatteryState":
      case "GetDeviceInfo":
      case "ProgramStep":
      case "VolumeStep":
        return;
      default: {
        const exhaustiveOperation: never = operation;
        throw new Error(`Unsupported operation for Philips: ${String(exhaustiveOperation)}`);
      }
    }
  }

  public async refreshState(): Promise<DriverState> {
    const volumeRaw = await this.context.transport.read(PHILIPS_CHARS.mainVolume);
    const programRaw = await this.context.transport.read(PHILIPS_CHARS.programRead);
    await this.context.transport.read(PHILIPS_CHARS.volumeRange);

    return {
      volume: volumeRaw[0],
      muted: volumeRaw[1] === 0,
      activeProgram: programRaw[0]
    };
  }

  private toByte(value: number | boolean | string | undefined, fallback: number): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return fallback;
    }
    return Math.max(0, Math.min(255, Math.round(value)));
  }
}
