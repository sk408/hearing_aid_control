# Philips Deep Extraction - Phase 2 (Static Decode)

This pass is based on static decompilation of the Philips HearLink 2.5.0 app tree in `jadx_output/philips`.
It upgrades control-path knowledge with byte-level request/response behavior recovered from code.

## 1) Communication pipeline

## App path

- App control entrypoints: `c.i.a.a.u.l`
- Callback/write reconciliation: `c.i.a.a.u.k`
- Characteristic discovery and map assembly: `com.oticon.blegenericmodule.ble.gatt.CharacteristicUuidProvider`
- Shared serializer helper for volume-like payloads: `c.h.a.b.e.m.m.a`
- GATT queue operations: `c.i.a.a.r.l` (write), `c.i.a.a.r.j` (read)

## Runtime pattern

1. App mutates local desired state (level/mute/program).
2. App writes characteristic through queued `c.i.a.a.r.l`.
3. Callback `c.i.a.a.u.k` reads back value fields (`getIntValue`) and compares to desired pending state.
4. If mismatch, app re-serializes and re-writes until state converges.

This makes write semantics and expected response bytes explicit.

## 2) UUID map actively used in control flow

- `1454e9d6-f658-4190-8589-22aa9e3021eb` (main HA volume-style channel)
- `50632720-4c0f-4bc4-960a-2404bdfdfbca` (streaming volume-style channel)
- `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1` (microphone/audio volume-style channel)
- `535442f7-0ff7-4fec-9780-742f3eb00eda` (program select write)
- `68bfa64e-3209-4172-b117-f7eafce17414` (program list control)
- `bba1c7f1-b445-4657-90c3-8dbd97361a0c` (program config read follow-up)
- `60415e72-c345-417a-bb2b-bbba95b2c9a3` (EQ/gain payloads)
- `6efab52e-3002-4764-9430-016cef4dfc87` (bonded device info access)
- `6e557876-ccc4-40e0-8c2d-651542c5ad3d` (soundscape control)
- `786ff607-774d-49d6-80a5-a17e08823d91` (streaming device activation write)
- `42e940ef-98c8-4ccd-a557-30425295af89` (program-info version read)
- `dcbe7a3e-a742-4527-aeb5-cd8dee63167f` (available-program bitset read)
- `58bbccc5-5a57-4e00-98d5-18c6a0408dfd` (volume range limits read)
- `d01ab591-d282-4ef5-b83b-538e0bf32d85` (streaming state/status read)
- `bc6829c4-b750-48e6-b6f4-48ec866a1efb` (uptime/session counters read)
- `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` (single-byte status value; semantic pending)
- `34dfc7cb-5252-430b-ba6d-df2fe87914e7` (ASHA-side bonded-device list feed)

## 3) Confirmed request byte layouts

## 3.1 Volume-like channels (confirmed)

Serializer (`c.h.a.b.e.m.m.a`):

- request payload = two bytes:
  - `byte0 = (byte) level`
  - `byte1 = (!muteBoolean) ? 1 : 0`
- write type = `WRITE_TYPE_NO_RESPONSE` (`2`)

Used by `c.i.a.a.u.l` for:

- `1454e9d6...` (main volume path)
- `50632720...` (streaming volume path)
- `e5892ebe...` (microphone/audio path)

## 3.2 Program select (confirmed)

`c.i.a.a.u.l.i(int i)`:

- UUID: `535442f7...`
- payload: `[(byte) i]`
- write type: `2`

Callback confirms by checking characteristic byte0 against pending program value.

## 3.3 Program discovery and list flow (now mostly decoded)

`c.i.a.a.u.l.S()`:

- UUID: `68bfa64e...`
- payload: `[(byte) peek.b]` where queue item type is `c.i.a.a.l`

`c.i.a.a.l(int i)` sets:

- `b = i`
- `a = 2` if `i == 255`, else `a = 0`

Program discovery in callback `c.i.a.a.u.l.a(...)`:

