# ReSound (GN) UUID + Characteristic Dossier

Date: 2026-03-28  
App lineage: ReSound Smart 3D 1.43.1  
Key caution: user controls are tunneled via GN command/notify + dynamic handles, not static UUID-per-operation writes.

## 1) Service and characteristic families

### 1.1 GN `e0262760` family (critical correction)

| UUID | Suffix | Role in this build | Status |
|---|---|---|---|
| `e0262760-08c2-11e1-9073-0e8ac72ea010` | a010 | control point | confirmed |
| `e0262760-08c2-11e1-9073-0e8ac72ea011` | a011 | status | confirmed |
| `e0262760-08c2-11e1-9073-0e8ac72ea110` | a110 | firmware update status endpoint | confirmed |
| `e0262760-08c2-11e1-9073-0e8ac72ea111` | a111 | firmware certificate endpoint | confirmed |
| `e0262760-08c2-11e1-9073-0e8ac72ea112` | a112 | firmware image data endpoint | confirmed |
| `e0262760-08c2-11e1-9073-0e8ac72ea113` | a113 | firmware PSM endpoint | confirmed |
| `e0262760-08c2-11e1-9073-0e8ac72ea210` | a210 | pairing reservation characteristic | confirmed |

### 1.2 GN command interface UUIDs

| UUID | Label | Status |
|---|---|---|
| `1959a468-3234-4c18-9e78-8daf8d9dbf61` | GN command channel | confirmed |
| `8b51a2ca-5bed-418b-b54b-22fe666aadd2` | GN notify channel | confirmed |
| `97c1c193-ea53-4312-9bd9-e52207d5e03d` | GN version | confirmed |
| `12257119-ddcb-4a12-9a08-1cd4df7921bb` | GN security capability | confirmed |
| `add69bfc-edc7-40a4-ba5e-5f0107c3b3ac` | trusted-app challenge | confirmed |
| `e09369ec-150b-40b0-abd5-841ca383d7fa` | fit protocol config | confirmed |

### 1.3 Other custom UUIDs seen (semantics mostly unresolved)

- `1bcd1f06-1e72-4dad-8edb-8bfaeb4fe812`
- `213885c7-488a-412c-ba95-e36436b88c42`
- `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87`
- `497eeb9e-b194-4f35-bc82-36fd300482a6`
- `4d56d4f5-af39-4885-9525-9f68c18ff451`
- `53df4e1c-43e1-497e-8edf-589f48aafd9a`
- `6d27fe99-0bfc-4c5e-9a3f-a4a271bb3d2a`
- `6eae2d11-57a1-43bf-be4a-6326d0d94e88`
- `7009c09b-b94f-42d4-8d68-676059f153ab`
- `8d17ac2f-1d54-4742-a49a-ef4b20784eb3`
- `98e3949e-d4dd-421c-87b2-5a5ddc1ac26f`
- `a53062b9-7dfd-446c-bca5-1e13269560bd`
- `b69669b0-effb-4568-9862-7d82f3391170`
- `bf41a31e-7619-42c2-aa34-5f434d16dd5f`
- `c853ac0b-2175-4d1d-8396-8f866d1ba821`
- `c97d21d3-d79d-4df8-9230-bb33fa805f4e`
- `de1e1fd9-6056-4d89-8c49-5c3907ab694f`
- `deb1c8c1-ec5e-42d3-9d0f-4d108a3c612c`

## 2) Confirmed command and notification value shapes

## 2.1 Command opcodes

| Opcode | Meaning |
|---|---|
| `0x01` | set notify vector |
| `0x02` | get notify vector |
| `0x03` | write handle |
| `0x04` | read handles |
| `0x05` | read blob |
| `0x06` | discover |

## 2.2 Notify event IDs

| Event | Meaning |
|---|---|
| `0x01` | response accepted |
| `0x02` | notification bitfield |
| `0x03` | handle readout |
| `0x04` | handle notification |
| `0x05` | handle blob readout |
| `0x06` | discover response |
| `0x07` | discover last response |
| `0x08` | error code |
| `0x09` | mic error code |

## 2.3 Frame formats (confirmed)

- Set notify vector write:
  - `[0x01, 16-byte bitvector]`
- Discover request:
  - `[0x06]`
- Handle write:
  - `[0x03, handleLow, payload...]`
- Single-handle read:
  - `[0x04, handleLow]`
- Multi-handle read:
  - `[0x04, handle1, handle2, ...]`
