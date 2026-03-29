# ReSound Unknown Values and Experiment Plan - 2026-03-28

This document lists unresolved UUID/characteristic value semantics and a concrete plan to close each gap.

## Scope

Targets unresolved ReSound/GN values in:

- `docs/resound_uuid_reference_master_2026-03-28.md`
- `docs/resound_uuid_exhaustive_registry_static_2026-03-28.md`
- `docs/deep_extraction/resound_phase2_static.md`

## 1) Unknown Characteristic Buckets

## 1.1 Program/Mode Domain

- `6726C057-9F99-0F3A-0BA6-D331181B1525` (`GNAvailablePrograms`)
- `DC82F820-63AC-F82F-1E89-372FDE4151F4` (`GNCurrentActiveProgram`) - transport known, value model partial
- `FCC19FF1-7E4B-8094-1488-B63ED0870E30` (`GNAvailableProgramsVersion`)
- `D6709E73-DF85-2BBF-1A32-B84F217BA6AD` (`GNProgramCategory`)
- `D6709E73-DF85-2BBF-1A32-B84F217BA6AC` (`GNProgramEnvironmentID`)

Expected outcomes:

- Enumerated program id space
- Category map
- Versioning invalidation rules

## 1.2 Streaming Domain

- `9C21DF09-E38C-333D-5783-E9C13C9324A9` (`GNStreamStatus`)
- `E374ABCA-ACEC-412E-90BC-5D70E48DD664` (`GNStreamType`)
- `B4923AC8-4E3D-41DB-925F-0FA33D49337A` (`GNCurrentActiveStreamProgram`)
- `0F3FD4DD-B0A9-465D-BC36-5DD182AD8FC5` (`GNAutomaticStreaming`)
- `29626EDD-5349-429E-B629-27DB46E4E1CD` (`GNMediaType`)

Expected outcomes:

- State byte/bit map for streaming
- Source/type mapping
- Stream program coupling behavior

## 1.3 Device State / Feature Flags

- `8D552F91-15D0-4628-A03F-1A64FC88FA51` (`GNHiState`)
- `650C3A00-CB6D-467D-A20B-3544F189D8AF` (`GNFeatureSupport`)
- `3B70C9ED-82AF-4B1B-9ACC-D376A9CFAC18` (`GNSecurityStatus`)
- `4E8CBF8C-C1FC-423F-B920-96437F358346` (`GNAllVolumes`)
- `4E8CBF8C-C1FC-423F-B920-96437F398346` (`GNPushButton`)

Expected outcomes:

- bitfield decode tables
- security state transitions
- pushbutton event states

## 1.4 Fine Tuning / Fitting / Diagnostic

- `FE3196E3-CAE2-446C-943F-C137EA22E959` (`GNRFTCertificate`)
- `16025E7E-334B-46FB-AD05-2DFF664D2F72` (`GNRFTWrite`)
- `DE57A589-7067-4BA8-8B76-6DCAF537575B` (`GNRFTNotify`)
- `9062FD9D-153C-487F-ACB8-6A5FE8AABCEF` (`GNGainData`)
- `400FC36C-ABD9-40ED-95AA-CC186C73D02A` (`GNAllGainData`)
- `84E8DF2C-1C15-4268-8C42-133B390A5E70` (`GNDHR`)

Expected outcomes:

- packet segmentation and object schema
- auth prerequisite map
- response/error contract

## 1.5 Mystique Extensions

- `1FF8B26A-2771-4F92-B252-BD39ADB0506F` (`GNInSituCommandCenter`)
- `00E8CA84-6410-4F0D-8B81-7493EA23DB26` (`GNSelfFittingState`)
- `CAA48155-1A86-4C3D-92B0-75A590992593` (`GNEnableStickyVC`)
- `E33C5A76-F1DB-44B1-9CA2-0BB63492CB5C` (`GNClassifierData`)
- `533C5A76-F1DB-44B1-9CA2-0BB63492CB5C` (`GNSelfFittingStorage`)
- `453CABEC-212A-49DF-814C-C84CD50AAE90` (`GNFactoryReset`)

Expected outcomes:

- feature availability gates
- write safety semantics
- irreversible action markers (factory reset)

## 2) Experiment Design

## 2.1 Capture Points

- Capture plaintext immediately before command encryption.
- Capture plaintext immediately after notify decryption.
- Log discover records (`0x06` / `0x07`) for each connected profile.

## 2.2 Action Script (Repeat Per Device/Profile)

1. Connect and complete trust bootstrap.
2. Trigger one UI action at a time.
3. Record command frame, event sequence, tuple payloads, and resulting app state.
4. Reset to baseline before next action.

## 2.3 Minimum Action Set

- Program up/down/select explicit index
- Mic volume up/down/mute/unmute
- Stream volume up/down/mute/unmute
- Toggle automatic streaming
- Trigger pushbutton/gesture-related events if available
- Read feature support and HI state pre/post each action

## 3) Per-UUID Completion Criteria

Mark UUID as complete only when all are true:

- Payload schema identified (enum/bitfield/struct/blob)
- Byte order and signedness confirmed
- Allowed write ranges confirmed
- Error cases observed and mapped
- Security and trusted-write preconditions confirmed
- Profile-specific differences captured

## 4) Data Model for Final Canonical Tables

For each UUID, persist:

- `uuid`
- `service_uuid`
- `profile_family`
- `ref_name`
- `handle`
- `r/w/n`
- `size_static`
- `frame_opcode_path`
- `value_schema`
- `known_values`
- `unknown_bits`
- `requires_trust`
- `evidence_file_refs`

## 5) Stop Conditions

Static/dynamic documentation set is considered complete when:

- all high-frequency user-control UUIDs are fully decoded,
- all transport UUIDs have end-to-end frame examples,
- all profile size conflicts are reconciled with gating logic,
- and unresolved UUIDs are limited to non-user-facing diagnostics only.

