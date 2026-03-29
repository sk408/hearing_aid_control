# ReSound Deep Extraction - Phase 2 (Static Decode from Extracted Assemblies)

This pass uses managed assemblies extracted from local `ReSound Smart 3D_1.43.1` XAPK artifacts.

## 1) Extraction status (completed)

- XAPK extracted from local artifact:
  - `artifacts/extracted/resound_1.43.1`
- Xamarin/MAUI assembly blob extracted:
  - `libassemblies.armeabi-v7a.blob.so`
- Managed assemblies extracted:
  - `artifacts/assemblies/resound_1.43.1`
- Key assemblies decompiled:
  - `ReSound.App.BLE.dll`
  - `ReSound.App.BLE.Droid.NET.dll`
  - `ReSound.App.BLE.XPlatform.RemoteCommunication.dll`
  - `ReSound.XPlatform.Ble.Contracts.dll`
  - `ReSound.XPlatform.BleIdentifier.dll`
  - `ReSound.App.HI.dll`
  - `dk.resound.smart3d.dll`

## 2) Critical correction: `e0262760` family semantics

Previously, `a110/a111/a112/a113` had been treated as likely user-control channels.
In this build, code shows they are part of control/status and firmware endpoints:

- `...ea010` = control point
- `...ea011` = status
- `...ea110` = firmware update status endpoint
- `...ea111` = firmware certificate endpoint
- `...ea112` = firmware image data endpoint
- `...ea113` = firmware PSM endpoint
- `...ea210` = pairing reservation characteristic

This significantly changes how ReSound control should be modeled.

## 3) Confirmed GN command interface UUIDs

From `GNConstants` in decompiled assemblies:

- GN command channel:
  - `1959A468-3234-4C18-9E78-8DAF8D9DBF61`
- GN notify channel:
  - `8B51A2CA-5BED-418B-B54B-22FE666AADD2`
- GN version:
  - `97C1C193-EA53-4312-9BD9-E52207D5E03D`
- GN security capability:
  - `12257119-DDCB-4A12-9A08-1CD4DF7921BB`
- Trusted-app challenge:
  - `ADD69BFC-EDC7-40A4-BA5E-5F0107C3B3AC`
- Fit protocol config:
  - `E09369EC-150B-40B0-ABD5-841CA383D7FA`

## 4) Confirmed command opcodes and notify event IDs

From `HandleBasedPlatform`:

- GN command opcodes:
  - `1` set-notify vector
  - `2` get-notify vector
  - `3` write handle
  - `4` read handles
  - `5` read blob
  - `6` discover

- GN notify event IDs:
  - `1` response accepted
  - `2` notification bitfield
  - `3` handle readout
  - `4` handle notification
  - `5` handle blob readout
  - `6` discover response
  - `7` discover last response
  - `8` error code
  - `9` mic error code

## 4.1 Confirmed frame shapes (from command writes)

- Set notify vector write:
  - frame: `[0x01, <16-byte-notification-bitvector>]` (17 bytes total)
- Discover write:
  - frame: `[0x06]`
- Handle write:
  - frame: `[0x03, handleLowByte, payload...]`
- Handle read:
  - single-handle short read: `[0x04, handleLowByte]`
  - blob read (for large values): `[0x05, handleLowByte, 0x00, 0x00]`
- Batched handle-read flow:
  - app constructs and writes `handles.ToArray()`, where list is seeded with `0x04`, so wire form is `[0x04, handle1, handle2, ...]`.

## 4.2 Confirmed notify payload decode (from notification handlers)

From `HandleBasedPlatform.Notification(...)`, `HandleReadOut(...)`, `HandleNotification(...)`,
`HandleBlobReadOut(...)`, and `HandleErrorCode(...)`:

- GN notify wrapper:
  - first byte is notify event ID (`1..9`)
  - for most events, remainder is decrypted before parsing
- Event `3` (handle readout) and `4` (handle notification):
  - payload is repeated tuples:
    - `[handle, length, valueBytes...]`
  - parser walks until payload end and dispatches each tuple to `serverDescription.LookupCharacteristicsByHandle(handle)`
- Event `5` (blob readout):
  - carries blob chunk bytes
  - app accumulates chunks until expected characteristic size reached
  - continuation request is sent as `[0x05, handle, offsetLow, offsetHigh]`
- Event `8` (error code):
  - payload is repeated triplets:
    - `[commandOpcode, handle, errorCode]`
  - command opcodes `3`/`4` are correlated to outstanding waits by handle

## 4.3 Confirmed discover-response record layout (opcode 6 path)

From `Discover()` + `HandleDiscovery(...)`:

- Discover command request:
  - write `[0x06]` to GN command characteristic