- read `dcbe7a3e...` as bitset of available program indices.
- for each set bit position `i`, enqueue `new c.i.a.a.l(i)`.
- enqueue terminal sentinel `new c.i.a.a.l(255)`.
- read `68bfa64e...`; when byte0 returns `255`, call `S()` to write next queue item id back to `68bfa64e...`.
- after each write/read handshake, app reads `bba1c7f1...` and parses one queue item.

`bba1c7f1...` record parser for queue items with `a == 0`:

- `byte0` = program category index -> `ProgramInfoCharacteristic$ProgramCategory` (fallback `DEFAULT`).
- `byte1` = program-name length `nameLen`.
- `bytes[2..2+nameLen-1]` = UTF-8-like name string from `getStringValue(2)` (trimmed); if empty or null, fallback name by category.
- `byte[2 + nameLen]` = flags bitfield:
  - bit0 -> tinnitus-related flag (`n`)
  - bit1 -> additional flag (`p`, used by make-audible gating)
- program id comes from queue item `poll.b`.
- assembled entry: `new c.i.a.a.k(programId, name, category, n, p)`.

Program map finalization:

- parsed entries first collect in `n0` (staging map).
- when parser marks completion, app sets `K = A0`, swaps `G <- n0`, clears `n0`, and emits refresh callbacks.

## 3.4 Bonding access control bytes (confirmed)

`c.i.a.a.u.l` writes to `6efab52e...`:

- reset/request: `[1, 0]`
- select bonded slot: `[2, slotId]`

Streaming activation request (`786ff607...`):

- payload length fixed to 8 bytes.
- `byte0 = 0x10`
- `bytes1..6 = bonded device address bytes` (copied from bonded cache entry)
- `byte7 = slotId`
- write type = `1` (with response)

## 3.5 EQ/soundscape channels (confirmed payload construction)

- `60415e72...` path A (`b(int[])`): 16-byte buffer with 8-byte gain data copied into indices 8..15.
- `60415e72...` path B (`c(int[])`): raw byte array from provided ints.
- `6e557876...`: `[0, (byte) i]` with `i` bounded to 0..255.

## 4) Confirmed response parsing behavior

In `c.i.a.a.u.k` write-callback reconciliation:

- Volume-like reads parse:
  - `getIntValue(33, 0)` for level byte
  - `getIntValue(33, 1) == 0` as mute boolean
- If pending desired state differs, serializer re-writes same characteristic.

For program path:

- `getIntValue(17, 0)` on `535442f7...` compared to pending target.
- Re-write retry if not yet converged.

For program list path:

- `getIntValue(17, 0) == 255` interpreted as ready signal.
- Otherwise, app reads `bba1c7f1...` for additional program metadata.

In `c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)` service callback (fully decompiled with debug pass):

- service dispatch by service UUID:
  - `0000180a...` -> standard Device Information strings (`2a29`, `2a24`, `2a26`, `2a28`)
  - `56772eaf...` -> proprietary Philips/Oticon control plane
  - `0a23ae62...` -> ASHA-side bonded-device info (`34df...`)

Key proprietary response decode now confirmed:

- `e5892ebe...`:
  - level=`uint8@0`, mute=`(uint8@1)==0`
  - updates tinnitus/mic state and signals `TINNITUS_VOLUME_READY`
- `50632720...`:
  - level=`uint8@0`, mute=`(uint8@1)==0`
  - updates streaming-volume state and signals `OBLE_VOLUME_READY`
- `1454e9d6...`:
  - level=`uint8@0`, mute=`(uint8@1)==0`
  - updates main-volume state and signals `MAIN_VOLUME_READY`
- `58bbccc5...`:
  - parses min/max pairs for up to 3 ranges:
    - main range from bytes 0..1
    - streaming range from bytes 2..3
    - tinnitus/mic range from bytes 4..5 (if present)
  - signals `VOLUME_RANGES_READY`
