# Gaps and Next Steps

Status as of 2026-03-28 (reconciled to current local artifacts and deep-extraction docs).

This document tracks only what still needs work before implementation. Items already
confirmed in the existing docs are not treated as blockers.

---

## Reconciled Status vs Original Request

### 1) ReSound .NET assemblies (`asm_110/111/112`)
- **Status:** static corpus now partially resolved; runtime validation still blocking
- **What is already done:**
  - managed assemblies were extracted and decompiled under `artifacts/`
  - GN command/notify UUIDs, command opcodes, and handle protocol shape are documented
  - `e0262760` family role mapping is documented in `docs/deep_extraction/resound_phase2_static.md`
  - static operation corpus for `volume/program/mute/stream` now exists in:
    - `docs/resound_operation_corpus_static_2026-03-28.md`
- **What still blocks coding:**
  - final per-operation request/response examples validated with runtime traces
  - per-family handle mapping confirmation across multiple profile families

### 2) Starkey Piccolo wire-level transport
- **Status:** unresolved (high blocker)
- **What is already done:**
  - app-layer command bytes and many control object semantics are documented
  - `HaConfigOpCode` and `HAConfigID` are now read and understood at enum/bit-packing level
- **What still blocks coding:**
  - native framing below app layer (`PiccoloPacketTransportFeature.SendPacketResult`) is opaque
  - checksum/framing/retry rules on wire are not yet recovered

### 3) Starkey HIP/SSI/GASS parent service UUIDs
- **Status:** unresolved for HIP/GASS, partially resolved for SSI
- **What is already done:**
  - HIP (`896Cxxxx`) and GASS chars are located by global characteristic search
  - SSI characteristic family is known (`5446xxxx`) and there is evidence of service-level usage in related code paths
- **What still blocks coding:**
  - definitive parent service UUID attribution for HIP/GASS from static code or runtime discovery capture

### 4) Rexton full UUID table (`8b82xxxx`, `c8f7xxxx`)
- **Status:** static canonicalization resolved; runtime alias routing still partial
- **What is already done:**
  - full UUIDs and aliases are present in decompiled sources under `artifacts/decompiled/rexton_2.7.32`
  - major channel mappings are documented in `docs/deep_extraction/rexton_phase2_static.md`
  - canonical alias tables are now consolidated in:
    - `docs/uuid_rexton_dossier_2026-03-28.md`
    - `docs/rexton_uuid_dossier_01_static_registry.md`
- **What still blocks coding:**
  - per-model alias dispatch behavior (which alias appears on which device family) still requires runtime validation

### 5) Philips 7 unlabeled UUIDs (`29d9ed98`, `87749df4`, `8a1695c7`, `9188040d`, `b31b99bf`, `ee224395`, `adcf079a`)
- **Status:** likely non-baseline/false-positive set; not currently a coding blocker
- **What is already done:**
  - docs indicate these are not active HA GATT channels in baseline POLARIS path
- **What still needs validation:**
  - runtime adjudication across additional app/device versions before final closure

### 6) Rexton mute opcode
- **Status:** partially resolved (medium)
- **What is already done:**
  - static `BasicCommandProtocol` confirms no dedicated mute opcode in basic-control channel (`8b8276e8`)
  - static mute/unmute writes are present via advanced/FAPI receiver-state paths
- **What still blocks coding:**
  - runtime validation of advanced/FAPI mute behavior across device families and firmware variants

### 7) Philips PRE_POLARIS legacy (`14293049` service)
- **Status:** unresolved (medium-high for compatibility)
- **Need:** full legacy characteristic table and operation flow including `d5d0affb`

### 8) ReSound `e0262760` role mapping
- **Status:** resolved in current baseline docs
- **Need:** keep as verified reference, not an active blocker

---

## Updated Priority Backlog (Before Coding)

### P0 - Blocks implementation

1. **Starkey wire transport extraction**
   - Recover framing/checksum/session behavior beneath app-layer Piccolo bytes.
   - Target native bridge around `PiccoloPacketTransportFeature.SendPacketResult`.

2. **Starkey parent service attribution (HIP/GASS, and SSI confirmation)**
   - Produce definitive parent service UUID mapping for all three profile families.
   - Prefer runtime service-discovery capture if static evidence remains ambiguous.

3. **ReSound operation-level protocol corpus**
   - Static templates are now documented (`operation -> command frame -> notify sequence -> parsed state`).
   - Remaining blocker is runtime validation on at least two device profile families.

4. **Rexton documentation normalization**
   - Keep canonical alias registry synchronized across dossier docs.
   - Add runtime-backed per-family alias dispatch table.

### P1 - Important, not immediate blockers

5. **Philips PRE_POLARIS deep map**
   - Enumerate full `14293049` branch and decode `d5d0affb` behavior.

6. **Rexton mute behavior confirmation**
   - Validate advanced/FAPI mute behavior across at least two device families.

7. **Philips unresolved-pool adjudication**
   - Re-validate seven candidate UUIDs through runtime capture and version diffs.

### P2 - Quality and maintenance

8. **Cross-doc consistency pass**
   - Align `command_dictionary`, vendor dossiers, and matrices to one status model:
     `confirmed`, `partial`, `inferred`, `inactive-in-baseline`.

9. **Evidence anchor hardening**
   - Add explicit class/method anchors for each high-value claim where missing.

---

## Recommended Execution Order

1. Starkey wire transport extraction
2. Starkey parent service attribution
3. ReSound operation corpus finalization
4. Rexton UUID/table normalization
5. Philips PRE_POLARIS mapping
6. Remaining medium/quality tasks

---

## Tooling Notes

- **Already sufficient in workspace:** JADX output, extracted APK/XAPK artifacts, decompiled managed assemblies.
- **External tools still useful when needed:**
  - nRF Sniffer + Wireshark (ground-truth runtime GATT + payloads)
  - Frida (controlled dynamic BLE trace instrumentation)
  - dnSpy/ILSpy (fallback/triage for any remaining managed-code blind spots)

---

## Implementation Handoff

For build-sequence, safety gating, and a static-fixable issue list intended for a fresh
implementation agent, use:

- `docs/implementation_handoff_web_android.md`