- Discover response body (events `6` and final `7`):
  - repeated records, each:
    - `[handle(1), size(1), ops(1), uuid(16)]`
  - `ops` bitfield decode:
    - bit0 = read
    - bit1 = write
    - bit2 = notify
  - UUID bytes are transformed to canonical GUID byte order before `new Guid(...)`
  - each decoded record feeds `DiscoverProperties.DiscoveredService(handle, uuid, size, operations)`

## 5) Confirmed trust/bootstrap action

During trust setup, code writes explicit bytes to GN security capability:

- write: `[4, 0, 0, 0, 0]` to GN security capability characteristic.

## 6) Implication for user controls

User-level operations (volume/program/mute/stream) are not exposed as simple fixed
UUID-per-operation writes in this stack. They are tunneled through:

- GN command/notify interface
- handle-based read/write commands
- dynamic characteristic/handle discovery and notification vectors

So, direct mapping like `operation -> single UUID -> fixed payload` is incomplete for ReSound.
The correct model is command-interface protocol over GN command+notify.

## 6.1 Confidence for user-operation mapping

- `volume/program/mute/stream` transport mechanism:
  - `confirmed`: GN command/notify handle protocol
- per-operation handle IDs and payload bodies:
  - `partial`: handles are looked up dynamically via server description and not yet fully mapped to each user control in this pass

## 6.2 Newly mapped user-control targets (from embedded service descriptions)

`ReSound.App.HI.dll` embeds multiple `*ServiceDescription.xml` resources. Extracted to:

- `artifacts/extracted/resound_1.43.1/gatt_descriptions`

Using `ref-name -> uuid -> handle` mapping in those XMLs, key user-control properties are:

- Dooku3 family (`Dooku3ServiceDescription.xml`):
  - `GNMicAttenuation` (mic volume/mute): handle `5`, uuid `32C9322D-6B17-11CF-0234-6F0DA5EAFD75`, size `2`
  - `GNStreamAttenuation` (stream volume/mute): handle `6`, uuid `054E99C7-FF34-1C12-59CD-E2C20D2E6743`, size `2`
  - `GNCurrentActiveProgram` (program select): handle `8`, uuid `DC82F820-63AC-F82F-1E89-372FDE4151F4`, size `1`
  - `GNStreamStatus`: handle `21`, uuid `9C21DF09-E38C-333D-5783-E9C13C9324A9`, size `2`
  - `GNStreamType`: handle `31`, uuid `E374ABCA-ACEC-412E-90BC-5D70E48DD664`, size `1`
  - `GNAllVolumes`: handle `51`, uuid `4E8CBF8C-C1FC-423F-B920-96437F358346`, size `1` (descriptor indicates app-specific packing)
  - `GNCurrentActiveStreamProgram`: handle `67`, uuid `B4923AC8-4E3D-41DB-925F-0FA33D49337A`, size `1`
  - `GNAutomaticStreaming`: handle `70`, uuid `0F3FD4DD-B0A9-465D-BC36-5DD182AD8FC5`, size `1`
- Palpatine6 family (`Palpatine6ServiceDescription.xml`):
  - `GNUnmuteDefault`: handle `31`, uuid `5B65E784-E3B8-4511-8E0F-91B5B6239887`, size `1`

## 6.3 Concrete user-operation request examples (handle protocol)

Given `SetData(...)` wraps payloads as `[0x03, handle, body...]`, and Dooku3 handle map above:

- Program change (`GNCurrentActiveProgram`, handle `0x08`):
  - clear payload from property write: `[programIndex]`
  - command frame: `[0x03, 0x08, programIndex]`
- Mic attenuation / mute (`GNMicAttenuation`, handle `0x05`):
  - attenuation property writes one or two bytes depending on characteristic mode
  - Dooku descriptors define size `2`, and `AttenuationProperty` writes `[currentProgram, attenuation]`
  - command frame: `[0x03, 0x05, currentProgram, attenuation]`
  - mute semantic from descriptor: `attenuation=0`
- Stream attenuation / mute (`GNStreamAttenuation`, handle `0x06`):
  - same shape as mic attenuation
  - command frame: `[0x03, 0x06, currentProgram, attenuation]`
- Stream status read (`GNStreamStatus`, handle `0x15`):
  - short read request: `[0x04, 0x15]`
  - expected notify event `3` with tuple payload including handle `0x15`

## 7) Next ReSound targets

- Build live capture + decoder pass (Phase 3 dynamic) to validate encrypted-wire examples against real devices:
  - instrument `_gnCommand.Write(...)` plaintext before `encoder.Encrypt(...)`
  - instrument GN notify path after decrypt, before per-event parser dispatch
  - record operation traces for:
    - program change
    - mic attenuation up/down/mute
    - stream attenuation up/down/mute
    - stream source / automatic streaming toggles
