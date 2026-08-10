# hearing_aid_control

Reverse-engineered BLE protocol documentation for major hearing aid brands (Philips, Starkey, ReSound, Rexton). Contains UUID maps, control operation references, and analysis tools.

## Web app (this branch: `feature/simple-advanced`)

A Web Bluetooth hearing-aid remote (React 18 + TS + Vite + zustand) built on the
universal MFi/LEA control surface — see `MFI_WEB_NOTES.md` for the protocol port
details and live-test results. The app is built for hearing-aid WEARERS, many of
them elderly and non-technical, which drives the UI design:

- **Simple view (default for new users):** giant Louder/Softer buttons, big
  program buttons with real program names, plain battery status
  ("Battery: 15% — Low, charge soon"), one giant mute toggle. Minimum 20px
  text, ≥64px touch targets, no jargon. A "More options" / "Fewer options"
  toggle (persisted in localStorage) switches views on every screen.
- **Advanced view:** the full control surface — per-ear sliders, streaming
  volume, program details, capability matrix, diagnostics/logging. Experimental
  features (e.g. emulated mute) are flagged as experimental.
- **Binaural-first flow:** after the first aid connects, the app immediately
  offers "Connect my other hearing aid?" (skippable: "Just one for now") and
  labels each aid Left/Right (from the `8d17ac2f` side characteristic or the
  advertised name's L/R marker).
- **Write-both default:** with a two-aid set connected, volume/program/mute
  writes go to BOTH aids (`MfiAdapter.writeToBoth = true`). The Android
  branch's primary-only default assumed ear-to-ear sync, which not all aids
  do; on aids that DO sync, writing both is harmless duplication. Advanced
  view has an "Unlink ears" toggle for per-ear control. If one aid of a set
  drops, the app keeps controlling the survivor and says so plainly.

Dev: `npm run dev` · Build: `npm run build` · Tests: `npm test`
