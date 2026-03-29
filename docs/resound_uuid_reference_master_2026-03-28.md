# ReSound UUID Reference (Master) - 2026-03-28

This is a brand-new master reference for ReSound UUIDs and characteristic semantics built from static artifacts in this workspace.

## Scope and Evidence

- App family analyzed: ReSound Smart 3D `1.43.1` static artifacts.
- Primary evidence sources:
  - `artifacts/extracted/resound_1.43.1/gatt_descriptions/*.xml`
  - `docs/deep_extraction/resound_phase2_static.md`
  - `artifacts/decompiled/resound_1.43.1/ReSound.App.HI/ReSound.App.HI.decompiled.cs`
  - `artifacts/decompiled/resound_1.43.1/ReSound.App.BLE/ReSound.App.BLE.decompiled.cs`
  - `artifacts/decompiled/resound_1.43.1/ReSound.App.BLE.XPlatform.RemoteCommunication/ReSound.App.BLE.XPlatform.RemoteCommunication.decompiled.cs`

## Device/Profile Coverage in This Build

The UUID map is distributed across these profile descriptors:

- `CommonServiceDescription.xml`
- `Dooku2ServiceDescription.xml`
- `Dooku3ServiceDescription.xml`
- `Dooku3ServiceDescriptionOmnia.xml`
- `DookuServiceDescription.xml`
- `DookuServiceDescription3_1_1.xml`
- `Palpatine6ServiceDescription.xml`
- `MystiqueServiceDescription.xml`
- `DFUServiceDescription.xml`
- `NonGNServiceDescription.xml`

Observed total: **100 unique UUIDs** across service + characteristic definitions.

## Known Value Semantics (Confirmed)

### GN Battery Level

- Characteristic UUIDs:
  - `86E2C601-D90A-2628-19B9-BDB38D5C7CF0` (GN service battery in most profiles)
  - `24E1DFF3-AE90-41BF-BFBD-2CF8DF42BF87` (DFU service battery)
- Confirmed value mapping from descriptor tables:
  - `1` = Low battery
  - `5` = Previously low battery / assume OK
  - `10` = Battery OK
- Evidence:
  - `Dooku3ServiceDescription.xml`
  - `Palpatine6ServiceDescription.xml`
  - `DFUServiceDescription.xml`

### Hearing Aid Side

- UUID: `8D17AC2F-1D54-4742-A49A-EF4B20784EB3`
- Confirmed values:
  - `0` = Left
  - `1` = Right
- Appears in `GN Service` and `LEA Service` variants.

### Microphone / Stream Attenuation

- Microphone attenuation UUID: `32C9322D-6B17-11CF-0234-6F0DA5EAFD75`
- Streamer attenuation UUID: `054E99C7-FF34-1C12-59CD-E2C20D2E6743`
- Confirmed value semantics:
  - `0` = Mute
  - `1..255` = Volume level (1 min, 255 max)
- Notable profile difference:
  - Size is `1` byte in some profiles (e.g., `Palpatine6ServiceDescription.xml`)
  - Size is `2` bytes in Dooku/Mystique paths (program-index + attenuation framing observed in static decode notes)
- Code path corroboration:
  - `HandleBasedPlatform.SetData(...)` write framing in `resound_phase2_static.md`

### Attenuation Defaults

- UUID: `A93E1C00-45FE-4ACB-A5B0-0E9F8751AB64`
- Two-byte semantic (descriptor text):
  - Byte 0 = default mic attenuation
  - Byte 1 = default stream attenuation
  - Per-byte range matches attenuation semantics above.

### Melody/Event Enum

- UUID: `23E2FAF2-EE21-4A38-9A9A-9AF67E44AE09`
- Explicit value table present in descriptors (0..21), including:
  - `0` idle
  - `1..4` program selected
  - `5` volume changed
  - `7` low battery warning
  - `12` streaming enabled
  - `15` flight mode
  - `21` delayed activation 5 sec

## High-Confidence Protocol Control UUIDs (Non-XML)

These are confirmed in static decompilation and documented in `resound_phase2_static.md`, but are not represented in the profile XML characteristic catalogs:

