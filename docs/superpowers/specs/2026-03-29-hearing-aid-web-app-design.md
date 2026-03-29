# Hearing Aid Multi-Brand Web App Design (Web-First, Android-Ready)

Date: 2026-03-29  
Status: Draft for review  
Primary target: Web app now, Android app later (no forced co-development)

## 1) Goals

Build a browser-based hearing-aid control app that:
- Supports multiple brands with a single consistent UX.
- Preserves operation-level protocol detail from current research.
- Ships a safe MVP on Web Bluetooth first.
- Keeps boundaries that allow Android expansion later without rewriting protocol logic.

## 2) Scope and Non-Goals

In scope (Web MVP):
- Device discovery and connect flow with compatibility diagnostics.
- Safe controls:
  - volume up/down/set
  - program next/previous/select
  - mute/unmute only where semantics are confirmed
  - battery/device info reads where available
- Explicit capability gating by brand and operation (`supported`, `partial`, `blocked`).
- Detailed operation logging and protocol diagnostics for engineering validation.

Out of scope (Web MVP):
- Fitting/programming features (FAPI/programming channels).
- Any unresolved/risky writes.
- Full parity for ReSound and Starkey until current P0 blockers are closed.
- Android UI implementation in this phase.

## 3) Product and Safety Requirements

Hard safety rules:
- Default to read-only + safe-control operations.
- Block writes to unresolved or fitting-grade channels by default.
- Require explicit developer flag for any non-safe path; keep disabled in production builds.
- Never silently fallback from blocked operations. Show explicit "blocked by evidence/safety gate".

User trust requirements:
- Every unavailable feature must include a reason ("transport not confirmed", "payload uncertain", etc.).
- Every write operation should be traceable in diagnostics (operation -> channel -> payload metadata).
- Safety class must be visible in code and registry for all operations.

## 4) Architecture Overview

Use a layered architecture that separates operation semantics from transport details.

1. `ProtocolRegistry` (data-driven source of truth)
- Brand, UUID/channel, opcode/frame shape, expected notify/read pattern, confidence, safety class.
- Stored as machine-readable JSON.

2. `CapabilityEngine`
- Computes operation availability for connected device:
  - `supported`: allow in UI
  - `partial`: allow only if flagged safe in registry with warnings
  - `blocked`: disabled with reason

3. `BrandAdapter` interface (per vendor)
- Converts canonical operations (`SetVolume`, `SetProgram`, etc.) into protocol actions.
- Encapsulates brand-specific sequence logic and parsers.

4. `Transport` abstraction
- `WebBleTransport` now.
- `AndroidBleTransport` later.
- Same adapter contracts for both transports.

5. `SafetyGate`
- Final guard before any write.
- Enforces operation safety class and confidence requirements.

6. `App UI`
- Brand-agnostic controls and status.
- Capability-aware rendering.
- Diagnostics panel for connection state, capability matrix, and operation traces.

## 5) Approach Decision

Considered approaches:

1. Web-only codebase now, refactor for Android later  
Pros: fastest short-term output.  
Cons: high rewrite risk, weak boundary discipline, likely protocol duplication.

2. Full web+android co-development now  
Pros: early parity.  
Cons: slower delivery, more unknowns, increases risk while ReSound/Starkey blockers remain.

3. Web-first with Android-ready shared core (recommended)  
Pros: fastest safe delivery while preserving long-term reuse; avoids premature Android work; keeps protocol detail centralized.  
Cons: requires discipline to maintain clean transport boundaries.

Decision:
- Implement option 3.
- Build web product now, but treat protocol registry/adapters/safety model as platform-neutral core.

## 6) Canonical Domain Model

Operations:
- `SetVolume(level)`
- `VolumeStep(direction)`
- `SetProgram(programId)`
- `ProgramStep(direction)`
- `SetMute(isMuted)`
- `GetBatteryState()`
- `GetDeviceInfo()`
- `RefreshState()`

Safety classes:
- `safe-control`
- `state-read`
- `fitting-risk`
- `unresolved`

Confidence levels:
- `confirmed`
- `partial`
- `inferred`
- `inactive-in-baseline`

Feature state resolution rule:
- UI can execute only when:
  - safety class in `{safe-control, state-read}`, and
  - confidence is `confirmed`, or
  - confidence is `partial` with explicit safe exception and product approval.

## 7) Brand Support Plan (Web MVP)

### Philips/Oticon (POLARIS)
Status: primary MVP path.

Supported for MVP:
- Volume/mute on `1454e9d6...`, `50632720...`, `e5892ebe...`
- Program select on `535442f7...`
- Program metadata flow via `68bfa64e...` + `bba1c7f1...` and bitset/version helpers
- Streaming state read `d01ab591...`
- Volume-range read `58bbccc5...`