- `d01ab591...` streaming status frame:
  - `byte0` -> `StreamingState`
  - `byte1` high bits -> main source type, low bits -> subtype
  - optional bytes 3..8 + marker at byte9 -> source id payload
  - signals `STREAMING_STATE_READY`
- `42e940ef...`:
  - `A0 = int32@0` (program info version)
  - signals `PROGRAM_INFO_VERSION_READY`
  - if `A0 != K`, app triggers read of `dcbe7a3e...` to rebuild program map
- `dcbe7a3e...`:
  - available-program bitset -> queue seed for per-program metadata fetch
  - signals `AVAILABLE_PROGRAMS_READY`
- `535442f7...`:
  - active program id from `uint8@0`
  - signals `ACTIVE_PROGRAM_ID_READY`
- `bc6829c4...`:
  - parses two optional int32 values from response bytes into uptime/session structure and emits callback
- `e24fac83...`:
  - stores `uint8@0` into `this.r` (semantic meaning still unresolved)
- `268c4933...`:
  - observed in switch but no action body (no-op in this build)

ASHA service (`0a23ae62...`) bonded-device parser:

- `34dfc7cb...` response shapes:
  - `len>=8 && byte1==3`: bonded device entry (slot + 6-byte addr)
  - `len==1 && byte0!=0`: removed bonded entry
  - `len==1 && byte0==0`: end marker
- end marker triggers "download finished" state and cross-side aggregation of available streaming device addresses.

## 5) Confidence upgrades from this pass

- `volume` (Philips proprietary path): upgraded to confirmed request and response byte logic.
- `mute` (Philips proprietary path): upgraded to confirmed boolean bit encoding in byte1.
- `program` (single-byte selection): upgraded to confirmed request/readback behavior.
- `program list` and metadata path: upgraded from partial to mostly decoded, including queue protocol, category/name/flag parsing, and final map commit logic.
- `streaming state` decode (`d01ab591...`): now confirmed at field level.
- `volume range` decode (`58bbccc5...`): now confirmed.
- `bonded-device aggregation` and `streaming activation` framing: now confirmed from callback and writer paths.

## 6) Remaining unknowns

- Exact product semantics for `e24fac83...` byte0 (`this.r`) and any UX-facing meaning.
- Final interpretation of edge states in queue-completion logic when only sentinel items remain (decompiler control-flow artifacts suggest possible ambiguity).
- Precise unit mapping/calibration (real-world dB scale) behind byte-level level values across device families.
- Runtime packet timing/retry behavior under radio errors still needs live BLE capture for full protocol conformance.

## 7) Next Philips targets

- Run a live BLE capture pass (nRF/Android HCI or Frida hook on `BluetoothGattCharacteristic.setValue`) and map each UI action to on-wire frames.
- Validate all static decode paths against runtime traces, especially:
  - `dcbe -> 68bf -> bba1` program discovery sequencing,
  - retries/re-writes in `c.i.a.a.u.k` under mismatched readback,
  - bonded-device sync and `786ff607...` activation timing.
- Resolve unresolved UUID semantics (`e24fac83...`, any no-op/rare branches) through trigger-based runtime experiments.
- Acquire at least one additional Philips HearLink version and diff control-path methods (`u.l`, `u.k`, serializer helpers) to separate stable protocol core from version-specific behavior.

## 8) Runtime capture hook prepared

Added tracer script:

- `tools/reverse/frida_philips_ble_trace.js`

What it logs:

- outgoing payloads prepared through `BluetoothGattCharacteristic.setValue([B)` with service UUID, char UUID, write type, length, hex.
- incoming callback payloads at `c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)` with service UUID, char UUID, length, hex.

Suggested run:

- `frida -U -f com.philips.hearlink -l tools/reverse/frida_philips_ble_trace.js`

Use this capture to build definitive UI-action -> byte-frame mapping and close remaining protocol unknowns.

## 9) Bare communications inventory (all app <-> HA transport primitives)

