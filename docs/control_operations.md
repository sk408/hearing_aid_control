# Hearing Aid BLE Control Operations Reference

How to use each discovered UUID to control hearing aids: known parameters,
value encodings, and inferred usage from app decompilation.

---

## How to Read This Document

For each characteristic:
- **Access**: R = Read, W = Write, N = Notify, I = Indicate, WNR = Write No Response
- **Values**: Concrete byte encodings where known; inferred/likely where noted
- **Source**: Whether encoding is confirmed from decompilation or inferred from context

---

## 1. Standard BLE Controls (All Manufacturers)

These are Bluetooth SIG–assigned characteristics. Behavior is standardized.

### Battery Level — `00002a19-0000-1000-8000-00805f9b34fb`
| Field | Value |
|-------|-------|
| Access | R, N |
| Type | uint8 |
| Range | 0–100 (percent) |
| Found in | Rexton (confirmed), likely all |

Subscribe via CCCD (`00002902`) to receive notifications when battery level changes.

### Device Information Service — `0000180a-0000-1000-8000-00805f9b34fb`
Standard BLE DIS. Characteristics within:

| Characteristic | UUID | Access | Value |
|---------------|------|--------|-------|
| Model Number | `00002a24` | R | UTF-8 string |
| Serial Number | `00002a25` | R | UTF-8 string |
| Firmware Revision | `00002a26` | R | UTF-8 string (e.g. "1.2.3") |
| Hardware Revision | `00002a27` | R | UTF-8 string |
| Software Revision | `00002a28` | R | UTF-8 string |
| Manufacturer Name | `00002a29` | R | UTF-8 string (e.g. "WS Audiology") |

### CCCD (Client Characteristic Configuration Descriptor) — `00002902-0000-1000-8000-00805f9b34fb`
| Field | Value |
|-------|-------|
| Access | R, W |
| Type | uint16 little-endian |
| 0x0000 | Disable notifications and indications |
| 0x0001 | Enable notifications |
| 0x0002 | Enable indications |

Write `0x0100` (little-endian) to enable notifications for any characteristic that
supports `N`. This is required before the device will push updates.

---

## 2. ASHA Service — `0000fdf0-0000-1000-8000-00805f9b34fb`

Google's Audio Streaming for Hearing Aids. Used by Philips, ReSound, and (via ASHA
wrapper) probably Rexton. This is the **primary audio streaming path** on Android.

### 2.1 Read Only Properties — `6333651e-c481-4a3e-9169-7c902aad37bb`
| Field | Value |
|-------|-------|
| Access | R |
| Type | struct (multi-byte) |

Byte layout:
```
Byte 0:    Version (0x01 for ASHA v1, 0x02 for v2)
Byte 1:    Device Capabilities bitmask
             Bit 0: Side (0 = left, 1 = right)
             Bit 1: CSIS supported (binaural set member)
             Bit 2-7: Reserved
Byte 2-3:  HiSyncId low (shared with partner device — must match for binaural pairing)
Byte 4-5:  HiSyncId high
Byte 6:    Feature Map
             Bit 0: Low-latency mode supported
             Bit 1: Reserved
Byte 7:    Render Delay (units: frames; only meaningful in v2)
Byte 8-9:  Codec IDs bitmask (uint16 LE)
             Bit 0: G.722 @ 16kHz (mandatory)
             Bit 1: LC3 (optional, ASHA v2+)
```

### 2.2 Audio Control Point — `f0d28fea-5d20-4087-84a8-6b6f2fb08de0`
| Field | Value |
|-------|-------|
| Access | W |
| Type | byte array |

Command format:
```
Byte 0: Opcode
  0x01 = Start
  0x02 = Stop
  0x03 = Status

Start command (opcode 0x01):
  Byte 1: Codec ID (0x01 = G.722)
  Byte 2: Audio Type (0x00 = unknown, 0x01 = ringtone, 0x02 = phone call, 0x03 = media)
  Byte 3: Volume (signed int8, -128 to 0; see Volume characteristic below)
  Byte 4: Other Device Connected (0x00 = no partner, 0x01 = partner connected)

Stop command (opcode 0x02):
  No additional bytes.

Status command (opcode 0x03):
  Byte 1: Other Device Status (0x00 = disconnected, 0x01 = connected)
```

