# Hearing Aid UUID Master Matrix (Cross-Vendor)

Date: 2026-03-28  
Scope: Philips HearLink, ReSound Smart 3D, Rexton, Starkey  
Status model:
- `confirmed`: explicitly recovered from static code/decompilation and/or extraction docs
- `partial`: UUID identity is known but behavior/payload is incomplete
- `inferred`: behavior guessed from naming/context only
- `inactive-in-baseline`: UUID appears in references but is not active on baseline control path

## 1) Vendor support matrix (services)

| UUID | Label | Philips | ReSound | Rexton | Starkey | Confidence |
|---|---|---|---|---|---|---|
| `0000180a-0000-1000-8000-00805f9b34fb` | Device Information Service | yes | yes | yes | partial | confirmed |
| `0000180f-0000-1000-8000-00805f9b34fb` | Battery Service | yes | partial | yes | partial | partial |
| `0000fdf0-0000-1000-8000-00805f9b34fb` | ASHA service | yes | yes | partial | no evidence | partial |
| `7d74f4bd-c74a-4431-862c-cce884371592` | MFi HAP service | yes | yes | partial | no evidence | partial |
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | POLARIS / Hi Service | yes | no evidence | yes | no evidence | confirmed |
| `14293049-77d7-4244-ae6a-d3873e4a3184` | PRE_POLARIS service | yes (legacy) | no evidence | no evidence | no evidence | confirmed |
| `e0262760-08c2-11e1-9073-0e8ac72ea010` | GN proprietary primary | no evidence | yes | no evidence | no evidence | confirmed |
| `8b82105d-0f0c-40bb-b422-3770fa72a864` | Terminal IO service | no evidence | no evidence | yes | no evidence | confirmed |
| `c8f7a831-21b2-45b8-87f8-bd49a13eff49` | Programming service | no evidence | no evidence | yes | no evidence | confirmed |
| `d1d4dc2a-215f-44d2-b44c-0f4de3c91af2` | FAPI service | no evidence | no evidence | yes | no evidence | confirmed |
| `48ddf118-efd0-48fc-8f44-b9b8e17be397` | Starkey HA config service | no evidence | no evidence | no evidence | yes | confirmed |
| `9a04f079-9840-4286-ab92-e65be0885f95` | Starkey Piccolo service | no evidence | no evidence | partial (shared appearance in docs) | yes | partial |

## 2) Cross-vendor shared characteristics

| UUID | Seen in | Known role |
|---|---|---|
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | Philips, Rexton | Hi ID / device identifier |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Philips, Rexton | Partner HI ID |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | Philips, Rexton | Streaming/OBLE volume-like channel |
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | Philips, Rexton | Bonded-device list feed / extended channel |
| `6efab52e-3002-4764-9430-016cef4dfc87` | Philips, Rexton | Bonded-device info access control |
| `00002902-0000-1000-8000-00805f9b34fb` | all BLE stacks | CCCD descriptor for notify/indicate |

## 3) Confirmed control-plane channels by vendor

### Philips
- Volume-like writes:
  - `1454e9d6-f658-4190-8589-22aa9e3021eb`
  - `50632720-4c0f-4bc4-960a-2404bdfdfbca`
  - `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1`
- Program select and metadata:
  - `535442f7-0ff7-4fec-9780-742f3eb00eda`
  - `68bfa64e-3209-4172-b117-f7eafce17414`
  - `bba1c7f1-b445-4657-90c3-8dbd97361a0c`

### ReSound
- GN command/notify interface:
  - command `1959a468-3234-4c18-9e78-8daf8d9dbf61`
  - notify `8b51a2ca-5bed-418b-b54b-22fe666aadd2`
- GN `e0262760` family semantics in this build:
  - `...ea010` control point
  - `...ea011` status
  - `...ea110` firmware update status
  - `...ea111` firmware certificate
  - `...ea112` firmware image data
  - `...ea113` firmware PSM
  - `...ea210` pairing reservation

### Rexton
- Basic control channel:
  - `8b8276e8-0f0c-40bb-b422-3770fa72a864`
  - confirmed opcodes: `0x04` volume, `0x05` program, `0x06` sound balance, `0x07` tinnitus, `0x08` CROS, `0x09` TV stream volume
- Programming control/data:
  - `c8f75466...` / `c8f70447...`
  - `c8f72804...` / `c8f72fef...`

### Starkey
- Piccolo app-layer command framing (feature execution):
  - `[0x12, 0x06, lenPlusFlags, flags, featureHi, featureLo, optionalArg]`
- Known feature IDs:
  - `0x0435` volume
  - `0x0434` memory/program
  - `0x043A` mute
  - `0x043D` accessory stream start/stop

## 4) Unresolved UUID semantics (high-value)

| Vendor | UUID | Current state |
|---|---|---|
| Philips | `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | one-byte status field decoded, product semantic unresolved |
| Philips | `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3` | present in switch path, no action body in this build |
| ReSound | many custom UUIDs outside GN command/notify pair | identity known, operation-level meaning unresolved without runtime traces |
| Rexton | multiple `8b82xxxx` and `c8f7xxxx` alternates | aliases/generation paths known, exact routing per model not fully mapped |
| Starkey | native transport below `SendPacketResult` | Piccolo app-layer known, on-wire lower framing partial |

## 5) Potentially missing first-party UUIDs/characteristics

- ReSound likely has additional operation-bearing handles only discoverable via live GN discovery flow (dynamic handle map at runtime, not fixed static UUID-operation mapping).
- Rexton likely has generation-specific alternates beyond currently enumerated `8b82`/`c8f7` groups, selected by protocol version and capability probing.
- Philips PRE_POLARIS path likely contains additional legacy characteristics not active in current POLARIS-only decode passes.
- Starkey likely has supplementary protocol surfaces in HA config service (`48ddf118...`) not yet fully mapped to user controls.

## 6) Source references (file-level)

- `docs/deep_extraction/philips_phase2_static.md`
- `docs/deep_extraction/resound_phase2_static.md`
- `docs/deep_extraction/rexton_phase2_static.md`
- `docs/deep_extraction/starkey_phase2_static.md`
- `docs/deep_extraction/starkey_phase3_transport_static.md`
- `docs/ble_reference.md`
- `docs/command_dictionary.md`
- `docs/resound_operation_corpus_static_2026-03-28.md`
- `docs/philips_hearlink.md`
- `docs/rexton.md`
- `docs/resound.md`
- `docs/starkey.md`

## 7) Code references (symbol-level anchors)

- Philips:
  - `com.oticon.blegenericmodule.ble.gatt.CharacteristicUuidProvider`
  - `c.i.a.a.u.l` (service callback decode)
  - `c.i.a.a.u.k` (write reconciliation)
- ReSound:
  - `GNConstants`
  - `HandleBasedPlatform.Notification(...)`
  - `HandleBasedPlatform.Discover(...)`
- Rexton:
  - `BasicCommandProtocol`
  - `ProgrammingConnection.OpenConnectionAsync`
  - `FapiGattMessenger`
- Starkey:
  - `PiccoloCommand`
  - `PiccoloUiCommand`
  - `ControlObjectId`
  - `ServiceLibPiccolo`

## 8) Reminders

- Treat all fitting/programming paths (`FAPI`, programming channels, firmware endpoints) as high risk and out of normal user-control scope.
- Keep operation mapping separate from transport mapping; transport may be confirmed while operation payloads remain partial.
- For unresolved UUIDs, prioritize runtime capture with trigger-based tests over more static decompile passes.
