# Rexton Deep Extraction - Phase 2 (Static Decode from Extracted Assemblies)

This pass uses managed assemblies extracted from local `Rexton App 2.7.32.16308` XAPK artifacts.

## 1) Extraction status (completed)

- XAPK extracted from local artifact:
  - `artifacts/extracted/rexton_2.7.32`
- MAUI assembly blob extracted:
  - `libassemblies.arm64-v8a.blob.so`
- Managed assemblies extracted:
  - `artifacts/assemblies/rexton_2.7.32`
- Key assemblies decompiled:
  - `WSA.Foundation.Bluetooth.dll`
  - `WSA.Plugin.BLE.dll`
  - `WSA.Foundation.Bluetooth.HearingAsAService.dll`
  - `Component.RemoteControl.dll`
  - `Component.HearingAidConnection.dll`

## 2) Confirmed UUID topology from managed code

The decompiled managed layer directly defines UUID groups and labels.
This confirms the protocol map from docs at code level.

## Terminal IO (`8b82xxxx`)

- Service: `8b82105d-0f0c-40bb-b422-3770fa72a864`
- Data RX: `8b822409-...`
- Data TX: `8b82b999-...`
- Protocol Choice: `8b82cd2d-...`
- Ready for RX: `8b82a76f-...`
- Ready for TX: `8b82f3b9-...`
- Active Program Info: `8b8225e0-...`
- Basic Control Command: `8b8276e8-...`
- Configuration Check: `8b823656-...`

## Control/FAPI (`c8f7xxxx`)

- Control Request: `c8f75466-...` (and alternate `c8f79c9a-...`)
- Control Response: `c8f70447-...` (and alternate `c8f73dc3-...`)
- Data Request: `c8f72804-...` (and alternate `c8f7a8e4-...`)
- Data Response: `c8f72fef-...` (and alternate `c8f7a68a-...`)
- Advanced Control Command: `c8f76c2c-...` (alternate `c8f74ffb-...`)
- App Data: `c8f714d6-...`
- Configuration File: `c8f76c20-...`
- FB4H Data: `c8f73c59-...`
- Identifiers: `c8f7eea2-...`
- FAPI Request: `c8f723da-...`
- FAPI Response: `c8f7690c-...`
- Programming Service: `c8f7a831-...`

## Shared POLARIS and bonding

- POLARIS service: `56772eaf-2153-4f74-acf3-4368d99fbf5a`
- Shared IDs/chars include `5f35c43d...`, `353ecc73...`, `50632720...`, `83e28ff3...`, `bdf8a334...`
- Bonding service family includes `0a23ae62...`, `62dcc92f...`, `8e467a33...`, and related entries.

## 3) What this confirms

- The Rexton managed stack has first-class definitions for Terminal IO and Control/FAPI UUID sets.
- Previous JNI-only visibility in JADX Java was a bridge limitation; managed extraction resolves this.
- Multiple characteristics include alternate UUIDs for compatibility paths, confirming multi-generation support logic.

## 3.1 Confirmed Basic Control command bytes (user controls)

From decompiled `BasicCommandProtocol` methods:

- volume write:
  - frame: `[0x04, volumePosition]`
- program write:
  - frame: `[0x05, programId]`
- sound balance write:
  - frame: `[0x06, soundBalancePosition]`
- tinnitus volume write:
  - frame: `[0x07, tinnitusPosition]`
- CROS volume write:
  - frame: `[0x08, crosVolumePosition]`
- TV streamer volume write:
  - frame: `[0x09, (byte)(15 - sliderValue)]`

All of the above are written to `Basic Control Command` characteristic.

## 3.2 Confirmed streaming-volume fallback path

When Basic Control Command info version is below 3 and OBLE is supported:

- write to Oble volume characteristic with:
  - if slider nonzero: `[(byte)(sliderValue - 1), 0x01]`
  - else: `new byte[2]` (zeroed two-byte payload)

## 4) What remains unresolved

- Exact byte frame formats and opcode semantics for:
  - Control Request/Data Request payloads
  - FAPI Request payloads
