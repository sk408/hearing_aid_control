# Rexton — BLE Protocol Reference

## Source
- APK: Rexton App v2.7.32.16308 (XAPK)
- Platform: .NET MAUI 8 with native Android BLE bridge
- Manufacturer: Sivantos / WS Audiology
- Decompiled with: JADX + XALZ assembly extraction from `libassemblies.arm64-v8a.blob.so`

## Key Source Files

### Java/Android Layer
- `jadx_output/rexton/sources/crc6469638a7b57755299/GattCallback.java` — BluetoothGattCallback
- `jadx_output/rexton/sources/crc6469638a7b57755299/Adapter_Api21BleScanCallback.java` — BLE scan (API 21+)
- `jadx_output/rexton/sources/crc6469638a7b57755299/Adapter_Api18BleScanCallback.java` — BLE scan (API 18)
- `jadx_output/rexton/sources/crc6469638a7b57755299/BluetoothStatusBroadcastReceiver.java` — BT state
- `jadx_output/rexton/sources/crc6469638a7b57755299/BondStatusBroadcastReceiver.java` — Bond state

### .NET Assemblies (extracted from XALZ blob)
Key assemblies with UUIDs:
- **asm_230.dll** (1.1MB) — `WSA.Foundation.Bluetooth.dll` — 81 UUIDs, **main BLE service/characteristic map**
- **asm_265.dll** (58KB) — `WSA.Plugin.BLE.Abstractions.dll` — CCCD UUID
- **asm_266.dll** (88KB) — `WSA.Plugin.BLE.dll` — 233 standard BLE GATT UUIDs (full registry)

Other BLE-related assemblies: asm_069, asm_077, asm_085, asm_086, asm_089, asm_096, asm_098, asm_109, asm_117, asm_118, asm_231, asm_339, asm_340

## BLE Architecture

```
Component.HearingAidConnection
    └── WSA.Foundation.Bluetooth.HearingAsAService
        └── WSA.Foundation.Bluetooth          ← asm_230.dll (UUID map lives here)
            └── WSA.Plugin.BLE                ← asm_265/266.dll (generic BLE stack)
                └── Android BluetoothGatt (Java bridge via crc6469638a7b57755299)
```

## GATT Services — Proprietary

### Terminal IO Service
Base UUID family: `8b82xxxx-0f0c-40bb-b422-3770fa72a864`

| UUID | Label |
|------|-------|
| `8b82105d-0f0c-40bb-b422-3770fa72a864` | Terminal IO Service (service) |
| `8b822409-0f0c-40bb-b422-3770fa72a864` | Data RX |
| `8b82b999-0f0c-40bb-b422-3770fa72a864` | Data TX |
| `8b82cd2d-0f0c-40bb-b422-3770fa72a864` | Protocol Choice |
| `8b82a76f-0f0c-40bb-b422-3770fa72a864` | Ready for RX |
| `8b82f3b9-0f0c-40bb-b422-3770fa72a864` | Ready for TX |

### Control Service
Base UUID family: `c8f7xxxx-21b2-45b8-87f8-bd49a13eff49`

| UUID | Label |
|------|-------|
| `c8f75466-21b2-45b8-87f8-bd49a13eff49` | Control Request |
| `c8f79c9a-21b2-45b8-87f8-bd49a13eff49` | (Control Service char) |
| `c8f70447-21b2-45b8-87f8-bd49a13eff49` | Control Response |
| `c8f73dc3-21b2-45b8-87f8-bd49a13eff49` | (Control char) |
| `c8f72804-21b2-45b8-87f8-bd49a13eff49` | Data Request |
| `c8f7a8e4-21b2-45b8-87f8-bd49a13eff49` | (Data char) |
| `c8f72fef-21b2-45b8-87f8-bd49a13eff49` | Data Response |
| `c8f7a68a-21b2-45b8-87f8-bd49a13eff49` | (Data char) |
| `c8f76c2c-21b2-45b8-87f8-bd49a13eff49` | Advanced Control Command |
| `c8f714d6-21b2-45b8-87f8-bd49a13eff49` | App Data |
| `c8f76c20-21b2-45b8-87f8-bd49a13eff49` | Configuration File |
| `c8f747ac-21b2-45b8-87f8-bd49a13eff49` | (Config char) |
| `c8f74ffb-21b2-45b8-87f8-bd49a13eff49` | (Config char) |
| `c8f73c59-21b2-45b8-87f8-bd49a13eff49` | FB4H Data |
| `c8f7eea2-21b2-45b8-87f8-bd49a13eff49` | Identifiers |
| `c8f777d0-21b2-45b8-87f8-bd49a13eff49` | (Identifier char) |
| `c8f7a831-21b2-45b8-87f8-bd49a13eff49` | (Programming char) |
| `c8f7fac0-21b2-45b8-87f8-bd49a13eff49` | (Programming char) |
| `c8f7a5ab-21b2-45b8-87f8-bd49a13eff49` | (Programming char) |
| `c8f79346-21b2-45b8-87f8-bd49a13eff49` | (Programming char) |
| `c8f7ac86-21b2-45b8-87f8-bd49a13eff49` | (Programming char) |
| `c8f7d5ad-21b2-45b8-87f8-bd49a13eff49` | (Data char) |
| `c8f723da-21b2-45b8-87f8-bd49a13eff49` | FAPI Request |
| `c8f7690c-21b2-45b8-87f8-bd49a13eff49` | FAPI Response |

