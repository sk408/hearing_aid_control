export type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export class TransportError extends Error {
  public constructor(message: string, public readonly code: string) {
    super(message);
  }
}

export interface DeviceInfoSummary {
  readonly id: string;
  readonly name: string;
}

export interface TransportNotification {
  readonly characteristicUuid: string;
  readonly value: Uint8Array;
}

export interface Transport {
  connect(
    filters: readonly BluetoothLEScanFilter[],
    optionalServices: readonly BluetoothServiceUUID[]
  ): Promise<DeviceInfoSummary>;
  disconnect(): Promise<void>;
  discover(): Promise<{
    services: string[];
    characteristics: string[];
  }>;
  read(characteristicUuid: string): Promise<Uint8Array>;
  write(characteristicUuid: string, value: Uint8Array): Promise<void>;
  subscribe(
    characteristicUuid: string,
    onNotification: (notification: TransportNotification) => void
  ): Promise<void>;
  getConnectionState(): ConnectionState;
  /**
   * Optional adapter-installed hook deciding which subscriptions get re-armed
   * after a reconnect. Return false to skip a characteristic (e.g. secured
   * LEA characteristics while the link is unbonded). When unset, every
   * subscription is re-armed (default behavior).
   */
  resubscribeFilter?: ((characteristicUuid: string) => Promise<boolean>) | null;
}
