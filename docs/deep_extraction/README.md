# Deep Extraction Workspace

This folder is the active workspace for per-vendor deep extraction.

## Files

- `template.md`: reusable template for every vendor pass
- `starkey_phase1.md`: started
- `philips_phase1.md`: started
- `rexton_phase1.md`: started
- `resound_phase1.md`: started

## Current phase status

- Starkey: phase 1 and phase 2 static decode completed (Piccolo feature IDs, control-object IDs, and user-op request framing documented)
- Philips: phase 1 and phase 2 static decode completed (request/response byte mappings documented)
- ReSound: phase 1 and phase 2 static decode completed (managed extraction and GN command opcodes documented)
- Rexton: phase 1 and phase 2 static decode completed (managed extraction, UUID topology, Basic Control bytes, programming control/data framing, bare transport inventory, and implementer workflow documented)

## Next execution order

1. ReSound GN handle-to-user-operation mapping
2. Rexton Control/FAPI frame decoding
3. Cross-version comparison when more APK artifacts are available

## Definition of done (per vendor)

- At least one operation has confirmed request bytes.
- All four operations have explicit routes and confidence tags.
- Unresolved items are reduced with exact next-file targets.