- Handle-level request/response parsing rules and state transitions per operation.

## 5) Next Rexton targets

- Decode serializers/parsers in decompiled managed methods for Basic Control and Control Request command builders.
- Extract concrete request/response byte examples for volume/program/mute/stream.
- Separate user-control-safe paths from fitting/programming paths before any runtime validation.

## 6) Programming Service control-channel framing (newly confirmed)

The app uses the Programming Service control channel (`Control Request` / `Control Response`) with command-ID byte framing.

### Command IDs

- `0x00` StartProgramming
- `0x02` StopProgramming
- `0x04` StartHighPerformanceMode
- `0x06` StopHighPerformanceMode
- `0x08` ConnectionParameterUpdate
- `0x0A` ConnectionPriority
- `0x0C` VersionInfo

### Request frame format

- no-payload command:
  - `[commandId]`
- command with payload:
  - `[commandId, payload...]`

Confirmed payload examples:

- StartProgramming:
  - `[0x00, randomId[0], randomId[1], randomId[2], randomId[3], randomId[4], randomId[5]]`
  - `randomId` is generated per request by app-side random-id generator.
- ConnectionPriority High:
  - `[0x0A, 0x00]` (`High = 0`, `Low = 1` in enum)
- Version-1 connection parameter requests:
  - big interval: `[0x08, 0x10, 0x18, 0x00, 0x1E]`
  - medium interval: `[0x08, 0x08, 0x10, 0x00, 0x1E]`
  - small interval: `[0x08, 0x06, 0x0A, 0x00, 0x1E]`

### Response frame semantics

- byte0:
  - bit0: error flag (`1 = error`, `0 = success`)
  - bits1..7: echoed command id (`requestedId` compared using `data[0] & 0xFE`)
- byte1:
  - when error: error code (`0..7` or `255`)
  - when success: command-specific response data begins

Known error code mapping:

- `0` ProgrammingModeActive
- `1` ProgrammingModeNotActive
- `2` HighPerformanceModeActive
- `3` HighPerformanceModeNotActive
- `4` TestModeActive
- `5` TestModeNotActive
- `6` InvalidParameter
- `7` InternalError
- `255` InvalidCommandId

## 7) Programming data-channel transport (newly confirmed)

- Requests are written to `Data Request` characteristic.
- If request length <= BLE package size, app writes one packet.
- If request length > BLE package size, app splits into contiguous chunks and writes each chunk sequentially.
- Responses are received on `Data Response` and concatenated until `ResponseLength` bytes are collected.

This confirms a chunked raw-byte transport over `Data Request/Data Response` for programming payloads.

## 8) FAPI transport behavior (newly confirmed)

- FAPI is routed through:
  - request char: `c8f723da-21b2-45b8-87f8-bd49a13eff49`
  - response char: `c8f7690c-21b2-45b8-87f8-bd49a13eff49`
- `FapiGattMessenger` writes raw request bytes directly to FAPI request characteristic.
- max package length is `min(152, device.PackageSize)`.
- Request payload bytes come from `SerializeFapiCommunicationRequest()` (FapiAccessLayer/FapiProtocol generated objects).

So FAPI GATT transport is confirmed; the inner FAPI binary schema remains abstracted behind the external generator/serializer layer.

## 9) Bare communications inventory (all app <-> HA transport primitives)

This section inventories low-level communication behavior independent of specific feature UX.

### 9.1 BLE channels used

- **Terminal IO service (`8b82105d...`)**
  - Data RX (`8b822409...`)
  - Data TX (`8b82b999...`)
  - Protocol Choice (`8b82cd2d...`)
  - Basic Control Command (`8b8276e8...` + alternates)
- **Programming service (`c8f7a831...`)**
  - Control Request/Response (`c8f75466...` / `c8f70447...` + alternates)
  - Data Request/Response (`c8f72804...` / `c8f72fef...` + alternates)
- **FAPI service**
  - FAPI Request/Response (`c8f723da...` / `c8f7690c...`)

### 9.2 Programming session state machine (control + data channels)

Open path (`ProgrammingConnection.OpenConnectionAsync`):

