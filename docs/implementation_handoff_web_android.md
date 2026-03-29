# Implementation Handoff: Web App then Android App

Date: 2026-03-28  
Audience: fresh agent/engineer starting implementation with no prior chat context.

---

## 1) Goal

Build:
1. a web app for hearing-aid controls (where browser BLE permits), then
2. an Android app with broader and safer BLE support.

Scope is multi-brand support across:
- Philips/Oticon (POLARIS first, PRE_POLARIS optional later)
- Rexton/WSA
- ReSound/GN
- Starkey

---

## 2) Source-of-truth documents

Start here in order:
1. `docs/gaps_and_next_steps.md`
2. `docs/command_dictionary.md`
3. `docs/reverse_gap_matrix.md`
4. `docs/ble_reference.md`
5. Vendor dossiers:
   - `docs/philips_uuid_dossier_01_static_registry.md`
   - `docs/uuid_rexton_dossier_2026-03-28.md`
   - `docs/deep_extraction/resound_phase2_static.md`
   - Starkey references in `docs/reverse_gap_matrix.md` + `docs/command_dictionary.md`

Evidence artifacts already available:
- `artifacts/decompiled/rexton_2.7.32/`
- `artifacts/decompiled/resound_1.43.1/`
- `jadx_output/philips/`, `jadx_output/rexton/`, `jadx_output/resound/`, `jadx_output/starkey/`
- `artifacts/extracted/*`

---

## 3) Safety and product constraints

Hard rules:
- Default to **read-only inspection and safe control operations**.
- Never send exploratory writes to unresolved/fitting-grade channels.
- Separate "user-safe controls" from "fitting/programming" channels.
- Require explicit opt-in flags for any risky channel.

Safe-first feature baseline:
- Volume up/down/set
- Program next/previous/select
- Mute/unmute only where semantics are confirmed
- Read battery/device info where available

---

## 4) Current implementation readiness by brand

## Philips/Oticon (POLARIS)
- Readiness: high for core user controls.
- Confirmed paths: volume/mute framing, program select path, major callback decoders.
- Gaps: PRE_POLARIS legacy branch, full program metadata edge cases (`bba1c7f1`).

## Rexton/WSA
- Readiness: medium-high for basic controls.
- Confirmed paths: `8b82`/`c8f7` families, basic control opcodes, control/data channel framing.
- Gaps: dedicated mute opcode confirmation; deeper FAPI inner payload semantics.

## ReSound/GN
- Readiness: medium for adapter scaffolding, low for final operation certainty.
- Confirmed paths: GN command/notify protocol, key opcodes/event types, handle protocol shape.
- Gaps: finalized operation-level corpus (`volume/program/mute/stream`) with concrete examples.

## Starkey
- Readiness: medium for app-layer command builders, low for full transport.
- Confirmed paths: app-layer Piccolo commands, control objects, HA config enums.
- Gaps: native transport framing under `PiccoloPacketTransportFeature.SendPacketResult`,
  definitive HIP/GASS parent service mapping.

---

## 5) Build architecture recommendation

## Shared core (first)
Create a shared protocol core with:
- `BrandAdapter` interface
- Capability model: `supported`, `partial`, `blocked`
- Operation model: `SetVolume`, `SetProgram`, `SetMute`, `GetState`, etc.
- Transport abstraction:
  - `WebBleTransport` (Web Bluetooth)
  - `AndroidBleTransport` (native Android BLE stack)
- Safety gate layer that blocks unresolved/risky writes.

## Web app (phase 1)
- Implement only capabilities marked `supported`/`partial-safe`.
- Expect reduced brand/device coverage due to browser BLE limitations.
- Provide explicit compatibility UI and diagnostics panel.

## Android app (phase 2)
- Reuse shared core.
- Add richer connection/session handling and retries.
- Add vendor-specific workflows requiring tighter BLE control.

---

## 6) Suggested delivery phases

1. **Phase A: canonical metadata**
   - Centralize UUID/opcode registry from docs into machine-readable format.
2. **Phase B: Philips + Rexton MVP**
   - Implement volume/program/mute (where confirmed).
3. **Phase C: ReSound partial support**
   - Implement GN handle transport shell and read/state plumbing.
4. **Phase D: Starkey partial support**
   - Implement app-layer Piccolo builder/parser; keep native transport blocker explicit.
5. **Phase E: Android parity**
   - Promote features gated by transport/reliability requirements.

---

## 7) Definition of done for "fresh agent can build"

Minimum conditions:
- A single canonical capability matrix exists for all brands and operations.
- Every operation path has:
  - target UUID/channel
  - request frame shape
  - expected response/notify pattern
  - safety classification
- Unresolved items are represented as explicit blocked features, not silent fallbacks.

---

## 8) Issues fixable without live equipment (assuming perfect tools)

These are static/dynamic-lab tasks that do not require wearing/controlling real hearing aids.

## P0 static-fixable
1. **Starkey native transport extraction**
   - Reverse `PiccoloPacketTransportFeature.SendPacketResult` framing/checksum/session rules
   - via native/managed bridge analysis and instrumentation.
2. **Starkey service-parent attribution**
   - Derive HIP/GASS parent service UUIDs through full service discovery code-path tracing.
3. **ReSound operation corpus finalization**
   - Map operation builders to concrete GN handle frames and expected notify decode sequences.
4. **Cross-doc canonicalization**
   - Eliminate lingering placeholder/label drift across all docs and matrices.

## P1 static-fixable
5. **Rexton mute path**
   - Prove dedicated opcode vs volume-minimum emulation from serializers/callsites.
6. **Rexton FAPI inner schema progress**
   - Trace serializer inputs/outputs and recover additional command payload schemas.
7. **Philips PRE_POLARIS static mapping**
   - Enumerate full `14293049` branch and `d5d0affb` handling from decompiled paths.
8. **Philips candidate UUID adjudication**
   - Reconcile candidate list via static version diffs; mark active/inactive by build.

## P2 static-fixable quality
9. **Machine-readable protocol registry**
   - Emit JSON/YAML from docs for direct consumption by build agents.
10. **Reference anchors hardening**
   - Attach class/method/file anchors to all major claims in docs.
11. **Feature-risk taxonomy**
   - Tag each operation as `safe-control`, `state-read`, `fitting-risk`, `unresolved`.

---

## 9) Issues that still require live evidence

1. End-to-end reliability across real devices (disconnect/retry/latency behavior).
2. Runtime confirmation of any channel marked `partial`, `inferred`, or `inactive-in-baseline`.
3. Validation that write payloads cause intended user-facing outcomes on device.
4. Cross-firmware behavior drift not visible in static artifacts.

---

## 10) Immediate next actions for a new agent

1. Build `protocol_registry.json` from existing docs.
2. Generate `capability_matrix.md` per brand/operation with status gates.
3. Scaffold shared adapter interfaces + safety gate.
4. Implement Philips+Rexton MVP operations first.
5. Keep ReSound/Starkey blocked features explicit until P0 static blockers are closed.

---

## 11) Handoff status

- This repository is ready for a fresh agent to start architecture + MVP implementation.
- It is not yet ready for claiming full multi-brand parity without resolving the P0 blockers above.