Notes:
- Preserve current confirmed byte-level behavior:
  - volume-like payload `[levelByte, (!isMuted ? 1 : 0)]`
  - readback mute from `byte1 == 0`
- PRE_POLARIS (`14293049...`) marked blocked for MVP.

### Rexton/WSA
Status: MVP support for basic controls.

Supported for MVP:
- Basic control via `8b8276e8...`:
  - `0x04` volume
  - `0x05` program
- Active program notifications via `8b8225e0...`
- Read-only identity/state paths that are confirmed safe

Partially supported / blocked:
- Mute semantics via advanced/FAPI paths remain partial -> blocked by default.
- FAPI/programming channels are blocked (`fitting-risk`).

### ReSound/GN
Status: scaffold + explicit partial support.

Supported in MVP:
- Connection/session diagnostics.
- Command/notify transport shell:
  - command `1959A468-3234-4C18-9E78-8DAF8D9DBF61`
  - notify `8B51A2CA-5BED-418B-B54B-22FE666AADD2`
- Read/state operations only where mapping is confirmed and safe.

Blocked for MVP:
- User-control writes that require unresolved runtime-validated handle/payload mapping across profile families.

### Starkey
Status: mostly blocked for web control writes in MVP.

Supported in MVP:
- Discovery, identification, and diagnostics.
- Optional read-only status paths that are confirmed.

Blocked for MVP:
- Control writes dependent on unresolved native transport framing below app-layer Piccolo bytes.

## 8) Protocol Registry Specification

Create `protocol_registry.json` as canonical machine-readable input.

Minimum entry fields:
- `brand`
- `operation`
- `serviceUuid` (if applicable)
- `characteristicUuid` or `commandChannel`
- `requestFrameTemplate`
- `responsePattern` (read/notify expectations)
- `safetyClass`
- `confidence`
- `status` (`supported`/`partial`/`blocked`)
- `blockReason` (required if not `supported`)
- `sourceRefs` (doc references)

Example shape:

```json
{
  "brand": "philips",
  "operation": "SetVolume",
  "characteristicUuid": "1454e9d6-f658-4190-8589-22aa9e3021eb",
  "requestFrameTemplate": ["levelByte", "notMutedFlagByte"],
  "responsePattern": {
    "readback": {
      "levelByteIndex": 0,
      "muteByteIndex": 1,
      "muteWhenValueEquals": 0
    }
  },
  "safetyClass": "safe-control",
  "confidence": "confirmed",
  "status": "supported",
  "sourceRefs": [
    "docs/command_dictionary.md",
    "docs/deep_extraction/philips_phase2_static.md"
  ]
}
```

## 9) Connection and Session Flow (Web)

1. User clicks Connect.
2. Web Bluetooth device selection with brand-aware filters where possible.
3. Discover services and characteristics.
4. Build runtime `DeviceProfile`:
   - discovered UUIDs
   - detected brand candidate
   - capability map from registry + runtime presence
5. Subscribe notifications for required channels.
6. Initial read sync:
   - volume/mute state
   - active program
   - optional battery/device info
   - brand-specific metadata reads (only confirmed paths)
7. Render controls with capability gates.

Reconnect behavior:
- Exponential backoff reconnect with bounded retries.
- Preserve last known safe state with stale marker.
- Never replay queued writes automatically after reconnect without revalidation.

## 10) Error Handling and Diagnostics

Error classes:
- `TransportError` (BLE unavailable, permission denied, disconnect)
- `CapabilityError` (operation blocked by safety/capability policy)
- `ProtocolError` (unexpected frame shape, parse failure)
- `TimeoutError` (no expected response/notify in window)

Diagnostics panel requirements:
- Connected device metadata and inferred brand.
- Discovered service/characteristic summary.
- Capability matrix (supported/partial/blocked with reasons).
- Per-operation execution trace:
  - canonical operation
  - adapter command mapping
  - channels touched
  - timing/result/error category

Privacy:
- No cloud upload by default.
- Logs stay local unless explicit export action is used.

## 11) UI Requirements

Core screens:
- Connect screen
- Control screen (volume/program/mute/state)
- Capability details modal
- Diagnostics screen

UX rules:
- Disabled controls must display reason tooltip.
- Partial support should show caution badge.
- Blocked operation should offer "Learn why" linking to capability reason.
- Keep unsafe/fitting operations absent from normal user UI.

## 12) Testing Strategy

Unit tests:
- Registry schema validation.
- CapabilityEngine decisions for each confidence/safety combination.
- Brand adapter frame builders/parsers.

Integration tests (mock transport):
- Connect/discover flow.
- Notification subscription + state reconciliation.
- Operation -> expected write/read/notify sequencing.
- Blocked operation path correctness.

Hardware validation matrix:
- Philips POLARIS and Rexton first.
- ReSound/Starkey tracked as explicit partial/blocked until blockers closed.

