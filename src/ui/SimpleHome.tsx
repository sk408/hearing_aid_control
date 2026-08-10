import { useEffect, useState } from "react";
import type { CapabilityDecision, Operation } from "../domain/model";
import type { DriverState } from "../adapters/types";

interface SimpleHomeProps {
  readonly connected: boolean;
  readonly connecting: boolean;
  readonly driverState: DriverState;
  readonly capabilities: readonly CapabilityDecision[];
  readonly onConnect: () => Promise<void>;
  readonly onDisconnect: () => Promise<void>;
  readonly onExecute: (operation: Operation, args?: Record<string, number | boolean | string>) => Promise<void>;
}

/** Volume change per tap of the big Louder/Softer buttons (0–100 scale). */
const VOLUME_STEP = 5;

function isSupported(capabilities: readonly CapabilityDecision[], operation: Operation): boolean {
  return capabilities.some((item) => item.operation === operation && item.status === "supported");
}

/** Plain-words battery line: "80% — Good" / "15% — Low, charge soon". */
function batteryWords(pct: number | undefined): string {
  if (pct == null) return "unknown";
  const status = pct <= 20 ? "Low, charge soon" : pct <= 50 ? "OK" : "Good";
  return `${pct}% — ${status}`;
}

function sideWord(side: "left" | "right" | undefined): string {
  if (side === "left") return "Left";
  if (side === "right") return "Right";
  return "Your";
}

/**
 * Simple view — the default for new users. The audience is hearing-aid
 * wearers, many elderly and non-technical, so this screen is the essentials
 * only, in plain words: giant Louder/Softer buttons, big program buttons,
 * plain battery status, one giant mute toggle. No jargon, no sliders, no
 * diagnostics. Everything else lives in the Advanced view.
 */
export function SimpleHome({
  connected,
  connecting,
  driverState,
  capabilities,
  onConnect,
  onDisconnect,
  onExecute
}: SimpleHomeProps): JSX.Element {
  const [volume, setVolume] = useState<number>(driverState.volume ?? 50);
  const [busy, setBusy] = useState<boolean>(false);

  // Track the aid's actual volume (seeded on connect, refreshed after writes).
  useEffect(() => {
    if (driverState.volume != null) setVolume(driverState.volume);
  }, [driverState.volume]);

  if (!connected) {
    return (
      <section className="simple-home">
        <button className="giant-button" onClick={() => void onConnect()} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect my hearing aids"}
        </button>
      </section>
    );
  }

  const muted = driverState.muted === true;
  const canVolume = isSupported(capabilities, "SetVolume");
  const canProgram = isSupported(capabilities, "SetProgram");
  const canMute = isSupported(capabilities, "SetMute");

  const run = async (operation: Operation, args?: Record<string, number | boolean | string>): Promise<void> => {
    setBusy(true);
    try {
      await onExecute(operation, args);
    } finally {
      setBusy(false);
    }
  };

  const stepVolume = async (delta: number): Promise<void> => {
    const next = Math.max(0, Math.min(100, volume + delta));
    setVolume(next);
    await run("SetVolume", { level: next, isMuted: muted, ear: "both" });
  };

  const programs = driverState.programs ?? [];
  const activeProgram = programs.find((item) => item.index === driverState.activeProgram);
  const isSet = driverState.setActive === true;
  const secondarySide = driverState.primarySide === "left" ? "right" : "left";

  return (
    <section className="simple-home">
      <p className="simple-connected-line">
        {isSet
          ? driverState.primarySide
            ? `${sideWord(driverState.primarySide)} and ${sideWord(secondarySide).toLowerCase()} hearing aids connected`
            : "Both hearing aids connected"
          : `${sideWord(driverState.primarySide)} hearing aid connected`}
      </p>

      {isSet ? (
        <div className="simple-battery">
          <p>{`${driverState.primarySide ? sideWord(driverState.primarySide) : "Hearing aid 1"} battery: ${batteryWords(driverState.batteryPercent)}`}</p>
          <p>{`${driverState.primarySide ? sideWord(secondarySide) : "Hearing aid 2"} battery: ${batteryWords(driverState.batteryPercentSecondary)}`}</p>
        </div>
      ) : (
        <p className="simple-battery">{`Battery: ${batteryWords(driverState.batteryPercent)}`}</p>
      )}

      {canVolume ? (
        <div className="simple-volume">
          <button
            className="giant-button volume-button"
            onClick={() => void stepVolume(VOLUME_STEP)}
            disabled={busy || volume >= 100}
          >
            Louder
          </button>
          <button
            className="giant-button volume-button"
            onClick={() => void stepVolume(-VOLUME_STEP)}
            disabled={busy || volume <= 0}
          >
            Softer
          </button>
        </div>
      ) : null}

      {canProgram && programs.length > 0 ? (
        <div className="simple-programs">
          <p className="simple-program-current">
            Listening program: <strong>{activeProgram?.name ?? "Unknown"}</strong>
          </p>
          {programs.map((program) => (
            <button
              key={program.index}
              className={`giant-button program-button ${program.index === driverState.activeProgram ? "program-active" : ""}`}
              onClick={() => void run("SetProgram", { programId: program.index })}
              disabled={busy || program.index === driverState.activeProgram}
            >
              {program.name}
            </button>
          ))}
        </div>
      ) : null}

      {canMute ? (
        <button
          className={`giant-button mute-button ${muted ? "mute-active" : ""}`}
          onClick={() => void run("SetMute", { isMuted: !muted, level: volume })}
          disabled={busy}
        >
          {muted ? "Sound is off — tap to unmute" : "Mute"}
        </button>
      ) : null}

      <button className="simple-disconnect" onClick={() => void onDisconnect()}>
        Disconnect
      </button>
    </section>
  );
}
