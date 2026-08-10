import { useState } from "react";

interface PairingBannerProps {
  /** Advertised name of the primary aid, inserted into the guidance. */
  readonly deviceName: string;
  /** Re-runs the secured-read sequence after the user has paired in OS settings. */
  readonly onRetry: () => Promise<void>;
}

/**
 * Prominent pairing-guidance banner, shown when the adapter infers the link
 * is not bonded (secured LEA characteristics fail while unsecured reads work).
 * Web Bluetooth has no bonding API, so pairing must happen in the OS
 * Bluetooth settings; this banner walks the user through it.
 */
export function PairingBanner({ deviceName, onRetry }: PairingBannerProps): JSX.Element {
  const [busy, setBusy] = useState<boolean>(false);

  const retry = async (): Promise<void> => {
    setBusy(true);
    try {
      await onRetry();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="pairing-banner" role="alert">
      <strong>Hearing aids not paired with this computer</strong>
      <p>
        The secure controls (volume, programs, mute) need an encrypted link. Battery and device info work, but the
        hearing aids must be paired with this computer first:
      </p>
      <ol>
        <li>Put the aids in pairing mode (open/close the battery doors, or long-press the button).</li>
        <li>
          Open this computer&apos;s Bluetooth settings and pair <strong>&apos;{deviceName}&apos;</strong>.
        </li>
        <li>Click Retry below.</li>
      </ol>
      <button onClick={() => void retry()} disabled={busy}>
        {busy ? "Retrying..." : "Retry"}
      </button>
    </section>
  );
}
