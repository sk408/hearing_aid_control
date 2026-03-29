# Philips HearLink UUID + Characteristic Dossier

Date: 2026-03-28  
App lineage: Philips HearLink (Oticon/Demant POLARIS + PRE_POLARIS support)

## 1) Service map

| UUID | Service | Status |
|---|---|---|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | POLARIS proprietary control service | confirmed |
| `14293049-77d7-4244-ae6a-d3873e4a3184` | PRE_POLARIS legacy service | confirmed |
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | ASHA-side bonded-device feed service | confirmed |
| `0000180a-0000-1000-8000-00805f9b34fb` | Device Information Service | confirmed |
| `0000180f-0000-1000-8000-00805f9b34fb` | Battery Service | confirmed |
| `7d74f4bd-c74a-4431-862c-cce884371592` | MFi/HAP related path | partial |

## 2) Characteristic inventory with value semantics

Legend:
- `C` = confirmed byte-level behavior in static decode
- `P` = partial (channel and some fields known)
- `U` = unknown or unresolved behavior

### 2.1 Core control characteristics

| UUID | Purpose | Value format | Status |
|---|---|---|---|
| `1454e9d6-f658-4190-8589-22aa9e3021eb` | Main volume + mute | `[level, muteBitInverted]` where `muteBitInverted = (!mute ? 1 : 0)` | C |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | Streaming volume + mute | same as above | C |
| `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1` | Mic/tinnitus volume + mute | same as above | C |
| `535442f7-0ff7-4fec-9780-742f3eb00eda` | Active program set | single byte `[programId]` | C |
| `42e940ef-98c8-4ccd-a557-30425295af89` | Program info version | reads int32 at offset 0 (`A0`) | C |
| `dcbe7a3e-a742-4527-aeb5-cd8dee63167f` | Available program bitset | bitset; each set bit yields queued program index | C |
| `68bfa64e-3209-4172-b117-f7eafce17414` | Program list queue control | write one-byte selector; read ready sentinel `255` | C/P |
| `bba1c7f1-b445-4657-90c3-8dbd97361a0c` | Program metadata record | category/name/flags parser (len + string + bitfield) | C |
| `58bbccc5-5a57-4e00-98d5-18c6a0408dfd` | Volume range limits | min/max pairs in bytes (main/stream/mic ranges) | C |

### 2.2 Streaming, environment, and bonded-device paths

| UUID | Purpose | Value format | Status |
|---|---|---|---|
| `d01ab591-d282-4ef5-b83b-538e0bf32d85` | Streaming state/source | byte0 state + byte1 packed source fields + optional source id bytes | C |
| `6e557876-ccc4-40e0-8c2d-651542c5ad3d` | Soundscape update control | write `[0, freq]` with `freq in [0,255]` | C |
| `6efab52e-3002-4764-9430-016cef4dfc87` | Bonded-device control | writes `[1,0]` (reset/list), `[2,slot]` (select) | C |
| `786ff607-774d-49d6-80a5-a17e08823d91` | Streaming device activation | 8-byte write `[0x10, addr(6), slotId]` | C |
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | Bonded-device feed (ASHA side) | entry/remove/end-marker response shapes | C |
| `bc6829c4-b750-48e6-b6f4-48ec866a1efb` | Uptime/session counters | two optional int32 values parsed from payload | C/P |

### 2.3 EQ and auxiliary channels

| UUID | Purpose | Value format | Status |
|---|---|---|---|
| `60415e72-c345-417a-bb2b-bbba95b2c9a3` | EQ/gain writes | path A: 16-byte frame with gain bytes at 8..15; path B: raw int-byte array | C |
| `9215a295-b813-483f-9f85-b700d0b7bc75` | Tinnitus/make-audible channel | callback decode present; full write/read schema not fully cataloged | P |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | HIID | identifier string/bytes | P |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Partner HIID | identifier string/bytes | P |

### 2.4 Unresolved characteristics

| UUID | Observation | Status |
|---|---|---|
| `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | parsed byte0 stored into internal field `r`; UX meaning unresolved | U |
| `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3` | appears in switch but no action body in this app version | U |
| `d5d0affb-35b8-4fdc-a50b-f777c90293b8` | PRE_POLARIS-only special char in compatibility path | P/U |

## 3) Expected and candidate value domains

### Volume-like channels (`1454...`, `5063...`, `e589...`)
- Expected payload: 2 bytes.
- Byte0: likely bounded by device-specific range from `58bb...`.
- Byte1:
  - `0` => muted
  - `1` => unmuted
- Readback uses `getIntValue(33,0/1)` semantics.

### Program channels (`5354...`, `68bf...`, `bba1...`)
- Program set:
  - write `[programId]`.
- Program list acquisition:
  - read `dcbe...` bitset.
  - queue each set-bit id plus sentinel 255.
  - use `68bf...` handshake and parse `bba1...` records.
- Program flags field (`bba1...`):
  - bit0 tinnitus-related flag.
  - bit1 additional feature flag.

### Streaming activation (`786f...`)
- Fixed length 8.
- Must have bonded cache entry before write.
- Likely rejected when slot/address cache is stale or missing.

## 4) Potentially missing first-party UUIDs / characteristics

- Additional PRE_POLARIS-only chars are likely underrepresented because most static decode focus is POLARIS runtime paths.
- Possible supplemental notification chars for rare UX flows (telemetry/state edges) may be gated by device capabilities and not exercised in current static pass.
- Some IDs seen in early provider scans were later marked as false positives; a final live characteristic enumeration on at least one PRE_POLARIS device is still required to close the list.

## 5) File references and code anchors

### Primary docs
- `docs/deep_extraction/philips_phase2_static.md`
- `docs/philips_hearlink.md`
- `docs/ble_reference.md`

### Code/symbol anchors
- `com.oticon.blegenericmodule.ble.gatt.CharacteristicUuidProvider`
- `c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)`
- `c.i.a.a.u.k` (write reconcile loop)
- `c.h.a.b.e.m.m.a` (volume serializer helper)
- `c.i.a.a.r.*` queue ops (`read`, `write`, `notify`, `discover`, `requestMtu`)

## 6) Reminders for next-pass validation

- Validate ambiguous channels (`e24fac83...`, `268c4933...`) with trigger-based runtime capture tied to specific UI actions.
- Keep a strict split between:
  - transport certainty (high), and
  - semantic certainty of unresolved bytes (medium/low).
- Always capture pre-write desired state and post-readback state to preserve reconcile-loop semantics used by the first-party app.