### 2.3 Audio Status Point — `38663f1a-e711-488c-b1a2-4a7870e6a5e5`
| Field | Value |
|-------|-------|
| Access | R, N |
| Type | int8 |
| 0 | OK — ready for audio |
| -1 / 0xFF | Unknown disconnected |
| Other | Error codes |

Enable notification via CCCD before streaming.

### 2.4 Volume — `00e4ca9e-ab14-41e4-8823-f9e70c7e91df`
| Field | Value |
|-------|-------|
| Access | R, W |
| Type | int8 (signed byte) |
| Range | -128 to 0 |
| Mapping | Each step ≈ 0.375 dB; -128 = -48 dB (minimum), 0 = 0 dB (maximum) |

Android maps its 15-step volume scale to this range:
```
Android volume 0  → ASHA -128 (mute/min)
Android volume 15 → ASHA 0    (max)
```

Write the signed byte directly. Example: `-64` (0xC0) ≈ -24 dB (half volume).

### 2.5 LE PSM — `2d410339-82b6-42aa-b34e-e2e01df8cc1a` (ASHA v2 only)
| Field | Value |
|-------|-------|
| Access | R |
| Type | uint16 LE |

PSM value used to open L2CAP Connection-Oriented Channel (CoC) for audio.
Read this before calling `connectL2cap()`. PSM is dynamically assigned per
connection session.

**Audio L2CAP Stream format (after CoC is open)**:
```
Each 20ms audio packet:
  Byte 0:     Sequence Number (uint8, wraps 0–255, increment each frame)
  Bytes 1-N:  G.722 encoded audio data (160 bytes for 20ms @ 16kHz)
Total: 161 bytes per frame
```

---

## 3. Philips HearLink / Oticon — POLARIS Platform

Primary proprietary platform shared with Rexton/WSA.

### 3.1 Hi Service — `56772eaf-2153-4f74-acf3-4368d99fbf5a`

Container service. Discover this service first; all POLARIS characteristics
live within it.

### 3.2 Hi State — `83e28ff3-25ad-4bfe-aaf0-5a95dba4b56b`
| Field | Value |
|-------|-------|
| Access | R, N |
| Type | uint8 enum (inferred) |

Known/inferred state values (from Philips decompilation context):
```
0x00 = Disconnected / Off
0x01 = Connected / On
0x02 = Streaming
0x03 = Muted
0x04 = Pairing mode
```

Subscribe to notifications to track device state changes. Exact encoding TBD
from live capture — treat as opaque until confirmed.

### 3.3 Hi Id — `5f35c43d-e0f4-4da9-87e6-9719982cd25e`
| Field | Value |
|-------|-------|
| Access | R |
| Type | bytes (device identifier) |

Read-only unique device identifier. Used during pairing/bonding to distinguish
left from right hearing aid. Compare to Partner Id to verify binaural pairing.

### 3.4 Partner Id — `353ecc73-4d2c-421b-ac1c-8dcb35cd4477`
| Field | Value |
|-------|-------|
| Access | R |
| Type | bytes |

Identifies the binaural partner device. If `Hi Id` of device A matches `Partner Id`
of device B (and vice versa), they form a binaural pair.

### 3.5 Oble Volume — `50632720-4c0f-4bc4-960a-2404bdfdfbca`
| Field | Value |
|-------|-------|
| Access | R, W, N |
| Type | int8 (inferred, aligned with ASHA) |
| Range | -128 to 0 |

Very likely mirrors the ASHA volume encoding since Philips/Oticon implements ASHA.
Setting volume here mirrors the ASHA Volume characteristic write. Subscribe to
notifications to track user-initiated volume changes (e.g., from physical button
on the device).

Probable encoding:
```
0x00 = Maximum volume (0 dB)
0x80 = Minimum volume (-48 dB)
0xFF = -0.375 dB (one step below max)
```

