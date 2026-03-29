# Philips Hearing Aid UUID Dossier 02: Runtime Capture Matrix

Date: 2026-03-28
Scope: Action-to-frame mapping for Philips HearLink baseline (`2.5.0.10268`) using current static decode plus capture-ready expectations.

---

## 1) Purpose

This dossier translates static findings into a runtime validation matrix:

- UI action -> expected TX characteristic -> expected payload bytes
- expected RX characteristic(s) and parse behavior
- convergence/retry logic
- confidence and validation status

---

## 2) Capture Anchors and Logging Path

### Hook points already prepared

- Outgoing writes (prepared payload): `BluetoothGattCharacteristic.setValue([B)`
- Incoming app parser callback: `c.i.a.a.u.l.a(BluetoothGattCharacteristic, byte[], String)`

Script:

- `tools/reverse/frida_philips_ble_trace.js`

Suggested run command:

- `frida -U -f com.philips.hearlink -l tools/reverse/frida_philips_ble_trace.js`

---

## 3) Action -> Frame Matrix

Legend:

- `TX` = expected write payload
- `RX` = expected callback payload
- `wrType=1` write with response, `wrType=2` write without response
- `status`: `confirmed` (static decode), `expected` (high-confidence runtime expectation), `unknown` (not resolved)

| Action | Primary TX UUID | TX bytes (expected/recovered) | wrType | Primary RX UUID(s) | RX parse expectation | Convergence rule | Status |
|---|---|---|---|---|---|---|---|
| Set main volume | `1454e9d6-f658-4190-8589-22aa9e3021eb` | `[level, (!mute ? 1 : 0)]` | 2 | `1454e9d6...` | byte0 level, byte1==0 muted | retry if readback != desired | confirmed |
| Mute main volume | `1454e9d6...` | `[currentOrTargetLevel, 0]` | 2 | `1454e9d6...` | byte1 should read `0` | retry until byte1==0 | confirmed |
| Unmute main volume | `1454e9d6...` | `[currentOrTargetLevel, 1]` | 2 | `1454e9d6...` | byte1 should read `1` | retry until byte1==1 | confirmed |
| Set streaming volume | `50632720-4c0f-4bc4-960a-2404bdfdfbca` | `[level, (!mute ? 1 : 0)]` | 2 | `50632720...` | byte0 level, byte1 mute inversion | retry if mismatch | confirmed |
| Set tinnitus/mic volume | `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1` | `[level, (!mute ? 1 : 0)]` | 2 | `e5892ebe...` | byte0 level, byte1 mute inversion | retry if mismatch | confirmed |
| Read volume ranges | (read path) `58bbccc5-5a57-4e00-98d5-18c6a0408dfd` | n/a | n/a | `58bbccc5...` | bytes 0..1 main range, 2..3 stream range, 4..5 tinnitus range (if present) | used to clamp writes | confirmed |
| Select program | `535442f7-0ff7-4fec-9780-742f3eb00eda` | `[(byte)programId]` | 2 | `535442f7...` | byte0 active program id | retry if byte0 != target | confirmed |
| Check program-info version | (read path) `42e940ef-98c8-4ccd-a557-30425295af89` | n/a | n/a | `42e940ef...` | int32 at offset 0 | if changed, rebuild map | confirmed |
| Seed available programs | (read path) `dcbe7a3e-a742-4527-aeb5-cd8dee63167f` | n/a | n/a | `dcbe7a3e...` | bitset -> queue of candidate ids + sentinel 255 | drives metadata loop | confirmed |
| Program-list handshake step | `68bfa64e-3209-4172-b117-f7eafce17414` | `[(byte)queueHeadOrSentinel]` | expected 2 | `68bfa64e...` | byte0==255 as ready gate condition | continue loop until completion | confirmed |
| Read per-program metadata | (read path) `bba1c7f1-b445-4657-90c3-8dbd97361a0c` | n/a | n/a | `bba1c7f1...` | byte0 category, byte1 nameLen, name bytes, next byte flags | append/update program map | confirmed |
| Write EQ gains (mode A) | `60415e72-c345-417a-bb2b-bbba95b2c9a3` | 16-byte frame with gain bytes in positions 8..15 | expected 2 | `60415e72...` or derived state chars | app-level semantic feedback not fully mapped | validate with UX-triggered trace | expected |
| Write EQ gains (mode B) | `60415e72...` | raw byte array from int[] | expected 2 | `60415e72...` or related | payload accepted/echo behavior unresolved | runtime verify | expected |
| Set soundscape/env value | `6e557876-ccc4-40e0-8c2d-651542c5ad3d` | `[0, value(0..255)]` | expected 2 | `6e557876...` / related state | exact UX semantic pending | runtime verify | expected |
| Request bonded list reset | `6efab52e-3002-4764-9430-016cef4dfc87` | `[1,0]` | expected 2 | `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | entry/remove/end marker records | wait for end marker | confirmed |
| Select bonded slot | `6efab52e...` | `[2,slotId]` | expected 2 | `34dfc7cb...` / state callbacks | slot context updates | validate per slot | confirmed |
| Activate streaming device | `786ff607-774d-49d6-80a5-a17e08823d91` | `[0x10,addr0,addr1,addr2,addr3,addr4,addr5,slotId]` | 1 | `d01ab591...` + app state callbacks | streaming source/state transitions | verify start/stop transitions | confirmed |
| Read streaming status | (read path) `d01ab591-d282-4ef5-b83b-538e0bf32d85` | n/a | n/a | `d01ab591...` | byte0 state, byte1 source fields (+ optional ids) | consume into stream UI state | confirmed |
| Read uptime/session counters | (read path) `bc6829c4-b750-48e6-b6f4-48ec866a1efb` | n/a | n/a | `bc6829c4...` | optional int32 counters | informational | confirmed |
| Observe unresolved status byte | (read/notify path) `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | n/a | n/a | `e24fac83...` | byte0 stored internally as `r` | semantic unknown; test triggers required | unknown |
| Observe dormant branch | `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3` | unknown | unknown | `268c4933...` | no-op in this build | check in other app versions | unknown |

