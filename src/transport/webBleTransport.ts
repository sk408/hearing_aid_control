import type { DiagnosticsStream } from "../diagnostics/diagnostics";
import { TransportError, type ConnectionState, type DeviceInfoSummary, type Transport, type TransportNotification } from "./types";

const RECONNECT_DELAYS_MS = [300, 700, 1400];

export class WebBleTransport implements Transport {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private state: ConnectionState = "idle";
  private readonly characteristicCache = new Map<string, BluetoothRemoteGATTCharacteristic>();
  private readonly subscriptions = new Map<string, (notification: TransportNotification) => void>();

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
    } catch (error) {
      const maybeError = error as Error & { name?: string };
      if (maybeError.name !== "NotFoundError") {
        this.state = "disconnected";
        throw new TransportError(`Connect failed: ${maybeError.message}`, "CONNECT_FAILED");
      }

      // Fallback: some hearing aids do not advertise service UUIDs consistently.
      this.diagnostics.emit({
        type: "transport.connect",
        detail: "No device found with strict filters. Retrying with all nearby BLE devices."
      });

      try {
        this.device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices
        });
      } catch (fallbackError) {
        this.state = "disconnected";
        throw new TransportError(`Connect failed: ${(fallbackError as Error).message}`, "CONNECT_FAILED");
      }
    }

    return this.connectGatt();
  }

  /**
   * Connect to a device the page already has permission for — e.g. one
   * returned by `navigator.bluetooth.getDevices()`. No chooser is shown, so
   * this is used for auto-merging a binaural set member without a gesture.
   */
  public async connectGrantedDevice(device: BluetoothDevice): Promise<DeviceInfoSummary> {
    if (this.state === "connected" || this.state === "connecting") {
      throw new TransportError("Transport already has an active connection.", "ALREADY_CONNECTED");
    }
    this.state = "connecting";
    this.device = device;
    return this.connectGatt();
  }

  private async connectGatt(): Promise<DeviceInfoSummary> {
    const device = this.device;
    if (!device) {
      this.state = "disconnected";
      throw new TransportError("No device selected.", "NO_DEVICE");
    }

    try {
      device.addEventListener("gattserverdisconnected", this.onDisconnected);
      if (!device.gatt) {
        throw new TransportError("Selected device has no GATT server.", "NO_GATT");
      }

      this.server = await device.gatt.connect();
      this.state = "connected";
      this.diagnostics.emit({
        type: "transport.connect",
        detail: `Connected to ${device.name ?? "unknown-device"}`
      });

      return {
        id: device.id,
        name: device.name ?? "Unknown hearing aid"
      };
    } catch (error) {
      this.state = "disconnected";
      if (error instanceof TransportError) {
        throw error;
      }
      throw new TransportError(`Connect failed: ${(error as Error).message}`, "CONNECT_FAILED");
    }
  }

  public async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristicCache.clear();
    this.subscriptions.clear();
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
    // Prefer Write Request (ATT 0x12) so the firmware's error codes surface —
    // e.g. an out-of-range program index is actively rejected (MFI_SPEC §5.1).
    if (typeof characteristic.writeValueWithResponse === "function") {
      await characteristic.writeValueWithResponse(value);
    } else {
      await characteristic.writeValue(value);
    }
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
    this.subscriptions.set(characteristicUuid.toLowerCase(), onNotification);
    await this.armNotifications(characteristic, characteristicUuid, onNotification);
  }

  private async armNotifications(
    characteristic: BluetoothRemoteGATTCharacteristic,
    characteristicUuid: string,
    onNotification: (notification: TransportNotification) => void
  ): Promise<void> {
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
        await this.restoreAfterReconnect();
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

  /**
   * After a reconnect (including the disconnect triggered by OS pairing on
   * first access to an encrypted characteristic): re-run discovery — secured
   * characteristics may not have been visible pre-pairing — and re-arm any
   * notification subscriptions, which do not survive a GATT reconnect.
   */
  private async restoreAfterReconnect(): Promise<void> {
    try {
      await this.discover();
    } catch {
      return;
    }

    for (const [uuid, callback] of this.subscriptions) {
      const characteristic = this.characteristicCache.get(uuid);
      if (!characteristic) {
        continue;
      }
      try {
        await this.armNotifications(characteristic, uuid, callback);
      } catch {
        this.diagnostics.emit({
          type: "transport.notify",
          detail: `Failed to re-subscribe ${uuid} after reconnect.`
        });
      }
    }
  }
}
