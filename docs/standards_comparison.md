# Hearing Aid Standards Comparison
## Proprietary BLE Protocols vs Google ASHA, Apple MFi, and Bluetooth SIG HAP

---

## Overview of Standards

| Standard | Body | Bluetooth | Platform | Audio Codec | Status |
|----------|------|-----------|----------|-------------|--------|
| **ASHA v1** | Google | BLE 4.2+ | Android 9+ | G.722 16kHz | Deployed, widely adopted |
| **ASHA v2** | Google | BLE 4.2+ | Android 10+ | G.722 + LC3 | Deployed |
| **MFi HAP** | Apple | BLE (custom) | iOS 7+ | Proprietary | Deployed, NDA spec |
| **BT SIG HAP** | Bluetooth SIG | BLE 5.2+ | Any | LC3 (LE Audio) | 2023+, limited devices |
| **BT SIG VCS** | Bluetooth SIG | BLE 5.0+ | Any | N/A (metadata) | Deployed with HAP |
| **POLARIS** | Demant/WS Audiology | BLE 4.2+ | iOS + Android | Proprietary | Deployed (Philips, Rexton, Oticon) |
| **GN e0262760** | GN Hearing | BLE | iOS + Android | Proprietary | Deployed (ReSound) |
| **Piccolo** | Starkey | BLE | iOS + Android | Proprietary | Deployed |

---

## 1. Google ASHA (Audio Streaming for Hearing Aids)

### Service Structure

| UUID | Role |
|------|------|
| `0000fdf0-0000-1000-8000-00805f9b34fb` | ASHA Service (16-bit: 0xFDF0) |
| `6333651e-c481-4a3e-9169-7c902aad37bb` | Read Only Properties |
| `f0d28fea-5d20-4087-84a8-6b6f2fb08de0` | Audio Control Point |
| `38663f1a-e711-488c-b1a2-4a7870e6a5e5` | Audio Status Point |
| `00e4ca9e-ab14-41e4-8823-f9e70c7e91df` | Volume |
| `2d410339-82b6-42aa-b34e-e2e01df8cc1a` | LE PSM (v2 only) |

### Control Surface

| Control | Mechanism | Encoding |
|---------|-----------|----------|
| Volume | Write to Volume characteristic | int8, -128 to 0 (0 = max, -128 = -48 dB) |
| Start streaming | Write Audio Control Point opcode 0x01 | + codec ID, audio type, volume, partner status |
| Stop streaming | Write Audio Control Point opcode 0x02 | no params |
| Side (L/R) | Read Read Only Properties byte 1 bit 0 | 0=left, 1=right |
| Codec | Read Read Only Properties bytes 8-9 | bitmask: bit0=G.722, bit1=LC3 |
| Binaural sync | ASHA HiSyncId (bytes 2-5 of RO Properties) | shared uint32 between paired devices |

### Audio Streaming Architecture
- Audio sent over L2CAP Connection-Oriented Channel (CoC), NOT GATT
- 161 bytes per 20ms frame (1 sequence byte + 160 bytes G.722)
- Minimum MTU/MPS: 167 bytes
- Separate BLE connections to left and right devices
- Synchronization via matching sequence numbers

### What ASHA Does NOT Expose
- Program/preset switching (no opcode for it)
- Equalizer control
- Directional microphone configuration
- Noise reduction settings
- Tinnitus masker
- Battery level (separate standard BLE Battery Service)
- Streaming to non-phone sources without app involvement

### Android AOSP Implementation

**Source tree path (AOSP):**
```
packages/modules/Bluetooth/
  android/app/src/com/android/bluetooth/hearingaid/
    HearingAidService.java        — Main service, state mgmt, audio routing
    HearingAidStateMachine.java   — Per-device state machine (Disconnected → Connected → Streaming)
    HearingAidNativeInterface.java — JNI bridge to Fluoride C++ stack
```

**BluetoothHearingAid profile API (framework/base):**
```java
BluetoothHearingAid ha = (BluetoothHearingAid) adapter.getProfileProxy(ctx,
    listener, BluetoothProfile.HEARING_AID);

ha.connect(device);
ha.disconnect(device);
ha.getActiveDevices();      // [leftDevice, rightDevice], null if inactive
ha.adjustVolume(AudioManager.ADJUST_RAISE);   // one step up
ha.adjustVolume(AudioManager.ADJUST_LOWER);   // one step down
ha.adjustVolume(AudioManager.ADJUST_MUTE);    // mute
ha.adjustVolume(AudioManager.ADJUST_UNMUTE);  // unmute
ha.getConnectedDevices();
ha.getConnectionState(device); // STATE_CONNECTED, STATE_CONNECTING, etc.
```

