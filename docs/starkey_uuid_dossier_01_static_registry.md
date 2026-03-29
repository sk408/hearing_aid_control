# Starkey Hearing Aid UUID Dossier 01: Static Registry and Value Semantics

Date: 2026-03-28  
Scope: Starkey 2.1.0 static decode with Piccolo-centered control paths.

## 1) Evidence corpus

- `docs/starkey.md`
- `docs/deep_extraction/starkey_phase2_static.md`
- `docs/uuid_starkey_dossier_2026-03-28.md`
- `docs/ble_reference.md`

Confidence model:
- `confirmed`: byte-level framing recovered from static decode.
- `partial`: role is clear but value schema incomplete.
- `inferred`: best-effort semantic interpretation pending runtime proof.
- `inactive-in-baseline`: channel present but not active in the baseline build.

## 2) Service inventory

| UUID | Service | Status |
|---|---|---|
| `9a04f079-9840-4286-ab92-e65be0885f95` | Piccolo service | confirmed |
| `48ddf118-efd0-48fc-8f44-b9b8e17be397` | HA config service | confirmed |
| `5446ec0e-d711-11e4-b9d6-1681e6b88ec1` | E2E notification service | confirmed |

## 3) Core characteristic registry

### 3.1 Piccolo channels

| UUID | Label | Status |
|---|---|---|
| `a287a5f9-0fa3-bc84-2a41-c9da6d85bd4e` | primary Piccolo characteristic | confirmed |
| `37a691f4-7686-4280-caca-fba8b44b9360` | fallback Piccolo characteristic | confirmed |

Piccolo command framing (app layer):
- ExecuteFeature: `[0x12, 0x06, lenPlusFlags, flags, featureHi, featureLo, arg?]`
- GetControlState: `[0x12, 0x09, controlObjHi, controlObjLo]`

### 3.2 HA config service channels

| UUID | Label | Access | Status |
|---|---|---|---|
| `6401a620-89c5-4135-b4af-ea1c2e1ce524` | Control_Point | write | confirmed |
| `38278651-76d7-4dee-83d8-894f3fa6bb99` | Data_Source | read/notify | confirmed |
| `26ddeaca-a73c-4b61-a1de-87c5375b2706` | Feature_Support | read | confirmed |

### 3.3 HIP/SSI/auxiliary channels

Key IDs:
- HIP family: `896c9932...`, `896c98ba...`, `896c9950...`, `896c990a...`, `896c96ee...`
- SSI family: `5446e255...`, `5446e448...`, `5446fb18...`, `5446ea24...`, `5446e63c...`
- Tinnitus config: `5446daa2...`
- E2E channels: `0990d720...`, `a0370d1b...`
- Assistant/GASS: `b5a0badd...`, `c43b2a46...`, `7de95c7f...`, unresolved `d0b6dc42...`, `84f9e90a...`

### Parent service attribution (static status)

Evidence anchors:

- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/HearingInstrumentProfile.java`
  - resolves HIP-family characteristics via `IGattKt.char(...)`.
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/SSI.java`
  - resolves SSI-family characteristics via `IGattKt.char(...)`.
- `jadx_output/starkey/sources/com/starkey/device/features/smartassistant/voiceassistant/c.java`
  - resolves GASS-family characteristics via `IGattKt.char(...)`.
- `jadx_output/starkey/sources/com/starkey/connectivity/able/peripheral/gatt/IGattKt.java`
  - `char(...)` scans all discovered services and returns by characteristic UUID only.

Static conclusion:

- HIP (`896c*`) profile ownership in code: `confirmed`.
- SSI (`5446*`) profile ownership in code: `confirmed`.
- GASS characteristic ownership in code: `confirmed`.
- definitive characteristic -> parent-service UUID mapping for HIP/GASS: `partial` (not statically provable from this app because lookup is global by characteristic UUID).
- SSI parent-service mapping: `partial` for same reason (characteristic-level lookup without direct service UUID assertions in these classes).

## 4) Confirmed user-control value semantics

Feature IDs:
- SetVolume: `0x0435` -> request `[0x12,0x06,0x04,0x00,0x04,0x35,volume]`
- SetMemory(program): `0x0434` -> `[...0x34,memoryIndex]`
- SetMute: `0x043A` -> `[...0x3A,muteByte]`
- StartStopAccessoryStreaming: `0x043D` -> `[...0x3D,startByte]`

Control object IDs:
- `0x0000`..`0x000F` range recovered (Memory, volume objects, streaming, EQ, reduction states).

Response semantics:
- byte0 success flag (`!=0` success),
- remaining bytes command payload.

## 5) Potentially missing first-party coverage

- Lower transport wrapper bytes/checksum/segmentation under `SendPacketResult`.
- Full mapping of HA config service controls to user-visible features.
- Semantics for unresolved assistant characteristics (`d0b6dc42...`, `84f9e90a...`).
- Definitive HIP/GASS parent-service UUID attribution from runtime service-discovery evidence.

## 6) Reminders

- Preserve separation between app-layer Piccolo framing and lower transport framing.
- Capture primary/fallback characteristic selection per device model.
- Treat unresolved auxiliary channels as read-only/diagnostic until payloads are decoded.
