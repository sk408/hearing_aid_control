# Rexton Deep Extraction - Phase 1

## Vendor and version

- Vendor: Rexton (WS Audiology stack)
- App version: 2.7.32.16308
- Artifact: `Rexton App_2.7.32.16308_APKPure.xapk`
- Status: in progress

## Primary command path

- Android BLE callback bridge:
  - `jadx_output/rexton/sources/crc6469638a7b57755299/GattCallback.java`
  - JNI/native methods: `n_onCharacteristicRead`, `n_onCharacteristicWrite`, `n_onCharacteristicChanged`
- Android service/bond listeners:
  - `jadx_output/rexton/sources/crc64ab70c17f65a76b1f/BluetoothProfileServiceListener.java`
  - `jadx_output/rexton/sources/crc64ab70c17f65a76b1f/BluetoothBondBroadcastReceiver.java`
- Managed assembly inventory clue:
  - `jadx_output/rexton/sources/mono/MonoPackageManager_Resources.java`

## Operation dictionary (phase 1)

### Volume

- Route candidates:
  - `50632720-4c0f-4bc4-960a-2404bdfdfbca` (POLARIS/Oble)
  - `8b8276e8-0f0c-40bb-b422-3770fa72a864` (Terminal IO Basic Control)
  - ASHA fallback where available
- Request bytes: inferred/partial
- Response bytes: inferred
- Confidence: partial

### Program switch

- Route candidates:
  - `8b8276e8-...` + `8b8225e0-...`
  - `c8f75466-...` request + `c8f70447-...` response
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

### Mute/unmute

- Route candidates:
  - `8b8276e8-...` opcode candidate
  - Hi state and/or volume-floor fallback
- Request bytes: inferred
- Response bytes: inferred
- Confidence: inferred

### Stream control

- Route candidates:
  - ASHA control point path
  - Terminal IO data path after protocol negotiation
- Request bytes: partial/inferred
- Response bytes: inferred
- Confidence: partial

## Key phase-1 finding

- DEX/JADX Java does not contain practical `8b82xxxx`/`c8f7xxxx` payload serializers.
- Core command framing appears to live in extracted .NET assemblies, not Java.

## Immediate next decompile targets

- Extract and decompile managed assemblies referenced in app package:
  - `WSA.Foundation.Bluetooth.dll`
  - `WSA.Foundation.Bluetooth.HearingAsAService.dll`
  - `WSA.Plugin.BLE.dll`
  - `Component.HearingAidConnection.dll`
  - `Component.RemoteControl*.dll`
  - `FapiProtocol.Core.dll`
  - `WSA.Foundation.FapiAccessLayer.dll`

## Safety boundaries

- Exclude FAPI/FB4H/programming/firmware paths from active control experiments.
- Treat `c8f7xxxx` writes as high-risk until fully decoded.