- Blob read:
  - `[0x05, handleLow, offsetLow, offsetHigh]`

## 2.4 Notify payload tuple formats (confirmed)

- Events `0x03` and `0x04`:
  - repeated tuples `[handle, len, valueBytes...]`
- Event `0x05`:
  - blob chunk bytes, app accumulates to expected characteristic size
- Event `0x08`:
  - repeated triplets `[commandOpcode, handle, errorCode]`
- Discover events `0x06` and `0x07`:
  - repeated records `[handle(1), size(1), ops(1), uuid(16)]`
  - `ops` bitfield:
    - bit0 read
    - bit1 write
    - bit2 notify

## 3) Dynamic handle map with user-control relevance

From embedded `*ServiceDescription.xml` resources:

| Name | Handle | UUID | Size | User-control relevance |
|---|---:|---|---:|---|
| GNMicAttenuation | 5 | `32c9322d-6b17-11cf-0234-6f0da5eafd75` | 2 | mic volume/mute |
| GNStreamAttenuation | 6 | `054e99c7-ff34-1c12-59cd-e2c20d2e6743` | 2 | stream volume/mute |
| GNCurrentActiveProgram | 8 | `dc82f820-63ac-f82f-1e89-372fde4151f4` | 1 | program select |
| GNStreamStatus | 21 | `9c21df09-e38c-333d-5783-e9c13c9324a9` | 2 | stream status |
| GNStreamType | 31 | `e374abca-acec-412e-90bc-5d70e48dd664` | 1 | stream routing/type |
| GNAllVolumes | 51 | `4e8cbf8c-c1fc-423f-b920-96437f358346` | 1 | consolidated volumes |
| GNCurrentActiveStreamProgram | 67 | `b4923ac8-4e3d-41db-925f-0fa33d49337a` | 1 | stream program |
| GNAutomaticStreaming | 70 | `0f3fd4dd-b0a9-465d-bc36-5dd182ad8fc5` | 1 | auto streaming toggle |

Additional profile example:
- `GNUnmuteDefault` (Palpatine6): handle 31, UUID `5b65e784-e3b8-4511-8e0f-91b5b6239887`, size 1.

## 4) Expected values and unresolved value semantics

### Confirmed operation frame examples

- Program write:
  - `[0x03, 0x08, programIndex]`
- Mic attenuation write:
  - `[0x03, 0x05, currentProgram, attenuation]`
  - mute semantic appears as `attenuation = 0`
- Stream attenuation write:
  - `[0x03, 0x06, currentProgram, attenuation]`
- Stream status read:
  - `[0x04, 0x15]`

### Still unresolved

- Exact mapping from UI features to handle IDs across all device generations.
- Enumerated domains for stream type/status bytes for every model family.
- Encryption-layer edge behavior around error event handling and retries.

## 5) Potentially missing first-party UUIDs/characteristics

- Runtime discovery can surface model-specific characteristic UUIDs not present in currently extracted service descriptions.
- Handle IDs may be stable only per profile family (Dooku/Palpatine/etc.), suggesting missing profile resources from unrecovered app variants.
- Remote BLE proxy serialization path may expose additional operational UUID references not exercised in standard Android direct path.

## 6) File references and code anchors

### Primary docs
- `docs/deep_extraction/resound_phase2_static.md`
- `docs/resound.md`
- `docs/ble_reference.md`
- `docs/command_dictionary.md`

### Embedded resource locations
- `artifacts/extracted/resound_1.43.1/gatt_descriptions/CommonServiceDescription.xml`
- `artifacts/extracted/resound_1.43.1/gatt_descriptions/Dooku3ServiceDescription.xml`
- `artifacts/extracted/resound_1.43.1/gatt_descriptions/Palpatine6ServiceDescription.xml`

### Code/symbol anchors
- `GNConstants`
- `HandleBasedPlatform.SetData(...)`
- `HandleBasedPlatform.Notification(...)`
- `HandleBasedPlatform.HandleDiscovery(...)`
- `serverDescription.LookupCharacteristicsByHandle(...)`

## 7) Reminders

- Do not treat `e026...a110/a111/a112/a113` as user-control ops in this build; they are firmware/control endpoints.
- For implementation, model ReSound as:
  - encrypted command interface +
  - dynamic discovered handle table +
  - event-driven state decode.
- Prioritize live capture at plaintext boundary around encrypt/decrypt calls for final operation-level truth.
