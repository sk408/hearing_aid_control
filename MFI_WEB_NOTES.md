# MFI_WEB_NOTES — feature/mfi-web

Branch: `feature/mfi-web`
Date: 2026-08-09
Task: Port the universal MFi/LEA hearing-aid control surface from the proven
React Native branch (`feature/mfi-control`, TASK13–TASK16 — live-tested
against ReSound aids, PASSED) to this web app (React 18 + TS + Vite + zustand,
Web Bluetooth).

Protocol authority: `reference/MFI_SPEC.md` (GN Palpatine6 firmware 6.7.4.1
GATT dump). RN source of truth: `reference/mfiAdapter.ts`,
`reference/mfiSets.ts`, `reference/MFI_BRANCH_NOTES.md`.

---

## What was ported

| Piece | RN source | Web port |
|---|---|---|
| Universal adapter | `reference/mfiAdapter.ts` | `src/adapters/mfiAdapter.ts` |
| Set grouping + verified set | `reference/mfiSets.ts` | `src/brand/mfiSets.ts` |
| Detection: LEA check FIRST | `reference/detection.ts` | `src/brand/detection.ts` |
| Factory wiring | `reference/factory.ts` | `src/adapters/factory.ts` |
| `batteryPercentSecondary` etc. on DriverState | `reference/types.ts` | `src/adapters/types.ts` |
| Persistence (verified set, set metadata) | AsyncStorage `@mfi_verified` | localStorage `@mfi_verified`, `@mfi_last_set` |

Implemented per MFI_SPEC §4.1 minimum viable client:

