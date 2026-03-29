# Philips Deep Extraction - Phase 1

## Vendor and version

- Vendor: Philips HearLink (Oticon/Demant platform)
- App version: 2.5.0
- Artifact: `Philips HearLink_2.5.0.10268_Apkpure.apk`
- Status: in progress

## Primary command path

- UUID/service mapping:
  - `jadx_output/philips/sources/com/oticon/blegenericmodule/ble/gatt/CharacteristicUuidProvider.java`
- Connection/control implementation:
  - `jadx_output/philips/sources/c/i/a/a/u/l.java`
- Write callback routing:
  - `jadx_output/philips/sources/c/i/a/a/u/k.java`
- Payload serialization helper:
  - `jadx_output/philips/sources/c/h/a/b/e/m/m/a.java`
- GATT write/read operation layer:
  - `jadx_output/philips/sources/c/i/a/a/r/l.java`
  - `jadx_output/philips/sources/c/i/a/a/r/j.java`

## Operation dictionary (phase 1)

### Volume

- Route: `1454e9d6-f658-4190-8589-22aa9e3021eb` and `50632720-4c0f-4bc4-960a-2404bdfdfbca`
- Request bytes: partial (2-byte payload shape confirmed in serializer; dB mapping not finalized)
- Response bytes: partial
- Confidence: partial

### Program switch

- Route: `535442f7-0ff7-4fec-9780-742f3eb00eda`, `68bfa64e-3209-4172-b117-f7eafce17414`, `bba1c7f1-b445-4657-90c3-8dbd97361a0c`
- Request bytes: partial (single-byte write forms identified)
- Response bytes: inferred (status semantics need deeper decode)
- Confidence: partial

### Mute/unmute

- Route: same serializer path as volume-like controls
- Request bytes: partial (boolean packed into second byte)
- Response bytes: inferred
- Confidence: partial

### Stream control

- Route: `50632720-...` and ASHA path
- Request bytes: partial
- Response bytes: inferred
- Confidence: partial

## Known concrete bytes found

- Serializer writes two bytes for volume-like payloads:
  - byte0: level
  - byte1: inverted boolean flag
- Program control char write path includes one-byte command payload.
- Bonding related writes observed:
  - `{1,0}` and `{2,slot}` forms in specific methods.

## Immediate next decompile targets

- `jadx_output/philips/sources/c/i/a/a/s/*.java`
  - decode callback-side parsing and event semantics.
- `jadx_output/philips/sources/c/i/a/c/d.java`
  - recover exact clamp/range logic used for user levels.
- `jadx_output/philips/sources/com/wdh/ble/HearingAidManagerService.java`
  - link UI operations to concrete BLE write paths.

## Safety boundaries

- Do not touch extended feature or fitting-adjacent characteristics until decoded.
- Restrict active control work to volume/program/mute/stream.

