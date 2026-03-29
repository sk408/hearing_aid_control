# ReSound Missing First-Party UUID Targets - 2026-03-28

This document tracks likely first-party ReSound/GN UUIDs and characteristic semantics that are still missing, partial, or inconsistent across static artifacts.

## Why This Exists

The current static corpus splits protocol truth across:

- XML service descriptions (feature-centric, profile-specific)
- command/notify protocol docs (transport-centric)
- decompiled code paths (execution-centric)

A complete implementation needs all three merged.

## Priority 0: High-Risk Missing Surfaces

### 1) GN Command/Notify Transport Characteristics Not in XML Catalog

Missing from `gatt_descriptions/*.xml` despite high confidence in static decode:

- `1959A468-3234-4C18-9E78-8DAF8D9DBF61` (command)
- `8B51A2CA-5BED-418B-B54B-22FE666AADD2` (notify)
- `97C1C193-EA53-4312-9BD9-E52207D5E03D` (version)
- `12257119-DDCB-4A12-9A08-1CD4DF7921BB` (security capability)
- `ADD69BFC-EDC7-40A4-BA5E-5F0107C3B3AC` (trusted-app challenge)
- `E09369EC-150B-40B0-ABD5-841CA383D7FA` (fit protocol config)

Impact:

- Prevents building a complete first-party UUID graph from XML only.
- Hides the mandatory trust/bootstrap sequence from matrix-level tooling.

### 2) e0262760 Family Is Outside Descriptor Inventory

The entire `e0262760-08c2-11e1-9073-0e8ac72eaXXX` family is documented in protocol notes but not represented in the XML service description set.

Impact:

- Creates false negatives if tooling assumes XML is exhaustive.
- Blocks characteristic-level completeness checks.

### 3) Handle-Resolved Characteristics Lack Stable Payload Specs

Many GN characteristics are reachable only via dynamic handle discovery/read/write, but their value-level schema is still TBD.

Examples:

- `9C21DF09-E38C-333D-5783-E9C13C9324A9` (`GNStreamStatus`)
- `E374ABCA-ACEC-412E-90BC-5D70E48DD664` (`GNStreamType`)
- `8D552F91-15D0-4628-A03F-1A64FC88FA51` (`GNHiState`)
- `650C3A00-CB6D-467D-A20B-3544F189D8AF` (`GNFeatureSupport`)
- `4449301B-A5DD-4967-99DC-A051F71AC801` (`GNAccelerometerTapConfig`)

Impact:

- UUID known, operation-level behavior unknown.
- Cannot safely implement write builders and decoders yet.

## Priority 1: Profile Inconsistency Candidates

These look first-party but vary across profile XMLs and likely need runtime gating logic:

- Attenuation characteristic size differences (`1` vs `2`) for:
  - `32C9322D-6B17-11CF-0234-6F0DA5EAFD75`
  - `054E99C7-FF34-1C12-59CD-E2C20D2E6743`
- `ADCC76C3-7D42-4DCB-8024-1EE782D51DE8` dual role:
  - `GNDebugInfo` (GN Service, size `4`)
  - `LolaRPTCommand` (Lola Service, size `0`/variable)
- `3E251569-9A5E-4B05-8E97-D6420AE28BE4` role differs by profile labels:
  - stream balance in some
  - read datalog area result in others

## Priority 2: Mystique-Only Extension Set (Needs Confirmation)

Likely first-party but currently single-profile or sparse-profile:

- `1FF8B26A-2771-4F92-B252-BD39ADB0506F` (`GNInSituCommandCenter`)
- `00E8CA84-6410-4F0D-8B81-7493EA23DB26` (`GNSelfFittingState`)
- `CAA48155-1A86-4C3D-92B0-75A590992593` (`GNEnableStickyVC`)
- `E33C5A76-F1DB-44B1-9CA2-0BB63492CB5C` (`GNClassifierData`)
- `533C5A76-F1DB-44B1-9CA2-0BB63492CB5C` (`GNSelfFittingStorage`)
- `453CABEC-212A-49DF-814C-C84CD50AAE90` (`GNFactoryReset`)
- `5E438BB2-D72D-417F-9D7A-9BC6862A5381` (`GNGetNoiseLevel`)

## Code/Protocol Reference Hotspots

Use these loci first when filling gaps:

- `docs/deep_extraction/resound_phase2_static.md`
  - command opcodes and event IDs
  - frame layout and discover record structure
- `artifacts/decompiled/resound_1.43.1/ReSound.App.HI/ReSound.App.HI.decompiled.cs`
  - `HandleBasedPlatform.Notification(...)`
  - `HandleBasedPlatform.Discover(...)`
  - `HandleBasedPlatform.SetData(...)`
  - `HandleBasedPlatform.HandleReadOut(...)`
  - `HandleBasedPlatform.HandleBlobReadOut(...)`
- `artifacts/extracted/resound_1.43.1/gatt_descriptions/*.xml`
  - profile-dependent size/access declarations

## Validation Checklist for Closing a Missing Item

- Confirm UUID appears in at least one of:
  - static descriptor XML
  - runtime discover responses
  - command/notify plaintext traces
- Confirm operation path:
  - direct GATT read/write vs command tunnel handle write
- Confirm value schema:
  - enum/bitfield/struct/variable blob
- Confirm security requirements:
  - trusted write needed?
  - challenge/certificate prerequisite?
- Confirm profile constraints:
  - only Dooku3?
  - only Mystique?
  - all GN Service profiles?

## Reminders for Future Work

- Do not assume XML omission means UUID not used; command tunnel paths can bypass static descriptor visibility.
- Track one UUID by `(uuid, service uuid, profile)` tuple; UUID-only indexing causes collisions in multi-service contexts.
- Treat size `0` in Lola/Fit characteristics as variable-length payload expectation, not unknown parse failure.
- Keep a change log by app version; GN profile descriptors and payload semantics can drift between releases.

