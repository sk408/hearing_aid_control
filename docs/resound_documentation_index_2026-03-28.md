# ReSound Documentation Index - 2026-03-28

This is the current ReSound documentation map for the static extraction phase.

## Core Dossiers

- `docs/resound_uuid_reference_master_2026-03-28.md`
  - master UUID/value/reference dossier
- `docs/resound_uuid_exhaustive_registry_static_2026-03-28.md`
  - full static UUID family registry
- `docs/resound_uuid_vendor_support_matrix_2026-03-28.md`
  - vendor overlap and support attribution
- `docs/resound_uuid_missing_first_party_targets_2026-03-28.md`
  - missing/partial first-party surface tracking
- `docs/resound_control_protocol_frames_2026-03-28.md`
  - command/notify frame and event decode
- `docs/resound_unknown_values_and_experiment_plan_2026-03-28.md`
  - unknown-value closure plan

## Deep Extraction Inputs

- `docs/deep_extraction/resound_phase1.md`
- `docs/deep_extraction/resound_phase2_static.md`

## Artifact Inputs

- `artifacts/extracted/resound_1.43.1/gatt_descriptions/*.xml`
- `artifacts/decompiled/resound_1.43.1/ReSound.App.HI/ReSound.App.HI.decompiled.cs`
- `artifacts/decompiled/resound_1.43.1/ReSound.App.BLE/ReSound.App.BLE.decompiled.cs`
- `artifacts/decompiled/resound_1.43.1/ReSound.App.BLE.XPlatform.RemoteCommunication/ReSound.App.BLE.XPlatform.RemoteCommunication.decompiled.cs`

## Documentation Completeness Status

- UUID inventory breadth: **high** (static)
- User-control protocol framing: **high** (static)
- Value-level decode completeness: **partial**
- Cross-vendor mapping: **medium-high**
- Dynamic runtime proof: **missing (next phase)**

## Recommended Next Documents (Only After Runtime Captures)

No further static-only docs are required right now.

Create these only once dynamic traces are available:

1. `docs/resound_dynamic_trace_corpus_YYYY-MM-DD.md`
2. `docs/resound_uuid_canonical_value_tables_YYYY-MM-DD.md`
3. `docs/resound_profile_gating_matrix_YYYY-MM-DD.md`

