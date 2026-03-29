# Command Dictionary (Working Draft)

This dictionary maps user operations to likely protocol actions by vendor.
It is intended as an implementation aid and includes confidence markers.

## Confidence key

- `confirmed`: explicit value format known
- `partial`: operation-channel mapping is known, bytes still incomplete
- `inferred`: guess from naming/context only
- `inactive-in-baseline`: present in references but not active on baseline control path

## Volume

- **ASHA-capable path (Philips, ReSound, likely Rexton):**
  - UUID: `00e4ca9e-ab14-41e4-8823-f9e70c7e91df`
  - Write: signed int8 in `[-128..0]`
  - Confidence: `confirmed`

- **Philips POLARIS mirror:**
  - UUID: `50632720-4c0f-4bc4-960a-2404bdfdfbca`
  - Write (confirmed in app code): two-byte payload `[levelByte, muteFlagByte]`
  - Encoding: `levelByte = (byte) level`, `muteFlagByte = (!isMuted) ? 1 : 0`
  - Readback logic: parse byte0 as level and `byte1 == 0` as muted
  - Confidence: `confirmed`

- **Rexton Terminal IO Basic Control:**
  - UUID: `8b8276e8-0f0c-40bb-b422-3770fa72a864`
  - Confirmed payload: `[0x04, volumePosition]`
  - Confidence: `confirmed`

- **Starkey Piccolo:**
  - Service: `9a04f079-9840-4286-ab92-e65be0885f95`
  - App-level request bytes (ExecuteFeature SetVolume):
    - `[0x12, 0x06, 0x04, 0x00, 0x04, 0x35, volume]`
  - Confidence: `confirmed` (app-layer Piccolo framing)

- **ReSound GN proprietary (corrected path):**
  - Primary command UUID: `1959A468-3234-4C18-9E78-8DAF8D9DBF61` (GNCommand)
  - Primary notify UUID: `8B51A2CA-5BED-418B-B54B-22FE666AADD2` (GNNotify)
  - Command interface uses opcode-based handle protocol, not single static volume UUID writes.
  - Static operation template (mic attenuation path):
    - `[0x03, 0x05, currentProgram, attenuation]`
  - Expected notify decode:
    - `0x03/0x04` tuple payloads `[handle, len, valueBytes...]` including handle `0x05`.
  - Confidence: `partial`

## Program switch

- **Philips program select path:**
  - UUID: `535442f7-0ff7-4fec-9780-742f3eb00eda`
  - Request payload (confirmed): `[(byte) targetProgram]`
  - Readback logic (confirmed): compare characteristic byte0 to pending target
  - Confidence: `confirmed`

- **Philips program list control path:**
  - UUID: `68bfa64e-3209-4172-b117-f7eafce17414`
  - Request payload (confirmed framing): `[(byte) command]`
  - Known ready sentinel (confirmed): response byte0 `== 255`
  - Follow-up read when not ready: `bba1c7f1-b445-4657-90c3-8dbd97361a0c`
  - Confidence: `partial`

- **Rexton Terminal IO:**
  - UUID: `8b8276e8-0f0c-40bb-b422-3770fa72a864`
  - Confirmed payload: `[0x05, target_program_index]`
  - Confirm via: `8b8225e0-0f0c-40bb-b422-3770fa72a864` notifications
  - Confidence: `confirmed`

- **Rexton Control Request path:**
  - Request UUID: `c8f75466-21b2-45b8-87f8-bd49a13eff49`
  - Response UUID: `c8f70447-21b2-45b8-87f8-bd49a13eff49`
  - Payload schema: unknown framed/TLV
  - Confidence: `inferred`

- **Starkey Piccolo:**
  - App-level request bytes (ExecuteFeature SetMemory):
    - `[0x12, 0x06, 0x04, 0x00, 0x04, 0x34, memoryIndex]`
  - Confidence: `confirmed` (app-layer Piccolo framing)

- **ReSound GN proprietary:**
  - `e026...` family roles are primarily control/status/firmware endpoints in this build.
  - Program switching appears to be mediated via GN command/notify handle protocol.
  - Static operation template:
    - `[0x03, 0x08, programIndex]` (`GNCurrentActiveProgram` handle example).
  - Expected notify decode:
    - `0x03/0x04` tuples containing handle `0x08`.
  - Confidence: `partial`

## Mute/unmute

- **ASHA fallback:**
  - Emulation via volume minimum (`-128`) where needed
  - Confidence: `partial`

- **Philips proprietary mute bit (confirmed):**
  - Routes: `1454e9d6...`, `50632720...`, `e5892ebe...`
  - Encoding: second payload byte is inverted mute boolean (`0` = muted, `1` = unmuted)
  - Confidence: `confirmed`