This section enumerates every low-level communication primitive observed in Philips HearLink 2.5.0 static code, independent of feature semantics.

## 9.1 Transport operations used

All BLE actions are funneled through the single-threaded GATT operation queue in `c.i.a.a.r.h` and represented by `GattOperationBase` subclasses:

- connect attempt: `c.i.a.a.r.d` -> `hearingAid.K()` (connectGatt path)
- service discovery: `c.i.a.a.r.f` -> `BluetoothGatt.discoverServices()`
- MTU request: `c.i.a.a.r.b` -> `BluetoothGatt.requestMtu(512)` (issued on connect)
- connection priority request: `c.i.a.a.r.a` -> `BluetoothGatt.requestConnectionPriority(...)`
- characteristic read: `c.i.a.a.r.j` -> `BluetoothGatt.readCharacteristic(...)`
- characteristic write: `c.i.a.a.r.l` -> `BluetoothGatt.writeCharacteristic(...)`
- notification subscription: `c.i.a.a.r.c` ->
  - `setCharacteristicNotification(...)`
  - CCCD write on `00002902-0000-1000-8000-00805f9b34fb`
- RSSI read: `c.i.a.a.r.k` -> `BluetoothGatt.readRemoteRssi()`
- bond initiation path exists: `c.i.a.a.r.e` -> `BluetoothDevice.createBond()`

## 9.2 Callback ingress points (all incoming comms)

Incoming wire data enters via `GattCallbackWrapper`:

- `onCharacteristicChanged(...)` -> `c.i.a.a.u.c.b(...)`
- `onCharacteristicRead(...)` -> `c.i.a.a.u.c.a(...)`
- both then flow into Philips parser `c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)`
- write completion (`onCharacteristicWrite`) routes to reconciliation handler `c.i.a.a.u.k`
- descriptor completion (`onDescriptorWrite`) confirms notify subscription and invokes descriptor callback
- connection/meta callbacks handled:
  - `onConnectionStateChange`
  - `onServicesDiscovered`
  - `onMtuChanged`
  - `onConnectionUpdated`
  - `onReadRemoteRssi`

## 9.3 Notification/read bootstrap behavior

After services are discovered:

- app requests MTU 512 then triggers service discovery sequence.
- notification enables are issued for characteristics listed in `c.i.a.a.q.a.f946c` via CCCD (`0x2902`).
- initial reads are issued for characteristics in `c.i.a.a.q.a.b`.
- some reads are skipped when minimum required data is already satisfied (`CharacteristicUuidProvider.a(...)` + `INITIAL_DISCOVERY_DONE` gate).

This means communication startup is deterministic:

1. connect
2. MTU + discovery
3. enable notify set
4. initial read sweep
5. feature control writes/reads

## 9.4 Control-plane service and characteristic domains

Service-level ingress dispatch in parser:

- `0000180a-0000-1000-8000-00805f9b34fb` (Device Information)
- `56772eaf-2153-4f74-acf3-4368d99fbf5a` (primary proprietary control plane)
- `0a23ae62-c4c2-43d1-87b1-e8c83839a063` (ASHA-side bonded-device feed)

Communication-relevant proprietary characteristic set (decoded paths):

- control/state: `535442f7...`, `42e940ef...`, `dcbe7a3e...`, `68bfa64e...`, `bba1c7f1...`
- volume/mute domains: `1454e9d6...`, `50632720...`, `e5892ebe...`, `58bbccc5...`
- streaming/audio state: `d01ab591...`, `6e557876...`, `e24fac83...`, `268c4933...`
- bonded streaming/devices: `6efab52e...`, `786ff607...`, `34dfc7cb...`, `bc6829c4...`
- make-audible/tinnitus: `9215a295...`, `60415e72...`

## 9.5 Queue safety and timeout behavior (protocol robustness)

`c.i.a.a.r.h` enforces serialized op execution and timeout handling:

