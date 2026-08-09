import { useMemo, useState } from "react";
import type { Brand, CapabilityDecision, Operation } from "../domain/model";
import type { ProgramInfo } from "../adapters/types";
import { getProgramOptions } from "./brandMetadata";

interface MfiPanelProps {
  readonly isSet: boolean;
  readonly primarySide?: "left" | "right";
  readonly addingEar: boolean;
  readonly writeToBoth: boolean;
  readonly programs: readonly ProgramInfo[];
  readonly streamVolume: number;
  readonly onAddOtherEar: () => Promise<void>;
  readonly onSetWriteToBoth: (value: boolean) => void;
}

interface ControlPanelProps {
  readonly brand: Brand;
  readonly connected: boolean;
  readonly capabilities: readonly CapabilityDecision[];
  readonly onExecute: (operation: Operation, args?: Record<string, number | boolean | string>) => Promise<void>;
  readonly onRefresh: () => Promise<void>;
  /** MFi-only extras (binaural set, stream volume, real program names). */
  readonly mfi?: MfiPanelProps;
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

export function ControlPanel({ brand, connected, capabilities, onExecute, onRefresh, mfi }: ControlPanelProps): JSX.Element {
  const [volume, setVolume] = useState<number>(50);
  const [streamVolume, setStreamVolume] = useState<number>(mfi?.streamVolume ?? 50);
  const [program, setProgram] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [earTarget, setEarTarget] = useState<"both" | "left" | "right">("both");
  const [busyOperation, setBusyOperation] = useState<Operation | null>(null);

  const volumeCap = useMemo(() => findCapability(capabilities, "SetVolume"), [capabilities]);
  const streamVolumeCap = useMemo(() => findCapability(capabilities, "SetStreamVolume"), [capabilities]);
  const programCap = useMemo(() => findCapability(capabilities, "SetProgram"), [capabilities]);
  const muteCap = useMemo(() => findCapability(capabilities, "SetMute"), [capabilities]);
  const refreshCap = useMemo(() => findCapability(capabilities, "RefreshState"), [capabilities]);
  const isDiagnosticTemplate = useMemo(() => {
    const supportedWriteCount = capabilities.filter(
      (item) => WRITE_OPS.includes(item.operation) && item.status === "supported"
    ).length;
    return brand === "resound" || brand === "starkey" || supportedWriteCount === 0;
  }, [brand, capabilities]);

  const programOptions = useMemo(() => {
    // MFi: prefer the real fitted program names read from the aid.
    if (mfi && mfi.programs.length > 0) {
      return mfi.programs.map((item) => ({ id: item.index, label: item.name }));
    }
    return getProgramOptions(brand);
  }, [brand, mfi]);

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

      {mfi ? (
        <div className="control-card">
          <span className="quick-label">Binaural set</span>
          <span className={`status-chip ${mfi.isSet ? "status-supported" : "status-unknown"}`}>
            {mfi.isSet ? `L+R set (primary: ${mfi.primarySide ?? "right"})` : "single aid"}
          </span>
          <button onClick={() => void mfi.onAddOtherEar()} disabled={!connected || mfi.isSet || mfi.addingEar}>
            {mfi.addingEar ? "Adding..." : "Add other ear"}
          </button>
          <label htmlFor="writeToBoth">Write to both ears</label>
          <input
            id="writeToBoth"
            type="checkbox"
            checked={mfi.writeToBoth}
            onChange={(event) => mfi.onSetWriteToBoth(event.target.checked)}
            disabled={!connected || !mfi.isSet}
          />
        </div>
      ) : null}
      {mfi ? (
        <p className="control-note">
          Binaural aids normally sync ear-to-ear, so writes go to the primary aid only. Enable &quot;Write to both
          ears&quot; for sets that do not sync between ears.
        </p>
      ) : null}

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

      {mfi && !isDiagnosticTemplate ? (
        <>
          <div className="control-card">
            <label htmlFor="streamVolume">Stream volume</label>
            <input
              id="streamVolume"
              type="range"
              min={0}
              max={100}
              step={1}
              value={streamVolume}
              onChange={(event) => setStreamVolume(Number(event.target.value))}
              disabled={!connected}
            />
            <span>{streamVolume}</span>
            <button
              onClick={() => run("SetStreamVolume", { level: streamVolume })}
              disabled={!connected || !canExecute(streamVolumeCap) || busyOperation !== null}
              title={streamVolumeCap?.reason}
            >
              {busyOperation === "SetStreamVolume" ? "Applying..." : "Apply Stream Volume"}
            </button>
            <span className={`status-chip status-${capabilityLabel(streamVolumeCap)}`}>
              {capabilityLabel(streamVolumeCap)}
            </span>
          </div>
          <p className="control-note">Streaming-path attenuation — applies while the aid is streaming audio.</p>
        </>
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
            {mfi ? <span className="status-chip status-partial">experimental</span> : null}
          </div>
          <p className="control-note">
            {mfi
              ? "EXPERIMENTAL: mute is emulated by writing attenuation 0 and restoring the previous value on unmute (firmware treatment of 0 vs 1 is unconfirmed — MFI_SPEC §4.7)."
              : muteCap?.reason ?? "Mute capability is unknown for this device."}
          </p>
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
