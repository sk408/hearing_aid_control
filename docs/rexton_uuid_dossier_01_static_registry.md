# Rexton Hearing Aid UUID Dossier 01: Static Registry and Value Semantics

Date: 2026-03-28  
Scope: Rexton 2.7.32 static extraction and decompilation corpus.

## 1) Evidence corpus

- `docs/rexton.md`
- `docs/deep_extraction/rexton_phase2_static.md`
- `docs/uuid_rexton_dossier_2026-03-28.md`
- `docs/ble_reference.md`
- `artifacts/decompiled/rexton_2.7.32/WSA.Foundation.Bluetooth/WSA.Foundation.Bluetooth.decompiled.cs`
- `artifacts/decompiled/rexton_2.7.32/WSA.Plugin.BLE/WSA.Plugin.BLE.decompiled.cs`

Confidence model:
- `confirmed`: static decode gives concrete value/frame shape.
- `partial`: architecture strongly implies behavior but full wire examples are pending.
- `inferred`: UUID is known and behavior is hypothesized but not validated.
- `inactive-in-baseline`: UUID is present but no active semantic path is observed in baseline.

## 2) Service inventory

| UUID | Service | Status |
|---|---|---|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | Hi/POLARIS | confirmed |
| `8b82105d-0f0c-40bb-b422-3770fa72a864` | Terminal IO | confirmed |
| `c8f7a831-21b2-45b8-87f8-bd49a13eff49` | Programming | confirmed |
| `d1d4dc2a-215f-44d2-b44c-0f4de3c91af2` | FAPI | confirmed |
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | Bonding | confirmed |
| `0000180a-0000-1000-8000-00805f9b34fb` | Device Information | confirmed |
| `0000180f-0000-1000-8000-00805f9b34fb` | Battery | confirmed |

## 3) Core characteristic registry

### 3.1 Basic control surface

| UUID | Label | Value shape | Status |
|---|---|---|---|
| `8b8276e8-0f0c-40bb-b422-3770fa72a864` | Basic Control Command | `[opcode, arg]` | confirmed |
| `8b8225e0-0f0c-40bb-b422-3770fa72a864` | Active Program Info | notify/read state payload | partial |
| `8b823656-0f0c-40bb-b422-3770fa72a864` | Configuration Check | config state/check payload | partial |

Confirmed opcodes on `8b8276e8...`:
- `[0x04, volumePosition]`
- `[0x05, programId]`
- `[0x06, soundBalancePosition]`
- `[0x07, tinnitusPosition]`
- `[0x08, crosVolumePosition]`
- `[0x09, (15 - sliderValue)]` (TV streamer volume mapping)

Basic-control mute status:

- No dedicated mute opcode is exposed in static `BasicCommandProtocol`.
- Mute/unmute writes are implemented via advanced/FAPI paths (`AdvanceControlCommand` classifier `11`) rather than Basic Control.
- Confidence: `confirmed` for "not in basic-control surface", `partial` for end-to-end runtime behavior across all families.

### 3.2 Terminal IO transport

| UUID | Label | Status |
|---|---|---|
| `8b822409-0f0c-40bb-b422-3770fa72a864` | Data RX | partial |
| `8b82b999-0f0c-40bb-b422-3770fa72a864` | Data TX | partial |
| `8b82cd2d-0f0c-40bb-b422-3770fa72a864` | Protocol Choice | partial |
| `8b82a76f-0f0c-40bb-b422-3770fa72a864` | Ready for RX | partial |
| `8b82f3b9-0f0c-40bb-b422-3770fa72a864` | Ready for TX | partial |

### 3.3 Programming and FAPI channels

| UUID | Role | Value semantics | Status |
|---|---|---|---|
| `c8f75466-21b2-45b8-87f8-bd49a13eff49` | Control Request | `[commandId, payload...]` | confirmed |
| `c8f70447-21b2-45b8-87f8-bd49a13eff49` | Control Response | byte0 error+echo id, byte1 error/data | confirmed |
| `c8f72804-21b2-45b8-87f8-bd49a13eff49` | Data Request | raw/chunked programming payloads | confirmed |
| `c8f72fef-21b2-45b8-87f8-bd49a13eff49` | Data Response | chunk reassembly to expected length | confirmed |
| `c8f723da-21b2-45b8-87f8-bd49a13eff49` | FAPI Request | serializer output bytes | confirmed transport |
| `c8f7690c-21b2-45b8-87f8-bd49a13eff49` | FAPI Response | raw response bytes to FAPI core | confirmed transport |

Control command IDs:
- `0x00` StartProgramming
- `0x02` StopProgramming
- `0x04` StartHighPerformanceMode
- `0x06` StopHighPerformanceMode
- `0x08` ConnectionParameterUpdate
- `0x0A` ConnectionPriority
- `0x0C` VersionInfo

Known control error codes:
- `0..7`, `255` (InvalidCommandId)

Canonical UUID and alias registry (from managed mappings):

- Basic Control Command:
  - canonical: `8b8276e8-0f0c-40bb-b422-3770fa72a864`
  - aliases: `c8f747ac-21b2-45b8-87f8-bd49a13eff49`, `22e01397-43cb-45b6-a921-b28271e4e989`
- Active Program Info:
  - canonical: `8b8225e0-0f0c-40bb-b422-3770fa72a864`
  - aliases: `c8f7fac0-21b2-45b8-87f8-bd49a13eff49`, `c8f7a5ab-21b2-45b8-87f8-bd49a13eff49`, `c8f79346-21b2-45b8-87f8-bd49a13eff49`, `c8f7ac86-21b2-45b8-87f8-bd49a13eff49`, `6eabf749-7729-41fb-9001-bba9677018f8`, `f9252eea-7236-4cc4-a9e0-bd72724dc7d6`, `7e19ff52-6fa0-4d16-b746-fc40821f3715`, `6ead405e-9301-4231-86af-7ad94ef090ef`
- Programming control/data:
  - control request alias: `c8f79c9a-21b2-45b8-87f8-bd49a13eff49`
  - control response alias: `c8f73dc3-21b2-45b8-87f8-bd49a13eff49`
  - data request alias: `c8f7a8e4-21b2-45b8-87f8-bd49a13eff49`
  - data response alias: `c8f7a68a-21b2-45b8-87f8-bd49a13eff49`

### 3.4 Shared POLARIS channels

| UUID | Role | Status |
|---|---|---|
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | HI ID | partial |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Partner ID | partial |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | OBLE volume path | partial |
| `83e28ff3-25ad-4bfe-aaf0-5a95dba4b56b` | Hi State | partial |
| `d28617fe-0ad5-40c5-a04a-bc89051ff755` | Ear side | partial |
| `bdf8a334-1c7b-46e9-b4c2-800b8966136b` | Identifiers | partial |

## 4) Potentially missing first-party UUID coverage

- Alias UUID sets are now statically enumerated; generation dispatch logic remains partially unresolved.
- Full semantic map for `Active Program Info` and `Configuration Check` payloads is not yet complete.
- FAPI inner payload schema remains hidden behind serializer layers.

## 5) Reminders

- Keep basic user-control channels and fitting/programming channels strictly separated.
- Preserve connection/session sequencing from programming stack; control commands are stateful and order-dependent.
- Validate alias UUID routing by device family before assuming a single universal characteristic map.
