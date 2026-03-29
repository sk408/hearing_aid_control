# Philips Hearing Aid UUID Dossier 01: Static Registry and Value Semantics

Date: 2026-03-28
Scope: Philips HearLink ecosystem on Oticon/Demant BLE stack, with cross-vendor overlap notes and first-party gaps.

---

## 1) Evidence Corpus and Confidence Model

### Primary evidence files used

- `docs/philips_hearlink.md`
- `docs/deep_extraction/philips_phase1.md`
- `docs/deep_extraction/philips_phase2_static.md`
- `tools/reverse/frida_philips_ble_trace.js`
- `docs/ble_reference.md`
- `docs/reverse_gap_matrix.md`
- `docs/gaps_and_next_steps.md`
- `docs/artifact_acquisition_status.md`

### Confidence levels used in this dossier

- `confirmed`: directly recovered from static decode and/or callback/write paths with byte-level behavior.
- `partial`: strongly implied by stack architecture and standards, but not yet runtime-validated in this workspace.
- `inferred`: listed or referenced in broader project docs, but not proven as active Philips HA control path in current baseline.
- `inactive-in-baseline`: present in references or code paths but not active in the baseline control path.

### Baseline artifact context

- Philips app baseline analyzed: `Philips HearLink_2.5.0.10268_Apkpure.apk`.
- Additional Philips versions are not yet locally acquired (`2.4.1.10089`, `2.3.0.9837` targeted), so cross-version UUID stability is still open.

---

## 2) Philips Service UUID Inventory

| UUID | Label / Role | Status | Vendor Support Notes | Source Anchors |
|---|---|---|---|---|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | Oticon/Philips proprietary primary control service (POLARIS) | confirmed | Philips; also documented in Rexton/WSA stacks (shared platform lineage) | `docs/philips_hearlink.md`, `docs/deep_extraction/philips_phase2_static.md`, `docs/ble_reference.md` |
| `14293049-77d7-4244-ae6a-d3873e4a3184` | PRE_POLARIS legacy proprietary service | confirmed (presence), partial (full behavior) | Philips legacy only (current scope) | `docs/philips_hearlink.md`, `docs/ble_reference.md` |
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | ASHA-side bonded-device/bonding service used in Philips parser flow | confirmed | Philips; also seen in Rexton bonding paths | `docs/philips_hearlink.md`, `docs/deep_extraction/philips_phase2_static.md`, `docs/ble_reference.md` |
| `0000180a-0000-1000-8000-00805f9b34fb` | Device Information Service | confirmed | Standard SIG service; cross-vendor | `docs/philips_hearlink.md`, `docs/deep_extraction/philips_phase2_static.md` |
| `0000180f-0000-1000-8000-00805f9b34fb` | Battery Service | confirmed (enumerated), partial (payload mapping in Philips path) | Standard SIG service; cross-vendor | `docs/philips_hearlink.md`, `docs/ble_reference.md` |
| `7d74f4bd-c74a-4431-862c-cce884371592` | MFi HAP service (Apple-side compatibility path) | confirmed (service presence) | Philips + ReSound per current docs; runtime use in Android path not analyzed here | `docs/philips_hearlink.md`, `docs/ble_reference.md` |

---

## 3) Philips Characteristic Registry (Confirmed + Unknown)

### 3.1 Standard DIS characteristics in Philips parser

| UUID | Meaning | Value Type | Status | Notes |
|---|---|---|---|---|
| `00002a29-0000-1000-8000-00805f9b34fb` | Manufacturer name | String | confirmed | Parsed via DIS callback route. |
| `00002a24-0000-1000-8000-00805f9b34fb` | Model number | String | confirmed | Parsed via DIS callback route. |
| `00002a26-0000-1000-8000-00805f9b34fb` | Firmware revision | String | confirmed | Parsed via DIS callback route. |
| `00002a28-0000-1000-8000-00805f9b34fb` | Software revision | String | confirmed | Parsed via DIS callback route. |

### 3.2 Core POLARIS control-plane characteristics

