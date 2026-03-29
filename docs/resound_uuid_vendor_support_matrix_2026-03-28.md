# ReSound UUID Vendor Support Matrix - 2026-03-28

This document maps ReSound UUID/value semantics to vendor support evidence in this workspace.

## Evidence Sources Used

- ReSound deep static decode:
  - `docs/deep_extraction/resound_phase2_static.md`
  - `docs/resound_uuid_reference_master_2026-03-28.md`
- Philips deep static decode:
  - `docs/deep_extraction/philips_phase2_static.md`
  - `docs/philips_hearlink.md`
- Shared protocol notes:
  - `docs/ble_reference.md`

## Vendor Legend

- **ReSound / GN**: direct evidence in ReSound artifacts.
- **Philips / Demant/Oticon stack**: direct evidence in Philips artifacts.
- **Shared**: same UUID or semantically equivalent payload shape seen in both.
- **Unknown**: not enough evidence in current static corpus.

## Cross-Vendor UUID Overlap (Direct UUID Match)

| UUID | ReSound / GN | Philips | Notes |
|---|---|---|---|
| `24E1DFF3-AE90-41BF-BFBD-2CF8DF42BF87` | yes (DFU battery channel) | yes (documented in Philips refs in repo) | strongest direct overlap in current corpus |
| `0000180A-0000-1000-8000-00805f9b34fb` | yes (DIS service) | yes (DIS service) | standard GATT, expected overlap |
| `00002902-0000-1000-8000-00805f9b34fb` | operationally yes (CCCD write path) | yes (CCCD write path) | descriptor-level standard BLE overlap |

## ReSound GN-Unique (No Philips Match in Current Static Set)

These families appear GN-specific in current evidence:

- `e0262760-08c2-11e1-9073-0e8ac72eaXXX` control family
- GN command/notify/security cluster:
  - `1959A468-3234-4C18-9E78-8DAF8D9DBF61`
  - `8B51A2CA-5BED-418B-B54B-22FE666AADD2`
  - `97C1C193-EA53-4312-9BD9-E52207D5E03D`
  - `12257119-DDCB-4A12-9A08-1CD4DF7921BB`
  - `ADD69BFC-EDC7-40A4-BA5E-5F0107C3B3AC`
  - `E09369EC-150B-40B0-ABD5-841CA383D7FA`
- GN service characteristic cluster examples:
  - `32C9322D-6B17-11CF-0234-6F0DA5EAFD75` (mic attenuation)
  - `054E99C7-FF34-1C12-59CD-E2C20D2E6743` (stream attenuation)
  - `DC82F820-63AC-F82F-1E89-372FDE4151F4` (current program)
  - `9C21DF09-E38C-333D-5783-E9C13C9324A9` (stream status)
  - `E374ABCA-ACEC-412E-90BC-5D70E48DD664` (stream type)

## Philips-Unique (No ReSound Match in Current Static Set)

From `philips_phase2_static.md`, these UUIDs are Philips proprietary in current evidence:

- `1454e9d6-f658-4190-8589-22aa9e3021eb`
- `50632720-4c0f-4bc4-960a-2404bdfdfbca`
- `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1`
- `535442f7-0ff7-4fec-9780-742f3eb00eda`
- `68bfa64e-3209-4172-b117-f7eafce17414`
- `bba1c7f1-b445-4657-90c3-8dbd97361a0c`
- `60415e72-c345-417a-bb2b-bbba95b2c9a3`
- `6efab52e-3002-4764-9430-016cef4dfc87`
- `6e557876-ccc4-40e0-8c2d-651542c5ad3d`
- `786ff607-774d-49d6-80a5-a17e08823d91`
- `42e940ef-98c8-4ccd-a557-30425295af89`
- `dcbe7a3e-a742-4527-aeb5-cd8dee63167f`
- `58bbccc5-5a57-4e00-98d5-18c6a0408dfd`
- `d01ab591-d282-4ef5-b83b-538e0bf32d85`
- `bc6829c4-b750-48e6-b6f4-48ec866a1efb`
- `e24fac83-b5a8-4b9b-8fda-803fffb0c21c`
- `34dfc7cb-5252-430b-ba6d-df2fe87914e7`

## Cross-Vendor Value-Shape Comparison (Semantic, Not UUID Match)

| Value/Behavior Pattern | ReSound / GN | Philips | Support Status |
|---|---|---|---|
| Volume-like payload includes mute bit | yes (attenuation values include mute semantics; protocol tunneled over handle writes) | yes (`[level, !mute]` confirmed) | semantically shared |
| Program selection via 1-byte target id | yes (`GNCurrentActiveProgram`/handle protocol) | yes (`535442f7...` write `[programId]`) | semantically shared |
| Retry/reconcile after write with readback validation | partial evidence in GN event handling + state transitions | explicit in Philips callback reconciliation | likely shared design philosophy |
| Queue/serialized BLE operations | yes (command/notify and handle sequencing) | yes (explicit GATT queue classes) | shared transport strategy |
| Explicit dynamic discover record parsing | yes (GN discover event `6/7` with record tuples) | less central in current decode (char map provider is app-local) | divergent implementation detail |

## Vendor Support for Confirmed ReSound Enumerations

| ReSound Value Set | ReSound Support | Philips Support | Comment |
|---|---|---|---|
| Battery enum `1/5/10` | yes (`GNBatteryLevel` + DFU battery) | partial/unknown in Philips static docs | overlap only confirmed at UUID level for `24E1...` |
| Side enum `0=Left,1=Right` | yes (`GNLeftRight`) | unknown in Philips decode docs | likely present elsewhere, not recovered here |
| Attenuation `0 mute, 1..255 level` | yes (`GNMicAttenuation`, `GNStreamAttenuation`) | semantically yes (level + mute channels) | encoding differs by protocol |
| Melody enum `0..21` | yes (descriptor table) | no direct equivalent found | appears GN-specific UX/firmware signaling |

## Potentially Missing First-Party Vendor Connections

These are high-priority unknowns for cross-vendor attribution:

- Whether Philips has functional equivalents of GN command/notify/security UUIDs under different IDs.
- Whether ReSound has hidden equivalents of Philips bonded-device and streaming-source UUID channels.
- Whether overlap around `24E1...` is battery-only reuse or part of a larger shared DFU subprotocol.

## Action Reminders

- Build a normalized schema layer for both vendors:
  - feature (`volume/program/stream`) -> transport -> UUID(s) -> payload shape.
- Add dynamic trace columns:
  - first-party app action
  - wire bytes
  - response bytes
  - post-state.
- For every "semantic overlap / UUID mismatch" row, explicitly map:
  - same behavior?
  - same bytes?
  - same security prerequisite?