### 3.6 Ear — `d28617fe-0ad5-40c5-a04a-bc89051ff755`
| Field | Value |
|-------|-------|
| Access | R |
| Type | uint8 |
| 0x00 | Unknown / monaural |
| 0x01 | Left ear |
| 0x02 | Right ear |

Read to determine which side this device represents before issuing directional commands.

### 3.7 Identifiers — `bdf8a334-1c7b-46e9-b4c2-800b8966136b`
| Field | Value |
|-------|-------|
| Access | R |
| Type | struct |

Contains manufacturer-assigned product identifiers. Likely includes:
```
Bytes 0-1: Manufacturer ID
Bytes 2-3: Product ID / Model number
Bytes 4+:  Serial or version info
```

### 3.8 Extended Feature — `34dfc7cb-5252-430b-ba6d-df2fe87914e7`
| Field | Value |
|-------|-------|
| Access | R, W |
| Type | uint16 or uint32 bitmask (inferred) |

Feature capability flags. Read first to determine which operations the device
supports. Writing enables/disables optional features. Bitmask positions TBD
from live capture.

### 3.9 Bonded Device Info Access — `6efab52e-3002-4764-9430-016cef4dfc87`
| Field | Value |
|-------|-------|
| Access | R, W |
| Type | struct |

Manages bonding information for paired devices. Shared with Rexton.

---

## 4. Rexton / WS Audiology — WSA Platform

Shares POLARIS service (section 3) plus two proprietary service families.

### 4.1 Terminal IO Service — `8b82105d-0f0c-40bb-b422-3770fa72a864`

Command/data channel. All sub-characteristics share the `8b82xxxx-0f0c-40bb-b422-3770fa72a864` pattern.

#### Data RX — `8b822409-0f0c-40bb-b422-3770fa72a864`
| Field | Value |
|-------|-------|
| Access | W, WNR |
| Type | byte array |

Write data payloads TO the hearing aid. Protocol is framed binary (TLV likely).
Must negotiate protocol via Protocol Choice before sending data.

#### Data TX — `8b82b999-0f0c-40bb-b422-3770fa72a864`
| Field | Value |
|-------|-------|
| Access | N |
| Type | byte array |

Subscribe to receive data FROM the hearing aid. Enable CCCD first.

#### Protocol Choice — `8b82cd2d-0f0c-40bb-b422-3770fa72a864`
| Field | Value |
|-------|-------|
| Access | R, W |
| Type | uint8 enum |

Selects the binary protocol variant in use:
```
0x01 = Protocol variant 1 (legacy)
0x02 = Protocol variant 2
(exact values TBD from live capture)
```

#### Ready for RX — `8b82a76f-0f0c-40bb-b422-3770fa72a864`
| Field | Value |
|-------|-------|
| Access | R, N |
| Type | uint8 |
| 0x00 | Not ready to receive |
| 0x01 | Ready to receive data |

Poll or subscribe. Do not write to Data RX until this reads 0x01.

#### Ready for TX — `8b82f3b9-0f0c-40bb-b422-3770fa72a864`
| Field | Value |
|-------|-------|
| Access | R, N |
| Type | uint8 |
| 0x00 | No data waiting |
| 0x01 | Data available to read |

#### Active Program Info — `8b8225e0-0f0c-40bb-b422-3770fa72a864`
| Field | Value |
|-------|-------|
| Access | R, N |
| Type | struct |

Inferred layout:
```
Byte 0: Active program index (0-based or 1-based)
Byte 1: Total number of programs available
Byte 2: Program flags/capabilities bitmask
Bytes 3+: Program name (UTF-8, null-terminated or length-prefixed)
```

Subscribe to receive notifications when the user manually switches programs.

#### Basic Control Command — `8b8276e8-0f0c-40bb-b422-3770fa72a864`
| Field | Value |
|-------|-------|
| Access | W |
| Type | byte array |

Simple device commands. Inferred format:
```
Byte 0: Command opcode
  0x01 = Set volume
  0x02 = Switch program
  0x03 = Mute / Unmute
  0x04 = Query device status

Volume command example:
  Byte 0: 0x01
  Byte 1: Volume value (int8, -128 to 0, aligned with ASHA)

Program switch example:
  Byte 0: 0x02
  Byte 1: Program index (0 = program 1, 1 = program 2, etc.)
```

