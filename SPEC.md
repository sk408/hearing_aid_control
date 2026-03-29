# Universal Hearing Aid Controller — Project Spec v1.0

**Status:** Pre-development  
**Date:** 2026-03-29  
**Source docs:** `C:\Projects\hearing_aid_control\docs\` (42 files, ~260KB of reverse-engineered protocol data)

---

## 1. Project Goal

Build a web app that connects to hearing aids from multiple manufacturers via Web Bluetooth and provides a unified control interface: volume, program switching, muting, balance, tinnitus control, battery status, and streaming.

**Target brands (in priority order):**
1. Philips / Oticon (POLARIS platform) — most protocol data confirmed
2. Rexton / WS Audiology (shared POLARIS + Terminal IO) — confirmed byte-level
3. Starkey (Piccolo protocol) — confirmed app-layer framing
4. ReSound / GN Hearing (GN proprietary + ASHA) — partial, needs .NET decompile

---

## 2. What We Know (Protocol Summary)

### 2.1 Philips / Oticon (POLARIS)

**Primary service:** `56772eaf-2153-4f74-acf3-4368d99fbf5a`

| Operation | UUID | Payload | Confidence |
|-----------|------|---------|-----------|
| Volume R/W | `50632720-4c0f-4bc4-960a-2404bdfdfbca` | `[levelByte, muteFlagByte]` mute=0 means muted | ✅ confirmed |
| Mute flag | same ^ | byte1: `0`=muted, `1`=unmuted | ✅ confirmed |
| Program select | `535442f7-0ff7-4fec-9780-742f3eb00eda` | `[(byte) targetProgram]` | ✅ confirmed |
| Program list | `68bfa64e-3209-4172-b117-f7eafce17414` | `[(byte) command]`, ready=255 | ⚠️ partial |
| Program config read | `bba1c7f1-b445-4657-90c3-8dbd97361a0c` | read when program list not ready | ⚠️ partial |
| Device ID | `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | read | ✅ confirmed |
| ASHA volume (fallback) | `00e4ca9e-ab14-41e4-8823-f9e70c7e91df` | signed int8 `[-128..0]` | ✅ confirmed |

**Detection:** Scan for service `56772eaf`. Legacy devices use `14293049-77d7-4244-ae6a-d3873e4a3184`.

### 2.2 Rexton / WS Audiology

**Shares Philips POLARIS service** (`56772eaf`) for basic control.  
**Terminal IO service:** `8b82105d-0f0c-40bb-b422-3770fa72a864`  
**Control/FAPI service:** `c8f75466-21b2-45b8-87f8-bd49a13eff49`

| Operation | UUID | Payload | Confidence |
|-----------|------|---------|-----------|
| Volume | `8b8276e8-0f0c-40bb-b422-3770fa72a864` | `[0x04, volumePosition]` | ✅ confirmed |
| Program switch | `8b8276e8-...` | `[0x05, program_index]` | ✅ confirmed |
| Balance | `8b8276e8-...` | `[0x06, value]` | ✅ confirmed |
| Tinnitus vol | `8b8276e8-...` | `[0x07, value]` | ✅ confirmed |
| CROS volume | `8b8276e8-...` | `[0x08, value]` | ✅ confirmed |
| Program notify | `8b8225e0-0f0c-40bb-b422-3770fa72a864` | subscribe for active program | ✅ confirmed |
| Control request | `c8f75466-21b2-45b8-87f8-bd49a13eff49` | `[commandId, payload...]` | ✅ confirmed |
| Control response | `c8f70447-21b2-45b8-87f8-bd49a13eff49` | subscribe | ✅ confirmed |
| Data request | `c8f72804-21b2-45b8-87f8-bd49a13eff49` | chunked | ✅ confirmed |

**Control command IDs (confirmed):**
- `0x00` start programming
- `0x02` stop programming  
- `0x04` start high-performance
- `0x06` stop high-performance
- `0x08` connection-parameter update
- `0x0A` connection-priority
- `0x0C` version info

**Detection:** Scan for `56772eaf` (shared with Philips), differentiate by presence of `8b82xxxx` Terminal IO service.

### 2.3 Starkey (Piccolo)

**Service:** `9a04f079-9840-4286-ab92-e65be0885f95`

| Operation | Piccolo bytes | Confidence |
|-----------|--------------|-----------|
| Set volume | `[0x12, 0x06, 0x04, 0x00, 0x04, 0x35, volume]` | ✅ confirmed |
| Set program | `[0x12, 0x06, 0x04, 0x00, 0x04, 0x34, memoryIndex]` | ✅ confirmed |
| Mute | `[0x12, 0x06, 0x04, 0x00, 0x04, 0x3A, muteByte]` | ✅ confirmed |
| Stream start/stop | `[0x12, 0x06, 0x04, 0x00, 0x04, 0x3D, startByte]` | ✅ confirmed |

