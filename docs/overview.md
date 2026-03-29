# Hearing Aid BLE Protocol Overview

## Research Summary

Reverse-engineered BLE service and characteristic UUIDs from four manufacturer companion apps:
- **Philips HearLink** (v2.5.0) — Built on Oticon/Demant platform
- **Starkey** (v2.1.0) — Native Android/Kotlin, "Piccolo" protocol
- **ReSound Smart 3D** (v1.43.1) — GN Hearing, Mono/.NET based
- **Rexton** (v2.7.32) — Sivantos/WS Audiology, Mono/.NET based

## Protocol Landscape

### Standard Protocols
| Protocol | UUID | Used By |
|----------|------|---------|
| ASHA (Audio Streaming for Hearing Aid) | `0000fdf0-0000-1000-8000-00805f9b34fb` | Philips, ReSound |
| MFi HAP (Made for iPhone) | `7d74f4bd-c74a-4431-862c-cce884371592` | Philips, ReSound |
| Device Information Service | `0000180a-0000-1000-8000-00805f9b34fb` | All |
| Battery Service | `0000180f-0000-1000-8000-00805f9b34fb` | Philips, Rexton |

### Proprietary Protocols
| Manufacturer | Primary Service UUID | Protocol Name |
|--------------|---------------------|---------------|
| Philips/Oticon | `56772eaf-2153-4f74-acf3-4368d99fbf5a` | "POLARIS" |
| Starkey | `9a04f079-9840-4286-ab92-e65be0885f95` | "Piccolo" |
| ReSound/GN | `e0262760-08c2-11e1-9073-0e8ac72ea010` (family) | GN Proprietary |
| Rexton/WSA | `56772eaf` (shared Oticon) + `8b82xxxx` + `c8f7xxxx` families | WSA BLE |

## Architecture Patterns

### Philips HearLink
- Java/Kotlin native Android
- Oticon `blegenericmodule` BLE abstraction
- Two device generations: POLARIS (current) and PRE_POLARIS (legacy)
- Full characteristic map with functional labels recovered

### Starkey
- Native Android/Kotlin
- Piccolo binary command protocol over BLE
- Control objects: volume, program, tinnitus, streaming, balance
- `PiccoloDispatcher` sends commands, `PiccoloResponse` parses replies

### ReSound Smart 3D
- Mono/.NET (Xamarin) with native Android BLE bridge
- UUIDs stored in .NET assemblies (asm_110.dll)
- 7-UUID proprietary family: `e0262760-08c2-11e1-9073-0e8ac72eaXXX`
- ~30 additional custom characteristic UUIDs

### Rexton
- .NET MAUI 8 with native Android BLE bridge
- WSA.Plugin.BLE framework, assemblies in XALZ-compressed ELF blob
- **Shares Oticon/Philips POLARIS platform**: same Hi Service (`56772eaf`), Hi Id, Volume UUIDs
- Two proprietary UUID families: `8b82xxxx` (Terminal IO) and `c8f7xxxx` (Control/FAPI)
- 81 UUIDs total in main Bluetooth assembly, ~50 proprietary
- Labeled characteristics recovered: volume, program, config, bonding, FAPI (remote fitting)

## Common Control Features
All four apps expose these hearing aid controls:
1. **Volume** — master, per-ear balance, streaming volume
2. **Program switching** — select listening programs
3. **Muting** — quick mute/unmute
4. **Battery status** — read battery level
5. **Tinnitus management** — tinnitus sound generator control
6. **Streaming** — audio streaming volume and routing
7. **Firmware info** — read device firmware version

## Source Files
- `docs/philips_hearlink.md` — Full Philips/Oticon UUID map
- `docs/starkey.md` — Starkey Piccolo protocol details
- `docs/resound.md` — ReSound/GN UUID map
- `docs/rexton.md` — Rexton/WSA BLE details
- `docs/ble_reference.md` — Complete cross-manufacturer UUID reference
