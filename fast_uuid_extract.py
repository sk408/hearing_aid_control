"""Fast UUID extraction from APK DEX files - searches raw string constants."""
import re
import zipfile
import struct
from pathlib import Path

UUID_RE = re.compile(
    rb'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
)

# Also grab strings near UUIDs for context
BLE_STRINGS_RE = re.compile(
    rb'[\x20-\x7e]{4,200}'  # printable ASCII strings 4+ chars
)

# Known standard BLE UUIDs to label
KNOWN_UUIDS = {
    "00001800-0000-1000-8000-00805f9b34fb": "Generic Access",
    "00001801-0000-1000-8000-00805f9b34fb": "Generic Attribute",
    "0000180a-0000-1000-8000-00805f9b34fb": "Device Information",
    "0000180f-0000-1000-8000-00805f9b34fb": "Battery Service",
    "00001812-0000-1000-8000-00805f9b34fb": "HID Service",
    "00002a00-0000-1000-8000-00805f9b34fb": "Device Name",
    "00002a01-0000-1000-8000-00805f9b34fb": "Appearance",
    "00002a19-0000-1000-8000-00805f9b34fb": "Battery Level",
    "00002a29-0000-1000-8000-00805f9b34fb": "Manufacturer Name",
    "00002a24-0000-1000-8000-00805f9b34fb": "Model Number",
    "00002a25-0000-1000-8000-00805f9b34fb": "Serial Number",
    "00002a26-0000-1000-8000-00805f9b34fb": "Firmware Revision",
    "00002a27-0000-1000-8000-00805f9b34fb": "Hardware Revision",
    "00002a28-0000-1000-8000-00805f9b34fb": "Software Revision",
    "00002902-0000-1000-8000-00805f9b34fb": "CCCD (Client Characteristic Config)",
    "0000febe-0000-1000-8000-00805f9b34fb": "Bose Service",
    # ASHA (Audio Streaming for Hearing Aid)
    "0000fdf0-0000-1000-8000-00805f9b34fb": "ASHA Service (Android)",
    "6333651e-c481-4a3e-9169-7c902aad37bb": "ASHA Read Only Properties",
    "f0d4de7e-4a88-476c-9d9f-1937b0996cc0": "ASHA Audio Control Point",
    "38663f1a-e711-4cac-b641-326b56404837": "ASHA Audio Status",
    "00e4ca9e-ab14-41e4-8823-f9e70c7e91df": "ASHA Volume",
    "73bda8d5-9913-4c1d-83bb-46e5e4a7a548": "ASHA LE PSM Out",
    # MFi Hearing Aid
    "7d74f4bd-c74a-4431-862c-cce884371592": "MFi HAP Service",
}


def extract_strings_from_dex(data):
    """Extract all string constants from a DEX file."""
    strings = set()
    # Find all printable ASCII strings of length >= 4
    for match in BLE_STRINGS_RE.finditer(data):
        s = match.group().decode('ascii', errors='ignore')
        strings.add(s)
    return strings


def extract_uuids_from_data(data):
    """Find all UUIDs in raw binary data."""
    uuids = set()
    for match in UUID_RE.finditer(data):
        uuid = match.group().decode('ascii').lower()
        uuids.add(uuid)
    return uuids


def get_context_strings(data, uuid_bytes, window=500):
    """Get nearby strings around a UUID occurrence for context."""
    contexts = []
    start = 0
    while True:
        pos = data.find(uuid_bytes, start)
        if pos == -1:
            break
        region = data[max(0, pos - window):pos + len(uuid_bytes) + window]
        nearby = []
        for m in BLE_STRINGS_RE.finditer(region):
            s = m.group().decode('ascii', errors='ignore')
            if len(s) > 3 and s != uuid_bytes.decode('ascii', errors='ignore'):
                nearby.append(s)
        contexts.extend(nearby)
        start = pos + 1
    return contexts


