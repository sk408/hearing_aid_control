import { useMemo, useState } from "react";
import type { Brand, CapabilityDecision, Operation } from "../domain/model";

const WRITE_OPS: readonly Operation[] = ["SetVolume", "SetProgram", "SetMute"];

interface SafeModeBannerProps {
  readonly brand: Brand;
  readonly capabilities: readonly CapabilityDecision[];
}

export function SafeModeBanner({ brand, capabilities }: SafeModeBannerProps): JSX.Element | null {
  const [expanded, setExpanded] = useState<boolean>(false);

  const blockedWrites = useMemo(
    () =>
      capabilities.filter((item) => {
        const isWrite = WRITE_OPS.includes(item.operation);
        const isBlockedOrPartial = item.status !== "supported";
        return isWrite && isBlockedOrPartial;
      }),
    [capabilities]
  );

  if (blockedWrites.length === 0) {
    return null;
  }

  return (
    <section className="safe-mode-banner">
      <strong>Safe mode is active for {brand}.</strong>
      <p>
        Some write controls are intentionally locked because operation certainty and transport safety are not yet
        confirmed for this device profile.
      </p>
      <button onClick={() => setExpanded((value) => !value)}>
        {expanded ? "Hide safety details" : "Show safety details"}
      </button>
      {expanded ? (
        <ul>
          {blockedWrites.map((item) => (
            <li key={`${item.brand}-${item.operation}`}>
              <code>{item.operation}</code>: {item.reason}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
