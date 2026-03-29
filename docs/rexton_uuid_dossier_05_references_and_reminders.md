# Rexton Hearing Aid UUID Dossier 05: References and Reminders

Date: 2026-03-28  
Scope: consolidated index for Rexton UUID research and follow-up.

## 1) Canonical Rexton dossier set

- `docs/rexton_uuid_dossier_01_static_registry.md`
- `docs/rexton_uuid_dossier_02_runtime_capture_matrix.md`
- `docs/rexton_uuid_dossier_03_vendor_support_matrix.md`
- `docs/rexton_uuid_dossier_04_missing_first_party_and_unknowns.md`
- `docs/rexton_uuid_dossier_05_references_and_reminders.md`

## 2) Primary source files

- `docs/deep_extraction/rexton_phase2_static.md`
- `docs/rexton.md`
- `docs/uuid_rexton_dossier_2026-03-28.md`
- `docs/ble_reference.md`
- `docs/command_dictionary.md`

## 3) Code anchors

- `BasicCommandProtocol`
- `ProgrammingConnection.OpenConnectionAsync`
- `ProgrammingConnection.SendControlCommandAsync`
- `ProgrammingConnection.SendRequest`
- `FapiGattMessenger`
- `WSA.Foundation.Bluetooth.decompiled.cs`
- `WSA.Plugin.BLE.decompiled.cs`

## 4) Operational reminders

1. Keep user-control and programming/fitting channels isolated in implementation and testing.
2. Preserve session-order invariants for programming commands (`VersionInfo` -> `StartProgramming` -> data flow -> stop sequence).
3. Record model/firmware/app version for every runtime trace to resolve alias UUID routing.
4. Treat `8b82` and `c8f7` families as first-party core, even when POLARIS overlap exists.
5. Do not classify unresolved channel payloads as stable API until validated in runtime traces.
