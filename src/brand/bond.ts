/**
 * Bonding / pairing state for the MFi/LEA control surface.
 *
 * The LEA control characteristics (volumes, programs, mute) require an
 * ENCRYPTED/bonded BLE link; battery, mono-side and DIS do not (MFI_SPEC §4.2,
 * confirmed live against ReSound GN aids on desktop Chrome/Windows).
 *
 * Web Bluetooth has no createBond() and no bond-state API, so bond state is
 * INFERRED from operation outcomes: unsecured reads (battery/side) succeeding
 * while every secured read fails means the link is not bonded. Chrome on
 * Windows does not reliably auto-trigger OS pairing on secured-characteristic
 * access, so the user is sent to the OS Bluetooth settings with guidance.
 */
export type BondState = "unknown" | "bonded" | "needs-pairing";

/**
 * Error-message patterns that indicate an insufficient-authentication failure
 * on a secured characteristic. Chrome surfaces these as DOMExceptions such as
 * "Insufficient Authentication" or the generic "GATT operation failed for
 * unknown reason" when an encrypted characteristic is accessed without a bond.
 */
const AUTH_ERROR_PATTERN =
  /insufficient|authentication|authorization|not paired|pairing|bond|encrypt|GATT operation failed/i;

/**
 * True if the error looks like an insufficient-authentication failure.
 * Only meaningful in context — callers should already suspect the link is
 * unbonded (e.g. secured access failing while unsecured reads work).
 */
export function isAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return AUTH_ERROR_PATTERN.test(message);
}

/** User-facing pairing guidance shown on banners and write-failure messages. */
export function pairingGuidance(deviceName: string): string {
  return (
    `Pairing required: 1) Put the aids in pairing mode (open/close the battery doors ` +
    `or long-press the button). 2) Open this computer's OS Bluetooth settings and pair ` +
    `'${deviceName}'. 3) Click Retry.`
  );
}