**Full ControlObjectId enum (16 values):** Memory, MicrophoneVolume, TinnitusVolume, StreamingVolume, AccessoryStreamingVolume, BalanceVolume, StreamingState, AdaptiveTuningState, EqualizerBassState, EqualizerMiddleState, EqualizerTrebleState, NoiseReductionState, WindReductionState, StreamingEqualizerBassState, StreamingEqualizerMiddleState, StreamingEqualizerTrebleState

**Detection:** Scan for service `9a04f079`.

### 2.4 ReSound / GN Hearing

**Primary service family:** `e0262760-08c2-11e1-9073-0e8ac72eaXXX`  
**GN Command UUID:** `1959a468-3234-4c18-9e78-8daf8d9dbf61`  
**GN Notify UUID:** `8b51a2ca-5bed-418b-b54b-22fe666aadd2`  
**ASHA service:** `0000fdf0-0000-1000-8000-00805f9b34fb`

**GN command frame protocol (partial):**
- write handle: `[0x03, handleLow, payload...]`
- read handle: `[0x04, handleLow]`
- read blob: `[0x05, handleLow, 0x00, 0x00]`
- discover: `[0x06]`

**Status:** Volume/program/mute via opcode-based handle protocol — specific opcodes unknown pending .NET assembly decompile. ASHA volume path works as fallback.

**Detection:** Scan for `e0262760` service family or ASHA `0000fdf0`.

---

## 3. Architecture

### 3.1 Tech Stack

```
Frontend: React + TypeScript + Vite
BLE layer: Web Bluetooth API (browser-native)
State: Zustand
Styling: TailwindCSS
Build: Vite
Deploy: Static (GitHub Pages or Cloudflare Pages)
```

No backend needed — pure Web Bluetooth in the browser. Works on Chrome/Edge on Android, Windows, macOS. **Does not work on iOS** (Apple blocks Web Bluetooth).

### 3.2 Module Structure

```
src/
  ble/
    scanner.ts          # Device scanning and brand detection
    connection.ts       # Generic BLE connection management
    brands/
      philips.ts        # POLARIS protocol driver
      rexton.ts         # Terminal IO + POLARIS driver
      starkey.ts        # Piccolo protocol driver
      resound.ts        # GN proprietary + ASHA driver
      asha.ts           # Generic ASHA fallback
    types.ts            # Shared BLE types and interfaces
  ui/
    DeviceScanner.tsx
    DeviceCard.tsx
    VolumeControl.tsx
    ProgramSelector.tsx
    BalanceControl.tsx
    TinnitusControl.tsx
    BatteryIndicator.tsx
    StreamingControl.tsx
    EQControls.tsx
  store/
    deviceStore.ts
    settingsStore.ts
  hooks/
    useBLE.ts
    useDevice.ts
```

### 3.3 Brand Detection Logic

```typescript
async function detectBrand(device: BluetoothDevice): Promise<Brand> {
  const services = await device.gatt.getPrimaryServices();
  const uuids = services.map(s => s.uuid);

  if (uuids.includes('9a04f079-9840-4286-ab92-e65be0885f95'))
    return Brand.STARKEY;
  
  if (uuids.some(u => u.startsWith('e0262760')))
    return Brand.RESOUND;
  
  if (uuids.includes('56772eaf-2153-4f74-acf3-4368d99fbf5a')) {
    // Differentiate Philips vs Rexton by Terminal IO service
    if (uuids.some(u => u.startsWith('8b82')))
      return Brand.REXTON;
    return Brand.PHILIPS;
  }
  
  if (uuids.includes('0000fdf0-0000-1000-8000-00805f9b34fb'))
    return Brand.ASHA_GENERIC;

  return Brand.UNKNOWN;
}
```

---

## 4. Universal Control Interface

Every brand driver implements this interface:

```typescript
interface HearingAidDriver {
  // Connection
  connect(device: BluetoothDevice): Promise<void>;
  disconnect(): Promise<void>;
  
  // Core controls (all brands)
  setVolume(level: number, ear?: 'left' | 'right' | 'both'): Promise<void>;
  getVolume(): Promise<number>;
  setMute(muted: boolean): Promise<void>;
  getMute(): Promise<boolean>;
  setProgram(index: number): Promise<void>;
  getProgram(): Promise<number>;
  getPrograms(): Promise<Program[]>;
  getBattery(): Promise<number>; // 0-100
  
  // Extended controls (where supported)
  setBalance(value: number): Promise<void>;          // -10 to +10
  setTinnitusVolume(level: number): Promise<void>;
  setStreamingVolume(level: number): Promise<void>;
  setEQ(bass: number, mid: number, treble: number): Promise<void>;
  
  // Streaming
  startStreaming(codec: number): Promise<void>;
  stopStreaming(): Promise<void>;
  
  // Info
  getDeviceInfo(): Promise<DeviceInfo>;
  getBrand(): Brand;
  getSupportedFeatures(): Feature[];
}
```

---

## 5. Feature Support Matrix