- one in-flight operation at a time.
- operation timeout defaults by type:
  - connect-like ops: ~6s
  - most read/write/notify ops: ~20s
  - service-discovery/MTU-related paths have dedicated handling.
- on timeout/error cases, queue may:
  - disconnect,
  - refresh/close GATT,
  - or continue for ignorable cases (e.g., connection-priority timeout).
- characteristic UUID mismatch between callback and queue head triggers disconnect path (`UUID_MISMATCH_CASE` behavior).

This queue behavior is part of effective protocol semantics because it controls retries, reordering prevention, and failure recovery.

## 10) Implementer guide: identify HA devices and act as remote control

This section translates the reverse-engineered protocol into an app-facing control workflow.

## 10.1 Device identification workflow

1. Scan and connect candidate BLE devices.
2. Discover services and require presence of Philips/Oticon control service:
   - `56772eaf-2153-4f74-acf3-4368d99fbf5a`
3. Request MTU (app uses 512) and complete service discovery.
4. Enable notifications via CCCD (`00002902...`) for subscribed characteristics.
5. Read identification characteristics:
   - standard DIS service `0000180a...`:
     - `00002a29...` manufacturer
     - `00002a24...` model
     - `00002a26...` firmware revision
     - `00002a28...` software revision
   - proprietary HIID strings:
     - `5f35c43d...` (HIID)
     - `353ecc73...` (partner HIID)
6. Treat a device as controllable Philips target only after required steps and minimum characteristic set are present.

## 10.2 Remote-control initialization workflow

After identification, initialize control state before exposing UI controls:

1. Read `58bbccc5...` to obtain min/max bounds for control ranges.
2. Read `1454e9d6...`, `50632720...`, `e5892ebe...` for current level/mute states.
3. Read `42e940ef...` program-info version.
4. If version differs from cached value, rebuild program map:
   - read `dcbe7a3e...` -> available-program bitset
   - drive `68bfa64e...` / `bba1c7f1...` queue flow to decode each program record.
5. Read `535442f7...` for active program id.
6. Optionally read `d01ab591...` for streaming state/source.

## 10.3 Adjustable features (operation map)

- Main volume + mute:
  - write/read char: `1454e9d6...`
  - payload: `[level, (!mute ? 1 : 0)]`
  - write type: `2`
- Streaming volume + mute:
  - write/read char: `50632720...`
  - payload/write semantics same as above
- Tinnitus/mic volume + mute:
  - write/read char: `e5892ebe...`
  - payload/write semantics same as above
- Program selection:
  - write char: `535442f7...`
  - payload: `[(byte) programId]`
  - write type: `2`
- Program list retrieval:
  - control/read chars: `dcbe7a3e...`, `68bfa64e...`, `bba1c7f1...`
  - uses queue-based handshake and per-program metadata parsing
- EQ / gain controls:
  - char: `60415e72...`
  - payload modes:
    - raw int-byte array
    - 16-byte frame with gain data in bytes 8..15
- Soundscape update frequency:
  - char: `6e557876...`
  - payload: `[0, freq]` with `freq in [0,255]`

## 10.4 Bonded device and streaming-activation controls

- Bonded device list/control:
  - write `6efab52e...`:
    - reset/request list: `[1,0]`
    - select slot: `[2,slotId]`
- Bonded feed parser:
  - `34dfc7cb...` response shapes:
    - bonded entry
    - removed entry
    - end marker
- Activate selected streaming device:
  - write `786ff607...` payload:
    - `[0x10, addrByte0..addrByte5, slotId]`
  - write type: `1`

## 10.5 Control-loop behavior required for a compatible remote app

To match first-party behavior, implement reconciliation:

1. Keep desired pending state per control channel.
2. After write completion and/or read callback, parse readback bytes.
3. If readback != desired state, reserialize and rewrite same channel.
4. Serialize all GATT operations (single queue); avoid concurrent writes.
5. Apply bounds from `58bbccc5...` before issuing volume-like writes.

Without this loop, UI state and hearing-aid state may diverge.