- **Rexton Basic Control:**
  - UUID: `8b8276e8-0f0c-40bb-b422-3770fa72a864`
  - Confirmed related opcodes:
    - sound balance: `[0x06, value]`
    - tinnitus volume: `[0x07, value]`
    - CROS volume: `[0x08, value]`
  - No dedicated mute/unmute opcode is present in static Basic Control mapping.
  - Mute control is routed via advanced/FAPI receiver-state paths in current static evidence.
  - Confidence: `partial`

- **Starkey and ReSound proprietary mute path:**
  - Starkey app-layer request bytes (ExecuteFeature SetMute):
    - `[0x12, 0x06, 0x04, 0x00, 0x04, 0x3A, muteByte]`
  - ReSound channel known, payload body still unresolved per operation.
  - ReSound static mute candidate on mic attenuation handle:
    - mute: `[0x03, 0x05, currentProgram, 0x00]`
    - unmute: `[0x03, 0x05, currentProgram, attenuationNonZero]`
  - Confidence: `partial`

## Stream control

- **ASHA Audio Control Point:**
  - UUID: `f0d28fea-5d20-4087-84a8-6b6f2fb08de0`
  - Start: `[0x01, codec, audio_type, volume, other_device_status]`
  - Stop: `[0x02]`
  - Status: `[0x03, other_device_status]`
  - Confidence: `confirmed`

- **ReSound stream-related notes (corrected):**
  - `e026...a112` appears as firmware image data endpoint in this build.
  - Operational stream/user-control traffic is likely tunneled via GN command/notify.
  - Confirmed GN command frame shapes:
    - write handle: `[0x03, handleLow, payload...]`
    - read handle: `[0x04, handleLow]`
    - read blob: `[0x05, handleLow, 0x00, 0x00]`
    - discover: `[0x06]`
  - Static stream operation templates:
    - stream attenuation write: `[0x03, 0x06, currentProgram, attenuation]`
    - stream status read: `[0x04, 0x15]`
  - Confidence: `partial`

- **Starkey Piccolo stream control (accessory stream):**
  - App-layer request bytes (ExecuteFeature StartStopAccessoryStreaming):
    - `[0x12, 0x06, 0x04, 0x00, 0x04, 0x3D, startByte]`
  - Confidence: `confirmed` (app-layer Piccolo framing)

## Pairing/bonding and side identification

- **POLARIS side info:**
  - Ear UUID: `d28617fe-0ad5-40c5-a04a-bc89051ff755`
  - Confidence: `partial` (value mapping mostly known)

- **Rexton pairing state:**
  - UUID: `8e467a33-820e-40fa-8759-4cd7a197384d`
  - Confidence: `partial`

- **Device type input during pairing:**
  - UUID: `62dcc92f-59c2-4228-9a11-c85f18773530`
  - Candidate values (`Android/iOS/etc.`) documented but not wire-confirmed
  - Confidence: `inferred`

## Programming/control transport

- **Rexton Programming Service control channel (`Control Request/Response`):**
  - Request UUID: `c8f75466-21b2-45b8-87f8-bd49a13eff49` (alt `c8f79c9a-21b2-45b8-87f8-bd49a13eff49`)
  - Response UUID: `c8f70447-21b2-45b8-87f8-bd49a13eff49` (alt `c8f73dc3-21b2-45b8-87f8-bd49a13eff49`)
  - Request frame: `[commandId, payload...]`
  - Confirmed command IDs:
    - `0x00` start programming
    - `0x02` stop programming
    - `0x04` start high-performance
    - `0x06` stop high-performance
    - `0x08` connection-parameter update
    - `0x0A` connection-priority
    - `0x0C` version info
  - Response byte0 semantics:
    - bit0 error flag, bits1..7 echoed command id
  - `VersionInfo` response parse:
    - byte1 high nibble = major, low nibble = minor
  - `ConnectionParameterUpdate` success parse:
    - byte1 interpreted as MTU size in request-priority flow
  - Confidence: `confirmed`

- **Rexton Programming Service data channel (`Data Request/Response`):**
  - Request UUID: `c8f72804-21b2-45b8-87f8-bd49a13eff49` (alt `c8f7a8e4-21b2-45b8-87f8-bd49a13eff49`)
  - Response UUID: `c8f72fef-21b2-45b8-87f8-bd49a13eff49` (alt `c8f7a68a-21b2-45b8-87f8-bd49a13eff49`)
  - Transport behavior:
    - app chunks requests larger than BLE package size
    - app reassembles notifications until expected response length
  - Confidence: `confirmed`

## Next dictionary upgrades

1. Map Starkey app-layer bytes to native transport-on-wire framing below `SendPacketResult`.
2. Validate Rexton advanced/FAPI mute behavior across device families.
3. Expand ReSound templates to profile-family-specific handle maps (Dooku/Palpatine/etc).
4. Add source anchors for each entry once extracted from specific class/method paths.

