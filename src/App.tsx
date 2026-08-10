import { useEffect, useMemo, useRef, useState } from "react";
import { createAdapter } from "./adapters/factory";
import { MfiAdapter } from "./adapters/mfiAdapter";
import { detectBrandFromServices } from "./brand/detection";
import {
  LEA_SERVICE_UUID,
  isFittingBroadcastName,
  isVerifiedMfi,
  looksLikeMfiHearingAidName
} from "./brand/mfiSets";
import { resolveCapabilities, type DeviceProfile } from "./capability/capabilityEngine";
import { CapabilityTable } from "./ui/CapabilityTable";
import { DiagnosticsPanel } from "./ui/DiagnosticsPanel";
import { ControlPanel } from "./ui/ControlPanel";
import { PairingBanner } from "./ui/PairingBanner";
import { SafeModeBanner } from "./ui/SafeModeBanner";
import { useAppStore } from "./store/appStore";
import { DiagnosticsStream } from "./diagnostics/diagnostics";
import { WebBleTransport } from "./transport/webBleTransport";
import type { BrandAdapter } from "./adapters/types";
import type { DeviceInfoSummary } from "./transport/types";
import type { Operation } from "./domain/model";

const OPTIONAL_SERVICES: BluetoothServiceUUID[] = [
  LEA_SERVICE_UUID,
  "56772eaf-2153-4f74-acf3-4368d99fbf5a",
  "8b82105d-0f0c-40bb-b422-3770fa72a864",
  "e0262760-08c2-11e1-9073-0e8ac72ea010",
  "0000fdf0-0000-1000-8000-00805f9b34fb",
  "9a04f079-9840-4286-ab92-e65be0885f95",
  "0000180a-0000-1000-8000-00805f9b34fb",
  "0000180f-0000-1000-8000-00805f9b34fb"
];

const DEVICE_FILTERS: BluetoothLEScanFilter[] = [
  // LEA first: this app is the universal MFi remote — the chooser leads with
  // MFi-capable hearing aids. Brand filters stay as fallback for non-LEA devices.
  { services: [LEA_SERVICE_UUID] },
  { services: ["56772eaf-2153-4f74-acf3-4368d99fbf5a"] },
  { services: ["e0262760-08c2-11e1-9073-0e8ac72ea010"] },
  { services: ["0000fdf0-0000-1000-8000-00805f9b34fb"] },
  { services: ["9a04f079-9840-4286-ab92-e65be0885f95"] },
  { services: ["0000180a-0000-1000-8000-00805f9b34fb"] }
];