### Programming Service
| UUID | Label |
|------|-------|
| `8b8225e0-0f0c-40bb-b422-3770fa72a864` | Active Program Info |
| `8b8276e8-0f0c-40bb-b422-3770fa72a864` | Basic Control Command |
| `8b823656-0f0c-40bb-b422-3770fa72a864` | Configuration Check |
| `8b8246c8-0f0c-40bb-b422-3770fa72a864` | (Programming char) |

### Hearing Instrument Service
| UUID | Label |
|------|-------|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | Hi Service (shared with Oticon/Philips!) |
| `83e28ff3-25ad-4bfe-aaf0-5a95dba4b56b` | Hi State |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | Hi Id (shared with Philips!) |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Partner Id (shared with Philips!) |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | Oble Volume (shared with Philips!) |
| `d28617fe-0ad5-40c5-a04a-bc89051ff755` | Ear |
| `bdf8a334-1c7b-46e9-b4c2-800b8966136b` | Identifiers |
| `62e84690-3757-4af3-95f5-269e0f7b7c0a` | (HI char) |

### FAPI Service (Fitting API)
| UUID | Label |
|------|-------|
| `d1d4dc2a-215f-44d2-b44c-0f4de3c91af2` | Fapi Service |
| `c8f723da-21b2-45b8-87f8-bd49a13eff49` | FAPI Request |
| `c8f7690c-21b2-45b8-87f8-bd49a13eff49` | FAPI Response |

### Bonding Service
| UUID | Label |
|------|-------|
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | Bonding Service (same as Philips ASHA UUID!) |
| `d61cb039-62dc-4426-90ab-2077c7e9205e` | (Bonding char) |
| `62dcc92f-59c2-4228-9a11-c85f18773530` | Device Type Input |
| `8e467a33-820e-40fa-8759-4cd7a197384d` | Pairing State |
| `ebee6f69-70b6-4bb9-b13b-9ba84953c233` | Battery Level |
| `6efab52e-3002-4764-9430-016cef4dfc87` | Bonded Device Info Access |
| `336e6111-6ce2-44f8-a2fd-9e92972121a7` | Bonded Device Info |

### Other Custom UUIDs
| UUID | Label |
|------|-------|
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | (shared with Philips) |
| `cf2ac7b4-3cbc-46b0-9cf1-264443e2c1c0` | (custom char) |
| `22e01397-43cb-45b6-a921-b28271e4e989` | Configuration Check (additional) |
| `38cf7c2b-1925-4a41-860f-68c511e4317b` | (custom char) |
| `1959387a-e2c9-448a-b8b3-8d8d7f2f03d1` | (custom char) |
| `8b821572-0f0c-40bb-b422-3770fa72a864` | (Terminal IO family) |
| `62f7e35b-7763-4200-8688-f50ec96816ef` | (custom char) |
| `8b82f55d-0f0c-40bb-b422-3770fa72a864` | (Terminal IO family) |
| `8b820369-0f0c-40bb-b422-3770fa72a864` | (Terminal IO family) |
| `8b820c6d-0f0c-40bb-b422-3770fa72a864` | (Terminal IO family) |
| `6eabf749-7729-41fb-9001-bba9677018f8` | (custom char) |
| `f9252eea-7236-4cc4-a9e0-bd72724dc7d6` | (custom char) |
| `7e19ff52-6fa0-4d16-b746-fc40821f3715` | (custom char) |
| `6ead405e-9301-4231-86af-7ad94ef090ef` | Advanced Control Command (additional) |
| `3f73cb3e-7308-4f67-a6ba-10df1067382e` | (before Generic Attribute) |
| `8e467a33-820e-40fa-8759-4cd7a197384d` | Pairing State |
| `62dcc92f-59c2-4228-9a11-c85f18773530` | Device Type Input |
| `c8f7a831-21b2-45b8-87f8-bd49a13eff49` | Programming Service (service) |

