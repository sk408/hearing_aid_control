# Philips Hearing Aid UUID Dossier 04: Missing First-Party Coverage and Unresolved Areas

Date: 2026-03-28
Scope: Identify likely missing Philips first-party UUID/characteristic coverage and define evidence-driven resolution steps.

---

## 1) What "Missing First-Party Coverage" Means Here

A UUID/characteristic is considered "missing first-party coverage" when any of the following is true:

1. It is listed in Philips/Oticon provider maps but not behaviorally decoded.
2. It appears in callback switch logic but has no resolved semantic payload.
3. It appears in older/newer-reference docs but is not active in current baseline decode.
4. It belongs to legacy Philips service paths not yet deeply mapped.

---

## 2) Confirmed Unresolved Items (High Priority)

| UUID | Current evidence | Gap | Risk |
|---|---|---|---|
| `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | callback reads `uint8@0` into internal field | product semantic unresolved | medium (status channel ambiguity) |
| `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3` | present in callback dispatch map | no action body in baseline build | low-medium (version-gated behavior possible) |
| `d5d0affb-35b8-4fdc-a50b-f777c90293b8` | explicit PRE_POLARIS branch in `c.i.a.a.s.c` sets characteristic availability to false | payload schema and runtime role unresolved | high for legacy compatibility |

---

## 3) Inferred Pools Requiring Adjudication

### 3.1 Candidate unlabeled set from broader references

- `29d9ed98-a469-4536-ade2-f981bc1d605e`
- `87749df4-7ccf-48f8-aa87-704bad0e0e16`
- `8a1695c7-5c40-4b42-8965-d97076e22b8d`
- `9188040d-6c67-4c5b-b112-36a304b66dad`
- `b31b99bf-5257-41d3-86df-ad84b30aea8e`
- `ee224395-69b5-4622-8645-ff2566532795`
- `adcf079a-bf94-4c4c-97e7-afef5aa06b38`

Current state:

- Some deep decode notes suggest part of this set may be false positives for baseline app.
- No definitive runtime evidence in workspace proving active TX/RX usage.

### 3.2 Legacy service branch under `14293049...`

Known:

- Service presence documented.
- `d5d0affb...` linked to PRE_POLARIS handling.

Missing:

- Full characteristic table for this service.
- startup/read/write/notify lifecycle mapping.
- compatibility behavior compared with POLARIS path.

Static anchors now confirmed:

- `DeviceCompatibility.from(...)` uses `14293049...` in PRE_POLARIS classification.
- `c.i.a.a.q.b` includes `14293049...` in required service-set list.
- `c.i.a.a.s.c` contains explicit PRE_POLARIS handling for `d5d0affb...`.

---

## 4) First-Party Coverage Gaps by Functional Area

| Functional area | Coverage status | Missing details |
|---|---|---|
| Volume/mute/program (POLARIS) | strong | edge-case retries and failure-state traces |
| Program metadata lifecycle | strong | corruption/partial-record handling behavior |
| Streaming state | moderate | exhaustive state enum values from real traffic |
| EQ/soundscape channels | moderate | UX control <-> byte-field mapping |
| Bonded-device activation | moderate | race/timing behavior across reconnects |
| PRE_POLARIS legacy | weak | almost entire protocol layer still missing |
| MFi branch | weak | characteristic-level map in Android analysis not complete |

---

## 5) Resolution Plan (Evidence-First)

### Phase A: Runtime trigger experiments (current baseline app)

1. Instrument with `tools/reverse/frida_philips_ble_trace.js`.
2. Execute controlled UI actions one at a time:
   - main volume up/down
   - mute/unmute
   - program switch across all visible programs
   - EQ/gain changes
   - soundscape/environment toggles
   - stream target selection
3. Record all unique UUIDs observed in TX and RX.
4. Diff observed UUID set against known confirmed set.

Primary outcome:

- Promote UUIDs to `confirmed active` or demote to `inactive/unobserved in this baseline`.

### Phase B: Version-diff extraction

1. Acquire Philips HearLink `2.4.1.10089` and `2.3.0.9837`.
2. Re-run static extraction for:
   - `CharacteristicUuidProvider`
   - callback parser
   - write reconciliation paths
3. Build a UUID delta table:
   - added / removed / retained
   - behavior changed / unchanged / unresolved

Primary outcome:

- detect version-gated first-party channels and stabilize compatibility guidance.

### Phase C: Legacy PRE_POLARIS deep map

1. Isolate legacy service branch in decompiled logic.
2. Enumerate PRE_POLARIS characteristic list and operation sequence.
3. Map write/read/notify semantics for each legacy characteristic.
4. Reconcile static branch behavior for `d5d0affb...` (availability false) against runtime service discovery to determine whether this is model/firmware gating, dead path, or safety disable.

Primary outcome:

- close highest-impact compatibility gap for older Philips hearing aids.

---

## 6) Candidate Test Triggers for Unresolved Semantics

### For `e24fac83...`

Potential trigger classes:

- entering/exiting streaming mode
- changing environmental profile states
- switching tinnitus/make-audible states
- completing bonded-device activation

Validation target:

- derive stable mapping from byte values to app-visible state transitions.

### For `268c4933...`

Potential trigger classes:

- hidden/advanced settings pages
- onboarding vs post-onboarding phases
- device model-specific features (firmware-dependent)

Validation target:

- determine whether channel is dormant, removed, or conditionally active.

### For candidate unlabeled pool (7 UUIDs)

Approach:

- treat any observed runtime appearance as high-priority decode target.
- if absent across repeated controlled sessions, classify as non-active in baseline.

---

## 7) Risk and Safety Notes

- Unresolved channels can include fitting-grade or safety-sensitive controls.
- Do not send exploratory writes to unresolved UUIDs on user devices.
- Restrict dynamic tests to passive observation plus confirmed-safe action pathways.

---

## 8) Completion Criteria for "No More Documents Needed" (Unresolved Track)

This unresolved track can be considered complete when:

1. every UUID in sections 2 and 3 is either behaviorally decoded or explicitly classified as inactive in baseline;
2. PRE_POLARIS characteristic table is fully enumerated;
3. at least one additional Philips app version has been diffed and reconciled.

At that point, this dossier can be marked `closed` and replaced with a final resolved registry.

