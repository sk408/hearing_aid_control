import { useEffect, useMemo, useRef } from "react";
import { createAdapter } from "./adapters/factory";
import { detectBrandFromServices } from "./brand/detection";
import { resolveCapabilities, type DeviceProfile } from "./capability/capabilityEngine";
import { CapabilityTable } from "./ui/CapabilityTable";
import { DiagnosticsPanel } from "./ui/DiagnosticsPanel";
import { ControlPanel } from "./ui/ControlPanel";
import { SafeModeBanner } from "./ui/SafeModeBanner";
import { useAppStore } from "./store/appStore";
import { DiagnosticsStream } from "./diagnostics/diagnostics";
import { WebBleTransport } from "./transport/webBleTransport";
import type { BrandAdapter } from "./adapters/types";
import type { Operation } from "./domain/model";

const OPTIONAL_SERVICES: BluetoothServiceUUID[] = [
  "56772eaf-2153-4f74-acf3-4368d99fbf5a",
  "8b82105d-0f0c-40bb-b422-3770fa72a864",
  "e0262760-08c2-11e1-9073-0e8ac72ea010",
  "0000fdf0-0000-1000-8000-00805f9b34fb",
  "9a04f079-9840-4286-ab92-e65be0885f95",
  "0000180a-0000-1000-8000-00805f9b34fb",
  "0000180f-0000-1000-8000-00805f9b34fb"
];

const DEVICE_FILTERS: BluetoothLEScanFilter[] = [
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
  const pushMessage = useAppStore((state) => state.pushMessage);
  const resetSession = useAppStore((state) => state.resetSession);

  const diagnostics = useMemo(() => new DiagnosticsStream(), []);
  const transport = useMemo(() => new WebBleTransport(diagnostics), [diagnostics]);
  const adapterRef = useRef<BrandAdapter | null>(null);

  useEffect(() => {
    const unsubscribe = diagnostics.onEvent((event) => {
      const prefix = event.brand ? `[${event.brand}]` : "[transport]";
      pushMessage(`${prefix} ${event.type}: ${event.detail}`);
    });
    return unsubscribe;
  }, [diagnostics, pushMessage]);

  const connect = async (): Promise<void> => {
    setConnecting(true);
    try {
      await transport.connect(DEVICE_FILTERS, OPTIONAL_SERVICES);
      const discovery = await transport.discover();
      const detectedBrand = detectBrandFromServices(discovery.services);
      const profile: DeviceProfile = {
        brand: detectedBrand,
        discoveredServiceUuids: discovery.services,
        discoveredCharacteristicUuids: discovery.characteristics
      };
      const adapter = createAdapter(detectedBrand, transport, profile, diagnostics);
      await adapter.connect();
      const resolved = resolveCapabilities(profile);
      const state = await adapter.refreshState();

      adapterRef.current = adapter;
      setBrand(detectedBrand);
      setCapabilities(resolved);
      setDriverState(state);
      setDiscovery(discovery.services, discovery.characteristics);
      setConnected(true);
    } catch (error) {
      pushMessage(`connect-error: ${(error as Error).message}`);
      await transport.disconnect();
      adapterRef.current = null;
      resetSession();
    } finally {
      setConnecting(false);
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

  return (
    <main>
      <h1>Hearing Aid Control (Web MVP)</h1>
      <p>Brand: {brand}</p>
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
      <ControlPanel
        brand={brand}
        connected={connected}
        capabilities={capabilities}
        onExecute={runOperation}
        onRefresh={refreshState}
      />
      <SafeModeBanner brand={brand} capabilities={capabilities} />
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
