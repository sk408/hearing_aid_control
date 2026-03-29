# ReSound Smart 3D — BLE Protocol Reference

## Source
- APK: ReSound Smart 3D v1.43.1 (XAPK)
- Platform: Mono/.NET (Xamarin) with native Android BLE bridge
- Manufacturer: GN Hearing
- Decompiled with: JADX + .NET assembly extraction

## Key Source Files

### Java/Android Layer
- `jadx_output/resound/sources/crc64994cc4a5850313c4/BLEDroidManager.java` — Main GATT callback handler
- `jadx_output/resound/sources/crc64994cc4a5850313c4/BLEDroidScanCallback.java` — BLE scan callback
- `jadx_output/resound/sources/crc64994cc4a5850313c4/BLEProfileProxyHelper_DeviceLookupCompletion.java` — Profile service listener
- `jadx_output/resound/sources/crc64994cc4a5850313c4/BluetoothStateListener.java` — Bluetooth state receiver

### .NET Assemblies (UUID source)
- `ReSound.App.BLE.dll`
- `ReSound.App.BLE.Droid.NET.dll`
- `ReSound.XPlatform.Ble.Contracts.dll`
- `ReSound.App.BLE.XPlatform.RemoteCommunication.dll`

Key assembly with UUIDs: **asm_110.dll** (96KB) — extracted from XAPK assemblies blob

### BLE Class Names from .NET Assemblies

From `asm_110.dll`:
- `BLEAdvertisementPackage`
- `BLEDevice`
- `BLEManagerConnected` / `BLEManagerDisconnected`
- `BLEManagerData`
- `BLEService`
- `BLEState` / `BLEStateChanged`
- `BLEStatusCode`
- `CharacteristicChanged`
- `CharacteristicsDiscoveryCompleted`
- `CharacteristicsFromBytes` / `CharacteristicsToUUID`
- `CharacteristicsHandle`
- `ServiceAndroid`

From `asm_112.dll` (BLE.XPlatform.RemoteCommunication):
- `BLECharacteristic` / `BLECharacteristics`
- `BLEDescriptor`
- `BLEDevice`
- `BLEDeviceDisconnectedException`
- `BLEDeviceState`
- `BLEHearingInstrumentProvider`
- `BLEInvoker`
- `BLEManager`
- `BLEService`

From `asm_111.dll` (BLE.Droid.NET):
- `GattCharacteristic`
- `HearingAidProfileProxy` / `HearingAidProfileProxyResult`
- `HearingAids` / `HearingAidsAsync`
- `ServiceConnected` / `ServiceData`
- `ServiceMultiplexId`

## Service UUIDs

### Standard Services

| UUID | Description |
|------|-------------|
| `0000180a-0000-1000-8000-00805f9b34fb` | Device Information Service (0x180A) |
| `0000184f-0000-1000-8000-00805f9b34fb` | Standard BLE 0x184F |
| `0000fdf0-0000-1000-8000-00805f9b34fb` | ASHA Service |
| `0000fd20-0000-1000-8000-00805f9b34fb` | Standard BLE 0xFD20 |
| `0000fd71-0000-1000-8000-00805f9b34fb` | Standard BLE 0xFD71 |
| `0000fefe-0000-1000-8000-00805f9b34fb` | Standard BLE 0xFEFE |
| `7d74f4bd-c74a-4431-862c-cce884371592` | MFi HAP (Apple) |

### Standard Characteristics

| UUID | Description |
|------|-------------|
| `00002a26-0000-1000-8000-00805f9b34fb` | Firmware Revision String |
| `00002902-0000-1000-8000-00805f9b34fb` | Client Characteristic Configuration Descriptor (CCCD) |

### GN Hearing Proprietary — `e0262760` Family

All share the same base UUID with varying last bytes. This is the core GN proprietary protocol.

| UUID | Suffix | Role |
|------|--------|------|
| `e0262760-08c2-11e1-9073-0e8ac72ea010` | a010 | Service / Primary |
| `e0262760-08c2-11e1-9073-0e8ac72ea011` | a011 | Characteristic |
| `e0262760-08c2-11e1-9073-0e8ac72ea110` | a110 | Characteristic |
| `e0262760-08c2-11e1-9073-0e8ac72ea111` | a111 | Characteristic |
| `e0262760-08c2-11e1-9073-0e8ac72ea112` | a112 | Characteristic |
| `e0262760-08c2-11e1-9073-0e8ac72ea113` | a113 | Characteristic |
| `e0262760-08c2-11e1-9073-0e8ac72ea210` | a210 | Characteristic |

### Custom Characteristic UUIDs