*Encoding confirmed to use volume/program semantics from label; exact opcodes
need live capture verification.*

#### Configuration Check — `8b823656-0f0c-40bb-b422-3770fa72a864`
| Field | Value |
|-------|-------|
| Access | R, W |
| Type | struct |

Read to verify device configuration is valid (post-fitting). Write to trigger
configuration validation sequence.

### 4.2 Control / FAPI Service — `c8f7xxxx-21b2-45b8-87f8-bd49a13eff49`

Higher-level control and remote fitting API. More complex than Terminal IO.

#### Control Request — `c8f75466-21b2-45b8-87f8-bd49a13eff49`
| Field | Value |
|-------|-------|
| Access | W |
| Type | byte array (TLV or framed command) |

Write control commands to the device. Pair with Control Response subscription.

#### Control Response — `c8f70447-21b2-45b8-87f8-bd49a13eff49`
| Field | Value |
|-------|-------|
| Access | N |
| Type | byte array |

Receive responses to Control Request writes. Subscribe via CCCD before issuing commands.

#### Data Request — `c8f72804-21b2-45b8-87f8-bd49a13eff49`
#### Data Response — `c8f72fef-21b2-45b8-87f8-bd49a13eff49`
Similar to Control pair but for bulk data transfers (e.g., firmware data, configuration files).

#### Advanced Control Command — `c8f76c2c-21b2-45b8-87f8-bd49a13eff49`
| Field | Value |
|-------|-------|
| Access | W |
| Type | byte array |

Extended version of Basic Control Command supporting more complex operations.
Likely used for equalizer, noise reduction mode, directional microphone configuration.

#### App Data — `c8f714d6-21b2-45b8-87f8-bd49a13eff49`
Bidirectional application-layer data. Used for app-specific features not covered
by standard hearing aid commands.

#### Configuration File — `c8f76c20-21b2-45b8-87f8-bd49a13eff49`
Read/write audiologist-configured settings file. This is the full hearing aid
fitting configuration (gain curves, frequency bands, etc.). Do not modify without
understanding the format — incorrect values can impair hearing.

#### FB4H Data — `c8f73c59-21b2-45b8-87f8-bd49a13eff49`
FB4H is WS Audiology's fitting protocol. This characteristic transfers fitting
data between hearing aid and audiologist software. Read-only from user apps.

#### FAPI Request — `c8f723da-21b2-45b8-87f8-bd49a13eff49`
#### FAPI Response — `c8f7690c-21b2-45b8-87f8-bd49a13eff49`
| Field | Value |
|-------|-------|
| Access | W (request), N (response) |
| Type | byte array |

Fitting API (remote programming). Used by audiologist software for remote fitting
sessions. Not intended for user-facing apps — controls gain levels, compression,
feedback cancellation, etc. **Risk: misconfiguration can cause hearing damage.**

#### Programming Service — `c8f7a831-21b2-45b8-87f8-bd49a13eff49`
Manages firmware update and device programming sessions.

#### Identifiers — `c8f7eea2-21b2-45b8-87f8-bd49a13eff49`
Device identification info within the Control service context.

### 4.3 Bonding Service — `0a23ae62-c4c2-43d1-87b1-e8c83839a063`

Shared with Philips (see section 3.9). Manages device bonding/pairing.

#### Device Type Input — `62dcc92f-59c2-4228-9a11-c85f18773530`
| Field | Value |
|-------|-------|
| Access | W |
| Type | uint8 or uint16 |

Identify the connecting device type to the hearing aid during initial pairing:
```
0x00 = Unknown
0x01 = Android phone
0x02 = iPhone/iOS
0x03 = Tablet
```

#### Pairing State — `8e467a33-820e-40fa-8759-4cd7a197384d`
| Field | Value |
|-------|-------|
| Access | R, N |
| 0x00 | Not paired |
| 0x01 | Pairing in progress |
| 0x02 | Paired |
| 0x03 | Pairing failed |

Subscribe to track pairing state changes.

---

## 5. Starkey — Piccolo Protocol

Starkey uses a single service UUID with a proprietary binary protocol
instead of multiple labeled characteristics.

