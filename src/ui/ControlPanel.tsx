import { useMemo, useState } from "react";
import type { Brand, CapabilityDecision, Operation } from "../domain/model";
import { getProgramOptions } from "./brandMetadata";

interface ControlPanelProps {
  readonly brand: Brand;
  readonly connected: boolean;
  readonly capabilities: readonly CapabilityDecision[];
  readonly onExecute: (operation: Operation, args?: Record<string, number | boolean | string>) => Promise<void>;
  readonly onRefresh: () => Promise<void>;
}

const WRITE_OPS: readonly Operation[] = ["SetVolume", "SetProgram", "SetMute"];

function findCapability(
  capabilities: readonly CapabilityDecision[],
  operation: Operation
): CapabilityDecision | undefined {
  return capabilities.find((item) => item.operation === operation);
}

function canExecute(capability: CapabilityDecision | undefined): boolean {
  return capability?.status === "supported";
}

function capabilityLabel(capability: CapabilityDecision | undefined): string {
  if (!capability) {
    return "unknown";
  }
  switch (capability.status) {
    case "supported":
      return "supported";
    case "partial":
      return "partial";
    case "blocked":
      return "blocked";
    default: {
      const exhaustive: never = capability.status;
      return exhaustive;
    }
  }
}

export function ControlPanel({ brand, connected, capabilities, onExecute, onRefresh }: ControlPanelProps): JSX.Element {
  const [volume, setVolume] = useState<number>(50);
  const [program, setProgram] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [earTarget, setEarTarget] = useState<"both" | "left" | "right">("both");
  const [busyOperation, setBusyOperation] = useState<Operation | null>(null);

  const volumeCap = useMemo(() => findCapability(capabilities, "SetVolume"), [capabilities]);
  const programCap = useMemo(() => findCapability(capabilities, "SetProgram"), [capabilities]);
  const muteCap = useMemo(() => findCapability(capabilities, "SetMute"), [capabilities]);
  const refreshCap = useMemo(() => findCapability(capabilities, "RefreshState"), [capabilities]);
  const isDiagnosticTemplate = useMemo(() => {
    const supportedWriteCount = capabilities.filter(
      (item) => WRITE_OPS.includes(item.operation) && item.status === "supported"
    ).length;
    return brand === "resound" || brand === "starkey" || supportedWriteCount === 0;
  }, [brand, capabilities]);

  const programOptions = useMemo(() => getProgramOptions(brand), [brand]);

  const run = async (operation: Operation, args?: Record<string, number | boolean | string>): Promise<void> => {
    setBusyOperation(operation);
    try {
      await onExecute(operation, args);
    } finally {
      setBusyOperation(null);
    }
  };

  const runRefresh = async (): Promise<void> => {
    setBusyOperation("RefreshState");
    try {
      await onRefresh();
    } finally {
      setBusyOperation(null);
    }
  };

  return (
    <section>
      <h3>Controls ({brand})</h3>
      <div className="brand-template-card">
        {isDiagnosticTemplate ? (
          <>
            <strong>Diagnostic-first template</strong>
            <p>
              This brand is currently running in a diagnostic-safe mode. Write controls remain hidden unless a write
              operation is fully supported.
            </p>
          </>
        ) : (
          <>
            <strong>Active control template</strong>
            <p>Confirmed write operations are enabled for quick daily use on this device family.</p>
          </>
        )}
      </div>

      {isDiagnosticTemplate ? null : (
        <>
          <div className="control-card">
            <label htmlFor="volume">Volume</label>
            <input
              id="volume"
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              disabled={!connected}
            />
            <span>{volume}</span>
            <label htmlFor="earTarget">Ear</label>
            <select
              id="earTarget"
              value={earTarget}
              onChange={(event) => setEarTarget(event.target.value as "both" | "left" | "right")}
              disabled={!connected}
            >
              <option value="both">Both</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <button
              onClick={() => run("SetVolume", { level: volume, isMuted: muted, ear: earTarget })}
              disabled={!connected || !canExecute(volumeCap) || busyOperation !== null}
              title={volumeCap?.reason}
            >
              {busyOperation === "SetVolume" ? "Applying..." : "Apply Volume"}
            </button>
            <span className={`status-chip status-${capabilityLabel(volumeCap)}`}>{capabilityLabel(volumeCap)}</span>
          </div>
          <p className="control-note">{volumeCap?.reason ?? "Volume capability is unknown for this device."}</p>
        </>
      )}

      {canExecute(volumeCap) && !isDiagnosticTemplate ? (
        <div className="control-card">
          <span className="quick-label">Quick volume</span>
          <button
            onClick={() => run("SetVolume", { level: Math.max(0, volume - 5), isMuted: muted, ear: earTarget })}
            disabled={!connected || busyOperation !== null}
          >
            -5
          </button>
          <button
            onClick={() => run("SetVolume", { level: Math.min(100, volume + 5), isMuted: muted, ear: earTarget })}
            disabled={!connected || busyOperation !== null}
          >
            +5
          </button>
        </div>
      ) : null}

      {isDiagnosticTemplate ? null : (
        <>
          <div className="control-card">
            <label htmlFor="program">Program</label>
            <input
              id="program"
              type="number"
              min={0}
              max={20}
              value={program}
              onChange={(event) => setProgram(Number(event.target.value))}
              disabled={!connected}
            />
            <select
              id="programPreset"
              value={program}
              onChange={(event) => setProgram(Number(event.target.value))}
              disabled={!connected}
            >
              {programOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => run("SetProgram", { programId: program })}
              disabled={!connected || !canExecute(programCap) || busyOperation !== null}
              title={programCap?.reason}
            >
              {busyOperation === "SetProgram" ? "Applying..." : "Apply Program"}
            </button>
            <span className={`status-chip status-${capabilityLabel(programCap)}`}>{capabilityLabel(programCap)}</span>
          </div>
          <p className="control-note">{programCap?.reason ?? "Program capability is unknown for this device."}</p>
        </>
      )}

      {canExecute(programCap) && !isDiagnosticTemplate ? (
        <div className="control-card">
          <span className="quick-label">Quick programs</span>
          {programOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setProgram(option.id);
                void run("SetProgram", { programId: option.id });
              }}
              disabled={!connected || busyOperation !== null}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {isDiagnosticTemplate ? null : (
        <>
          <div className="control-card">
            <label htmlFor="muted">Mute</label>
            <input
              id="muted"
              type="checkbox"
              checked={muted}
              onChange={(event) => setMuted(event.target.checked)}
              disabled={!connected}
            />
            <button
              onClick={() => run("SetMute", { isMuted: muted, level: volume })}
              disabled={!connected || !canExecute(muteCap) || busyOperation !== null}
              title={muteCap?.reason}
            >
              {busyOperation === "SetMute" ? "Applying..." : "Apply Mute"}
            </button>
            <span className={`status-chip status-${capabilityLabel(muteCap)}`}>{capabilityLabel(muteCap)}</span>
          </div>
          <p className="control-note">{muteCap?.reason ?? "Mute capability is unknown for this device."}</p>
        </>
      )}

      <div className="control-card">
        <button
          onClick={runRefresh}
          disabled={!connected || !canExecute(refreshCap) || busyOperation !== null}
          title={refreshCap?.reason}
        >
          {busyOperation === "RefreshState" ? "Refreshing..." : "Refresh State"}
        </button>
        <span className={`status-chip status-${capabilityLabel(refreshCap)}`}>{capabilityLabel(refreshCap)}</span>
      </div>
      <p className="control-note">{refreshCap?.reason ?? "Refresh capability is unknown for this device."}</p>

      {isDiagnosticTemplate ? (
        <p className="control-note">
          Tip: use Compatibility Snapshot and Diagnostics below to capture evidence for future write-path promotion.
        </p>
      ) : null}
    </section>
  );
}