| UUID | Notes |
|------|-------|
| `12257119-ddcb-4a12-9a08-1cd4df7921bb` | Custom |
| `1959a468-3234-4c18-9e78-8daf8d9dbf61` | Custom |
| `1bcd1f06-1e72-4dad-8edb-8bfaeb4fe812` | Custom |
| `213885c7-488a-412c-ba95-e36436b88c42` | Custom |
| `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87` | Also found in Philips |
| `497eeb9e-b194-4f35-bc82-36fd300482a6` | Custom |
| `4d56d4f5-af39-4885-9525-9f68c18ff451` | Custom |
| `53df4e1c-43e1-497e-8edf-589f48aafd9a` | Custom |
| `6d27fe99-0bfc-4c5e-9a3f-a4a271bb3d2a` | Custom |
| `6eae2d11-57a1-43bf-be4a-6326d0d94e88` | Custom |
| `7009c09b-b94f-42d4-8d68-676059f153ab` | Custom |
| `7d74f4bd-c74a-4431-862c-cce884371592` | MFi HAP |
| `8b51a2ca-5bed-418b-b54b-22fe666aadd2` | Custom |
| `8d17ac2f-1d54-4742-a49a-ef4b20784eb3` | Custom |
| `97c1c193-ea53-4312-9bd9-e52207d5e03d` | Custom |
| `98e3949e-d4dd-421c-87b2-5a5ddc1ac26f` | Custom |
| `a53062b9-7dfd-446c-bca5-1e13269560bd` | Custom |
| `add69bfc-edc7-40a4-ba5e-5f0107c3b3ac` | Custom |
| `b69669b0-effb-4568-9862-7d82f3391170` | Custom |
| `bf41a31e-7619-42c2-aa34-5f434d16dd5f` | Custom |
| `c853ac0b-2175-4d1d-8396-8f866d1ba821` | Custom |
| `c97d21d3-d79d-4df8-9230-bb33fa805f4e` | Custom |
| `de1e1fd9-6056-4d89-8c49-5c3907ab694f` | Custom |
| `deb1c8c1-ec5e-42d3-9d0f-4d108a3c612c` | Custom |
| `e09369ec-150b-40b0-abd5-841ca383d7fa` | Custom |

### Other UUIDs from asm_107.dll (Main App)

| UUID | Notes |
|------|-------|
| `3fc55f44-f617-480c-bf9e-fcc8c42a0fed` | App-internal |
| `c2d63d3e-83cc-4f3e-ab1d-692f9324c72c` | App-internal |

### UUIDs from asm_130.dll (UI/Resources)

| UUID | Notes |
|------|-------|
| `613a31e8-bd8a-11e7-73bd-007c928ca240` | App-internal |
| `a154e9ce-bd8a-11e7-72e4-007c928ca240` | App-internal |

## Java Layer Operations (BLEDroidManager.java)

The Java layer is a thin GATT callback bridge. All BLE events are forwarded to .NET:

| Callback | Data |
|----------|------|
| `onConnectionStateChange()` | Status code (int) |
| `onCharacteristicRead()` | UUID + byte array |
| `onCharacteristicWrite()` | UUID + status code |
| `onCharacteristicChanged()` | UUID + byte array (unsolicited notification) |
| `onDescriptorRead/Write()` | Descriptor data |
| `onMtuChanged()` | MTU size (int) |
| `onReadRemoteRssi()` | Signal strength (dBm) |
| `onServicesDiscovered()` | Status code (int) |

## UUID Labeling Status

**The 25+ custom UUIDs cannot be labeled from Java decompilation alone.**

All UUID constants and characteristic-to-function mappings live in compiled .NET assemblies embedded in the APK (`dk.resound.smart3d.apk` → `assets/assemblies/`). The key assemblies are:
- `asm_110.dll` (96KB) — core BLE manager, `CharacteristicsToUUID`, `BLEManagerData`
- `asm_111.dll` — `GattCharacteristic`, `HearingAidProfileProxy`
- `asm_112.dll` — `BLEHearingInstrumentProvider`, `BLEInvoker`

To label these UUIDs, the .NET assemblies must be decompiled with **dnSpy**, **ILSpy**, or **dotPeek**. See `docs/gaps_and_next_steps.md`.

## Notes
- ReSound uses Mono/.NET (Xamarin) — actual BLE logic lives in .NET assemblies, not Java
- The Java layer is a thin GATT callback bridge; UUID constants are not present in the DEX bytecode
- UUID `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87` appears in both ReSound and Philips, suggesting shared Demant/GN platform heritage
- The `e0262760` family is the signature GN Hearing proprietary BLE protocol
- 30+ unique UUIDs total — significantly more characteristics than other manufacturers
- Both ReSound and Starkey include the Vonage WebRTC SDK (telehealth); UUIDs `bb392ec0` (AOSP AEC) and `c06c8400` (AOSP Noise Suppressor) found in both APKs are Android audio effect UUIDs, NOT BLE
