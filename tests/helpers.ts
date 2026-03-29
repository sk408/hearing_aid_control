import type { Transport, ConnectionState, DeviceInfoSummary, TransportNotification } from "../src/transport/types";

export class MockTransport implements Transport {
  private state: ConnectionState = "idle";
  private readonly reads = new Map<string, Uint8Array>();
  public readonly writes: Array<{ uuid: string; value: Uint8Array }> = [];

  public setRead(uuid: string, value: number[]): void {
    this.reads.set(uuid.toLowerCase(), new Uint8Array(value));
  }

  public async connect(): Promise<DeviceInfoSummary> {
    this.state = "connected";
    return { id: "mock", name: "Mock Device" };
  }

  public async disconnect(): Promise<void> {
    this.state = "disconnected";
  }

  public async discover(): Promise<{ services: string[]; characteristics: string[] }> {
    return { services: [], characteristics: [] };
  }

  public async read(characteristicUuid: string): Promise<Uint8Array> {
    const item = this.reads.get(characteristicUuid.toLowerCase());
    if (!item) {
      return new Uint8Array([]);
    }
    return item;
  }

  public async write(characteristicUuid: string, value: Uint8Array): Promise<void> {
    this.writes.push({ uuid: characteristicUuid, value });
  }

  public async subscribe(
    _characteristicUuid: string,
    _onNotification: (notification: TransportNotification) => void
  ): Promise<void> {
    return Promise.resolve();
  }

  public getConnectionState(): ConnectionState {
    return this.state;
  }
}