1. Verify connected + programming service present.
2. Subscribe `ControlResponse`.
3. Send `VersionInfo` command.
4. Send `StartProgramming` command (random 6-byte id payload).
5. Optionally write `DeviceTypeInput = [0x06]` for specific platforms (D10/D11).
6. Optionally send high-performance commands:
   - `StartHighPerformance`
   - `RequestConnectionParameters`
7. Subscribe `DataResponse`.
8. Mark programming state ON.

Close path:

1. Send `StopHighPerformance` (may disconnect/reconnect depending on device behavior).
2. Send `StopProgramming`.
3. Unsubscribe `ControlResponse`, `DataResponse`.
4. Mark programming state OFF.

### 9.3 Control-channel frame semantics (authoritative)

- Request frame:
  - `[commandId]` or `[commandId, payload...]`
- Response frame:
  - `data[0] & 0x01` -> error flag
  - `data[0] & 0xFE` -> echoed command id (validated against requested command)
  - `data[1]` -> error code if error flag set

Known command payload patterns:

- `StartProgramming`:
  - request `[0x00, randomId[6]]`
  - success log parses `response[1..6]` as active programming id bytes
- `VersionInfo`:
  - request `[0x0C]`
  - success decode uses `response[1]` nibbles: major=`byte>>4`, minor=`byte&0x0F`
- `ConnectionParameterUpdate`:
  - version 1 sequence:
    - `[0x08, 0x10, 0x18, 0x00, 0x1E]`
    - `[0x08, 0x08, 0x10, 0x00, 0x1E]`
    - `[0x08, 0x06, 0x0A, 0x00, 0x1E]`
- `ConnectionPriority` high:
  - `[0x0A, 0x00]`

Error codes (`response[1]`):

- `0` programming mode active
- `1` programming mode not active
- `2` high-performance active
- `3` high-performance not active
- `4` test mode active
- `5` test mode not active
- `6` invalid parameter
- `7` internal error
- `255` invalid command id

### 9.4 Programming data-channel transport semantics

`ProgrammingConnection.SendRequest(...)` behavior:

- Input: `SivantosProgrammingRequest` with:
  - `Data` bytes
  - `ResponseLength`
- If `ResponseLength == 0`:
  - write request only, return empty response object.
- If `ResponseLength > 0`:
  - clear receive buffer
  - set expected length
  - write request
  - accumulate `DataResponse` notifications until byte count equals expected length
  - return assembled bytes

Write chunking:

- if `requestLen <= device.PackageSize`: single write to `DataRequest`.
- else: split into contiguous chunks of `device.PackageSize`, final chunk remainder-sized.

### 9.5 FAPI transport semantics at messenger boundary

`FapiGattMessenger` behavior:

- outgoing requests: raw byte array written to `FapiRequest` characteristic.
- incoming responses: raw `FapiResponse` notifications forwarded to FAPI core callback.
- maximum package length advertised to FAPI core:
  - `min(152, device.PackageSize)`.
- connection lifecycle:
  - `StartUpdatesAsync` subscribes to `FapiResponse`
  - `StopUpdatesAsync` unsubscribes
  - disconnection triggers `DeviceDisconnected` callback.

### 9.6 Protocol version routing (important for frame interpretation)

- Basic Control version selected by actual characteristic UUID:
  - v1 -> `8b8276e8...`
  - v2 -> `c8f747ac...`
  - v3 -> `22e01397...`
- Active Program Info version selected by characteristic UUID (`8b8225e0...` through `6ead405e...` mapped to v1..v9).
- FAPI support determined by presence of FAPI service; operation payloads are version-switched by FAPI contract versions.

## 10) Remaining unknowns after deep static pass

- Exact binary schema of serialized FAPI request bytes (`SerializeFapiCommunicationRequest`) remains behind external FapiAccessLayer implementation details not fully available in current extracted set.
- Construction details for `SivantosProgrammingRequest.Data` payloads at all callsites are not fully present in this decompiled assembly snapshot.
- Full on-wire timing/retry behavior under packet loss/disconnect requires dynamic capture for conformance-grade protocol reproduction.

