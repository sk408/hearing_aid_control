# Starkey Hearing Aid UUID Dossier 02: Runtime Capture Matrix

Date: 2026-03-28  
Scope: runtime validation matrix for Starkey Piccolo and related channels.

## 1) Matrix

| Action | TX path | TX bytes | RX path | RX expectation | status |
|---|---|---|---|---|---|
| Set volume | Piccolo char (`a287...` or `37a6...`) | `[0x12,0x06,0x04,0x00,0x04,0x35,volume]` | Piccolo response notify | success flag + updated control state | confirmed/partial |
| Program switch | Piccolo char | `[0x12,0x06,0x04,0x00,0x04,0x34,program]` | Piccolo response | active memory update | confirmed/partial |
| Mute toggle | Piccolo char | `[0x12,0x06,0x04,0x00,0x04,0x3A,muteByte]` | Piccolo response | muted bit transitions | confirmed/partial |
| Accessory stream start/stop | Piccolo char | `[0x12,0x06,0x04,0x00,0x04,0x3D,startByte]` | Piccolo response / SSI state | state transition | confirmed/partial |
| Get control state | Piccolo char | `[0x12,0x09,objHi,objLo]` | Piccolo response | control object payload bytes | confirmed |
| Read feature support | `26ddeaca...` read | n/a | `26ddeaca...` read result | feature bitfield by HAConfigID | partial |

## 2) Recommended capture sequencing

1. Connect and discover services.
2. Determine active Piccolo characteristic (primary then fallback).
3. Subscribe to Piccolo notification channel.
4. Execute exactly one UI action per capture window.
5. Record TX frame, RX frame, and resulting app state.

## 3) Unresolved items requiring runtime closure

- Lower transport wrapper under app-layer Piccolo commands.
- Correlation between HA config service operations and Piccolo operations for overlapping features.
- Semantics of unresolved assistant channels (`d0b6dc42...`, `84f9e90a...`).
- Parent-service attribution for HIP/GASS/SSI families when characteristic UUID lookup is ambiguous in static code.

## 4) Parent-service capture matrix

| Family | Characteristic samples | Static status | Runtime target |
|---|---|---|---|
| HIP | `896c9932`, `896c98ba`, `896c9950`, `896c990a`, `896c96ee` | class ownership confirmed; parent service unresolved | capture full service discovery and record each characteristic's `service_uuid` |
| SSI | `5446e255`, `5446e448`, `5446fb18`, `5446ea24`, `5446e63c`, `5446daa2` | class ownership confirmed; parent service unresolved | same as above, including notify-enabled channels |
| GASS | `b5a0badd`, `c43b2a46`, `7de95c7f`, `d0b6dc42`, `84f9e90a` | class ownership confirmed; parent service unresolved | same as above, then map command/status/audio-source roles by service |

## 5) Capture reminders

- Keep traces tagged with firmware and app version.
- Store both raw bytes and parsed fields (object IDs, feature IDs, success bit).
- Include no-op controls to identify baseline periodic notification traffic.