| Feature | Status | Notes |
|---|---|---|
| Discovery | Implemented | LEA service UUID is the FIRST `requestDevice` filter; detection checks LEA FIRST after connect + discovery, so any LEA device (incl. ReSound GN aids) gets the MFi adapter |
| Connect + bond | Implemented (adapted) | No `createBond()` on web: Chrome triggers OS pairing implicitly on first access to an encrypted characteristic. Transport reconnects + re-discovers after the pairing-triggered disconnect and re-arms notification subscriptions |
| Char cache by UUID | Implemented | Existing `WebBleTransport` cache (never handles, per spec §4.7 #6) |
| Battery read + notify | Implemented | LEABatteryLevel `24e1dff3-…`, per-ear (primary + secondary) |
| Available programs bitmask | Implemented | 4-byte LE u32 |
| Current program R/W | Implemented | Index validated against the bitmask before write (firmware rejects invalid indices, spec §3.2) |
| Program names | Implemented | Selector write → 60-byte UTF-8 name read; names surface in the program dropdown |
| Mic volume 0–100 ↔ 1–255 | Implemented | Linear map (50 → 128, RC mid step 6); writes use `writeValueWithResponse` (ATT Write Request) so firmware error codes surface (spec §5.1) |
| Stream attenuation setter | Implemented | New `SetStreamVolume` operation + UI slider |
| Notifications | Implemented | MicAttenuation, StreamAttenuation, CurrentActiveProgram, BatteryLevel on the primary; Battery/MicAttenuation/CurrentActiveProgram on the secondary |
| Mute | Implemented — EXPERIMENTAL | Write 0 / restore stored value (fallback 128); flagged "experimental" in the UI |
| DIS manufacturer name | Implemented | Display only — no brand logic keyed off it |
| Binaural sets | Implemented (adapted) | One adapter, two GATT connections; `writeToBoth` toggle (default false); per-ear writes via `setVolume(level, 'left'|'right')`; per-ear battery; graceful single-sided fallback |

## Deviations from the RN branch

1. **No background scan → no scan list, no sibling window.** Web Bluetooth has
   no scanning API. The RN two-stage verification (TASK14) and lazy sibling
   window (TASK16) are NOT portable and were replaced by:
   - an MFi-first `requestDevice` chooser (LEA service is the first filter;
     brand filters remain for non-LEA fallback devices), and
   - binaural set assembly via (a) an explicit "Add other ear" button that
     opens a second LEA-only chooser, and (b) automatic merging from
     `navigator.bluetooth.getDevices()` when a previously granted device
     matches the last-set metadata (`@mfi_last_set`) or the grouping
     heuristics against the persisted verified-MFi set.
2. **Grouping heuristics reduced.** Web Bluetooth exposes neither RSSI nor the
   MAC address, so the RSSI-delta (≤15 dB) and OUI-corroboration signals are
   dropped. `suggestSetSibling()` groups on normalized base name + L/R side
   markers only (same explicit side is still never paired). This is weaker
   against same-model neighbors than the RN version — see limitations.
3. **Bonding is implicit.** There is no `createBond()` and no bond-state API.
   The RN "re-discovery after bonding" step is mirrored inside
   `WebBleTransport.onDisconnected`: after any reconnect (pairing-triggered
   drops included) it re-runs discovery and re-arms subscriptions. The
   adapter's read/write retry wrapper (3×, 500 ms backoff, same as RN) rides
   out the pairing window.
4. **Persistence is localStorage, synchronous.** Keys mirror the RN
   AsyncStorage keys (`@mfi_verified`; set metadata under `@mfi_last_set`).
   Web Bluetooth device ids are origin-scoped, so the verified set and set
   metadata are only meaningful on the same origin (GitHub Pages deployment).
5. **Adapter interface mapping.** The web `BrandAdapter` interface is
   operation-based (`execute(operation, args)`), not method-based. The RN
   methods map as: `setVolume`→`SetVolume {level, ear}`,
   `setStreamingVolume`→`SetStreamVolume {level}` (new Operation),
   `setProgram`→`SetProgram {programId}`, `setMute`→`SetMute {isMuted}`,
   battery/program/device-info getters→`refreshState()`. Capability gating
   goes through the existing registry/safety-gate pipeline: 7 `mfi` entries
   were appended to `protocol_registry.json` (LEA service + LEA/DIS
   characteristics, `safe-control`/`state-read`). `SetMute` is registered
   `status: supported` with `confidence: partial` so the safety gate does not
   block it; the experimental nature is flagged in the UI instead (blocking it
   would make the feature unreachable, which the RN branch deliberately
   avoided).
6. **Volume/program step operations** (`VolumeStep`/`ProgramStep`) are not
   mapped for MFi — absolute setters only (they have no registry entry, so
   the safety gate blocks them before the adapter is reached).
7. **UI is extended, not forked.** `ControlPanel` gained an optional `mfi`
   prop (set badge, "Add other ear", writeToBoth toggle, stream slider,
   experimental-mute chip, real program names). Brand adapters ignore it.
8. **Single-GATT-transport app shell.** The app shell owns the primary
   transport; the MFi adapter creates its own second `WebBleTransport`
   instance for the secondary ear (the `Transport` interface itself is
   unchanged; `WebBleTransport` gained `connectGrantedDevice()` for the
   gesture-less getDevices path).

## Conflicts with the existing repo (mission took precedence)

- The repo's pre-existing `Transport.write` used `writeValue()`; it now
  prefers `writeValueWithResponse()` per the mission (error codes matter for
  volume/program writes). Brand adapters share this transport and are
  unaffected semantically (Write Request is the stricter superset).
- `Operation` gained `SetStreamVolume`; the 4 brand adapters' exhaustive
  switches gained a matching case (Philips/Rexton: no-op like other unmapped
  ops — no registry entry exists for them, so the safety gate blocks it
  first; ReSound/Starkey: grouped with their existing blocked-writes throw).
  No brand behavior change.

## Verified

- `npm install && npm run build` (tsc --noEmit + vite build): PASS.
- `npm test`: 26/26 PASS, including new `tests/mfiSets.test.ts` (9) and
  `tests/mfiAdapter.test.ts` (6: volume map, mic/stream writes, bitmask
  program validation, mute write-0/restore, refreshState shape).
- 4 brand adapters still compile and are reachable for non-LEA devices.

## Live-test checklist (mirrors MFI_BRANCH_NOTES untested items)

Everything BLE-facing needs a real MFi hearing aid (ReSound Vivia/Lacerta
expose the LEA service):

1. Connect chooser: does the aid advertise the 128-bit LEA UUID (spec §4.4
   open question)? If not, it only appears via the acceptAllDevices fallback
   — consider whether the fallback chooser is acceptable UX.
2. First connect triggers OS pairing implicitly (Just Works / LESC); the
   link may drop once during pairing — confirm the transport's
   reconnect + re-discovery + re-subscribe path recovers and the seed reads
   complete (watch Diagnostics).
3. Aid is bondable only in pairing windows (spec §4.3): first-time users may
   need to open the battery door / long-press BEFORE connecting.
4. Read battery % — matches aid state; notification updates on change.
5. Program list shows real fitted names ("All-Around", "Restaurant", …);
   program switch writes, aid switches, notification fires, `refreshState`
   agrees. Invalid program index is rejected locally before any BLE write.
6. Volume slider → audible change; read-back matches; hardware button press
   on the aid updates the app via notification.
7. Stream volume slider while streaming from an MFi streamer.
8. Mute toggle (EXPERIMENTAL): does attenuation byte 0 mute or clamp
   (spec §4.7 #4)? Unmute restores the previous level.
9. "Add other ear": second chooser connects the sibling; L+R badge appears
   with correct primary side (name marker vs `8d17ac2f` read); per-ear
   battery shows for both aids.
10. Ear-to-ear sync assumption: volume/program written to the primary only —
    confirm the secondary follows (its notifications in Diagnostics). If
    not, enable "Write to both ears".
11. Per-ear (unlinked) volume writes route to the correct physical aid.
12. Single-sided fallback: "Add other ear" cancelled / sibling powered off →
    primary keeps working; page reload → getDevices() auto-merges the set
    without a chooser (second connect onward).
13. Non-LEA device (e.g. POLARIS-only Philips): detection still falls
    through to the brand adapter.

## Known limitations

- Set grouping without RSSI/OUI can theoretically mis-suggest a sibling when
  two same-model aids with identical names are both granted and nearby; the
  explicit "Add other ear" chooser (user picks the device) is the reliable
  path.
- `requestDevice` fallback: cancelling the chooser re-prompts with
  `acceptAllDevices` (pre-existing `WebBleTransport` behavior, kept for the
  secondary chooser too).
- LEAProgramCategory is read-capable per spec but not surfaced (same as RN).
- Notifications only update the adapter cache; the UI reflects them on the
  next `refreshState()` (after each operation or manual refresh) — there is
  no push into the zustand store.