## 11) Implementer guide: identify hearing aids and control adjustable features

This section translates decoded communication into an app-facing control workflow.

### 11.1 Device identification workflow

1. Scan/connect candidate BLE peripherals.
2. Discover services and require at least one Rexton-compatible service set:
   - Hi Service aliases:
     - `8b821572-0f0c-40bb-b422-3770fa72a864`
     - `c8f7d5ad-21b2-45b8-87f8-bd49a13eff49`
     - `62f7e35b-7763-4200-8688-f50ec96816ef`
     - `c8f777d0-21b2-45b8-87f8-bd49a13eff49`
     - `56772eaf-2153-4f74-acf3-4368d99fbf5a`
     - `62e84690-3757-4af3-95f5-269e0f7b7c0a`
   - Optional capability services:
     - Terminal IO `8b82105d...`
     - Programming Service `c8f7a831...`
     - FAPI Service `d1d4dc2a-215f-44d2-b44c-0f4de3c91af2`
3. Discover characteristics and resolve protocol generation:
   - Basic Control version by characteristic UUID:
     - v1 `8b8276e8...`
     - v2 `c8f747ac...`
     - v3 `22e01397...`
4. Subscribe to notification channels needed for state sync:
   - `Active Program Info`
   - `Hi State`
   - plus protocol-specific response channels (`ControlResponse`, `DataResponse`, `FapiResponse`) when used.

### 11.2 Remote-control channel selection logic

Use the same order as the app for robust compatibility:

1. **Core user controls** (volume/program/sound-balance/tinnitus/CROS/TV stream volume):
   - use Basic Control Command when available.
2. **Fallbacks and extended controls**:
   - if Basic Control unsupported/insufficient, use Advanced Control / FAPI paths based on protocol support.
3. **Programming/fitting operations**:
   - use Programming Service Control/Data channels with explicit session open/close.

### 11.3 Core adjustable features: direct request frames

When using Basic Control:

- volume: `[0x04, value]`
- program: `[0x05, programId]`
- sound balance: `[0x06, value]`
- tinnitus volume: `[0x07, value]`
- CROS volume: `[0x08, value]`
- TV streamer volume: `[0x09, (15 - slider)]`

OBLE fallback for streaming volume (legacy path):

- nonzero slider: `[(slider - 1), 0x01]`
- zero slider: `[0x00, 0x00]`

### 11.4 Programming/fitting session workflow

To execute programming data requests:

1. Subscribe `ControlResponse`.
2. Send control commands in order:
   - `VersionInfo` -> `StartProgramming`
   - optional `StartHighPerformance` -> `RequestConnectionParameters`
3. Subscribe `DataResponse`.
4. Send `DataRequest` payloads (chunk if larger than package size).
5. Reassemble `DataResponse` until expected byte length.
6. Close cleanly:
   - `StopHighPerformance` -> `StopProgramming`
   - unsubscribe response channels.

Control-channel response decode requirement:

- byte0 bit0 = error, bits1..7 = echoed command id
- on error, decode byte1 using error-code map in section 9.3.

### 11.5 FAPI path for broad adjustable feature set

The app uses FAPI for many adjustable features (examples from protocol layer):

- volume/program/microphone state
- wireless/stream routing (phone clip / tv box)
- SLNF / user controls / indicator behavior
- device naming / versioned feature toggles
- BabyBoomer, aux mode, and multiple service-version-specific settings

Execution pattern:

1. Discover FAPI contracts (`GetContractsAsync`).
2. Select request generator service/version branch.
3. Build request via fluent calls.
4. Serialize (`SerializeFapiCommunicationRequest`).
5. Write to `FapiRequest`, consume `FapiResponse`, evaluate returned error/status fields.

### 11.6 Practical boundary for third-party implementation

- Fully reproducible now:
  - device identification, protocol capability gating, Basic Control requests, Programming control/data session framing.
- Partially reproducible:
  - inner FAPI binary payload schema (serializer internals externalized).
- For complete parity with first-party app across all adjustable features, dynamic capture or additional FAPI serializer internals are still required.