| Feature | Philips | Rexton | Starkey | ReSound |
|---------|:-------:|:------:|:-------:|:-------:|
| Volume | ✅ | ✅ | ✅ | ⚠️ |
| Mute | ✅ | ⚠️ | ✅ | ⚠️ |
| Program switch | ✅ | ✅ | ✅ | ⚠️ |
| Balance | ⚠️ | ✅ | ✅ | ❓ |
| Tinnitus vol | ⚠️ | ✅ | ✅ | ❓ |
| Streaming vol | ✅ | ✅ | ✅ | ⚠️ |
| EQ | ⚠️ | ❓ | ✅ | ❓ |
| Battery | ✅ | ✅ | ❓ | ❓ |
| Noise reduction | ❓ | ❓ | ✅ | ❓ |
| Wind reduction | ❓ | ❓ | ✅ | ❓ |
| ASHA streaming | ✅ | ❓ | ❌ | ✅ |

✅ confirmed | ⚠️ partial/inferred | ❓ unknown | ❌ not supported

---

## 6. Development Phases

### Phase 1 — Foundation + Philips (Week 1)
**Goal:** Working app with one brand fully functional.
- Project scaffold (React + TS + Vite + Tailwind)
- Web Bluetooth scanner UI
- Brand detection logic
- Philips POLARIS driver (volume, mute, program switch, battery)
- Basic UI: device list, volume slider, program buttons, mute toggle

**Deliverable:** Connect to a Philips hearing aid and control volume/programs.

### Phase 2 — Rexton (Week 1-2)
**Goal:** Second brand working, driver abstraction proven.
- Rexton Terminal IO driver
- Shared POLARIS service handling (Philips + Rexton overlap)
- Balance control UI
- Tinnitus control UI
- Extended command interface

**Deliverable:** Same UI works for both Philips and Rexton.

### Phase 3 — Starkey (Week 2)
**Goal:** Third brand working, Piccolo binary protocol.
- Starkey Piccolo driver
- Binary command encoder/decoder
- Full Piccolo ControlObjectId support
- EQ controls UI (Starkey has bass/mid/treble)

**Deliverable:** All 3 solid brands fully working.

### Phase 4 — ReSound (Week 2-3)
**Goal:** Fourth brand, requires .NET decompile research.
- Complete ReSound .NET assembly decompilation (dnSpy)
- Map GN handle-based command protocol
- ReSound driver implementation
- ASHA generic fallback driver for unknown brands

**Deliverable:** All 4 brands working.

### Phase 5 — Polish + Testing (Week 3)
- Persistent device pairing (localStorage)
- Per-ear controls UI (L/R independent)
- Settings page (default programs, volume limits)
- Error handling and reconnection logic
- Responsive mobile UI
- Test on real devices if available / nRF Sniffer validation

---

## 7. Context Management Strategy

This is explicitly designed to avoid the "context bloat → agent trails off" problem.

### Rules for agent sessions:
1. **One driver at a time.** Each agent session works on ONE brand's driver file only.
2. **Reference docs, don't paste them.** Agents read from `docs/` — don't dump UUIDs into the prompt.
3. **Commit after each driver.** Each completed driver gets committed before starting the next.
4. **Tests as progress gates.** Each driver must pass a test harness before moving on.
5. **Spec is source of truth.** This document + `docs/command_dictionary.md` are what agents read first.

### Prompt template for each phase:
```
Read HEARING_AID_CONTROLLER_SPEC.md and docs/command_dictionary.md first.
Then implement src/ble/brands/[brand].ts — the [Brand] driver.
All confirmed protocol data is in the docs. Do not make up UUIDs.
Mark unconfirmed features with TODO comments.
Implement the HearingAidDriver interface from src/ble/types.ts.
Write unit tests in src/ble/brands/[brand].test.ts.
Do NOT touch other brand files.
```

---

## 8. Known Unknowns (Don't Block On These)

These are gaps to work around, not blockers:

1. **ReSound opcode table** — use ASHA volume as fallback, stub GN commands with TODOs
2. **Starkey wire-level transport** — app-layer Piccolo bytes are confirmed, that's enough
3. **Rexton mute opcode** — use volume-minimum emulation as fallback
4. **Philips 7 unlabeled UUIDs** — ignore, core controls are documented
5. **Live device testing** — develop against the protocol docs, validate with nRF Sniffer later

---

## 9. Repo Structure

```
hearing_aid_control/
  docs/                    # All reverse-engineering docs (existing)
  src/                     # Web app source (to be created)
  tests/                   # Protocol unit tests
  tools/                   # APK extraction scripts (existing)
  SPEC.md                  # This document
  README.md
```

---

## 10. Design Decisions (Resolved)

1. **Target platform:** Android Chrome first. Desktop Chrome secondary.
2. **UI style:** Clean and functional. No consumer fluff — audiologist-grade clarity.
3. **Multi-device:** Single device at a time for now. No bilateral cross-brand support yet.
4. **Persistence:** No auto-read on connection. No background modification. User explicitly triggers all actions. State is display-only until user interacts.
5. **ReSound:** Full priority — user has a ReSound device for testing. Complete .NET decompile in Phase 4.