def analyze_apk(apk_path):
    print(f"\n{'='*80}")
    print(f"APK: {Path(apk_path).name}")
    print(f"{'='*80}")

    all_uuids = set()
    all_strings = set()
    uuid_file_map = {}  # uuid -> list of filenames where found

    with zipfile.ZipFile(apk_path, 'r') as zf:
        for entry in zf.namelist():
            # Search DEX files, XML files, and any text-like resources
            if entry.endswith('.dex') or entry.endswith('.xml') or \
               'ble' in entry.lower() or 'bluetooth' in entry.lower() or \
               'hearing' in entry.lower() or 'gatt' in entry.lower() or \
               entry.startswith('res/') and entry.endswith('.xml'):
                try:
                    data = zf.read(entry)
                except Exception:
                    continue

                uuids = extract_uuids_from_data(data)
                if uuids:
                    for u in uuids:
                        if u not in uuid_file_map:
                            uuid_file_map[u] = []
                        uuid_file_map[u].append(entry)
                all_uuids.update(uuids)

                if entry.endswith('.dex'):
                    all_strings.update(extract_strings_from_dex(data))

        # Also search ALL files for UUIDs (libs, assets, etc.)
        for entry in zf.namelist():
            if entry.endswith('.dex'):
                continue  # already searched
            if entry.endswith(('.so', '.png', '.jpg', '.webp', '.ogg', '.mp3')):
                continue  # skip binary media
            try:
                data = zf.read(entry)
                if len(data) > 10_000_000:
                    continue  # skip huge files
                uuids = extract_uuids_from_data(data)
                for u in uuids:
                    if u not in uuid_file_map:
                        uuid_file_map[u] = []
                    uuid_file_map[u].append(entry)
                all_uuids.update(uuids)
            except Exception:
                continue

    # Categorize
    ble_standard = {}
    ble_custom = {}
    other = {}

    BLE_BASE_SUFFIX = "0000-1000-8000-00805f9b34fb"

    for uuid in sorted(all_uuids):
        label = KNOWN_UUIDS.get(uuid, "")
        files = uuid_file_map.get(uuid, [])

        if label:
            ble_standard[uuid] = (label, files)
        elif BLE_BASE_SUFFIX in uuid:
            # Standard BLE UUID format but not in our known list
            short = uuid.split('-')[0].lstrip('0') or '0'
            ble_standard[uuid] = (f"Standard BLE (0x{short.upper()})", files)
        else:
            # Check if it appears in BLE-related context
            is_ble = any(
                kw in f.lower() for f in files
                for kw in ['ble', 'bluetooth', 'gatt', 'hearing', 'dex']
            )
            if is_ble:
                ble_custom[uuid] = ("Custom/Vendor BLE UUID", files)
            else:
                other[uuid] = ("Non-BLE UUID", files)

    # Print results
    print(f"\nTotal unique UUIDs found: {len(all_uuids)}")

    print(f"\n--- Standard BLE UUIDs ({len(ble_standard)}) ---")
    for uuid, (label, files) in sorted(ble_standard.items()):
        print(f"  {uuid}  [{label}]")
        for f in files[:3]:
            print(f"    in: {f}")

    print(f"\n--- Custom/Vendor BLE UUIDs ({len(ble_custom)}) ---")
    print("  (These are the most interesting - likely hearing aid specific)")
    for uuid, (label, files) in sorted(ble_custom.items()):
        print(f"  {uuid}")
        for f in files[:3]:
            print(f"    in: {f}")

    print(f"\n--- Other UUIDs ({len(other)}) ---")
    for uuid, (label, files) in sorted(other.items()):
        print(f"  {uuid}")
        for f in files[:2]:
            print(f"    in: {f}")

    # Also look for BLE-related strings that might give us protocol info
    print(f"\n--- BLE-Related Strings ---")
    ble_keywords = ['gatt', 'characterist', 'service_uuid', 'ble_', 'hearing',
                    'audio_stream', 'volume', 'program', 'mute', 'battery',
                    'asha', 'mfi', 'write_char', 'read_char', 'notify']
    ble_strings = sorted(s for s in all_strings
                         if any(kw in s.lower() for kw in ble_keywords)
                         and len(s) < 200)
    for s in ble_strings[:100]:
        print(f"  {s}")

    return all_uuids, ble_custom, ble_standard


if __name__ == '__main__':
    apks = sorted(Path('.').glob('*.apk'))
    if not apks:
        print("No APK files found")
        exit(1)

    results = {}
    for apk in apks:
        print(f"\nProcessing {apk.name} ({apk.stat().st_size / 1024 / 1024:.1f} MB)...")
        all_uuids, custom, standard = analyze_apk(str(apk))
        results[apk.name] = {
            'all': all_uuids,
            'custom': custom,
            'standard': standard,
        }

    if len(results) >= 2:
        names = list(results.keys())
        print(f"\n{'='*80}")
        print("CROSS-APK ANALYSIS")
        print(f"{'='*80}")

        all_custom = set()
        for name, r in results.items():
            all_custom.update(r['custom'].keys())

        common_custom = set.intersection(*(set(r['custom'].keys()) for r in results.values()))
        print(f"\nCustom UUIDs shared across ALL apps ({len(common_custom)}):")
        for uuid in sorted(common_custom):
            print(f"  {uuid}")

        print(f"\nAll custom/vendor UUIDs across all apps:")
        for uuid in sorted(all_custom):
            found_in = [n for n, r in results.items() if uuid in r['custom']]
            marker = " [SHARED]" if len(found_in) > 1 else ""
            print(f"  {uuid}{marker}")
            for n in found_in:
                print(f"    in: {n}")
