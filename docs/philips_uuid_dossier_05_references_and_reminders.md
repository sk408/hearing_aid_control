# Philips Hearing Aid UUID Dossier 05: References, Code Anchors, and Reminders

Date: 2026-03-28
Scope: Consolidated reference index for Philips UUID work, including file anchors, code symbols, and operational reminders for future extraction passes.

---

## 1) Canonical Philips UUID Dossier Set

- `docs/philips_uuid_dossier_01_static_registry.md`
- `docs/philips_uuid_dossier_02_runtime_capture_matrix.md`
- `docs/philips_uuid_dossier_03_vendor_support_matrix.md`
- `docs/philips_uuid_dossier_04_missing_first_party_and_unknowns.md`
- `docs/philips_uuid_dossier_05_references_and_reminders.md` (this file)

---

## 2) Primary Source Documents (Workspace)

### Philips-focused

- `docs/philips_hearlink.md`
- `docs/deep_extraction/philips_phase1.md`
- `docs/deep_extraction/philips_phase2_static.md`
- `tools/reverse/frida_philips_ble_trace.js`

### Cross-vendor and matrix context

- `docs/ble_reference.md`
- `docs/reverse_gap_matrix.md`
- `docs/command_dictionary.md`
- `docs/gaps_and_next_steps.md`
- `docs/uuid_master_vendor_matrix_2026-03-28.md`
- `docs/artifact_acquisition_status.md`

---

## 3) Code/Symbol Anchors to Revisit in Next Passes

These are the highest-value symbols repeatedly referenced across Philips extraction notes.

### UUID provisioning and compatibility

- `com.oticon.blegenericmodule.ble.gatt.CharacteristicUuidProvider`
- `com.oticon.blegenericmodule.ble.gatt.DeviceCompatibility`
- `c.i.a.a.q.b` (service UUID definitions in notes)

### Callback decode and state convergence

- `c.i.a.a.u.l` (service and characteristic callback parser)
- `c.i.a.a.u.k` (write callback reconciliation/retry)

### Payload construction and IO queue

- `c.h.a.b.e.m.m.a` (volume-like serializer)
- `c.i.a.a.r.h` (serialized GATT operation queue)
- `c.i.a.a.r.l` (write operation)
- `c.i.a.a.r.j` (read operation)
- `c.i.a.a.r.c` (notify/CCCD operation)
- `c.i.a.a.r.b` (MTU request)
- `c.i.a.a.r.f` (service discovery)

---

## 4) Runtime Instrumentation Reference

File:

- `tools/reverse/frida_philips_ble_trace.js`

What it logs:

- TX payload staging through `setValue([B)` with service UUID, characteristic UUID, write type, hex.
- RX callback payload into Philips parser function with UUID context and hex.

Operational reminder:

- For one-action attribution, execute exactly one UI control action between trace checkpoints.

---

## 5) Known Stable UUID Groups (Quick Reference)

### Philips POLARIS core

- service: `56772eaf-2153-4f74-acf3-4368d99fbf5a`
- volume/mute/program core: `1454e9d6...`, `50632720...`, `e5892ebe...`, `535442f7...`
- program map pipeline: `42e940ef...`, `dcbe7a3e...`, `68bfa64e...`, `bba1c7f1...`
- streaming/bonding: `d01ab591...`, `6efab52e...`, `786ff607...`, `34dfc7cb...`
- identity: `5f35c43d...`, `353ecc73...`

### Known unresolved channels

- `e24fac83-b5a8-4b9b-8fda-803fffb0c21c`
- `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3`
- PRE_POLARIS marker: `d5d0affb-35b8-4fdc-a50b-f777c90293b8`

---

## 6) Reminders for Future Documentation Updates

1. Keep a per-UUID status field (`confirmed`, `partial`, `inferred`, `inactive-in-baseline`).
2. Always separate static inference from runtime-validated behavior.
3. Record vendor overlap explicitly to avoid false assumptions of Philips-only ownership.
4. Preserve a changelog section when adding new app versions.
5. When contradictions appear across docs, resolve with explicit adjudication notes instead of silent edits.

---

## 7) Reminders for Safe Implementation Work

1. Do not issue writes to unresolved channels during testing.
2. Keep user-facing control to confirmed channels and bounded values.
3. Maintain serialized GATT queue behavior; avoid concurrent writes.
4. Treat fitting/programming-like pathways as high risk unless fully decoded.

---

## 8) Suggested Closure Checklist for Philips UUID Documentation

Mark the Philips UUID documentation effort as "complete enough for implementation" when:

- all currently known Philips UUIDs are either decoded or explicitly marked inactive for baseline;
- unresolved channels have targeted runtime experiments documented and executed;
- one additional Philips app version has been diffed for UUID stability;
- runtime capture matrix contains at least one validated frame example per major user operation:
  - main volume/mute
  - streaming volume
  - program switch
  - program list refresh
  - bonded device activation