## GATT Services — Standard

From `asm_230.dll`:
| UUID | Label |
|------|-------|
| `00001800-0000-1000-8000-00805f9b34fb` | Generic Access |
| `00001801-0000-1000-8000-00805f9b34fb` | Generic Attribute |
| `0000180a-0000-1000-8000-00805f9b34fb` | Device Information Service |
| `0000180f-0000-1000-8000-00805f9b34fb` | Battery Service |

Standard Characteristics used:
| UUID | Label |
|------|-------|
| `00002a00-0000-1000-8000-00805f9b34fb` | Device Name |
| `00002a01-0000-1000-8000-00805f9b34fb` | Appearance |
| `00002a02-0000-1000-8000-00805f9b34fb` | Peripheral Privacy Flag |
| `00002a04-0000-1000-8000-00805f9b34fb` | Peripheral Preferred Connection Parameters |
| `00002a05-0000-1000-8000-00805f9b34fb` | Service Changed |
| `00002a19-0000-1000-8000-00805f9b34fb` | Battery Level |
| `00002a24-0000-1000-8000-00805f9b34fb` | Model Number |
| `00002a25-0000-1000-8000-00805f9b34fb` | Serial Number |
| `00002a26-0000-1000-8000-00805f9b34fb` | Firmware Revision |
| `00002a27-0000-1000-8000-00805f9b34fb` | Hardware Revision |
| `00002a28-0000-1000-8000-00805f9b34fb` | Software Revision |
| `00002a29-0000-1000-8000-00805f9b34fb` | Manufacturer Name |
| `00002902-0000-1000-8000-00805f9b34fb` | CCCD |

## DEX UUIDs (Java layer)

| UUID | Notes |
|------|-------|
| `9a04f079-9840-4286-ab92-e65be0885f95` | Shared with Starkey (Piccolo?) |
| `e2719d58-a985-b3c9-781a-b030af78d30e` | Rexton-specific |
| `edef8ba9-79d6-4ace-a3c8-27dcd51d21ed` | Widevine DRM (not BLE) |

## Key Findings

### Shared UUIDs with Philips/Oticon
Rexton shares **significant** BLE infrastructure with Philips (Oticon/Demant):
- `56772eaf` — Hi Service (POLARIS service)
- `5f35c43d` — Hi Id
- `353ecc73` — Partner Id
- `50632720` — Oble Volume (streaming control)
- `34dfc7cb` — Extended Feature
- `6efab52e` — Bonded Device Info Access
- `0a23ae62` — Bonding/ASHA Service

This confirms WS Audiology licenses or shares the Oticon/Demant BLE hearing instrument platform.

### Proprietary UUID Families
Two distinct base UUID families for proprietary characteristics:
1. **`8b82xxxx-0f0c-40bb-b422-3770fa72a864`** — Terminal IO / Programming (14 UUIDs)
2. **`c8f7xxxx-21b2-45b8-87f8-bd49a13eff49`** — Control / Data / FAPI (24 UUIDs)

### Total UUID Count
- 81 unique UUIDs in main Bluetooth assembly (asm_230.dll)
- ~50 proprietary hearing aid characteristics
- 13 standard GATT characteristics
- 3 DEX-layer UUIDs

## Notes
- Rexton is part of WS Audiology (merger of Sivantos and Widex)
- The WSA namespace confirms shared platform with Signia brand
- .NET MAUI 8 with AOT compilation — assemblies stored in XALZ-compressed blob inside ELF `.so`
- "FB4H" likely stands for "FitBridge for Hearing" — remote fitting protocol
- "FAPI" = Fitting API — audiologist-facing remote programming interface
- `Component.CloudProMobile.BleHearingAidAccess.dll` enables telecare via BLE
