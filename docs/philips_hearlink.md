# Philips HearLink — BLE Protocol Reference

## Source
- APK: Philips HearLink v2.5.0.10268
- Platform: Oticon/Demant `blegenericmodule`
- Decompiled with: JADX

## Key Source Files
- `jadx_output/philips/sources/com/oticon/blegenericmodule/ble/gatt/CharacteristicUuidProvider.java`
- `jadx_output/philips/sources/com/oticon/blegenericmodule/ble/gatt/DeviceCompatibility.java`
- `jadx_output/philips/sources/c/i/a/a/q/b.java` — Service UUID definitions
- `jadx_output/philips/sources/c/i/a/a/u/k.java` — Characteristic handler (switch statement)
- `jadx_output/philips/sources/c/i/a/a/u/l.java` — HearingAid connection handler

## Service UUIDs

| UUID | Description | Notes |
|------|-------------|-------|
| `0000180a-0000-1000-8000-00805f9b34fb` | Device Information Service | Standard GATT 0x180A |
| `0000180f-0000-1000-8000-00805f9b34fb` | Battery Service | Standard GATT 0x180F |
| `7d74f4bd-c74a-4431-862c-cce884371592` | MFi HAP (Apple) | Made for iPhone hearing aid |
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | ASHA | Audio Streaming for Hearing Aid |
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | Oticon Proprietary (POLARIS) | Current generation devices |
| `14293049-77d7-4244-ae6a-d3873e4a3184` | Oticon Proprietary (PRE_POLARIS) | Legacy devices only |

## Device Compatibility
- **POLARIS**: Has service `56772eaf` but NOT service `14293049`
- **PRE_POLARIS**: Has services from the full list in `c/i/a/a/q/b.java`
- Special handling for UUID `d5d0affb` in PRE_POLARIS devices

## Characteristic UUIDs — Standard GATT (Device Information)

| UUID | Description |
|------|-------------|
| `00002a24-0000-1000-8000-00805f9b34fb` | Model Number String |
| `00002a26-0000-1000-8000-00805f9b34fb` | Firmware Revision String |
| `00002a28-0000-1000-8000-00805f9b34fb` | Software Revision String |
| `00002a29-0000-1000-8000-00805f9b34fb` | Manufacturer Name String |

## Characteristic UUIDs — Proprietary (Service `56772eaf`)

### Required Characteristics (List `a` in CharacteristicUuidProvider)

| UUID | Function | R/W/N | Switch Case |
|------|----------|-------|-------------|
| `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1` | Microphone/Audio Control | Write | case 0 |
| `60415e72-c345-417a-bb2b-bbba95b2c9a3` | EQ/Gain Control | Write | case 1 |
| `9215a295-b813-483f-9f85-b700d0b7bc75` | Make Audible / Tinnitus | Notify | case 2 |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | Audio Control | R/W | — |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Audio Control | R/W | — |
| `42e940ef-98c8-4ccd-a557-30425295af89` | Audio/Streaming | R/W | — |
| `535442f7-0ff7-4fec-9780-742f3eb00eda` | Control | Write | case 5 |
| `58bbccc5-5a57-4e00-98d5-18c6a0408dfd` | Audio/Data | R/W | — |
| `1454e9d6-f658-4190-8589-22aa9e3021eb` | Volume Control | Write | case 7 |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | Streaming Control | Write | case 6 |
| `d01ab591-d282-4ef5-b83b-538e0bf32d85` | Audio | R/W | — |
| `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | Audio/Data | R/W | — |
| `6e557876-ccc4-40e0-8c2d-651542c5ad3d` | Soundscape/Environment | R/W | — |
| `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87` | (in asm_110 also) | R/W | — |

### Extended Characteristics

| UUID | Function | R/W/N | Switch Case |
|------|----------|-------|-------------|
| `68bfa64e-3209-4172-b117-f7eafce17414` | Program/Device List | R/W | case 3 |
| `bba1c7f1-b445-4657-90c3-8dbd97361a0c` | Program Configuration | R/W | case 4 |
| `51939bb6-a635-4b1e-903b-76cd9dff3fac` | Bonded Device | R/W | case 8 |
| `bc6829c4-b750-48e6-b6f4-48ec866a1efb` | Extended Feature | R/W | — |
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | Extended Feature | R/W | — |
| `6efab52e-3002-4764-9430-016cef4dfc87` | Streaming/Bond Control | Write | — |
| `786ff607-774d-49d6-80a5-a17e08823d91` | Bonded Device Streaming | Write | — |

### PRE_POLARIS Only

| UUID | Description |
|------|-------------|
| `d5d0affb-35b8-4fdc-a50b-f777c90293b8` | Special PRE_POLARIS characteristic |

### Additional Unlabeled UUIDs (from `CharacteristicUuidProvider.java`)

After deep decode of `c.i.a.a.u.l.a(...)`, the primary provider list is now mostly mapped.
Previously listed UUIDs such as `29d9ed98...` / `9188040d...` were false positives from non-BLE codepaths and not Philips HA GATT characteristics.

| UUID | Notes |
|------|-------|
| `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3` | Present in proprietary callback switch, no action body in this build |
| `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | Parsed as single byte into internal field `r`; product semantic unresolved |
| `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87` | Seen in older asm reference, not active in recovered callback switch |