**Volume sync:** Android maps its 0–15 volume scale to ASHA's -128..0 range automatically.
`EXTRA_VOLUME_CHANGE_SIDE` in broadcast intent indicates which ear changed.

**State machine transitions:**
```
DISCONNECTED → CONNECTING → CONNECTED → DISCONNECTING → DISCONNECTED
                                 ↕
                             STREAMING (audio active)
```

**Profile constants:**
```java
BluetoothHearingAid.SIDE_LEFT   = 1
BluetoothHearingAid.SIDE_RIGHT  = 2
BluetoothHearingAid.MODE_BINAURAL  = 0  (both connected)
BluetoothHearingAid.MODE_MONAURAL  = 1  (single device)
```

---

## 2. Apple MFi Hearing Aid Protocol (HAP)

### Service UUID
- `7d74f4bd-c74a-4431-862c-cce884371592` — MFi HAP / Hearing Aid profile service

### Control Surface

Apple's MFi spec is under NDA, but iOS exposes these capabilities to apps:

| Control | iOS API | Notes |
|---------|---------|-------|
| Volume (L/R) | `AVAudioSession` + `MFiHearingDevice` | Independent left/right |
| Preset selection | `MFiHearingDevice.presets` | Named environment presets |
| Battery | `MFiHearingDevice.batteryLevel` | 0.0–1.0 float |
| Streaming | Automatic via `AVAudioSession.setCategory(.playAndRecord)` | |
| Device info | `MFiHearingDevice.name`, `.manufacturer` | |

**iOS Accessibility API (public, iOS 12+):**
```swift
// Requires "Made for iPhone" entitlement OR accessibility MFi
let hearingDevices = AVAudioSession.sharedInstance().availableInputs?
    .filter { $0.portType == .bluetoothHFP }

// Preset control (hearing aid specific)
// AccessibilityHearingAidBLECharacteristicUUID — advertised in CoreBluetooth scan
```

### How Apple HAP Compares to ASHA

| Aspect | ASHA (Google) | Apple MFi |
|--------|---------------|-----------|
| Spec availability | Public (AOSP) | NDA required (MFi) |
| Preset/program control | Not in spec | Yes, named presets |
| Binaural sync | Sequence numbers | Proprietary |
| Volume range | -128 to 0 signed byte | Device-specific |
| Direct BLE access | Yes (app can use GATT) | No (MFi-licensed apps only) |
| Audio codec | G.722 (open) | Proprietary |
| Latency target | 20–40ms | < 20ms claimed |
| OS version | Android 9+ | iOS 7+ |
| Certification required | No | Yes (MFi program, ~$99/yr + hardware) |

---

## 3. Bluetooth SIG Hearing Access Profile (HAP)

### Service UUIDs

| UUID | Service |
|------|---------|
| `0x1854` | Hearing Access Service (HAS) |
| `0x1844` | Volume Control Service (VCS) |
| `0x1845` | Volume Offset Control Service (VOCS) |
| `0x1843` | Audio Input Control Service (AICS) |
| `0x184E` | Audio Stream Control Service (ASCS) |
| `0x1846` | Coordinated Set Identification Service (CSIS) |

### Hearing Access Service (HAS) Characteristics

| Characteristic | UUID | Access | Purpose |
|---------------|------|--------|---------|
| Hearing Aid Features | `0x2BDA` | R | Bitmask: supported opcodes and capabilities |
| Hearing Aid Preset Control Point | `0x2BDB` | W, N/I | Preset CRUD operations |
| Active Preset Index | `0x2BDC` | R, N | Currently active preset (1-based index) |

**Hearing Aid Features bitmask:**
```
Bit 0: Hearing Aid Type (0=binaural, 1=monaural, 2=banded)
Bit 1: Preset Synchronization supported (sync presets between L/R)
Bit 2: Independent Presets (L and R can have different active presets)
Bit 3: Dynamic Presets (presets can change at runtime)
Bit 4: Writable Presets (preset names can be modified by client)
```

**Preset Control Point opcodes:**
```
0x01 = Read Presets Request      (args: StartIndex uint8, NumPresets uint8)
0x02 = Read Preset Response      (server→client notification: index + name)
0x03 = Preset Record Changed     (server→client: preset was added/changed/deleted)
0x04 = Write Preset Name         (args: Index uint8, Name UTF-8)
0x05 = Set Active Preset         (args: Index uint8)
0x06 = Set Next Preset           (no args — cycles forward)
0x07 = Set Previous Preset       (no args — cycles backward)
0x08 = Set Active Preset Synchronized (syncs L+R to same preset)
```

### Volume Control Service (VCS)