Definition of done for Web MVP:
- Philips + Rexton safe controls working end-to-end.
- ReSound + Starkey represented with honest capability states.
- No unresolved writes reachable from production UI.
- Diagnostics panel can explain every blocked feature.

## 13) Delivery Plan

Phase 1: Data and contracts
- Create `protocol_registry.json`.
- Define operation/capability/safety types.
- Implement adapter and transport interfaces.

Phase 2: Web transport and shared safety engine
- Implement `WebBleTransport`.
- Implement `CapabilityEngine` + `SafetyGate`.

Phase 3: Philips + Rexton MVP controls
- Implement confirmed operation paths only.
- Add state sync and capability-aware UI.

Phase 4: ReSound/Starkey scaffolding
- Add diagnostic-only and explicitly gated pathways.
- Keep unsupported writes blocked with reasons.

Phase 5: Hardening
- Add retries, reconnect reliability, telemetry exports, and validation docs.

## 14) Android Expansion Plan (Later, Not Co-Developed Now)

When web MVP is stable:
- Reuse registry, domain model, adapters, and safety policies.
- Implement `AndroidBleTransport`.
- Keep parity tests at adapter contract level.
- Add Android-specific session reliability features and background constraints.

Android should be additive:
- No redefinition of operation semantics.
- No duplicate brand logic per platform.
- Platform differences isolated to transport/session implementation details.

## 15) Open Risks and Tracking

High risks:
- ReSound operation certainty still partial pending runtime validation.
- Starkey on-wire transport framing unresolved below app-layer Piccolo.
- Rexton mute behavior still partial in advanced/FAPI paths.
- Philips PRE_POLARIS legacy branch incomplete.

Risk policy:
- Represent each unresolved area as explicit blocked features in the registry.
- Do not merge speculative write support behind hidden fallbacks.
- Require evidence promotion path (`partial -> confirmed`) before enabling new controls.

## 16) Spec Acceptance Criteria

This spec is acceptable for implementation if:
- It preserves existing confirmed byte-level behavior for Philips and Rexton MVP paths.
- It explicitly gates all unresolved/risky operations.
- It defines contracts that allow later Android transport integration without adapter rewrites.
- It includes an auditable registry format and capability model.

## 17) Appendix A: Operation Coverage Matrix (Web MVP)

| Operation | Philips/Oticon | Rexton | ReSound | Starkey |
|---|---|---|---|---|
| SetVolume | supported (confirmed byte layout) | supported (`8b8276e8`, opcode `0x04`) | partial (handle protocol known, op mapping partial) | blocked (native transport unresolved) |
| SetProgram | supported (`535442f7`) | supported (`8b8276e8`, opcode `0x05`) | partial (dynamic handle flow, needs runtime certainty) | blocked (native transport unresolved) |
| SetMute | supported (byte1 inverted boolean) | blocked (advanced path partial) | partial (template exists, runtime confirmation needed) | blocked (native transport unresolved) |
| ReadBattery | partial-to-supported depending on discovered channels | supported where discovered | partial | partial |
| RefreshState | supported | supported | partial (read-safe only) | partial (read-safe only) |

Promotion rule:
- A `partial` item moves to `supported` only after runtime evidence is linked in `sourceRefs`.

## 18) Appendix B: Critical Channel Map To Preserve

Philips/Oticon POLARIS:
- Volume-like writes: `1454e9d6...`, `50632720...`, `e5892ebe...`
- Program select: `535442f7...`
- Program discovery/metadata: `dcbe7a3e...`, `68bfa64e...`, `bba1c7f1...`
- Streaming status: `d01ab591...`
- Volume ranges: `58bbccc5...`

Rexton:
- Basic control command: `8b8276e8...`
- Active program notify: `8b8225e0...`
- Programming/FAPI (`c8f7...`, `d1d4dc2a...`) remains blocked in user-safe UI

ReSound:
- Command: `1959A468-3234-4C18-9E78-8DAF8D9DBF61`
- Notify: `8B51A2CA-5BED-418B-B54B-22FE666AADD2`
- Handle protocol invariants:
  - write handle frame: `[0x03, handleLowByte, payload...]`
  - read frame: `[0x04, handleLowByte]`
  - blob read frame: `[0x05, handleLowByte, offsetLow, offsetHigh]`

Starkey:
- App-layer Piccolo feature IDs are known, but wire transport below app layer remains unresolved.
- Treat all write controls as blocked until transport framing/checksum/session behavior is confirmed.

## 19) Appendix C: Implementation Invariants

Do not violate these rules during implementation:
- No direct write path may bypass `SafetyGate`.
- Adapter logic must not be embedded in UI components.
- Registry edits must include confidence and source references.
- Unknown/discovered UUIDs without confirmed mapping must be logged as observations, not auto-enabled controls.
- Production build must not expose fitting-risk operations.