### 5.1 Piccolo Service — `9a04f079-9840-4286-ab92-e65be0885f95`

All communication happens through characteristics within this service.
The Piccolo protocol uses `ControlObjectId` enum values to target specific features.

### 5.2 Volume Controls (Piccolo ControlObjectId enum)

Commands are byte arrays written to the Piccolo write characteristic.
General command format (inferred from `PiccoloCommand` base class):
```
Byte 0:   Command type / category
Byte 1:   ControlObjectId
Byte 2-N: Value and parameters
```

| ControlObjectId | Function | Value Range (inferred) |
|-----------------|----------|----------------------|
| `MicrophoneVolume` | Main hearing aid amplification | 0–100 or signed -128–0 |
| `TinnitusVolume` | Tinnitus masker sound level | 0–100 |
| `StreamingVolume` | BLE/wireless audio stream volume | 0–100 |
| `AccessoryStreamingVolume` | External accessory (neckloop etc.) | 0–100 |
| `BalanceVolume` | Left/right balance | -50 to +50 (or 0–100 centered at 50) |

Piccolo responses (parsed by `PiccoloResponse.java`) include:
- ACK/NAK for command receipt
- Current value readback
- Device status updates
- Error codes

### 5.3 GATT Operations (from `IGattIo` interface)

Standard sequence for any Piccolo operation:
```
1. discoverServices() → confirm Piccolo service UUID present
2. requestMtu(512) → negotiate larger MTU for complex commands
3. writeCharacteristic(char, commandBytes, WRITE_TYPE_DEFAULT)
4. getOnCharacteristicChanged() → subscribe to response flow
```

---

## 6. ReSound (GN Hearing) — e0262760 Protocol

### 6.1 Primary Service — `e0262760-08c2-11e1-9073-0e8ac72ea010`

Container for GN proprietary characteristics.

### 6.2 e0262760 Characteristic Map

GN uses a numbered suffix scheme. Based on decompilation of BLE class names
(`BLEManagerData`, `CharacteristicsHandle`, `BLEInvoker`):

| UUID Suffix | Likely Role | Access |
|-------------|-------------|--------|
| `a011` | Device status / state | R, N |
| `a110` | Volume control | R, W, N |
| `a111` | Program / preset selection | R, W, N |
| `a112` | Streaming control | W |
| `a113` | Configuration / device settings | R, W |
| `a210` | Notifications / events | N |

*Encoding for `a110` (volume): likely signed byte aligned with ASHA (-128 to 0)
or an unsigned 0–100 scale. GN implements ASHA so system-level volume syncs
through that channel; `a110` may be the proprietary mirror.*

### 6.3 Custom Characteristics (inferred roles from class naming)

ReSound has 25+ custom UUIDs without labels in decompiled code. Based on
`BLEHearingInstrumentProvider`, `BLEManagerConnected`, `ServiceMultiplexId`:

| UUID | Inferred Role |
|------|---------------|
| `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87` | Shared platform service (also Philips) — device sync |
| `12257119-ddcb-4a12-9a08-1cd4df7921bb` | Likely: streaming audio config |
| `1959a468-3234-4c18-9e78-8daf8d9dbf61` | Likely: noise reduction mode |
| `497eeb9e-b194-4f35-bc82-36fd300482a6` | Likely: directional microphone |
| `53df4e1c-43e1-497e-8edf-589f48aafd9a` | Likely: tinnitus masker |
| `8b51a2ca-5bed-418b-b54b-22fe666aadd2` | Likely: battery / device status |
| `97c1c193-ea53-4312-9bd9-e52207d5e03d` | Likely: program / environment preset |
| `b69669b0-effb-4568-9862-7d82f3391170` | Likely: equalizer / sound profile |
| `de1e1fd9-6056-4d89-8c49-5c3907ab694f` | Likely: device pairing/bonding |

*These are inference-only. Definitive mapping requires live BLE capture.*

---

## 7. Common Operations: Step-by-Step Recipes

### 7.1 Volume Change (Any Manufacturer)