- GN command: `1959A468-3234-4C18-9E78-8DAF8D9DBF61`
- GN notify: `8B51A2CA-5BED-418B-B54B-22FE666AADD2`
- GN version: `97C1C193-EA53-4312-9BD9-E52207D5E03D`
- GN security capability: `12257119-DDCB-4A12-9A08-1CD4DF7921BB`
- Trusted-app challenge: `ADD69BFC-EDC7-40A4-BA5E-5F0107C3B3AC`
- Fit protocol config: `E09369EC-150B-40B0-ABD5-841CA383D7FA`

These UUIDs are critical because user operations are tunneled through command/notify + handle protocol, not through direct static writes to one characteristic per feature.

## e0262760 Family (Critical First-Party GN Cluster)

From static phase notes and prior references in workspace docs:

- `e0262760-08c2-11e1-9073-0e8ac72ea010` (service/control plane)
- `e0262760-08c2-11e1-9073-0e8ac72ea011`
- `e0262760-08c2-11e1-9073-0e8ac72ea110`
- `e0262760-08c2-11e1-9073-0e8ac72ea111`
- `e0262760-08c2-11e1-9073-0e8ac72ea112`
- `e0262760-08c2-11e1-9073-0e8ac72ea113`
- `e0262760-08c2-11e1-9073-0e8ac72ea210`

Current interpretation from static notes:

- `...a010` = control point service domain
- `...a011` = status path
- `...a110..a113` = firmware/update related endpoints in this build
- `...a210` = pairing reservation characteristic

Status: **partially decoded** in static evidence, still requires dynamic plaintext capture for full operation-level certainty.

## Core Characteristic Matrix (Representative, High-Value)

| UUID | Ref-name / Label | R/W/N | Size | Value Status | Profile Presence |
|---|---|---|---:|---|---|
| `86E2C601-D90A-2628-19B9-BDB38D5C7CF0` | `GNBatteryLevel` | R/-/N | 1 | known enum | 8 profile files |
| `24E1DFF3-AE90-41BF-BFBD-2CF8DF42BF87` | DFU Battery | R/-/N | 1 | known enum | DFU only |
| `8D17AC2F-1D54-4742-A49A-EF4B20784EB3` | `GNLeftRight` | R/-/- | 1 | known enum | 9 profile files |
| `32C9322D-6B17-11CF-0234-6F0DA5EAFD75` | `GNMicAttenuation` | R/W/N | 1 or 2 | known enum + profile-size variant | 8 profile files |
| `054E99C7-FF34-1C12-59CD-E2C20D2E6743` | `GNStreamAttenuation` | R/W/N | 1 or 2 | known enum + profile-size variant | 8 profile files |
| `A93E1C00-45FE-4ACB-A5B0-0E9F8751AB64` | `GNAttenuationDefaults` | R/-/N | 2 | known struct | 8 profile files |
| `DC82F820-63AC-F82F-1E89-372FDE4151F4` | `GNCurrentActiveProgram` | R/W/N | 1 | partial payload semantics | 8 profile files |
| `9C21DF09-E38C-333D-5783-E9C13C9324A9` | `GNStreamStatus` | R/-/N | 2 | partial | 8 profile files |
| `E374ABCA-ACEC-412E-90BC-5D70E48DD664` | `GNStreamType` | R/-/N | 1 | partial | 6 profile files |
| `8D552F91-15D0-4628-A03F-1A64FC88FA51` | `GNHiState` | R/-/N | 1 | partial | 5 profile files |
| `4E8CBF8C-C1FC-423F-B920-96437F358346` | `GNAllVolumes` | R/-/- | 1 | partial | 5 profile files |
| `4E8CBF8C-C1FC-423F-B920-96437F398346` | `GNPushButton` | R/-/N | 1 | partial | 5 profile files |
| `650C3A00-CB6D-467D-A20B-3544F189D8AF` | `GNFeatureSupport` | R/-/N | 4 | partial bitfield | 5 profile files |
| `4449301B-A5DD-4967-99DC-A051F71AC801` | `GNAccelerometerTapConfig` | R/W/N | 2 | partial | Dooku3 + Dooku3_1_1 |
| `B4923AC8-4E3D-41DB-925F-0FA33D49337A` | `GNCurrentActiveStreamProgram` | R/-/N | 1 | partial | Dooku3 + Dooku3_1_1 |
| `0F3FD4DD-B0A9-465D-BC36-5DD182AD8FC5` | `GNAutomaticStreaming` | R/W/- | 1 | partial | Dooku3 + Dooku3_1_1 |
| `246540C2-92A9-4E81-ACBC-0CA154DB606E` | `GNAuracastControlPoint` | -/W/N | 2 | partial | Dooku3 + Dooku3_1_1 |
| `F47AC10B-58CC-4372-A567-0E02B2C3D479` | `GNStartFittingAuthenticationWindow` | R/W/- | 2 | partial | Dooku3 + Dooku3_1_1 |
| `ADCC76C3-7D42-4DCB-8024-1EE782D51DE8` | `GNDebugInfo` / `LolaRPTCommand` | R/W/- or R/W/N | 0 or 4 | context-dependent | multi-profile + Lola |
| `9062FD9D-153C-487F-ACB8-6A5FE8AABCEF` | `GNGainData` | R/W/N | 12000 | partial large blob | 8 profile files |

