# Starkey UUID + Characteristic Dossier

Date: 2026-03-28  
App lineage: Starkey 2.1.0  
Protocol note: strongest evidence is app-layer Piccolo framing; lower native packet wrapping remains partial.

## 1) Service map

| UUID | Service | Status |
|---|---|---|
| `9a04f079-9840-4286-ab92-e65be0885f95` | Piccolo service | confirmed |
| `48ddf118-efd0-48fc-8f44-b9b8e17be397` | HA configuration service | confirmed |
| `5446ec0e-d711-11e4-b9d6-1681e6b88ec1` | E2E notification service | confirmed |

## 2) Characteristic inventory

## 2.1 HA configuration (`48ddf118...`)

| UUID | Label | Access | Status |
|---|---|---|---|
| `6401a620-89c5-4135-b4af-ea1c2e1ce524` | Control Point | write | confirmed |
| `38278651-76d7-4dee-83d8-894f3fa6bb99` | Data Source | read/notify | confirmed |
| `26ddeaca-a73c-4b61-a1de-87c5375b2706` | Feature Support | read | confirmed |

## 2.2 Piccolo characteristics

| UUID | Label | Access | Status |
|---|---|---|---|
| `a287a5f9-0fa3-bc84-2a41-c9da6d85bd4e` | primary Piccolo char | read/write/notify | confirmed |
| `37a691f4-7686-4280-caca-fba8b44b9360` | fallback Piccolo char | read/write/notify | confirmed |

## 2.3 HIP and SSI families

| UUID | Label | Status |
|---|---|---|
| `896c9932-d4ea-11e1-af55-58b035fea743` | HA ID | confirmed |
| `896c98ba-d4ea-11e1-af52-58b035fea743` | HA info | confirmed |
| `896c9950-d4ea-11e1-af56-58b035fea743` | other HA ID | confirmed |
| `896c990a-d4ea-11e1-af54-58b035fea743` | side | confirmed |
| `896c96ee-d4ea-11e1-af46-58b035fea743` | versions | confirmed |
| `0b2be3d9-ba60-429f-b61a-e9b564167c97` | WiCross device type | confirmed |
| `5446e255-d711-11e4-b9d6-1681e6b88ec1` | SSI next long packet | confirmed |
| `5446e448-d711-11e4-b9d6-1681e6b88ec1` | SSI last long packet | confirmed |
| `5446fb18-d711-11e4-b9d6-1681e6b88ec1` | streaming/accessory control | confirmed |
| `5446ea24-d711-11e4-b9d6-1681e6b88ec1` | associated device/accessory status | confirmed |
| `5446e63c-d711-11e4-b9d6-1681e6b88ec1` | accessory secondary write | confirmed |
| `5446daa2-d711-11e4-b9d6-1681e6b88ec1` | tinnitus config | confirmed |
| `60fb6208-9b02-468e-aba8-b702dd6f543a` | battery level (morse) | confirmed |

## 2.4 E2E / assistant / reminders

| UUID | Label | Status |
|---|---|---|
| `0990d720-893f-4365-b03c-0718186506f9` | E2E notification ch1 | confirmed |
| `a0370d1b-e805-4dda-b41a-1f011d2a4a7a` | E2E notification ch2 | confirmed |
| `b5a0badd-7739-4712-8804-a60a0ed9bdec` | assistant status point | confirmed |
| `c43b2a46-e802-4ea4-81b1-97987cd33b1c` | assistant control point | confirmed |
| `7de95c7f-12de-40a9-b77c-6712da671217` | audio source enable | confirmed |
| `d0b6dc42-03c8-457a-a347-ade8d1c4e98d` | unresolved GASS char | partial |
| `84f9e90a-884a-4bb3-85f2-e77399189874` | unresolved GASS char | partial |
| `985c6f7d-ac66-445a-b65e-573fc0d72f46` | put-on reminder toggle | partial |
| `ae1badbf-a989-4d02-bbe8-25cb10254202` | self-check reminder toggle | partial |

## 3) Confirmed Piccolo operation value formats

## 3.1 Top-level framing

- Execute UI command channel:
  - command byte `0x12`
- UI subcommands:
  - ExecuteFeature `0x06`
  - GetControlState `0x09`
- ExecuteFeature payload shape:
  - `[0x12, 0x06, featureLengthPlusFlags, flagsByte, featureIdHi, featureIdLo, optionalArg]`
- Flags bits:
  - bit0 inhibitIndicator
  - bit1 inhibitLocal
  - bit2 inhibitE2E
  - bit3 inhibitGATT

## 3.2 User-control feature IDs and example request values

| Feature | ID | Request bytes |
|---|---:|---|
| SetVolume | `0x0435` | `[0x12, 0x06, 0x04, 0x00, 0x04, 0x35, volume]` |
| SetMemory (program) | `0x0434` | `[0x12, 0x06, 0x04, 0x00, 0x04, 0x34, memoryIndex]` |
| SetMute | `0x043A` | `[0x12, 0x06, 0x04, 0x00, 0x04, 0x3A, muteByte]` |
| StartStopAccessoryStreaming | `0x043D` | `[0x12, 0x06, 0x04, 0x00, 0x04, 0x3D, startByte]` |

Expected arg values:
- `muteByte`: `0x01` muted, `0x00` unmuted.
- `startByte`: `0x01` start, `0x00` stop.

## 3.3 Control object IDs (GetControlState)

Request shape:
- `[0x12, 0x09, controlObjectHi, controlObjectLo]`

Known object values:
- `0x0000` Memory
- `0x0001` MicrophoneVolume
- `0x0002` TinnitusVolume
- `0x0003` StreamingVolume
- `0x0004` AccessoryStreamingVolume
- `0x0005` BalanceVolume
- `0x0006` StreamingState
- `0x0007` AdaptiveTuningState
- `0x0008` EqualizerBassState
- `0x0009` EqualizerMiddleState
- `0x000A` EqualizerTrebleState
- `0x000B` NoiseReductionState
- `0x000C` WindReductionState
- `0x000D` StreamingEqualizerBassState
- `0x000E` StreamingEqualizerMiddleState
- `0x000F` StreamingEqualizerTrebleState

## 3.4 Response value semantics

- Raw response packet:
  - byte0 success flag (`!=0` success)
  - bytes1..N command result payload
- Volume object parser expects 4 bytes:
  - byte0 bit0 muted
  - byte1 volume-table index
  - byte2 current volume level
  - byte3 default volume

## 4) Potentially missing first-party UUIDs / characteristics

- Starkey likely has additional operation channels in HA configuration service not fully tied to user controls in current docs.
- Some feature toggles may be mapped only through capability bitfields and server-side interpretation, not explicit per-feature UUIDs.
- Any transport-level headers/checksums below `SendPacketResult` could imply hidden framing constants not currently documented.

## 5) File references and code anchors

### Primary docs
- `docs/deep_extraction/starkey_phase2_static.md`
- `docs/starkey.md`
- `docs/ble_reference.md`
- `docs/command_dictionary.md`

### Symbol anchors
- `PiccoloCommand`
- `PiccoloUiCommand`
- `UiFeature`
- `ControlObjectId`
- `ServiceLibPiccolo`
- `PiccoloDispatcher`
- `PiccoloResponsePacket`

## 6) Reminders

- Keep two layers separate in docs/implementation:
  - app-layer Piccolo command format (mostly confirmed),
  - native on-wire wrapping (still partial).
- Record characteristic selection behavior (primary vs fallback Piccolo char) per model/firmware during runtime tests.
- For safety, classify assistant, E2E, and reminder channels as non-core-control until explicit operation requirements exist.