---

## 4) Program Discovery Runtime Sequence (Deterministic)

Expected flow in one capture session:

1. Read `42e940ef...` (program-info version).
2. If version changed, read `dcbe7a3e...` (available-program bitset).
3. Build queue with set bits + sentinel item (`255`).
4. For each queue step, use `68bfa64e...` handshake.
5. Read `bba1c7f1...` metadata records until completion.
6. Commit map and refresh active program state from `535442f7...`.

Capture success criterion:

- At least one full run where all six steps are observed in order and resulting program map entries are internally consistent.

---

## 5) Validation Checklists

### 5.1 Per-action capture checklist

- Record exact TX hex and target UUID.
- Record immediate RX callback(s) with UUID and hex.
- Confirm parsed values match UI intent.
- Confirm retry behavior on forced mismatch (if safe).

### 5.2 Session-level checklist

- Connect/discover/MTU sequence observed.
- Notification enables observed (CCCD writes where visible).
- Initial read sweep observed.
- Control writes serialized (single in-flight pattern).

---

## 6) Vendor overlap notes for runtime interpretation

- `56772eaf...`, `50632720...`, `5f35c43d...`, `353ecc73...`, `34dfc7cb...`, and `6efab52e...` appear in both Philips and Rexton documentation contexts.
- Runtime traces should therefore treat these as potentially platform-shared semantics with vendor-specific policy layers above them.

---

## 7) Unresolved Runtime Questions

1. What real-world UX state does `e24fac83...` byte0 encode?
2. Is `268c4933...` reachable by hidden settings, specific device SKUs, or only older/newer app builds?
3. Are there active PRE_POLARIS frame sequences not represented by current POLARIS-heavy traces?
4. Which paths are truly app-primary on Android when ASHA and proprietary channels are both available?

---

## 8) Next document in sequence

Recommended next:

- `docs/philips_uuid_dossier_03_vendor_support_matrix.md`

Focus:

- definitive per-UUID vendor support and confidence reconciliation, Philips-centered.