## Decoded callback map (service `56772eaf`)

Recovered from debug/bad-code pass of `c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)`:

- `e5892ebe...` -> tinnitus/mic volume + mute state (`byte0`, `byte1==0`)
- `60415e72...` -> EQ payload and 8-band gain decoding
- `9215a295...` -> make-audible/tinnitus characteristic decode
- `6e557876...` -> hearing environment frame decode (>=20-byte frame variants)
- `50632720...` -> streaming volume + mute state
- `d01ab591...` -> streaming state/source decode
- `5f35c43d...` -> HIID string
- `353ecc73...` -> partner HIID string
- `42e940ef...` -> program-info version; triggers refresh if changed
- `dcbe7a3e...` -> available-program bitset -> queue seed
- `68bfa64e...` -> program list handshake gate
- `bba1c7f1...` -> program metadata parser (category/name/flags)
- `535442f7...` -> active program id
- `1454e9d6...` -> main volume + mute state
- `58bbccc5...` -> volume range limits (main/stream/mic ranges)
- `bc6829c4...` -> uptime/session counters
- `268c4933...` -> no-op in this version
- `e24fac83...` -> one-byte internal status field

## Write Types
From `k.java` handler:
- `setWriteType(1)` — Write with response (reliable)
- `setWriteType(2)` — Write without response (fast)

## Bare GATT Communication Lifecycle

All communications are serialized through `c.i.a.a.r.h` (single-operation queue). Core operation classes:

- `c.i.a.a.r.d` — connect attempt
- `c.i.a.a.r.b` — MTU request (`512`)
- `c.i.a.a.r.f` — service discovery
- `c.i.a.a.r.c` — notification enable/disable + CCCD (`00002902...`) descriptor write
- `c.i.a.a.r.j` — characteristic read
- `c.i.a.a.r.l` — characteristic write
- `c.i.a.a.r.a` — connection priority request
- `c.i.a.a.r.k` — RSSI read

Ingress callbacks carrying HA communication payloads:

- `onCharacteristicRead`
- `onCharacteristicChanged`
- both routed to `c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)` for service/characteristic-specific decode
- `onCharacteristicWrite` routed to `c.i.a.a.u.k` for write reconciliation / convergence retries

Startup communication order in connected path:

1. Connect GATT
2. Request MTU and discover services
3. Enable notifications for subscribed characteristics (CCCD writes)
4. Initial read sweep over required characteristics
5. Feature control traffic (program/volume/stream/bonding)
