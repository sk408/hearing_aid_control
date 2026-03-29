import type { Operation } from "../domain/model";
import { BaseAdapter } from "./baseAdapter";
import type { DriverState } from "./types";

const RESOUND_CHARS = {
  command: "1959a468-3234-4c18-9e78-8daf8d9dbf61",
  notify: "8b51a2ca-5bed-418b-b54b-22fe666aadd2"
} as const;

export class ResoundAdapter extends BaseAdapter {
  public readonly brand = "resound" as const;

  public override async connect(): Promise<void> {
    await this.context.transport.subscribe(RESOUND_CHARS.notify, () => {
      // Diagnostic-only path for MVP. Parsing is deferred until operation certainty is confirmed.
    });
  }

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
        throw new Error("ReSound writes are blocked until runtime operation mapping is confirmed.");
      default: {
        const exhaustiveOperation: never = operation;
        throw new Error(`Unsupported operation for ReSound: ${String(exhaustiveOperation)}`);
      }
    }
  }

  public async refreshState(): Promise<DriverState> {
    const discoverFrame = new Uint8Array([0x06]);
    await this.context.transport.write(RESOUND_CHARS.command, discoverFrame);
    return {};
  }
}
