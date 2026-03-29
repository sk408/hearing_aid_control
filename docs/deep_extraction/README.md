# Deep Extraction Workspace

This folder is the active workspace for per-vendor deep extraction.

## Files

- `template.md`: reusable template for every vendor pass
- `starkey_phase1.md`: started
- `philips_phase1.md`: started
- `rexton_phase1.md`: started
- `resound_phase1.md`: started

## Current phase status

- Starkey: phase 1 completed, phase 2 ready (smali/native boundary focus)
- Philips: phase 1 completed, phase 2 ready (payload and callback decode focus)
- Rexton: phase 1 completed, phase 2 blocked on .NET extraction/decompile
- ReSound: phase 1 completed, phase 2 blocked on .NET extraction/decompile

## Phase 2 execution order

1. Starkey
2. Philips
3. Rexton
4. ReSound

## Definition of done (per vendor)

- At least one operation has confirmed request bytes.
- All four operations have explicit routes and confidence tags.
- Unknowns are reduced with exact next-file targets.

