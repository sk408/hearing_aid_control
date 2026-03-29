import type { Brand } from "../domain/model";

export interface ProgramOption {
  readonly id: number;
  readonly label: string;
}

const DEFAULT_PROGRAMS: readonly ProgramOption[] = [
  { id: 0, label: "General" },
  { id: 1, label: "Speech in Noise" },
  { id: 2, label: "Music" },
  { id: 3, label: "Outdoor" },
  { id: 4, label: "TV / Media" },
  { id: 5, label: "Custom" }
];

const BRAND_PROGRAMS: Record<Exclude<Brand, "unknown">, readonly ProgramOption[]> = {
  philips: [
    { id: 0, label: "General" },
    { id: 1, label: "Speech Focus" },
    { id: 2, label: "Music" },
    { id: 3, label: "Comfort" },
    { id: 4, label: "TV Adapter" },
    { id: 5, label: "Custom 1" }
  ],
  rexton: [
    { id: 0, label: "Universal" },
    { id: 1, label: "Noisy Environment" },
    { id: 2, label: "Music" },
    { id: 3, label: "Acoustic Phone" },
    { id: 4, label: "TV Stream" },
    { id: 5, label: "Telecoil" }
  ],
  resound: [
    { id: 0, label: "All-Around" },
    { id: 1, label: "Restaurant" },
    { id: 2, label: "Music" },
    { id: 3, label: "Outdoor" },
    { id: 4, label: "Streaming" },
    { id: 5, label: "Custom" }
  ],
  starkey: [
    { id: 0, label: "Normal" },
    { id: 1, label: "Edge Mode" },
    { id: 2, label: "Music+" },
    { id: 3, label: "Conversation" },
    { id: 4, label: "TV Stream" },
    { id: 5, label: "Accessory" }
  ]
};

export function getProgramOptions(brand: Brand): readonly ProgramOption[] {
  if (brand === "unknown") {
    return DEFAULT_PROGRAMS;
  }
  return BRAND_PROGRAMS[brand];
}
