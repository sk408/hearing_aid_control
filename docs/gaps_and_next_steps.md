# Gaps and Next Steps

Status as of 2026-03-28. Documents what still needs investigation and what tools would help.

---

## Current Gaps by Manufacturer

### Starkey

| Gap | Detail |
|-----|--------|
| **GASS service UUID** | The Voice Assistant (GASS) service UUID is unknown — only characteristic UUIDs found. The characteristics (`b5a0badd`, `c43b2a46`, `7de95c7f`) are looked up across all services via `m38char(iGatt, uuid)`, so the parent service UUID is not visible in the lookup code. Need to inspect `Connection.java` service discovery flow or capture live GATT. |
| **HIP service UUID** | Same issue — `HearingInstrumentProfile.java` looks up `896Cxxxx` characteristics without specifying a service UUID. |
| **SSI service UUID** | `SSI.java` does not specify a service UUID for `5446xxxx` characteristics. |
| **Unknown GASS chars** | `d0b6dc42` and `84f9e90a` are retrieved in the GASS constructor but results are immediately discarded (not assigned to a named field). Purpose unknown — possibly placeholders for future features or legacy compatibility probes. |
| **Piccolo binary format** | `PiccoloCommand.java` and `PiccoloResponse.java` contain the command byte layout but the full binary protocol schema (op codes, field offsets, value encoding) has not been mapped. `PiccoloResponse.java` at 138KB has extensive message type parsing. |
| **ControlObjectId full enum** | Only 5 control objects are currently documented (MicrophoneVolume, TinnitusVolume, etc.). `ControlObjectId.java` likely has more values (programs, noise reduction, directionality settings). |
| **HaConfigOpCode** | `HaConfigOpCode.java` and `HAConfigID.java` contain the op-code and config-ID enums used over the GattConsolidation service. These have not been read. |

### ReSound / GN Hearing

