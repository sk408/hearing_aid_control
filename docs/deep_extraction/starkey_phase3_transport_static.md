# Starkey Deep Extraction - Phase 3 (Static Transport Boundary)

Date: 2026-03-28  
Scope: static-only trace of the transport boundary below Piccolo app-layer frames.

## 1) Evidence anchors

- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloDispatcher.java`
  - `sendPayloadAtomic(...)` uses `PiccoloServiceIds.ProgrammingService.getId()` and calls `IServiceLibPiccolo.sendPacket(...)`.
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/PiccoloServiceIds.java`
  - `ProgrammingService((byte) 2)`.
- `artifacts/extracted/starkey_2.1.0/apktool/smali_classes3/com/starkey/connectivity/able/services/piccolo/ServiceLibPiccolo.smali`
  - `sendPacket([Lfu/p;BLku/d;)` joins payload bytes into a comma-delimited decimal string before JNI.
  - response is returned as comma-delimited decimal string and converted back to byte array.
- `jadx_output/starkey/sources/com/starkey/connectivity/able/services/piccolo/ServiceLibPiccolo$sendPacket$stringResponse$1.java`
  - calls `HIAWrapper.waitForRPToBeDone(...)` before transport call.
  - calls `PiccoloPacketTransportFeature.SendPacketResult(stringPayload, serviceTypeByte)`.
- `jadx_output/starkey/sources/hialibandroid/PiccoloPacketTransportFeature.java`
  - native entrypoint `n_SendPacketResult(String, byte)`.
- `jadx_output/starkey/sources/hialibandroid/DeviceConnectionFeatureLibrary.java`
  - `n_getPiccoloPacketTransportFeature()` establishes JNI-backed transport object retrieval.

## 2) Confirmed cross-layer flow

1. Caller builds app-layer Piccolo bytes (`[0x12,...]`) in dispatcher/command classes.
2. `PiccoloDispatcher.sendPayloadAtomic(...)` serializes one command at a time (mutex-protected) and sets service type to `0x02`.
3. `ServiceLibPiccolo.sendPacket(...)` converts byte array to CSV decimal string:
   - example shape: `"18,6,4,0,4,53,10"`.
4. coroutine waits for RP gate (`waitForRPToBeDone`) before crossing to native.
5. JNI call:
   - `SendPacketResult(stringPayload, serviceTypeByte)`.
6. native returns CSV decimal response string.
7. managed layer splits/parses to bytes and feeds `PiccoloResponsePacket.fromByteArray(...)`.

## 3) Transport boundary conclusions

What is now `confirmed`:

- boundary format across JNI is text CSV decimal, not raw byte array.
- explicit service discriminator is passed as a separate byte (`0x02` for ProgrammingService).
- command pipeline is serialized in dispatcher before native call.
- RP session gating is enforced before transport call.

What remains `partial`:

- native on-wire wrapper framing (headers/length/checksum/sequence/session fields).
- retry rules and retransmission logic inside native `n_SendPacketResult`.
- segmentation/reassembly strategy between CSV payload and BLE ATT packets.

## 4) Candidate wire-wrapper schema (bounded hypothesis)

Static Java/smali cannot prove exact on-air bytes, but the minimum candidate model is:

- input tuple to native:
  - `payloadCsv`: comma-delimited decimal app bytes.
  - `serviceType`: one-byte route selector.
- output tuple from native:
  - `responseCsv`: comma-delimited decimal response bytes.

Likely native-internal fields (unverified):

- transport header marker(s)
- payload length
- sequence or transaction id
- checksum or CRC
- service/channel id embedding

Confidence tags:

- CSV bridge and service byte: `confirmed`
- internal wrapper field list: `inferred`

## 5) Implementation impact (static-only)

- app-level protocol implementation can safely model:
  - Piccolo app payload builder (already confirmed in phase 2),
  - service id routing byte (`0x02`),
  - response parse by `PiccoloResponsePacket`.
- transport beneath JNI must remain explicitly blocked in docs/code as:
  - `native-wrapper-unknown`,
  - requiring runtime/native instrumentation for closure.

## 6) Runtime-closure checklist (for later phase)

- instrument around `n_SendPacketResult` boundary (entry args + return args).
- correlate JNI tuples with BLE write/notify captures.
- recover deterministic mapping:
  - `csv-in -> on-wire-bytes -> on-wire-response -> csv-out`.