## Mystique-Only or Limited-Presence UUIDs (Potentially Newer/Experimental)

Observed primarily in `MystiqueServiceDescription.xml`:

- `1FF8B26A-2771-4F92-B252-BD39ADB0506F` (`GNInSituCommandCenter`)
- `00E8CA84-6410-4F0D-8B81-7493EA23DB26` (`GNSelfFittingState`)
- `CAA48155-1A86-4C3D-92B0-75A590992593` (`GNEnableStickyVC`)
- `8A0942BD-1D12-4815-8C9C-9E4F5C3C3467` (`GNDeviceName`)
- `303B4B3B-4DEA-4FB8-B050-43D0333DCA0E` (`GNSealingProperty`)
- `E33C5A76-F1DB-44B1-9CA2-0BB63492CB5C` (`GNClassifierData`)
- `533C5A76-F1DB-44B1-9CA2-0BB63492CB5C` (`GNSelfFittingStorage`)
- `453CABEC-212A-49DF-814C-C84CD50AAE90` (`GNFactoryReset`)
- `5E438BB2-D72D-417F-9D7A-9BC6862A5381` (`GNGetNoiseLevel`)

Status: present in descriptors, but semantics unresolved without dynamic traces.

## Potentially Missing First-Party UUID/Characteristic Surfaces

These appear to be first-party protocol surfaces that are **not fully represented** in one place:

- Command/notify/security UUIDs (listed above) are absent from service-description XML files.
- `e0262760` cluster is discussed in protocol notes but not represented in extracted gatt descriptor set.
- ASHA-related service UUIDs referenced in project docs (`0000fdf0...`) do not appear in the ReSound gatt descriptor XML inventory.
- CCCD (`00002902...`) is used operationally but not listed as a characteristic in profile XML (expected, but still important to document for implementers).

## File and Code References for Follow-Up

- Protocol framing and event IDs:
  - `docs/deep_extraction/resound_phase2_static.md`
- Command/notify and trust bootstrap UUID assertions:
  - `docs/deep_extraction/resound_phase2_static.md`
- Service/characteristic catalogs with handles/sizes:
  - `artifacts/extracted/resound_1.43.1/gatt_descriptions/*.xml`
- Handle-based transport decode paths:
  - `artifacts/decompiled/resound_1.43.1/ReSound.App.HI/ReSound.App.HI.decompiled.cs`
  - `artifacts/decompiled/resound_1.43.1/ReSound.App.BLE/ReSound.App.BLE.decompiled.cs`

## Reminders for Future Dynamic Validation

- Capture plaintext before command encryption and after notify decryption for:
  - program select
  - mic attenuation up/down/mute
  - stream attenuation up/down/mute
  - automatic streaming toggles
  - auracast control point writes
- Validate every `partial` UUID above into one of:
  - enum table
  - packed bitfield spec
  - structure schema (fixed or variable)
- Diff at least one newer ReSound app version to detect:
  - UUID churn
  - handle remap
  - changed payload shapes for same UUID.

