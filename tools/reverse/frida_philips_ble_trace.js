/*
 * Philips HearLink BLE tracer (Frida Java hook)
 *
 * Captures:
 * - outgoing characteristic payloads via BluetoothGattCharacteristic.setValue([B)
 * - incoming callback payloads via c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)
 *
 * Usage example:
 *   frida -U -f com.philips.hearlink -l tools/reverse/frida_philips_ble_trace.js
 */

function nowIso() {
  return new Date().toISOString();
}

function safeString(fn, fallback) {
  try {
    const v = fn();
    if (v === null || v === undefined) return fallback;
    return String(v);
  } catch (_) {
    return fallback;
  }
}

function bytesToHex(bytes) {
  if (!bytes) return "";
  const out = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] & 0xff;
    out.push((b < 16 ? "0" : "") + b.toString(16));
  }
  return out.join("");
}

function logEvent(evt) {
  console.log(JSON.stringify(evt));
}

Java.perform(function () {
  const BluetoothGattCharacteristic = Java.use("android.bluetooth.BluetoothGattCharacteristic");

  // Outgoing payloads set on characteristics before write operations.
  const setValueBytes = BluetoothGattCharacteristic.setValue.overload("[B");
  setValueBytes.implementation = function (arr) {
    const serviceUuid = safeString(() => this.getService().getUuid().toString(), "");
    const charUuid = safeString(() => this.getUuid().toString(), "");
    const writeType = safeString(() => this.getWriteType(), "");

    const payload = Java.array("byte", arr);
    logEvent({
      ts: nowIso(),
      dir: "tx_prepare",
      api: "BluetoothGattCharacteristic.setValue([B)",
      service_uuid: serviceUuid,
      char_uuid: charUuid,
      write_type: writeType,
      len: payload.length,
      hex: bytesToHex(payload),
    });
    return setValueBytes.call(this, arr);
  };

  // Main Philips callback parser recovered from static decompilation.
  const PhilipsCallback = Java.use("c.i.a.a.u.l");
  const onBytes = PhilipsCallback.a.overload(
    "android.bluetooth.BluetoothGattCharacteristic",
    "[B",
    "java.lang.String"
  );
  onBytes.implementation = function (ch, arr, serviceUuid) {
    const charUuid = safeString(() => ch.getUuid().toString(), "");
    const payload = Java.array("byte", arr);

    logEvent({
      ts: nowIso(),
      dir: "rx",
      api: "c.i.a.a.u.l.a(BluetoothGattCharacteristic,byte[],String)",
      service_uuid: String(serviceUuid),
      char_uuid: charUuid,
      len: payload.length,
      hex: bytesToHex(payload),
    });
    return onBytes.call(this, ch, arr, serviceUuid);
  };

  logEvent({
    ts: nowIso(),
    kind: "status",
    msg: "philips BLE trace hooks installed",
  });
});
