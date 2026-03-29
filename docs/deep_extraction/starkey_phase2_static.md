# Starkey Deep Extraction - Phase 2 (Static Decode from Smali + Decompiled Sources)

This pass targets byte-level command framing for user operations in Starkey v2.1.0.

## 1) Key confirmation sources

- Decompiled Java/Kotlin output:
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloCommand.java`
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloUiCommand.java`
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/UiFeature.java`
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloResponsePacket.java`
- Smali (apktool decode):
  - `artifacts/extracted/starkey_2.1.0/apktool/smali_classes3/com/starkey/connectivity/able/services/piccolo/ControlObjectId.smali`
  - `artifacts/extracted/starkey_2.1.0/apktool/smali_classes3/com/starkey/connectivity/able/services/piccolo/ServiceLibPiccolo.smali`
  - `artifacts/extracted/starkey_2.1.0/apktool/smali_classes3/com/starkey/connectivity/able/services/piccolo/PiccoloDispatcher.smali`

## 2) Confirmed top-level Piccolo command framing

- `PiccoloCommand.ExecuteUiCommand` command byte is `0x12` (18).
- UI subcommand IDs:
  - `ExecuteFeature`: `0x06`
  - `GetControlState`: `0x09`
- Dispatcher calls packet transport with `PiccoloServiceIds.ProgrammingService`, where service id byte is `0x02`.

## 3) ExecuteFeature payload structure (confirmed)

For UI feature execution, the payload shape is:

- `[0x12, 0x06, featureLengthPlusFlags, flagsByte, featureIdHi, featureIdLo, optionalArg]`

Where:

- `featureLengthPlusFlags = featurePayloadLength + 1`
- `flagsByte` comes from `UiCommandFlags` bitfield:
  - bit0 inhibitIndicator
  - bit1 inhibitLocal
  - bit2 inhibitE2E
  - bit3 inhibitGATT
- default flags in normal execute paths are all false (`flagsByte = 0x00`).

`UiFeature` uses 16-bit IDs serialized as `[highByte, lowByte]`.

## 4) User-operation feature IDs and concrete request bytes

### Volume set

- `UiFeature.SetVolume` id: `1077` (`0x0435`)
- arg: one byte volume level
- request bytes:
  - `[0x12, 0x06, 0x04, 0x00, 0x04, 0x35, volume]`

### Program switch (memory set)

- `UiFeature.SetMemory` id: `1076` (`0x0434`)
- arg: one byte memory/program index
- request bytes:
  - `[0x12, 0x06, 0x04, 0x00, 0x04, 0x34, memoryIndex]`

### Mute/unmute

- `UiFeature.SetMute` id: `1082` (`0x043A`)
- arg: boolean encoded as byte (`0x01` true, `0x00` false)
- request bytes:
  - `[0x12, 0x06, 0x04, 0x00, 0x04, 0x3A, muteByte]`

### Stream control (accessory stream start/stop)

- `UiFeature.StartStopAccessoryStreaming` id: `1085` (`0x043D`)
- arg: boolean start byte (`0x01` start, `0x00` stop)
- request bytes:
  - `[0x12, 0x06, 0x04, 0x00, 0x04, 0x3D, startByte]`

## 5) GetControlState framing and numeric ControlObjectId map

`PiccoloUiCommand.GetControlState` payload is:

- `[0x12, 0x09, controlObjectIdHi, controlObjectIdLo]`

Smali confirms `ControlObjectId` numeric values:

- Memory `0x0000`
- MicrophoneVolume `0x0001`
- TinnitusVolume `0x0002`
- StreamingVolume `0x0003`
- AccessoryStreamingVolume `0x0004`
- BalanceVolume `0x0005`
- StreamingState `0x0006`
- AdaptiveTuningState `0x0007`
- EqualizerBassState `0x0008`
- EqualizerMiddleState `0x0009`
- EqualizerTrebleState `0x000A`
- NoiseReductionState `0x000B`
- WindReductionState `0x000C`
- StreamingEqualizerBassState `0x000D`
- StreamingEqualizerMiddleState `0x000E`
- StreamingEqualizerTrebleState `0x000F`

## 6) Response packet decode (confirmed)

- Piccolo response packet raw byte array format:
  - byte0: success flag (`!= 0` means success)
  - bytes1..n: command result payload bytes

For parsed control-object responses:

- `GetControlState` parser discards the first byte of result, then passes remaining bytes to the specific control object parser.
- Volume control object parser expects 4 bytes:
  - byte0 bit0 = muted
  - byte1 = vcTableIndex
  - byte2 = volumeLevel
  - byte3 = defaultVolume

## 7) Transport boundary note

- `ServiceLibPiccolo` sends payload bytes as comma-separated string values into native transport:
  - `PiccoloPacketTransportFeature.SendPacketResult(stringPayload, serviceTypeByte)`.
- Native packet wrapping/checksum/segmentation is below this boundary and remains unresolved in static Java/smali.

## 8) Confidence outcome

- Command routing and user-op request bytes above: `confirmed` at app-level Piccolo command layer.
- Native transport framing beneath `SendPacketResult`: `partial`.
