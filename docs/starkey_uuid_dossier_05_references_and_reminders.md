# Starkey Hearing Aid UUID Dossier 05: References and Reminders

Date: 2026-03-28  
Scope: reference index and maintenance reminders for Starkey UUID documentation.

## 1) Canonical Starkey dossier set

- `docs/starkey_uuid_dossier_01_static_registry.md`
- `docs/starkey_uuid_dossier_02_runtime_capture_matrix.md`
- `docs/starkey_uuid_dossier_03_vendor_support_matrix.md`
- `docs/starkey_uuid_dossier_04_missing_first_party_and_unknowns.md`
- `docs/starkey_uuid_dossier_05_references_and_reminders.md`

## 2) Primary sources

- `docs/deep_extraction/starkey_phase2_static.md`
- `docs/starkey.md`
- `docs/uuid_starkey_dossier_2026-03-28.md`
- `docs/ble_reference.md`

## 3) Symbol anchors

- `PiccoloCommand`
- `PiccoloUiCommand`
- `UiFeature`
- `ControlObjectId`
- `ServiceLibPiccolo`
- `PiccoloDispatcher`
- `PiccoloResponsePacket`
- `GattConsolidationDispatcherKt`

## 4) Reminders

1. Keep per-UUID confidence tags current (`confirmed`, `expected`, `unknown`).
2. Always distinguish app-layer Piccolo framing from transport-layer packet framing.
3. Track primary vs fallback Piccolo characteristic usage by model and firmware.
4. Keep unknown assistant channels documented separately until decoded.
5. Add version deltas whenever new Starkey app versions are analyzed.