- Emit operation-level corpus:
  - `operation -> command plaintext frame -> notify event sequence -> parsed handle/value transitions`
- Cross-validate by platform generation:
  - at least one Palpatine6 profile
  - at least one Dooku3 profile
- Promote finalized output to implementation-ready protocol spec:
  - stable command builders
  - response decoders
  - per-operation preconditions (trusted bond, notification vector bits, expected state transitions)

## 8) Bare communications path (full stack to Android GATT)

### 8.1 Confirmed BLE backend wiring in this app build

From app startup wiring (`dk.resound.smart3d`):

- `Singleton.Set<IBLEManager>(new BLEDroidManagerFactory(base.ApplicationContext));`

Implication:

- This Android build uses direct `BLEDroidManager` (Android `BluetoothGatt` path), not the optional remote-proxy transport as the primary runtime BLE path.

### 8.2 End-to-end write path (user operation -> radio transaction)

For HI operations (`program/volume/mute/stream`) on handle-controlled characteristics:

1. Property layer builds operation payload (for example, attenuation writes include current program index when characteristic size is `2`).
2. `HandleBasedPlatform.SetData(uuid, data)` wraps payload into GN command frame:
   - `[0x03, handleLowByte, payload...]`
3. Frame is encrypted in-app:
   - `_gnCommand.Write(delegate => encoder.Encrypt(frame), ...)`
4. BLE abstraction write:
   - `IBleCharacteristic -> IBLECharacteristics.Write(...)`
5. Android transport write:
   - `BLEDroidDevice.RequestWrite(...)`
   - `BluetoothGattCharacteristic.SetValue(data)`
   - `BluetoothGatt.WriteCharacteristic(characteristic)`
6. Completion callback:
   - `OnCharacteristicWrite(...)` -> `WriteCompleted/WriteFailed`

### 8.3 End-to-end notify/read path (radio transaction -> decoded property)

1. Android callback:
   - `OnCharacteristicChanged(...)` receives bytes from GN notify characteristic.
2. Data enters BLE abstraction:
   - `BLEDroidCharacteristics.Data` -> `OnCharacteristicChanged` event.
3. HI protocol decoder:
   - `HandleBasedPlatform.Notification(...)`
   - event byte dispatch (`1..9`)
   - decrypt payload (`encoder.Decrypt(...)`, except error-code path behavior)
4. Parsed tuples:
   - handle tuples (`[handle,length,value...]`) for events `3`/`4`
   - blob chunks for event `5`
   - discovery records for events `6`/`7`
5. Mapped to model:
   - `serverDescription.LookupCharacteristicsByHandle(handle)`
   - property cache update + listener notification

### 8.4 Bare GATT operations exercised against hearing aids

From `BLEDroidManager/BLEDroidDevice` and HI platform flow:

- Scan:
  - `BluetoothLeScanner.StartScan(...)` with service filters (GN/target services)
- Connect:
  - `BluetoothDevice.ConnectGatt(..., BluetoothTransports.Le)` (API-dependent overloads)
- Service discovery:
  - `BluetoothGatt.DiscoverServices()`
- Characteristic discovery:
  - `BluetoothGattService.GetCharacteristics()` via wrapper discovery flow
- Read:
  - `BluetoothGatt.ReadCharacteristic(...)`
- Write:
  - `BluetoothGatt.WriteCharacteristic(...)`
- Notification subscription:
  - `BluetoothGatt.SetCharacteristicNotification(...)`
  - CCCD write (`00002902-0000-1000-8000-00805f9b34fb`) via `WriteDescriptor(...)`
- MTU negotiation:
  - `BluetoothGatt.RequestMtu(...)`
  - app requests MTU up to normal `176` (constants show min app support `64`)

### 8.5 Control-plane commands beyond user operations

Observed stack interactions include:

- Bonding / bond-state handling
- RSSI registration and updates
- ASHA compatibility checks and hearing-aid profile probing
- reconnect policy on GATT failures/disconnect
- trusted-bond challenge/public-key/security-cap exchanges before encrypted GN command traffic

### 8.6 Optional remote BLE proxy protocol (present but not primary path here)

`ReSound.App.BLE` includes a remote command channel abstraction (`IBLERemoteChannel`, `BLEProxy`, `RemoteBLEManager`) with command names:

- host-to-ble side: `Initialize`, `StartScanning`, `Connect`, `DiscoverServices`, `DiscoverCharacteristics`, `AddNotify`, `Read`, `Write`, `MTU`, ...
- callback side: `OnNotify`, `OnRead`, `OnWrite`, `OnServiceDiscoveryCompleted`, ...

Characteristic-addressed command payloads serialize:

- `deviceUUID + serviceUUID + characteristicUUID + optionalValueBytes`

This is useful for instrumentation/replay tooling, but this Android app build is wired directly to `BLEDroidManager`.