| Characteristic | UUID | Access | Description |
|---------------|------|--------|-------------|
| Volume State | `0x2B7D` | R, N | Volume_Setting (0–255) + Mute (0/1) + Change_Counter |
| Volume Control Point | `0x2B7E` | W | Opcodes: Relative Vol Down/Up, Unmute/Vol Down, Unmute/Vol Up, Set Absolute, Unmute, Mute |
| Volume Flags | `0x2B7F` | R | Bit 0: Setting persisted across power cycle |

**Volume Control Point opcodes:**
```
0x00 = Relative Volume Down     (decrease by one step)
0x01 = Relative Volume Up       (increase by one step)
0x02 = Unmute/Relative Volume Down
0x03 = Unmute/Relative Volume Up
0x04 = Set Absolute Volume      (args: Change_Counter uint8, Volume_Setting uint8 [0–255])
0x05 = Unmute
0x06 = Mute
```

Note: `Change_Counter` in Set Absolute Volume must match current `Change_Counter`
from Volume State to prevent race conditions. If it doesn't match, server returns
error code `0x80` (Invalid Change Counter).

**Volume encoding:** 0–255 (different from ASHA's -128..0 signed byte).
```
0   = minimum volume (approximately silent)
255 = maximum volume (approximately 0 dB)
```

### Audio Stream Control Service (ASCS) — LE Audio

Replaces L2CAP CoC from ASHA with isochronous streams (BIS/CIS).
Requires Bluetooth 5.2+ with LE Audio support.

```
ASE Control Point opcode sequence to start streaming:
0x01 = Codec Config
0x02 = QoS Config
0x03 = Enable
0x04 = Receiver Start Ready
0x05 = Disable
0x06 = Receiver Stop Ready
0x07 = Update Metadata
0x08 = Release
```

---

## 4. Proprietary vs Standard: Feature Matrix

| Feature | ASHA | Apple MFi | BT SIG HAP | Philips POLARIS | Rexton WSA | Starkey Piccolo | ReSound GN |
|---------|------|-----------|------------|----------------|------------|-----------------|------------|
| **Volume control** | ✓ signed byte | ✓ | ✓ 0–255 VCS | ✓ Oble Vol | ✓ Terminal IO + POLARIS | ✓ ControlObjectId | ✓ a110 |
| **L/R identification** | ✓ bit in RO Props | ✓ | ✓ CSIS | ✓ Ear char | ✓ Ear char (shared) | inferred | inferred |
| **Binaural sync** | ✓ HiSyncId + seq# | ✓ | ✓ CSIS | ✓ Partner Id | ✓ Partner Id | inferred | inferred |
| **Program/preset switch** | ✗ | ✓ | ✓ HAP opcodes | limited | ✓ Active Program | ✓ Piccolo | inferred a111 |
| **Preset naming** | ✗ | ✓ | ✓ Write Preset Name | ✗ | inferred | inferred | ✗ |
| **Battery level** | ✗ (separate BAS) | ✓ | ✗ (separate BAS) | ✓ via BAS | ✓ via BAS + Bonding svc | ✗ | ✗ |
| **Streaming audio** | ✓ L2CAP G.722 | ✓ | ✓ LE Audio LC3 | ✓ via ASHA | ✓ via ASHA | proprietary | ✓ via ASHA |
| **Tinnitus masker vol** | ✗ | ✗ | ✗ | ✗ | inferred | ✓ explicit | inferred |
| **Balance (L/R)** | ✗ | ✗ | ✗ (VOCS) | ✗ | ✗ | ✓ explicit | ✗ |
| **Accessories volume** | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ explicit | ✗ |
| **Noise reduction mode** | ✗ | ✗ | ✗ | ✗ | inferred (Advanced Cmd) | inferred | inferred |
| **Directional mic** | ✗ | ✗ | ✗ | ✗ | inferred (Advanced Cmd) | inferred | inferred |
| **Remote fitting** | ✗ | ✗ | ✗ | ✗ | ✓ FAPI/FB4H | ✗ | ✗ |
| **Device info** | ✗ (DIS) | ✓ | ✓ | ✓ Identifiers | ✓ Identifiers | ✗ | ✓ DIS |
| **Mute** | via volume -128 | ✓ | ✓ VCS opcode 0x06 | inferred | inferred | inferred | inferred |
| **App open-source** | ✓ AOSP | ✗ | N/A (spec public) | ✗ | ✗ | ✗ | ✗ |
| **Requires certification** | ✗ | ✓ (MFi) | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 5. Volume Encoding Across Standards

This is the most critical interoperability concern — each standard uses a different scale:

| Standard | Type | Min | Max | Scale |
|----------|------|-----|-----|-------|
| **ASHA** | int8 | -128 | 0 | -48 dB to 0 dB, 0.375 dB/step |
| **BT SIG VCS** | uint8 | 0 | 255 | vendor-defined mapping |
| **Android API** | int | 0 | 15 | Android volume steps |
| **Starkey Piccolo** | uint8 (inferred) | 0 | 100 | percent (inferred) |
| **Philips POLARIS** | int8 (inferred) | -128 | 0 | mirrors ASHA |
| **Rexton WSA** | int8 (inferred) | -128 | 0 | mirrors ASHA |
| **ReSound GN** | unknown | ? | ? | likely ASHA-aligned |

**Conversion formulas:**
```
ASHA to VCS:
  vcs = round((asha + 128) * 255 / 128)

VCS to ASHA:
  asha = round(vcs * 128 / 255) - 128

ASHA to Android (0–15 steps):
  android = round((asha + 128) * 15 / 128)
```

---

## 6. What Google AOSP Exposes vs What Is App-Accessible

### AOSP System (privileged / signature permission)
- `BLUETOOTH_PRIVILEGED` permission required for most `BluetoothHearingAid` methods
- Handles: L2CAP audio streaming, codec negotiation, connection parameter optimization,
  volume sync between OS volume and ASHA Volume characteristic
- `adjustVolume()` is system-only; third-party apps use `AudioManager` which routes through OS

### Apps (no special permission, Android 12+)
- Scan for hearing aid devices: `BluetoothLeScanner` with ASHA service UUID filter
- Connect via GATT: `BluetoothDevice.connectGatt()` — works without special permissions
- Read/write characteristics: standard `BluetoothGatt` API
- Proprietary UUIDs are fully accessible via GATT if device is bonded

### Key gap: Direct Audio
Third-party apps **cannot** directly stream audio over ASHA L2CAP CoC — the OS owns that
channel. Apps can only control volume via `AudioManager`, which the OS then propagates to
the hearing aid. To stream custom audio to hearing aids, apps must route through the
Android audio stack (MediaPlayer, AudioTrack, etc.) rather than direct ASHA writes.

---

## 7. Protocol Relationships and Shared Heritage

```
POLARIS Platform (Demant Group)
  ├── Philips HearLink (Demant OEM)
  │     ├── Hi Service (56772eaf)
  │     ├── ASHA streaming
  │     └── MFi HAP service (7d74f4bd)
  └── Rexton / Signia / Widex (WS Audiology)
        ├── Hi Service (56772eaf)  ←── SAME as Philips
        ├── Terminal IO (8b82xxxx) ←── WSA addition
        ├── Control/FAPI (c8f7xxxx)←── WSA addition
        └── ASHA streaming

GN Hearing Platform
  └── ReSound
        ├── GN e0262760 family
        ├── ASHA streaming
        ├── MFi HAP (7d74f4bd)
        └── Shared UUID (24e1dff3) also found in Philips
               ↑ suggests common Demant-GN licensing heritage

Starkey
  └── Independent (Piccolo protocol)
        ├── Not ASHA
        └── Proprietary L2CAP or GATT streaming
```

**Key implication:** A single POLARIS-targeting implementation will work on both
Philips HearLink and Rexton (and likely Oticon, Bernafon, and other Demant brands).
The shared Hi Service UUID is the discovery anchor.

---

## 8. Recommended Control Strategy by Manufacturer

### Android (all ASHA-capable manufacturers)
Use the Android `BluetoothHearingAid` API for volume — it handles ASHA internally
and is the most reliable path. Use proprietary characteristics only for features
ASHA doesn't expose (programs, tinnitus, balance).

### Volume
| Manufacturer | Primary | Fallback |
|-------------|---------|---------|
| Philips | ASHA Volume or Oble Volume (`50632720`) | Android API |
| Rexton | ASHA Volume → Terminal IO Basic Control | Android API |
| ReSound | ASHA Volume → e0262760 a110 | Android API |
| Starkey | Piccolo MicrophoneVolume command | Android API |

### Program Selection
| Manufacturer | Characteristic | Notes |
|-------------|---------------|-------|
| Rexton | Active Program Info (`8b8225e0`), Basic Control (`8b8276e8`) | Read count first |
| Philips | Likely via Extended Feature (`34dfc7cb`) or separate char | TBD from live capture |
| ReSound | Likely e0262760 a111 | TBD from live capture |
| Starkey | Piccolo program command | ControlObjectId-based |
| Any SIG HAP | Preset Control Point (`0x2BDB`) | Most interoperable |

### iOS / Apple
On iOS, ASHA is not supported. Use:
1. MFi HAP service (`7d74f4bd`) if the device is MFi-certified (requires entitlement)
2. Proprietary characteristics via CoreBluetooth (POLARIS, GN, etc.) — fully accessible
3. For standard control, target BT SIG HAP characteristics where available