export default function App(): JSX.Element {
  const brand = useAppStore((state) => state.brand);
  const connected = useAppStore((state) => state.connected);
  const connecting = useAppStore((state) => state.connecting);
  const capabilities = useAppStore((state) => state.capabilities);
  const driverState = useAppStore((state) => state.driverState);
  const messages = useAppStore((state) => state.messages);
  const discoveredServices = useAppStore((state) => state.discoveredServices);
  const discoveredCharacteristics = useAppStore((state) => state.discoveredCharacteristics);
  const setBrand = useAppStore((state) => state.setBrand);
  const setConnected = useAppStore((state) => state.setConnected);
  const setConnecting = useAppStore((state) => state.setConnecting);
  const setCapabilities = useAppStore((state) => state.setCapabilities);
  const setDriverState = useAppStore((state) => state.setDriverState);
  const setDiscovery = useAppStore((state) => state.setDiscovery);
  const bondState = useAppStore((state) => state.bondState);
  const setBondState = useAppStore((state) => state.setBondState);
  const pushMessage = useAppStore((state) => state.pushMessage);
  const resetSession = useAppStore((state) => state.resetSession);

  const diagnostics = useMemo(() => new DiagnosticsStream(), []);
  const transport = useMemo(() => new WebBleTransport(diagnostics), [diagnostics]);
  const adapterRef = useRef<BrandAdapter | null>(null);
  const [writeToBoth, setWriteToBoth] = useState<boolean>(false);
  const [addingEar, setAddingEar] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>("");
  const [grantedDevices, setGrantedDevices] = useState<readonly BluetoothDevice[]>([]);

  useEffect(() => {
    const unsubscribe = diagnostics.onEvent((event) => {
      const prefix = event.brand ? `[${event.brand}]` : "[transport]";
      pushMessage(`${prefix} ${event.type}: ${event.detail}`);
    });
    return unsubscribe;
  }, [diagnostics, pushMessage]);

  // Previously granted devices for one-tap reconnect without the chooser.
  // navigator.bluetooth.getDevices() needs Chrome 85+ permission persistence;
  // on some builds it requires chrome://flags/#enable-web-bluetooth-new-permissions-backend.
  useEffect(() => {
    if (!("bluetooth" in navigator) || typeof navigator.bluetooth.getDevices !== "function") return;
    navigator.bluetooth
      .getDevices()
      .then((devices) => {
        // Identity selection: GN aids broadcast two identities — hide the
        // fitting broadcast ("GN"), prefer verified/MFi-ish names.
        const usable = devices.filter((device) => !isFittingBroadcastName(device.name ?? ""));
        const rank = (device: BluetoothDevice): number => {
          if (isVerifiedMfi(device.id)) return 0;
          if (looksLikeMfiHearingAidName(device.name ?? "")) return 1;
          return 2;
        };
        setGrantedDevices([...usable].sort((a, b) => rank(a) - rank(b)));
      })
      .catch(() => undefined);
  }, []);

  /** Shared post-connection setup for both the chooser and getDevices paths. */
  const finishConnect = async (deviceInfo: DeviceInfoSummary): Promise<void> => {
    const discovery = await transport.discover();
    const detectedBrand = detectBrandFromServices(discovery.services);
    const profile: DeviceProfile = {
      brand: detectedBrand,
      discoveredServiceUuids: discovery.services,
      discoveredCharacteristicUuids: discovery.characteristics,
      deviceId: deviceInfo.id,
      deviceName: deviceInfo.name
    };
    const adapter = createAdapter(detectedBrand, transport, profile, diagnostics);
    if (adapter instanceof MfiAdapter) {
      adapter.onBondStateChange = setBondState;
    }
    await adapter.connect();
    const resolved = resolveCapabilities(profile);
    const state = await adapter.refreshState();

    adapterRef.current = adapter;
    setBrand(detectedBrand);
    setCapabilities(resolved);
    setDriverState(state);
    setDiscovery(discovery.services, discovery.characteristics);
    setDeviceName(deviceInfo.name);
    if (adapter instanceof MfiAdapter) {
      setBondState(adapter.bondState);
    }
    setConnected(true);
  };

  const handleConnectError = async (error: unknown): Promise<void> => {
    pushMessage(`connect-error: ${(error as Error).message}`);
    await transport.disconnect();
    adapterRef.current = null;
    resetSession();
  };

  const connect = async (): Promise<void> => {
    setConnecting(true);
    try {
      const deviceInfo = await transport.connect(DEVICE_FILTERS, OPTIONAL_SERVICES);
      await finishConnect(deviceInfo);
    } catch (error) {
      await handleConnectError(error);
    } finally {
      setConnecting(false);
    }
  };

  /** One-tap reconnect to a previously granted device — no chooser. */
  const reconnectGranted = async (device: BluetoothDevice): Promise<void> => {
    setConnecting(true);
    try {
      const deviceInfo = await transport.connectGrantedDevice(device);
      await finishConnect(deviceInfo);
    } catch (error) {
      await handleConnectError(error);
    } finally {
      setConnecting(false);
    }
  };

  /** Pairing banner Retry: re-run the secured-read sequence on the live link. */
  const retryPairing = async (): Promise<void> => {
    const adapter = adapterRef.current;
    if (!(adapter instanceof MfiAdapter)) return;
    try {
      const state = await adapter.retryBondedSetup();
      setBondState(state);
      if (state === "bonded") {
        const refreshed = await adapter.refreshState();
        setDriverState(refreshed);
        pushMessage("pairing: secured reads succeeded — link is bonded");
      }
    } catch (error) {
      pushMessage(`pairing-error: ${(error as Error).message}`);
    }
  };

  const disconnect = async (): Promise<void> => {
    if (adapterRef.current) {
      await adapterRef.current.disconnect();
      adapterRef.current = null;
    } else {
      await transport.disconnect();
    }
    resetSession();
  };

  const runOperation = async (
    operation: Operation,
    args?: Record<string, number | boolean | string>
  ): Promise<void> => {
    const adapter = adapterRef.current;
    if (!adapter) {
      pushMessage("action-error: no connected adapter");
      return;
    }

    try {
      await adapter.execute(operation, args);
      const refreshed = await adapter.refreshState();
      setDriverState(refreshed);
    } catch (error) {
      pushMessage(`action-error: ${(error as Error).message}`);
    }
  };

  const refreshState = async (): Promise<void> => {
    const adapter = adapterRef.current;
    if (!adapter) {
      return;
    }
    try {
      const refreshed = await adapter.refreshState();
      setDriverState(refreshed);
    } catch (error) {
      pushMessage(`refresh-error: ${(error as Error).message}`);
    }
  };

  // ── MFi binaural set handlers ──

  const addOtherEar = async (): Promise<void> => {
    const adapter = adapterRef.current;
    if (!(adapter instanceof MfiAdapter)) {
      return;
    }
    setAddingEar(true);
    try {
      await adapter.addSecondaryEar();
      const refreshed = await adapter.refreshState();
      setDriverState(refreshed);
    } catch (error) {
      pushMessage(`set-error: ${(error as Error).message}`);
    } finally {
      setAddingEar(false);
    }
  };

  const toggleWriteToBoth = (value: boolean): void => {
    const adapter = adapterRef.current;
    if (adapter instanceof MfiAdapter) {
      adapter.writeToBoth = value;
    }
    setWriteToBoth(value);
  };

  const mfiPanel =
    brand === "mfi"
      ? {
          isSet: driverState.setActive === true,
          primarySide: driverState.primarySide,
          addingEar,
          writeToBoth,
          programs: driverState.programs ?? [],
          streamVolume: driverState.streamVolume ?? 50,
          onAddOtherEar: addOtherEar,
          onSetWriteToBoth: toggleWriteToBoth
        }
      : undefined;

  return (
    <main>
      <h1>Hearing Aid Control (Web MVP)</h1>
      <p>Brand: {brand === "mfi" ? "MFi (Universal)" : brand}</p>
      <p>Session: {connecting ? "connecting" : connected ? "ready" : "idle"}</p>
      <p>Connection: {connected ? "connected" : "disconnected"}</p>
      <div className="actions">
        <button onClick={connect} disabled={connected || connecting}>
          {connecting ? "Connecting..." : "Connect"}
        </button>
        <button onClick={disconnect} disabled={!connected && !connecting}>
          Disconnect
        </button>
      </div>
      {!connected && grantedDevices.length > 0 ? (
        <section className="previous-devices">
          <h3>Previously connected</h3>
          {grantedDevices.map((device) => (
            <button key={device.id} onClick={() => void reconnectGranted(device)} disabled={connecting}>
              {device.name ?? "Unknown device"}
              {isVerifiedMfi(device.id) ? <span className="verified-tag"> — MFi hearing aid (verified)</span> : null}
            </button>
          ))}
        </section>
      ) : null}
      {connected && bondState === "needs-pairing" ? (
        <PairingBanner deviceName={deviceName || "your hearing aids"} onRetry={retryPairing} />
      ) : null}
      <ControlPanel
        brand={brand}
        connected={connected}
        capabilities={capabilities}
        onExecute={runOperation}
        onRefresh={refreshState}
        mfi={mfiPanel}
      />
      <SafeModeBanner brand={brand} capabilities={capabilities} />
      {brand === "mfi" && connected ? (
        <section>
          <h3>Battery</h3>
          <p>
            {mfiPanel?.isSet
              ? `${driverState.primarySide === "left" ? "Left" : "Right"} (primary): ${
                  driverState.batteryPercent ?? "?"
                }% — ${driverState.primarySide === "left" ? "Right" : "Left"} (secondary): ${
                  driverState.batteryPercentSecondary ?? "?"
                }%`
              : `Battery: ${driverState.batteryPercent ?? "?"}%`}
          </p>
        </section>
      ) : null}
      <section>
        <h3>Current State</h3>
        <pre>{JSON.stringify(driverState, null, 2)}</pre>
      </section>
      <section>
        <h3>Compatibility Snapshot</h3>
        <p>Services discovered: {discoveredServices.length}</p>
        <pre>{JSON.stringify(discoveredServices, null, 2)}</pre>
        <p>Characteristics discovered: {discoveredCharacteristics.length}</p>
        <pre>{JSON.stringify(discoveredCharacteristics, null, 2)}</pre>
      </section>
      <section>
        <h3>Capability Matrix</h3>
        <CapabilityTable capabilities={capabilities} />
      </section>
      <DiagnosticsPanel messages={messages} />
    </main>
  );
}
