import { create } from "zustand";
import type { CapabilityDecision, Brand } from "../domain/model";
import type { DriverState } from "../adapters/types";

export interface AppState {
  readonly brand: Brand;
  readonly connected: boolean;
  readonly connecting: boolean;
  readonly capabilities: readonly CapabilityDecision[];
  readonly driverState: DriverState;
  readonly messages: readonly string[];
  readonly discoveredServices: readonly string[];
  readonly discoveredCharacteristics: readonly string[];
  setBrand: (brand: Brand) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setCapabilities: (capabilities: readonly CapabilityDecision[]) => void;
  setDriverState: (driverState: DriverState) => void;
  setDiscovery: (services: readonly string[], characteristics: readonly string[]) => void;
  pushMessage: (message: string) => void;
  resetSession: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  brand: "unknown",
  connected: false,
  connecting: false,
  capabilities: [],
  driverState: {},
  messages: [],
  discoveredServices: [],
  discoveredCharacteristics: [],
  setBrand: (brand) => set({ brand }),
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setCapabilities: (capabilities) => set({ capabilities }),
  setDriverState: (driverState) => set({ driverState }),
  setDiscovery: (services, characteristics) =>
    set({
      discoveredServices: services,
      discoveredCharacteristics: characteristics
    }),
  pushMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message].slice(-30)
    })),
  resetSession: () =>
    set({
      brand: "unknown",
      connected: false,
      connecting: false,
      capabilities: [],
      driverState: {},
      discoveredServices: [],
      discoveredCharacteristics: []
    })
}));
