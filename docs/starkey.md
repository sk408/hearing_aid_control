# Starkey — BLE Protocol Reference

## Source
- APK: Starkey v2.1.0
- Platform: Native Android/Kotlin
- Protocol: "Piccolo" (binary command protocol over BLE)
- Decompiled with: JADX

## Key Source Files
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/GattConsolidationDispatcherKt.java` — Primary service/characteristic UUID definitions
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/HearingInstrumentProfile.java` — HIP service characteristic UUIDs
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/SSI.java` — Streaming Serial Interface UUIDs
- `jadx_output/starkey/sources/com/starkey/connectivity/able/Connection.java` — Piccolo characteristic lookup (primary + fallback)
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloCommand.java`
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloDispatcher.java` (28KB)
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloResponse.java` (138KB)
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/ControlObjectId.java`
- `jadx_output/starkey/sources/com/starkey/connectivity/able/peripheral/gatt/IGattIo.java`
- `jadx_output/starkey/sources/com/starkey/connectivity/able/peripheral/gatt/IGattKt.java` (50KB)

---

## GATT Service Structure

### 1. HA Configuration Service (GattConsolidationDispatcher)
Service UUID: `48ddf118-efd0-48fc-8f44-b9b8e17be397`

Source: `GattConsolidationDispatcherKt.java`

| UUID | Field Name | Access | Function |
|------|-----------|--------|----------|
| `6401a620-89c5-4135-b4af-ea1c2e1ce524` | Control_Point | Write | Send commands to device |
| `38278651-76d7-4dee-83d8-894f3fa6bb99` | Data_Source | Read/Notify | Receive responses from device |
| `26ddeaca-a73c-4b61-a1de-87c5375b2706` | Feature_Support | Read | Query supported HAConfigID feature set |

`Feature_Support` returns a `FeatureSupportResponse` bitfield checked against `HAConfigID.values()`.

### 2. Piccolo Protocol Characteristics
Likely under service `9a04f079-9840-4286-ab92-e65be0885f95` (Piccolo Service — confirmed from ble_reference).

Source: `Connection.java` lines 595–600

| UUID | Role | Notes |
|------|------|-------|
| `a287a5f9-0fa3-bc84-2a41-c9da6d85bd4e` | Primary Piccolo characteristic | Read/Write/Notify — tried first |
| `37a691f4-7686-4280-caca-fba8b44b9360` | Fallback Piccolo characteristic | Read/Write/Notify — used if primary not found |

The fallback mechanism: app tries to get `a287a5f9`; if null, falls back to `37a691f4`. This likely reflects a version difference between hearing aid firmware generations.

### 3. Hearing Instrument Profile (HIP) Service
Source: `HearingInstrumentProfile.java`

| UUID | Field Name | Access | Function |
|------|-----------|--------|----------|
| `896c9932-d4ea-11e1-af55-58b035fea743` | haIDChar | Read | Hearing aid unique identifier |
| `896c98ba-d4ea-11e1-af52-58b035fea743` | haInfoChar | Read | HA info (shared with SSI service) |
| `896c9950-d4ea-11e1-af56-58b035fea743` | otherHAIDChar | Read | Paired/contralateral HA identifier |
| `896c990a-d4ea-11e1-af54-58b035fea743` | sideChar | Read | Device side (Left / Right / WiCrosTx) |
| `896c96ee-d4ea-11e1-af46-58b035fea743` | versionsChar | Read | Firmware and hardware version info |
| `0b2be3d9-ba60-429f-b61a-e9b564167c97` | wicrossDeviceType | Read | WiCross device type identifier |
| `00002a29-0000-1000-8000-00805f9b34fb` | manufacturerChar | Read | Standard BLE Manufacturer Name String |

### 4. SSI (Streaming Serial Interface) Service
Source: `SSI.java`

| UUID | Field Name | Access | Function |
|------|-----------|--------|----------|
| `5446e255-d711-11e4-b9d6-1681e6b88ec1` | ssiNextLongChar | Read/Notify | Next long SSI data packet |
| `5446e448-d711-11e4-b9d6-1681e6b88ec1` | ssiLastLongChar | Read/Notify | Last long SSI data packet |
| `896c98ba-d4ea-11e1-af52-58b035fea743` | haInfoChar | Read | HA info (shared with HIP) |
| `5446fb18-d711-11e4-b9d6-1681e6b88ec1` | streamingEnableChar | Write | Enable/disable SSI streaming |
| `60fb6208-9b02-468e-aba8-b702dd6f543a` | batteryLevelMorseChar | Read/Notify | Battery level (Morse-coded notation) |
| `5446ea24-d711-11e4-b9d6-1681e6b88ec1` | associatedDevListChar | Read/Notify | Associated device list |

### 5. Accessories Service
Source: `com/starkey/device/features/accessories/a.java`

Overlaps with SSI UUID family (`5446xxxx`).

| UUID | Field | Access | Function |
|------|-------|--------|----------|
| `5446ea24-d711-11e4-b9d6-1681e6b88ec1` | f11384c (status) | Read | Accessory status |
| `5446fb18-d711-11e4-b9d6-1681e6b88ec1` | f11385d (controlPoint) | Write | Accessory control commands |
| `5446e63c-d711-11e4-b9d6-1681e6b88ec1` | f11386e | Write | Secondary accessory write |

### 6. Tinnitus Configuration
Source: `com/starkey/ap/k.java`

| UUID | Field Name | Access | Function |
|------|-----------|--------|----------|
| `5446daa2-d711-11e4-b9d6-1681e6b88ec1` | tinnitusConfigChar | Read/Write/Notify | Tinnitus masker settings |

### 7. E2E Notification Service
Source: `com/starkey/vl/a.java`

Service UUID: `5446ec0e-d711-11e4-b9d6-1681e6b88ec1`

| UUID | Function |
|------|----------|
| `0990d720-893f-4365-b03c-0718186506f9` | E2E notification channel 1 |
| `a0370d1b-e805-4dda-b41a-1f011d2a4a7a` | E2E notification channel 2 |

### 8. Voice Assistant / GASS Service
Source: `com/starkey/device/features/smartassistant/voiceassistant/c.java`

| UUID | Field | Access | Function |
|------|-------|--------|----------|
| `b5a0badd-7739-4712-8804-a60a0ed9bdec` | f15340d (statusPoint) | Notify | Voice assistant status updates |
| `c43b2a46-e802-4ea4-81b1-97987cd33b1c` | f15341e (controlPoint) | Write/Notify | Send voice/audio commands |
| `7de95c7f-12de-40a9-b77c-6712da671217` | f15342f/f15343g (audioSourceEnable) | Notify | Audio source enable/control |
| `d0b6dc42-03c8-457a-a347-ade8d1c4e98d` | (unnamed) | — | Unknown — result discarded in constructor |
| `84f9e90a-884a-4bb3-85f2-e77399189874` | (unnamed) | — | Unknown — result discarded in constructor |

### 9. Smart Reminders
Source: `com/starkey/on/b.java`

| UUID | Function |
|------|----------|
| `985c6f7d-ac66-445a-b65e-573fc0d72f46` | Put-on hearing aid toggle reminder |
| `ae1badbf-a989-4d02-bbe8-25cb10254202` | Self-check reminder toggle |

---

## Piccolo Protocol

### Architecture
- Binary command/response protocol over BLE GATT characteristics
- `PiccoloCommand` — base class for all commands (byte arrays)
- `PiccoloDispatcher` — sends commands, manages request/response flow
- `PiccoloResponse` — parses responses (138KB — extensive type hierarchy)

### Control Object IDs
The `ControlObjectId` enum defines controllable hearing aid features:

| Control Object | Function |
|---------------|----------|
| MicrophoneVolume | Main hearing aid volume |
| TinnitusVolume | Tinnitus masker volume |
| StreamingVolume | Audio streaming volume |
| AccessoryStreamingVolume | External accessory volume |
| BalanceVolume | Left/right balance |

### GATT Operations (from IGattIo interface)

```
discoverServices() → Response.OnServicesDiscovered
getService(UUID) → BluetoothGattService
getServices() → List<BluetoothGattService>
readCharacteristic(characteristic) → Response.OnCharacteristicRead
writeCharacteristic(characteristic, data, writeType) → Response.OnCharacteristicWrite
setCharacteristicNotification(characteristic, enabled) → boolean
getOnCharacteristicChanged() → Flow<OnCharacteristicChanged>
readDescriptor(descriptor) → Response.OnDescriptorRead
writeDescriptor(descriptor, data) → Response.OnDescriptorWrite
requestMtu(int mtu) → Response.OnMtuChanged
readRemoteRssi() → Response.OnReadRemoteRssi
getDeviceMacAddress() → String
```

---

## UUID Summary Table

| UUID | Service | Function |
|------|---------|----------|
| `9a04f079-9840-4286-ab92-e65be0885f95` | — | Piccolo Service (previously documented) |
| `48ddf118-efd0-48fc-8f44-b9b8e17be397` | HA Config Service | GattConsolidationDispatcher service |
| `6401a620-89c5-4135-b4af-ea1c2e1ce524` | HA Config | Control_Point (Write) |
| `38278651-76d7-4dee-83d8-894f3fa6bb99` | HA Config | Data_Source (Notify) |
| `26ddeaca-a73c-4b61-a1de-87c5375b2706` | HA Config | Feature_Support (Read) |
| `a287a5f9-0fa3-bc84-2a41-c9da6d85bd4e` | Piccolo | Primary Piccolo characteristic |
| `37a691f4-7686-4280-caca-fba8b44b9360` | Piccolo | Fallback Piccolo characteristic |
| `896c9932-d4ea-11e1-af55-58b035fea743` | HIP | Hearing Aid ID |
| `896c98ba-d4ea-11e1-af52-58b035fea743` | HIP/SSI | HA Info (shared) |
| `896c9950-d4ea-11e1-af56-58b035fea743` | HIP | Other HA ID |
| `896c990a-d4ea-11e1-af54-58b035fea743` | HIP | Side (L/R) |
| `896c96ee-d4ea-11e1-af46-58b035fea743` | HIP | Versions |
| `0b2be3d9-ba60-429f-b61a-e9b564167c97` | HIP | WiCross Device Type |
| `5446e255-d711-11e4-b9d6-1681e6b88ec1` | SSI | Next SSI Packet (Notify) |
| `5446e448-d711-11e4-b9d6-1681e6b88ec1` | SSI | Last SSI Packet (Notify) |
| `5446fb18-d711-11e4-b9d6-1681e6b88ec1` | SSI/Accessories | Streaming Enable / Accessory Control |
| `60fb6208-9b02-468e-aba8-b702dd6f543a` | SSI | Battery Level (Morse) |
| `5446ea24-d711-11e4-b9d6-1681e6b88ec1` | SSI/Accessories | Associated Devices / Accessory Status |
| `5446e63c-d711-11e4-b9d6-1681e6b88ec1` | Accessories | Secondary Accessory Write |
| `5446daa2-d711-11e4-b9d6-1681e6b88ec1` | Tinnitus | Tinnitus Config (R/W/Notify) |
| `5446ec0e-d711-11e4-b9d6-1681e6b88ec1` | — | E2E Notification Service |
| `0990d720-893f-4365-b03c-0718186506f9` | E2E | Notification Channel 1 |
| `a0370d1b-e805-4dda-b41a-1f011d2a4a7a` | E2E | Notification Channel 2 |
| `b5a0badd-7739-4712-8804-a60a0ed9bdec` | GASS | Voice Assistant Status (Notify) |
| `c43b2a46-e802-4ea4-81b1-97987cd33b1c` | GASS | Voice Assistant Control (Write) |
| `7de95c7f-12de-40a9-b77c-6712da671217` | GASS | Audio Source Enable (Notify) |
| `d0b6dc42-03c8-457a-a347-ade8d1c4e98d` | GASS | Unknown |
| `84f9e90a-884a-4bb3-85f2-e77399189874` | GASS | Unknown |
| `985c6f7d-ac66-445a-b65e-573fc0d72f46` | Reminders | Put-on HA Toggle |
| `ae1badbf-a989-4d02-bbe8-25cb10254202` | Reminders | Self-check Reminder Toggle |

---

## Notes
- Starkey uses a native Kotlin BLE stack (not Xamarin/.NET)
- The Piccolo protocol is a compact binary format — commands are byte arrays
- `PiccoloResponse.java` at 138KB has extensive response parsing with many message types
- Volume controls use `ControlObjectId` enum values to target specific features
- The `9a04f079` Piccolo Service has a primary/fallback characteristic pair — likely firmware version differences
- The `48DDF118` GattConsolidationDispatcher is a newer/parallel protocol path alongside Piccolo
- The `5446xxxx` UUID family covers SSI streaming, accessories, tinnitus, and E2E notifications
- The `896Cxxxx` family covers device identification and metadata (HIP)
- The app also includes Vonage WebRTC for telehealth audio (unrelated to hearing aid BLE)