**Via ASHA (Philips, ReSound, Rexton):**
```
1. Write ASHA Audio Control Point — Start command with desired volume byte
   OR
   Write ASHA Volume characteristic directly (signed byte, -128 to 0)
2. Read back ASHA Volume to confirm
3. Subscribe to ASHA Volume notifications to track user button presses
```

**Via Rexton Terminal IO:**
```
1. Subscribe to Data TX (8b82b999) via CCCD
2. Read Ready for RX (8b82a76f) — wait for 0x01
3. Write Basic Control Command (8b8276e8): [0x01, volume_byte]
4. Receive confirmation on Data TX
```

**Via Starkey Piccolo:**
```
1. Subscribe to Piccolo characteristic notification
2. Write command bytes: [opcode, MicrophoneVolume_id, value_byte]
3. PiccoloResponse confirms new volume
```

### 7.2 Program / Preset Selection

**Via Rexton Terminal IO:**
```
1. Read Active Program Info (8b8225e0) to get current program and total count
2. Write Basic Control Command: [0x02, target_program_index]
3. Subscribe to Active Program Info notifications to confirm switch
```

**Via Rexton FAPI / Control Service:**
```
1. Subscribe to Control Response (c8f70447)
2. Write Control Request (c8f75466): program selection command
3. Read response from Control Response notification
```

**Via Bluetooth SIG HAP (if device supports it):**
```
1. Read Hearing Aid Features (0x1854 service) to check opcode support
2. Write Hearing Aid Preset Control Point: [SET_ACTIVE_PRESET opcode, index]
3. Read Active Preset Index to confirm
```

### 7.3 Binaural Left/Right Identification

**POLARIS (Philips + Rexton):**
```
1. Read Ear characteristic (d28617fe) — 0x01 = left, 0x02 = right
2. Read Hi Id (5f35c43d) and Partner Id (353ecc73) to verify pairing
3. Both devices must have matching HiSyncId in ASHA Read Only Properties
```

**ASHA (any manufacturer):**
```
Read ASHA Read Only Properties byte 1, bit 0:
  0 = left device
  1 = right device
```

### 7.4 Discovering Available Programs

**Rexton:**
```
1. Read Active Program Info (8b8225e0): byte 1 = total programs
2. Program names may require querying via Control Request
```

**Bluetooth SIG HAP:**
```
1. Write Read Presets Request to Preset Control Point: [opcode, start=1, count=255]
2. Receive preset records via notifications (one per notification)
3. Collect all records; last notification has "IsLast" flag set
```

### 7.5 Audio Streaming Start Sequence (ASHA)

Full sequence to initiate ASHA audio streaming:
```
1. Connect to hearing aid BLE device
2. Discover services — find ASHA service (0xFDF0)
3. Read ASHA Read Only Properties — extract HiSyncId, codec support, side, LE_PSM
4. If ASHA v2: read LE PSM characteristic to get L2CAP PSM value
5. Subscribe to Audio Status Point (CCCD → 0x0001)
6. Open L2CAP CoC: connectL2cap(device, psm, secured=true)
7. Wait for Audio Status Point notification: 0x00 = ready
8. Write Audio Control Point: [0x01, codec=0x01, type=0x03, volume, other_device_status]
9. Begin sending 161-byte audio frames every 20ms:
   [sequence_number, 160_bytes_g722_data]
10. To stop: write Audio Control Point [0x02]
11. Close L2CAP CoC
```

---

## 8. Safety Notes

- **FAPI / Fitting API** (Rexton `c8f7xxxx` FAPI characteristics, Configuration File):
  These control audiologist-configured gain levels. Incorrect values can reduce
  hearing aid effectiveness or cause discomfort. Read-only unless you are implementing
  authorized audiologist tooling.

- **Volume limits**: Physical hearing damage is possible if volume is set to maximum
  in a poorly fitted device. Stay within ASHA range (-128 to 0) and provide user-facing
  limits.

- **Firmware update characteristics** (Rexton Programming Service `c8f7a831`):
  Do not write to these outside of a valid firmware update flow. Interrupted firmware
  writes can brick the device.

- **All writes require BLE encryption** (bonded connection). Never attempt to write
  control characteristics on an unencrypted connection.
