# Starkey Deep Extraction - Phase 1

## Vendor and version

- Vendor: Starkey
- App version: 2.1.0
- Artifact: `My Starkey_2.1.0_APKPure.apk`
- Status: in progress

## Primary command path

- Command dispatcher:
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloDispatcher.java`
  - Symbols: `sendPayloadAtomic`, `sendCommand`, `executeUiFeatureAndAwaitCompletion`
- Packet transport bridge:
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/IServiceLibPiccolo.java`
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/ServiceLibPiccolo.java`
- Native transport boundary:
  - `jadx_output/starkey/sources/hialibandroid/PiccoloPacketTransportFeature.java`
  - Symbol: `n_SendPacketResult`
- Response decode:
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloResponse.java`
  - `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloResponsePacket.java`

## Operation dictionary (phase 1)

### Volume

- Route: Piccolo `UiFeature.SetVolume` / `IncrementVolume` / `DecrementVolume`
- Request bytes: partial (top-level command IDs known, object/value bytes incomplete)
- Response bytes: partial (response packet success byte known; object schema incomplete)
- Confidence: partial

### Program switch

- Route: Piccolo `UiFeature.SetMemory` and related memory control paths
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

### Mute/unmute

- Route: Piccolo `UiFeature.SetMute`, `MuteAndSetUnmuteVolume`
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

### Stream control

- Route: Piccolo `UiFeature.StartStopAccessoryStreaming`
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

## Known concrete bytes found

- `PiccoloServiceIds.ProgrammingService` id byte: `2`
- `PiccoloCommand.ExecuteUiCommand` command byte: `18`
- `PiccoloUiCommand.ExecuteFeature` command byte: `6`
- `PiccoloUiCommand.GetControlState` command byte: `9`
- `PiccoloResponsePacket`: byte0 indicates success/failure

## Immediate next decompile targets

- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/ServiceLibPiccolo.java`
  - recover `sendPacket` body and wire framing.
- `jadx_output/starkey/sources/com/starkey/connectivity/able/peripheral/Connection.java`
  - recover GATT write path and characteristic resolution.
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/ControlObjectId.java`
  - extract numeric IDs (likely via smali).

## Safety boundaries

- Exclude remote programming/fitting code paths.
- Do not attempt active writes from inferred payloads.