| Gap | Detail |
|-----|--------|
| **All 25+ custom UUID labels** | UUID constants are in .NET assemblies (`asm_110.dll`, `asm_111.dll`, `asm_112.dll`) embedded in `dk.resound.smart3d.apk → assets/assemblies/`. The Java/DEX layer is a thin GATT bridge with no UUID string literals. Static decompilation of the Java layer cannot label these. |
| **GN e0262760 family roles** | The 7 characteristics of the `e0262760` service family (a011, a110, a111, a112, a113, a210) are unlabeled. They are the core GN Hearing proprietary protocol. |
| **Protocol structure** | Whether the GN proprietary protocol is binary (like Starkey's Piccolo) or structured (TLV, protobuf, etc.) is unknown without .NET decompilation or packet capture. |

### Philips / Oticon

| Gap | Detail |
|-----|--------|
| **Command byte encoding** | Characteristic UUIDs and their broad functions are well-documented. The actual byte-level encoding of write payloads (e.g., volume levels, program IDs, EQ values) is not mapped. |
| **PRE_POLARIS compatibility** | The legacy `14293049` service and `d5d0affb` characteristic used in pre-POLARIS devices have not been analyzed in depth. |

### Rexton / WS Audiology

| Gap | Detail |
|-----|--------|
| **Terminal IO full UUID table** | `8b82xxxx` family UUIDs: the 4-digit middle segment for each characteristic is represented as `...` in the docs. Full UUIDs need to be extracted from the decompiled source. |
| **Control/FAPI service details** | Same issue for `c8f7xxxx` family. The 8 "various" characteristics noted at the bottom of the Rexton table are unstated. |
| **FAPI protocol** | The Fitting API (FAPI) is used for remote programming. Its request/response format is unknown. |

---

## Recommended Next Steps

### 1. ReSound .NET Assembly Decompilation (Highest Priority)

**Tool:** [dnSpy](https://github.com/dnSpy/dnSpy) or [ILSpy](https://github.com/icsharpcode/ILSpy)

**Steps:**
1. Extract `assets/assemblies/` from `xapk_extracted/ReSound Smart 3D_1.43.1_APKPure/dk.resound.smart3d.apk` (it's a zip)
2. The assemblies blob may be compressed with LZ4 or XZ (Xamarin format) — use `Xamarin.Android.Tools.Bytecode` or the `decompress_assemblies` utility if needed
3. Open `asm_110.dll` in dnSpy and locate:
   - `CharacteristicsToUUID` class — maps enum values to UUID strings
   - `BLEManagerData` — characteristic assignments
   - `BLEInvoker` — shows which characteristics are written for each user action
4. Repeat for `asm_111.dll` (GattCharacteristic, HearingAidProfileProxy) and `asm_112.dll` (BLEHearingInstrumentProvider)

**Expected output:** Full labeled UUID table for all 25+ ReSound custom characteristics.

### 2. Live BLE Packet Capture

**Tool:** [nRF Sniffer for Bluetooth LE](https://www.nordicsemi.com/Products/Development-tools/nRF-Sniffer-for-Bluetooth-LE) + Wireshark

**Setup:** nRF52840 dongle running nRF Sniffer firmware, paired with Wireshark BLE dissector.

**What to capture:**
- Initial connection and service discovery (to confirm service UUIDs for Starkey HIP/SSI/GASS)
- Volume adjustment (to identify which characteristic carries volume writes and the byte encoding)
- Program change (to map program characteristic + payload format)
- ReSound app interactions (to label the `e0262760` family and custom UUIDs live)

**Expected output:** Ground-truth UUID assignments and binary protocol payload formats for all manufacturers.

### 3. Frida Dynamic Analysis

**Tool:** [Frida](https://frida.re/) + rooted Android device or emulator with BLE passthrough

**Targets:**
- Hook `BluetoothGattCharacteristic.setValue()` and `BluetoothGatt.writeCharacteristic()` to log all write payloads with the triggering UI action
- Hook `onCharacteristicChanged()` callbacks to capture notification payloads
- For ReSound: hook .NET Xamarin bridge to intercept UUID → operation mapping before the Java layer

**Script skeleton:**
```javascript
// Hook all BLE characteristic writes
Java.perform(() => {
  const BluetoothGatt = Java.use('android.bluetooth.BluetoothGatt');
  BluetoothGatt.writeCharacteristic.overload(
    'android.bluetooth.BluetoothGattCharacteristic'
  ).implementation = function(char) {
    console.log('[WRITE]', char.getUuid(), '->',
      char.getValue().map(b => b.toString(16).padStart(2,'0')).join(' '));
    return this.writeCharacteristic(char);
  };
});
```

**Expected output:** Complete mapping of UI action → UUID → payload bytes for all manufacturers.

### 4. Starkey Piccolo Protocol Mapping

**Steps:**
1. Read `PiccoloCommand.java` — base command structure (byte array layout, header format)
2. Read `PiccoloResponse.java` — parse all nested response type classes to map op-codes
3. Read `ControlObjectId.java` — get the full enum (expected: 20+ control objects)
4. Read `HaConfigOpCode.java` and `HAConfigID.java` — map HA config operations
5. Cross-reference with `PiccoloDispatcher.java` — which methods send which command bytes

**Expected output:** Piccolo binary protocol specification (op-code table, payload formats).

### 5. Service UUID Discovery for Starkey HIP/SSI/GASS

**Steps:**
1. Read `Connection.java` (the full file, not just lines 595–600) to find where service discovery results are consumed and which services are enumerated
2. Read `ProfileService.java` — likely contains the list of expected service UUIDs
3. Search for any file that calls `getService(UUID)` with a `896Cxxxx` or `5446xxxx` UUID as the argument rather than a characteristic lookup

### 6. Rexton Full UUID Extraction

**Steps:**
1. Run `grep -rn "8b82\|c8f7" jadx_output/rexton/` to find all Terminal IO and FAPI characteristic UUIDs with their full values
2. The existing docs use `...` placeholders — replace with confirmed hex strings

---

## Tool Summary

| Tool | Purpose | Priority |
|------|---------|----------|
| dnSpy / ILSpy | ReSound .NET assembly decompilation | High |
| nRF Sniffer + Wireshark | Live BLE packet capture | High |
| Frida | Dynamic BLE payload hooking | Medium |
| jadx (already used) | Static Java/Kotlin decompilation | Done |
| dotPeek | Alternative .NET decompiler | Low (fallback to dnSpy) |