| UUID | Function | Expected/Recovered Payload | Status | Vendor Support Notes |
|---|---|---|---|---|
| `1454e9d6-f658-4190-8589-22aa9e3021eb` | Main volume + mute | write/read byte layout: `[level, invMute]` where `invMute = (!mute) ? 1 : 0`; readback mute when byte1==0 | confirmed | Philips-specific path; operation shape aligns with shared Demant patterns. |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | Streaming volume + mute | same two-byte layout as above | confirmed | Shared UUID appears in Philips + Rexton docs. |
| `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1` | Tinnitus/mic volume + mute | same two-byte layout as above | confirmed | Philips control-plane path confirmed in callbacks. |
| `535442f7-0ff7-4fec-9780-742f3eb00eda` | Program select / active program id | write one-byte `[(byte)programId]`; readback compares byte0 to pending target | confirmed | Program switching control anchor. |
| `68bfa64e-3209-4172-b117-f7eafce17414` | Program list handshake gate | command byte write; response byte0 `255` used as ready sentinel | confirmed | Drives program metadata fetch flow. |
| `bba1c7f1-b445-4657-90c3-8dbd97361a0c` | Program metadata record channel | parsed fields: category, name length, name, flags bits | confirmed (structure mostly decoded) | Central for label/category/flags reconstruction. |
| `42e940ef-98c8-4ccd-a557-30425295af89` | Program-info version | int32 at offset 0; version change triggers map rebuild | confirmed | Version gate for program list refresh. |
| `dcbe7a3e-a742-4527-aeb5-cd8dee63167f` | Available-program bitset | bitset seeds queue of program ids + sentinel | confirmed | Operationally paired with `68bfa64e` + `bba1c7f1`. |
| `58bbccc5-5a57-4e00-98d5-18c6a0408dfd` | Volume range limits | byte pairs for min/max ranges (main/stream/tinnitus when present) | confirmed | Used as bounds source before writes. |
| `d01ab591-d282-4ef5-b83b-538e0bf32d85` | Streaming state/status | byte0 state + source decomposition from byte1 and optional fields | confirmed | Streaming state parser exists in callback path. |
| `60415e72-c345-417a-bb2b-bbba95b2c9a3` | EQ/gain transport | observed raw and framed payload builders (including 16-byte form) | confirmed (write construction), partial (full domain semantics) | Requires runtime feature-level validation for UX mapping. |
| `6e557876-ccc4-40e0-8c2d-651542c5ad3d` | Soundscape/environment parameter | observed write form `[0, value]` with value bounded 0..255 | confirmed (shape), partial (semantic meaning) | Controls environment-related tuning dimension. |
| `6efab52e-3002-4764-9430-016cef4dfc87` | Bonded-device access control | write forms `[1,0]` and `[2,slot]` | confirmed | Shared UUID with Rexton docs. |
| `786ff607-774d-49d6-80a5-a17e08823d91` | Streaming-device activation | fixed 8-byte payload `[0x10, addr0..addr5, slot]`; write type with response | confirmed | Bridge from bonded cache to active stream routing. |
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | ASHA-side bonded feed records | parser handles entry/remove/end marker record shapes | confirmed | Also appears in cross-vendor shared tables. |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | HIID string | string read | confirmed | Shared with Rexton docs. |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Partner HIID string | string read | confirmed | Shared with Rexton docs. |
| `bc6829c4-b750-48e6-b6f4-48ec866a1efb` | Uptime/session counters | callback parses optional int32 values | confirmed | Counter semantics partially inferred from parser behavior. |
| `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | Single-byte status field (`this.r`) | `uint8@0` stored; product meaning unresolved | partial | High-priority unresolved semantic. |
| `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3` | Callback switch presence | no-op in this app build | inactive-in-baseline | Could be dormant or version-gated feature. |
| `9215a295-b813-483f-9f85-b700d0b7bc75` | Make-audible / tinnitus channel | callback path identified; detailed payload spec incomplete | partial | Present in characteristic map and decode routing. |
| `51939bb6-a635-4b1e-903b-76cd9dff3fac` | Bonded device characteristic | listed in provider maps; behavior not fully decoded in current notes | inferred | Appears in service map, not fully documented in parser notes. |

### 3.3 PRE_POLARIS specific characteristic

| UUID | Role | Status | Notes |
|---|---|---|---|
| `d5d0affb-35b8-4fdc-a50b-f777c90293b8` | PRE_POLARIS special characteristic | confirmed (existence), partial (payload/semantics) | Explicitly flagged as legacy-specific in current references. |

---

## 4) Expected vs Potential UUIDs (Reconciliation Notes)

### 4.1 UUIDs previously listed as unknown Philips POLARIS channels in broader docs

The following values appear in older or broader reference docs as "unlabeled" Philips candidates:

- `29d9ed98-a469-4536-ade2-f981bc1d605e`
- `87749df4-7ccf-48f8-aa87-704bad0e0e16`
- `8a1695c7-5c40-4b42-8965-d97076e22b8d`
- `9188040d-6c67-4c5b-b112-36a304b66dad`
- `b31b99bf-5257-41d3-86df-ad84b30aea8e`
- `ee224395-69b5-4622-8645-ff2566532795`
- `adcf079a-bf94-4c4c-97e7-afef5aa06b38`

Current Philips-specific deep decode notes indicate at least part of this set may represent false positives from non-BLE or inactive code paths in this baseline, and they are not currently represented in the recovered callback map.

Status in this dossier: `inferred` until runtime trace or additional APK versions prove active wire usage.

### 4.2 Standard ASHA characteristic UUIDs expected in Philips environments

These are expected because Philips app stack advertises ASHA service support, but Philips-specific value ownership in app-layer proprietary parser is not the same as full ASHA channel ownership:

- `6333651e-c481-4a3e-9169-7c902aad37bb` (ASHA Read Only Properties)
- `f0d28fea-5d20-4087-84a8-6b6f2fb08de0` (ASHA Audio Control Point)
- `38663f1a-e711-488c-b1a2-4a7870e6a5e5` (ASHA Audio Status Point)
- `00e4ca9e-ab14-41e4-8823-f9e70c7e91df` (ASHA Volume)
- `2d410339-82b6-42aa-b34e-e2e01df8cc1a` (ASHA LE PSM, v2)

Status in this dossier: `partial` for Philips ecosystem compatibility, but not yet asserted as the app's primary control surface for all user actions.

---

## 5) Potential Missing First-Party UUID/Characteristic Coverage

This section tracks likely first-party coverage gaps in current static-only inventory.

1. Legacy path under `14293049...` service is under-documented; only `d5d0affb...` is explicitly tracked.
2. Any version-gated POLARIS characteristics omitted in v2.5.0 callback no-op branches (e.g., `268c4933...`) may surface in other app or firmware versions.
3. Several project-level references still list unlabeled characteristics not confirmed in current parser recovery (see section 4.1), implying documentation drift that needs runtime adjudication.
4. Cross-platform service visibility includes MFi HAP service presence, but no exhaustive Philips Android-side characteristic table for MFi branch is documented yet.

---

## 6) Code and File Reference Index (for fast follow-up)

### Decompile/class anchors referenced by current docs

- `com/oticon/blegenericmodule/ble/gatt/CharacteristicUuidProvider.java`
- `c/i/a/a/u/l.java` (service/characteristic callback parser)
- `c/i/a/a/u/k.java` (write reconciliation)
- `c/h/a/b/e/m/m/a.java` (volume-like serializer)
- `c/i/a/a/r/l.java` (GATT write operation)
- `c/i/a/a/r/j.java` (GATT read operation)

### Runtime instrumentation anchor already prepared

- `tools/reverse/frida_philips_ble_trace.js`
  - Hooks outgoing `BluetoothGattCharacteristic.setValue([B)`.
  - Hooks incoming parser callback `c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)`.

---

## 7) Reminders and Research TODO Queue

### High-priority reminders

- Validate `e24fac83...` semantics by triggering the corresponding UX state and correlating callback byte0 transitions.
- Validate whether section 4.1 UUIDs ever appear in live TX/RX logs on Philips devices.
- Acquire at least one older Philips HearLink APK to diff provider and callback switch maps.
- Build a version-diff table for UUID additions/removals and payload schema drift.

### Safety reminders

- Do not write fitting/extended channels until schema confidence is upgraded by runtime traces.
- Keep user-control tooling constrained to confirmed channels (volume/program/stream/mute) with strict bounds.
- Preserve serialized GATT operation queue behavior; do not parallelize write/read ops against hearing aids.

### Documentation hygiene reminders

- Maintain a "status per UUID" field (`confirmed`/`partial`/`inferred`/`inactive-in-baseline`) in every future dossier.
- Flag and reconcile contradictions between project-wide summary docs and Philips deep extraction docs instead of merging them silently.

---

## 8) Recommended Next Document (Dossier 02)

Create next as: Philips runtime frame atlas, one UI action at a time.

Proposed filename:

- `docs/philips_uuid_dossier_02_runtime_capture_matrix.md`

Planned contents:

- UI action -> TX characteristic UUID -> exact payload bytes -> expected RX callback bytes -> convergence rules.

