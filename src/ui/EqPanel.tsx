import { useState } from "react";
import type { EqMatch } from "../domain/eqBands";

interface EqPanelProps {
  /** EQ candidate match from findEqCandidate() — null when none discovered. */
  readonly match: EqMatch | null;
  readonly connected: boolean;
  /** Write an encoded payload to the matched EQ characteristic. */
  readonly onWrite: (characteristicUuid: string, payload: Uint8Array) => Promise<void>;
}

/**
 * Bass/Treble sliders (Advanced view) — shown ONLY when a discovered
 * characteristic matches a known EQ candidate that is writable AND has a
 * registered payload encoder (see src/domain/eqBands.ts). With no usable
 * candidate the panel renders nothing: never show dead controls.
 */
export function EqPanel({ match, connected, onWrite }: EqPanelProps): JSX.Element | null {
  const [bass, setBass] = useState<number>(50);
  const [treble, setTreble] = useState<number>(50);
  const [busy, setBusy] = useState<boolean>(false);

  if (!match || !match.usable || !match.candidate.encode) {
    return null;
  }

  const apply = async (nextBass: number, nextTreble: number): Promise<void> => {
    const encode = match.candidate.encode;
    if (!encode) return;
    setBusy(true);
    try {
      await onWrite(match.candidate.uuid, encode(nextBass, nextTreble));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h3>Tone (Bass / Treble)</h3>
      <p className="control-note">
        {match.candidate.label} ({match.candidate.uuid}) — {match.candidate.notes}
      </p>
      <div className="control-card">
        <label htmlFor="eqBass">Bass</label>
        <input
          id="eqBass"
          type="range"
          min={0}
          max={100}
          step={1}
          value={bass}
          onChange={(event) => {
            const next = Number(event.target.value);
            setBass(next);
            void apply(next, treble);
          }}
          disabled={!connected || busy}
        />
        <span>{bass}</span>
      </div>
      <div className="control-card">
        <label htmlFor="eqTreble">Treble</label>
        <input
          id="eqTreble"
          type="range"
          min={0}
          max={100}
          step={1}
          value={treble}
          onChange={(event) => {
            const next = Number(event.target.value);
            setTreble(next);
            void apply(bass, next);
          }}
          disabled={!connected || busy}
        />
        <span>{treble}</span>
      </div>
    </section>
  );
}
