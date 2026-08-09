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
  mfi: DEFAULT_PROGRAMS
};

export function getProgramOptions(brand: Brand): readonly ProgramOption[] {
  if (brand === "unknown") {
    return DEFAULT_PROGRAMS;
  }
  return BRAND_PROGRAMS[brand];
}
