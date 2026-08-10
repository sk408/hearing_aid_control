interface BinauralPromptProps {
  /** Detected side of the already-connected aid, when known. */
  readonly side?: "left" | "right";
  readonly busy: boolean;
  /** Opens the second-device chooser ("add other ear" flow). */
  readonly onConnectOther: () => void;
  /** Dismisses the prompt for this session ("Just one for now"). */
  readonly onSkip: () => void;
}

/**
 * Binaural-first prompt, shown right after the FIRST hearing aid connects:
 * most fittings are two aids, so connecting the other ear is presented as
 * the expected path — one tap into the same chooser/verification flow the
 * Advanced view uses. Skippable for genuine single-aid users.
 */
export function BinauralPrompt({ side, busy, onConnectOther, onSkip }: BinauralPromptProps): JSX.Element {
  const sideText = side ? ` (${side})` : "";
  return (
    <section className="binaural-prompt">
      <strong>Your{sideText} hearing aid is connected.</strong>
      <p>Do you wear two hearing aids? Most people do — connect the other one now so both change together.</p>
      <div className="binaural-prompt-actions">
        <button className="giant-button" onClick={onConnectOther} disabled={busy}>
          {busy ? "Connecting…" : "Connect my other hearing aid"}
        </button>
        <button onClick={onSkip} disabled={busy}>
          Just one for now
        </button>
      </div>
    </section>
  );
}
