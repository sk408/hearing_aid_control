# Rexton (WSA) UUID + Characteristic Dossier

Date: 2026-03-28  
App lineage: Rexton 2.7.32  
Platform note: hybrid of shared POLARIS channels plus WSA-specific `8b82` and `c8f7` families.

## 1) Service families

| UUID | Service | Status |
|---|---|---|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | Hi/POLARIS service (shared with Philips) | confirmed |
| `8b82105d-0f0c-40bb-b422-3770fa72a864` | Terminal IO | confirmed |
| `c8f7a831-21b2-45b8-87f8-bd49a13eff49` | Programming service | confirmed |
| `d1d4dc2a-215f-44d2-b44c-0f4de3c91af2` | FAPI service | confirmed |
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | Bonding service | confirmed |

## 2) Characteristic map and value formats

## 2.1 Shared Hi/POLARIS characteristics

| UUID | Role | Status |
|---|---|---|
| `83e28ff3-25ad-4bfe-aaf0-5a95dba4b56b` | Hi state | partial |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | Hi ID | partial |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Partner ID | partial |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | OBLE volume channel | partial |
| `d28617fe-0ad5-40c5-a04a-bc89051ff755` | Ear side | partial |
| `bdf8a334-1c7b-46e9-b4c2-800b8966136b` | Identifiers | partial |

## 2.2 Terminal IO (`8b82xxxx`) channels

| UUID | Label | Value semantics | Status |
|---|---|---|---|
| `8b822409-...-3770fa72a864` | Data RX | write raw bytes to device | partial |
| `8b82b999-...-3770fa72a864` | Data TX | notification raw bytes from device | partial |
| `8b82cd2d-...-3770fa72a864` | Protocol Choice | protocol variant selector enum | partial |
| `8b82a76f-...-3770fa72a864` | Ready for RX | readiness flag byte | partial |
| `8b82f3b9-...-3770fa72a864` | Ready for TX | readiness/data-available flag byte | partial |
| `8b8225e0-...-3770fa72a864` | Active Program Info | notification payload with active program info | partial |
| `8b8276e8-...-3770fa72a864` | Basic Control Command | opcode-based writes for user controls | confirmed |
| `8b823656-...-3770fa72a864` | Configuration Check | config state check/trigger | partial |

### Basic Control Command (`8b8276e8...`) confirmed opcodes

| Opcode | Meaning | Payload |
|---|---|---|
| `0x04` | volume set | `[0x04, volumePosition]` |
| `0x05` | program set | `[0x05, programId]` |
| `0x06` | sound balance set | `[0x06, balance]` |
| `0x07` | tinnitus volume set | `[0x07, tinnitus]` |
| `0x08` | CROS volume set | `[0x08, cros]` |
| `0x09` | TV streamer volume set | `[0x09, (15 - slider)]` |

### OBLE fallback stream-volume write (legacy path)

- Used when basic-control info version < 3 and OBLE is supported.
- Payload:
  - nonzero slider: `[(slider - 1), 0x01]`
  - zero slider: `[0x00, 0x00]`

## 2.3 Programming control/data channels (`c8f7xxxx`)

| UUID | Role | Status |
|---|---|---|
| `c8f75466-...-bd49a13eff49` | Control Request | confirmed |
| `c8f70447-...-bd49a13eff49` | Control Response | confirmed |
| `c8f72804-...-bd49a13eff49` | Data Request | confirmed |
| `c8f72fef-...-bd49a13eff49` | Data Response | confirmed |
| `c8f723da-...-bd49a13eff49` | FAPI Request | confirmed |
| `c8f7690c-...-bd49a13eff49` | FAPI Response | confirmed |

### Control Request command IDs and expected values

| Command ID | Name | Example request bytes |
|---|---|---|
| `0x00` | StartProgramming | `[0x00, randomId[6]]` |
| `0x02` | StopProgramming | `[0x02]` |
| `0x04` | StartHighPerformanceMode | `[0x04]` |
| `0x06` | StopHighPerformanceMode | `[0x06]` |
| `0x08` | ConnectionParameterUpdate | `[0x08, intervalMin, intervalMax, latency, timeout]` |
| `0x0A` | ConnectionPriority | `[0x0A, priority]` where high is `0x00` |
| `0x0C` | VersionInfo | `[0x0C]` |

### Control Response value semantics

- `byte0`:
  - bit0: error flag
  - bits1..7: echoed command ID
- `byte1`:
  - error code if error flag set
  - else command-specific data start

Known error code values:
- `0`: ProgrammingModeActive
- `1`: ProgrammingModeNotActive
- `2`: HighPerformanceModeActive
- `3`: HighPerformanceModeNotActive
- `4`: TestModeActive
- `5`: TestModeNotActive
- `6`: InvalidParameter
- `7`: InternalError
- `255`: InvalidCommandId

## 3) Unknowns and unresolved UUIDs

- Several alternates in `8b82` and `c8f7` families are clearly generation aliases, but per-model dispatch rules are not fully pinned down.
- Internal FAPI payload schema remains externalized behind serializer layers; transport UUIDs are known but many feature payloads are opaque.
- Full mute/unmute dedicated opcode in basic-control surface remains not explicitly singled out in current static pass.

## 4) Potentially missing first-party UUIDs/characteristics

- Additional versioned aliases likely exist for older/newer hardware families beyond currently extracted assembly scope.
- Some high-level feature toggles may use FAPI-only characteristics that are present but not semantically mapped because serializer internals are incomplete.
- Dynamic capability-gated characteristics may not appear unless specific device families are connected.

## 5) File references and code anchors

### Primary docs
- `docs/deep_extraction/rexton_phase2_static.md`
- `docs/rexton.md`
- `docs/ble_reference.md`
- `docs/command_dictionary.md`

### Decompiled code references
- `WSA.Foundation.Bluetooth.decompiled.cs`
- `WSA.Plugin.BLE.decompiled.cs`

### Symbol anchors
- `BasicCommandProtocol`
- `ProgrammingConnection.SendControlCommandAsync`
- `ProgrammingConnection.SendRequest`
- `FapiGattMessenger`

## 6) Reminders

- Separate user-safe controls (basic control) from fitting/programming paths in tooling and docs.
- Assume command aliases across generations until runtime verifies a single active set for each device model.
- Treat any write paths touching FAPI/configuration file characteristics as audiology-grade and high risk.
