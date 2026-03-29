import type { DiagnosticsStream } from "../diagnostics/diagnostics";
import { TransportError, type ConnectionState, type DeviceInfoSummary, type Transport, type TransportNotification } from "./types";

const RECONNECT_DELAYS_MS = [300, 700, 1400];

export class WebBleTransport implements Transport {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private state: ConnectionState = "idle";
  private readonly characteristicCache = new Map<string, BluetoothRemoteGATTCharacteristic>();

  public constructor(private readonly diagnostics: DiagnosticsStream) {}

  public getConnectionState(): ConnectionState {
    return this.state;
  }

  public async connect(
    filters: readonly BluetoothLEScanFilter[],
    optionalServices: readonly BluetoothServiceUUID[]
  ): Promise<DeviceInfoSummary> {
    if (!("bluetooth" in navigator)) {
      throw new TransportError("Web Bluetooth is not available in this browser.", "WEB_BLE_UNAVAILABLE");
    }

    this.state = "connecting";
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters,
        optionalServices
      });

      this.device.addEventListener("gattserverdisconnected", this.onDisconnected);
      if (!this.device.gatt) {
        throw new TransportError("Selected device has no GATT server.", "NO_GATT");
      }

      this.server = await this.device.gatt.connect();
      this.state = "connected";
      this.diagnostics.emit({
        type: "transport.connect",
        detail: `Connected to ${this.device.name ?? "unknown-device"}`
      });

      return {
        id: this.device.id,
        name: this.device.name ?? "Unknown hearing aid"
      };
    } catch (error) {
      this.state = "disconnected";
      throw new TransportError(`Connect failed: ${(error as Error).message}`, "CONNECT_FAILED");
    }
  }

  public async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.server = null;
    this.characteristicCache.clear();
    this.state = "disconnected";
    this.diagnostics.emit({
      type: "transport.disconnect",
      detail: "Disconnected from device."
    });
  }

  public async discover(): Promise<{ services: string[]; characteristics: string[] }> {
    const services = await this.requireServer().getPrimaryServices();
    const serviceUuids: string[] = [];
    const characteristicUuids: string[] = [];

    for (const service of services) {
      serviceUuids.push(service.uuid);
      const chars = await service.getCharacteristics();
      chars.forEach((item: BluetoothRemoteGATTCharacteristic) => {
        characteristicUuids.push(item.uuid);
        this.characteristicCache.set(item.uuid.toLowerCase(), item);
      });
    }

    return {
      services: serviceUuids,
      characteristics: characteristicUuids
    };
  }

  public async read(characteristicUuid: string): Promise<Uint8Array> {
    const characteristic = await this.getCharacteristic(characteristicUuid);
    const value = await characteristic.readValue();
    const data = new Uint8Array(value.buffer.slice(0));
    this.diagnostics.emit({
      type: "transport.read",
      detail: `Read ${characteristicUuid}`
    });
    return data;
  }

  public async write(characteristicUuid: string, value: Uint8Array): Promise<void> {
    const characteristic = await this.getCharacteristic(characteristicUuid);
    await characteristic.writeValue(value);
    this.diagnostics.emit({
      type: "transport.write",
      detail: `Write ${characteristicUuid}: [${Array.from(value).join(",")}]`
    });
  }

  public async subscribe(
    characteristicUuid: string,
    onNotification: (notification: TransportNotification) => void
  ): Promise<void> {
    const characteristic = await this.getCharacteristic(characteristicUuid);
    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (!target.value) {
        return;
      }
      const value = new Uint8Array(target.value.buffer.slice(0));
      this.diagnostics.emit({
        type: "transport.notify",
        detail: `Notify ${characteristicUuid}: [${Array.from(value).join(",")}]`
      });
      onNotification({
        characteristicUuid,
        value
      });
    });
  }

  private async getCharacteristic(characteristicUuid: string): Promise<BluetoothRemoteGATTCharacteristic> {
    const cached = this.characteristicCache.get(characteristicUuid.toLowerCase());
    if (cached) {
      return cached;
    }

    await this.discover();
    const refreshed = this.characteristicCache.get(characteristicUuid.toLowerCase());
    if (refreshed) {
      return refreshed;
    }
    throw new TransportError(`Characteristic not found: ${characteristicUuid}`, "CHAR_NOT_FOUND");
  }

  private requireServer(): BluetoothRemoteGATTServer {
    if (!this.server?.connected) {
      throw new TransportError("Not connected to a GATT server.", "NOT_CONNECTED");
    }
    return this.server;
  }

  private readonly onDisconnected = async (): Promise<void> => {
    if (!this.device || !this.device.gatt) {
      return;
    }

    this.state = "reconnecting";
    for (const delay of RECONNECT_DELAYS_MS) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        this.server = await this.device.gatt.connect();
        this.state = "connected";
        this.diagnostics.emit({
          type: "transport.connect",
          detail: "Reconnected after disconnect."
        });
        return;
      } catch {
        continue;
      }
    }

    this.state = "disconnected";
    this.diagnostics.emit({
      type: "transport.disconnect",
      detail: "Reconnect failed after bounded retries."
    });
  };
}
