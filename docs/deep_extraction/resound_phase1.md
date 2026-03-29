# ReSound Deep Extraction - Phase 1

## Vendor and version

- Vendor: ReSound (GN)
- App version: 1.43.1
- Artifact: `ReSound Smart 3D_1.43.1_APKPure.xapk`
- Status: in progress

## Primary command path

- Android callback bridge:
  - `jadx_output/resound/sources/crc64994cc4a5850313c4/BLEDroidManager.java`
  - JNI/native methods handle GATT event dispatch into managed layer.
- Scan/profile support bridge:
  - `jadx_output/resound/sources/crc64994cc4a5850313c4/BLEDroidScanCallback.java`
  - `jadx_output/resound/sources/crc64994cc4a5850313c4/BLEProfileProxyHelper_DeviceLookupCompletion.java`
- Managed assembly inventory clue:
  - `jadx_output/resound/sources/mono/MonoPackageManager_Resources.java`

## Operation dictionary (phase 1)

### Volume

- Route candidate: `e0262760-08c2-11e1-9073-0e8ac72ea110` (`a110`) plus ASHA path
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

### Program switch

- Route candidate: `e0262760-08c2-11e1-9073-0e8ac72ea111` (`a111`)
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

### Mute/unmute

- Route candidate: proprietary route unknown; fallback by volume path
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

### Stream control

- Route candidate: `e026...a112` adjunct plus ASHA control path
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

## Key phase-1 finding

- `e0262760` UUID literals and request-payload builders are not recoverable from the JADX Java bridge alone.
- Practical decoding requires .NET assembly extraction/decompilation.

## Immediate next decompile targets

- Extract and decompile managed assemblies:
  - `ReSound.App.BLE.Droid.NET.dll`
  - `ReSound.App.BLE.dll`
  - `ReSound.App.BLE.XPlatform.RemoteCommunication.dll`
  - `ReSound.XPlatform.Ble.Contracts.dll`
  - `ReSound.App.HI.dll`
  - additional app-layer assemblies that invoke BLE operations

## Safety boundaries

- Avoid fitting/configuration/firmware-related characteristics until decoded.
- Keep active experimentation limited to user control paths only.

