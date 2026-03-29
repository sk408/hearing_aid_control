# Command Dictionary (Working Draft)

This dictionary maps user operations to likely protocol actions by vendor.
It is intended as an implementation aid and includes confidence markers.

## Confidence key

- `confirmed`: explicit value format known
- `partial`: operation-channel mapping is known, bytes still incomplete
- `inferred`: guess from naming/context only

## Volume

- **ASHA-capable path (Philips, ReSound, likely Rexton):**
  - UUID: `00e4ca9e-ab14-41e4-8823-f9e70c7e91df`
  - Write: signed int8 in `[-128..0]`
  - Confidence: `confirmed`

- **Philips POLARIS mirror:**
  - UUID: `50632720-4c0f-4bc4-960a-2404bdfdfbca`
  - Write: likely ASHA-aligned signed int8
  - Confidence: `partial`

- **Rexton Terminal IO Basic Control:**
  - UUID: `8b8276e8-0f0c-40bb-b422-3770fa72a864`
  - Candidate payload: `[0x01, volume_byte]`
  - Confidence: `partial`

- **Starkey Piccolo:**
  - Service: `9a04f079-9840-4286-ab92-e65be0885f95`
  - Candidate payload shape: `[opcode, MicrophoneVolume_id, value]`
  - Confidence: `partial`

- **ReSound GN proprietary:**
  - UUID: `e0262760-08c2-11e1-9073-0e8ac72ea110`
  - Payload encoding: unknown (ASHA-aligned or percent scale possible)
  - Confidence: `inferred`

## Program switch

- **Rexton Terminal IO:**
  - UUID: `8b8276e8-0f0c-40bb-b422-3770fa72a864`
  - Candidate payload: `[0x02, target_program_index]`
  - Confirm via: `8b8225e0-0f0c-40bb-b422-3770fa72a864` notifications
  - Confidence: `partial`

- **Rexton Control Request path:**
  - Request UUID: `c8f75466-21b2-45b8-87f8-bd49a13eff49`
  - Response UUID: `c8f70447-21b2-45b8-87f8-bd49a13eff49`
  - Payload schema: unknown framed/TLV
  - Confidence: `inferred`

- **Starkey Piccolo:**
  - Candidate operation target: program object in Piccolo command stream
  - Byte schema: unknown
  - Confidence: `inferred`

- **ReSound GN proprietary:**
  - UUID: `e0262760-08c2-11e1-9073-0e8ac72ea111`
  - Byte schema: unknown
  - Confidence: `inferred`

## Mute/unmute

- **ASHA fallback:**
  - Emulation via volume minimum (`-128`) where needed
  - Confidence: `partial`

- **Rexton Basic Control:**
  - UUID: `8b8276e8-0f0c-40bb-b422-3770fa72a864`
  - Candidate opcode: `0x03`
  - Confidence: `inferred`

- **Starkey and ReSound proprietary mute path:**
  - Channel known, payload unknown
  - Confidence: `inferred`

## Stream control

- **ASHA Audio Control Point:**
  - UUID: `f0d28fea-5d20-4087-84a8-6b6f2fb08de0`
  - Start: `[0x01, codec, audio_type, volume, other_device_status]`
  - Stop: `[0x02]`
  - Status: `[0x03, other_device_status]`
  - Confidence: `confirmed`

- **ReSound proprietary stream control:**
  - Candidate UUID: suffix `a112`
  - Payload schema unknown
  - Confidence: `inferred`

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

## Next dictionary upgrades

1. Replace inferred Starkey object IDs with numeric values from decompiled enums.
2. Replace inferred Rexton Basic Control opcodes with verified bytes.
3. Add per-operation request and response example hex frames.
4. Add source anchors for each entry once extracted from specific class/method paths.

