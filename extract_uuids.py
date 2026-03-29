"""Extract BLE UUIDs from hearing aid APKs using androguard."""
import re
import sys
from pathlib import Path
from androguard.misc import AnalyzeAPK

# UUID patterns
UUID_FULL = re.compile(
    r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
)
UUID_SHORT = re.compile(r'\b0x[0-9a-fA-F]{4}\b')
# fromString("...") pattern common in Android BLE code
FROM_STRING = re.compile(
    r'fromString\s*\(\s*"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"\s*\)'
)

# Known BLE base UUID suffix for 16-bit UUIDs
BLE_BASE = "0000-1000-8000-00805f9b34fb"

# Keywords that indicate BLE/hearing aid relevance
BLE_KEYWORDS = [
    'gatt', 'bluetooth', 'ble', 'characteristic', 'service', 'descriptor',
    'hearing', 'audio', 'volume', 'program', 'mute', 'battery',
    'writeCharacteristic', 'readCharacteristic', 'setNotification',
    'BluetoothGatt', 'UUID', 'fromString',
]


def analyze_apk(apk_path):
    print(f"\n{'='*80}")
    print(f"Analyzing: {Path(apk_path).name}")
    print(f"{'='*80}")

    a, d, dx = AnalyzeAPK(apk_path)

    print(f"\nPackage: {a.get_package()}")
    print(f"Permissions: {[p for p in a.get_permissions() if 'BLUETOOTH' in p.upper()]}")

    # Collect all UUIDs found with their context
    uuid_contexts = {}  # uuid -> set of contexts

    for dex in d:
        for cls in dex.get_classes():
            cls_name = cls.get_name()

            # Skip standard Android/library classes that aren't BLE-related
            if any(skip in cls_name for skip in [
                'Landroid/', 'Ljava/', 'Lkotlin/', 'Lcom/google/protobuf/',
                'Lorg/apache/', 'Lokhttp3/', 'Lretrofit2/',
            ]):
                continue

            for method in cls.get_methods():
                try:
                    code = method.get_source()
                    if not code:
                        continue
                except Exception:
                    continue

                # Look for full UUIDs
                for match in UUID_FULL.finditer(code):
                    uuid = match.group().lower()
                    context_key = f"{cls_name}->{method.get_name()}"
                    if uuid not in uuid_contexts:
                        uuid_contexts[uuid] = set()
                    uuid_contexts[uuid].add(context_key)

    # Categorize UUIDs
    print(f"\n--- Found {len(uuid_contexts)} unique UUIDs ---\n")

    ble_uuids = {}
    other_uuids = {}

    for uuid, contexts in sorted(uuid_contexts.items()):
        # Check if any context suggests BLE usage
        is_ble = any(
            any(kw.lower() in ctx.lower() for kw in BLE_KEYWORDS)
            for ctx in contexts
        )
        # Also check if the UUID itself matches the BLE base pattern
        if BLE_BASE in uuid:
            is_ble = True

        if is_ble:
            ble_uuids[uuid] = contexts
        else:
            other_uuids[uuid] = contexts

    print("=== BLE / Hearing Aid Related UUIDs ===\n")
    if ble_uuids:
        for uuid, contexts in sorted(ble_uuids.items()):
            print(f"  UUID: {uuid}")
            for ctx in sorted(contexts):
                print(f"    -> {ctx}")
            print()
    else:
        print("  (none found via keyword matching)\n")

    print("=== Other UUIDs (may still be relevant) ===\n")
    for uuid, contexts in sorted(other_uuids.items()):
        print(f"  UUID: {uuid}")
        for ctx in sorted(contexts)[:3]:  # limit context lines
            print(f"    -> {ctx}")
        if len(contexts) > 3:
            print(f"    ... and {len(contexts)-3} more locations")
        print()

    return uuid_contexts


def find_ble_classes(apk_path):
    """Find classes that interact with BLE APIs."""
    print(f"\n{'='*80}")
    print(f"BLE Class Analysis: {Path(apk_path).name}")
    print(f"{'='*80}")

    a, d, dx = AnalyzeAPK(apk_path)

    ble_classes = set()
    for dex in d:
        for cls in dex.get_classes():
            cls_name = cls.get_name()
            source = ""
            try:
                source = cls.get_source()
            except Exception:
                continue
            if not source:
                continue

            # Look for BLE interaction patterns
            if any(pattern in source for pattern in [
                'BluetoothGatt', 'BluetoothGattService',
                'BluetoothGattCharacteristic', 'getService',
                'writeCharacteristic', 'readCharacteristic',
                'setCharacteristicNotification', 'fromString',
            ]):
                if not any(skip in cls_name for skip in [
                    'Landroid/', 'Ljava/',
                ]):
                    ble_classes.add(cls_name)

    print(f"\nClasses interacting with BLE ({len(ble_classes)}):\n")
    for cls in sorted(ble_classes):
        print(f"  {cls}")

    return ble_classes


if __name__ == '__main__':
    apks = list(Path('.').glob('*.apk'))
    if not apks:
        print("No APK files found in current directory")
        sys.exit(1)

    all_uuids = {}
    for apk in apks:
        uuids = analyze_apk(str(apk))
        all_uuids[apk.name] = uuids

    # Show UUIDs common to both APKs
    if len(all_uuids) == 2:
        names = list(all_uuids.keys())
        common = set(all_uuids[names[0]].keys()) & set(all_uuids[names[1]].keys())
        print(f"\n{'='*80}")
        print(f"UUIDs COMMON to both APKs ({len(common)}):")
        print(f"{'='*80}\n")
        for uuid in sorted(common):
            print(f"  {uuid}")
            for name in names:
                for ctx in sorted(all_uuids[name][uuid])[:2]:
                    print(f"    [{name[:20]}] {ctx}")
            print()
