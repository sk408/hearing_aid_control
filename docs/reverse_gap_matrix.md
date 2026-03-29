# Reverse Engineering Gap Matrix

This file tracks what is confirmed vs inferred for control-level BLE behavior.
It is focused on practical command extraction, not full protocol documentation.

## Confidence levels

- `confirmed`: explicit in decompiled code or standards docs
- `partial`: UUID/flow known, payload details incomplete
- `inferred`: behavior guessed from naming or context, not verified

## Vendor matrix

### Philips / Oticon (POLARIS)

- **Service/characteristic map:** `confirmed`
  - Main service and many labeled chars are in `docs/ble_reference.md` and `docs/philips_hearlink.md`.
- **Volume/mute write payload bytes:** `confirmed` (for app-level proprietary paths)
  - Serializer writes `[levelByte, muteFlagByte]` where mute flag uses inverted boolean encoding.
  - Callback readback parses byte0 level and `byte1 == 0` as muted, with retry-on-mismatch logic.
- **Program switching protocol:** `partial`
  - `535442f7` single-byte write path is confirmed.
  - `68bfa64e` program-list control framing is confirmed with ready sentinel `255`.
  - Full `bba1c7f1` program-config payload schema remains unresolved.
- **Next high-value extraction:**
  - Decode full `bba1c7f1` response schema and command semantics for non-255 program list operations.
  - Diff these behaviors against additional Philips versions once downloadable APK artifacts are acquired.

### Starkey (Piccolo)

- **Piccolo service + control object names:** `confirmed`
  - Service UUID and `ControlObjectId` names are documented.
- **Command framing + operation IDs:** `confirmed` (app layer)
  - `ExecuteUiCommand` = `0x12`, `ExecuteFeature` = `0x06`, `GetControlState` = `0x09`.
  - User-op feature IDs confirmed:
    - SetMemory `0x0434`, SetVolume `0x0435`, SetMute `0x043A`, StartStopAccessoryStreaming `0x043D`.
  - Control object IDs confirmed from smali:
    - Memory `0x0000`, MicrophoneVolume `0x0001`, StreamingVolume `0x0003`, StreamingState `0x0006`, etc.
- **Response decode map:** `partial`
  - `PiccoloResponsePacket`: byte0 success flag, bytes1.. payload.
  - GetControlState strips first result byte, then parses control-object payload (volume object expects 4 bytes).
  - Native transport wrapper/checksum framing is still below visible app-layer boundary.
- **Next high-value extraction:**
  - Recover native packet boundary details under `PiccoloPacketTransportFeature.SendPacketResult`.
  - Extract richer response/event mappings (feature complete/error variants) for runtime-state transitions.

### Rexton / WSA (Terminal IO + Control/FAPI)

- **UUID families and characteristic labels:** `confirmed`
  - `8b82xxxx` (Terminal IO) and `c8f7xxxx` (Control/FAPI) are well mapped.
- **Managed-code confirmation:** `confirmed`
  - Extracted MAUI assemblies directly define Terminal IO, Control/FAPI, POLARIS, and bonding characteristic groups.
  - Alternate UUID variants for several characteristics are present in managed mappings.
- **Basic Control opcodes:** `partial`
  - Confirmed from managed serializers:
    - volume `[0x04, value]`
    - program `[0x05, value]`
    - sound balance `[0x06, value]`
    - tinnitus `[0x07, value]`
    - CROS `[0x08, value]`
    - TV streamer volume `[0x09, (15 - slider)]`
  - Dedicated mute opcode still unresolved.
- **Control/FAPI frame schema:** `partial`
  - Programming control channel framing now confirmed:
    - requests use `[commandId, payload...]`
    - response byte0 uses bit0 error flag plus echoed command id in bits1..7
    - command IDs `0x00/0x02/0x04/0x06/0x08/0x0A/0x0C` recovered
  - Programming data channel transport now confirmed:
    - request chunking by BLE package size and response reassembly by expected length
  - FAPI inner payload schema remains opaque behind external serializer (`SerializeFapiCommunicationRequest`).
- **Next high-value extraction:**
  - Extract `SivantosProgrammingRequest` builder callsites to map operation->data-channel payload bytes.
  - Recover FAPI binary schema by tracing the external FapiAccessLayer serializer inputs/outputs or additional assemblies.

### ReSound / GN (`e0262760` family)

- **Core UUID family:** `confirmed`
  - `a010/a011/a110/a111/a112/a113/a210` list is stable.
- **Semantic mapping per characteristic:** `partial` (corrected)
  - In this build, `e026...a010/a011` map to control/status and `a110..a113` map to firmware-related endpoints.
  - This contradicts earlier assumptions that `a110/a111` were direct volume/program channels.
- **Command-interface path:** `partial`
  - GN command UUID (`1959...`) and notify UUID (`8b51...`) are confirmed, with opcode/event IDs recovered.
  - Frame forms now confirmed for key operations:
    - write handle `[0x03, handleLow, payload...]`
    - read handle `[0x04, handleLow]`
    - read blob `[0x05, handleLow, 0x00, 0x00]`
    - discover `[0x06]`
- **Custom UUID role mapping:** `partial`
  - Multiple GN/DFU/FIT UUID roles are now confirmed from extracted managed code.
- **Next high-value extraction:**
  - Map handle IDs to user controls (volume/program/mute/stream) through server-description tables.

## Cross-vendor highest-priority unknowns

1. ReSound GN handle-to-operation map (volume/program/mute/stream).
2. Starkey native transport-on-wire framing below app-level Piccolo payloads.
3. Rexton Control/FAPI framing and payload schemas.
4. Cross-version diffs once additional APK artifacts are acquired.

## Recommended execution order

1. ReSound GN handle-to-control mapping
2. Rexton Control/FAPI decoding
3. Starkey native transport framing
4. Cross-version validation pass

