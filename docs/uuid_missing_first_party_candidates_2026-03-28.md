# Missing First-Party UUID Candidates and Unresolved Characteristic Values

Date: 2026-03-28  
Purpose: track likely missing UUIDs/characteristics and unresolved value semantics across Philips, ReSound, Rexton, and Starkey.

## 1) What counts as "missing"

A UUID/characteristic is considered potentially missing when at least one is true:
- dynamic discovery is used at runtime and static maps are incomplete;
- code references operation paths that do not resolve to a fully documented UUID/value pair;
- generation aliases exist but routing logic per device family is not fully established;
- payload values are parsed/stored but semantic meaning is unresolved.

## 2) Vendor-specific missing candidates

## 2.1 Philips

### Candidate missing or incomplete surfaces
- PRE_POLARIS-only characteristic set likely undercovered vs POLARIS-first decoding.
- Potential capability-gated chars not observed in current app-version callback paths.

### Known unresolved characteristics
- `e24fac83-b5a8-4b9b-8fda-803fffb0c21c`:
  - one byte captured (`this.r` assignment), semantic unresolved.
- `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3`:
  - switch case present, no behavior in current build.

## 2.2 ReSound

### Candidate missing or incomplete surfaces
- Dynamic GN discovery can return model-specific characteristic UUIDs not present in current extracted profile resources.
- Additional profile-family XMLs or app versions may expose extra operation handles.

### Known unresolved characteristic set
- Numerous non-command GN custom UUIDs (for example `497eeb9e...`, `b69669b0...`, `deb1c8c1...`) have identity without complete operation semantics.

## 2.3 Rexton

### Candidate missing or incomplete surfaces
- Versioned alias characteristics in `8b82`/`c8f7` families likely vary by hardware generation.
- FAPI serializer internals likely define additional operation payload schemas not yet externally visible.

### Known unresolved or partial areas
- Per-feature mapping for all advanced-control/FAPI channels remains incomplete.
- Mute/unmute explicit dedicated basic-control opcode is not yet isolated as a named primitive in current static pass.

## 2.4 Starkey

### Candidate missing or incomplete surfaces
- HA configuration service may carry feature-specific controls not fully mapped from current reverse pass.
- Transport wrapper below app-level Piccolo commands may encode additional protocol identifiers/checksums.

### Known unresolved characteristics
- `d0b6dc42-03c8-457a-a347-ade8d1c4e98d` (GASS unknown)
- `84f9e90a-884a-4bb3-85f2-e77399189874` (GASS unknown)

## 3) Unresolved value domains (cross-vendor)

| Domain | State |
|---|---|
| Philips `e24fac83...` value meaning | unresolved |
| ReSound per-operation handle IDs across all model families | partial |
| ReSound stream-type/status enum values | partial |
| Rexton full FAPI binary payload schemas | partial |
| Starkey lower transport framing under `SendPacketResult` | partial |

## 4) Prioritized closure plan

Priority order:
1. **ReSound runtime handle discovery capture** (highest impact; many operations depend on dynamic handles).
2. **Philips unresolved status bytes** (`e24fac83...`, `268c4933...`) with trigger-based UI actions.
3. **Rexton generation-alias mapping** for `8b82`/`c8f7` traits across at least two device families.
4. **Starkey packet wrapper decode** beneath app-layer Piccolo commands.

### Required capture evidence per unresolved item

- Trigger action (exact UI operation).
- Outgoing write bytes + target characteristic UUID.
- Incoming notify/read bytes + source characteristic UUID.
- Before/after app state field snapshots.
- Device model/firmware/version metadata.

## 5) First-party parity risks if unresolved

- Incorrect semantic assumptions may produce writes that are accepted but functionally wrong.
- Apparent UUID overlap across vendors can mislead implementation if value schema differs.
- Fitting/programming channels can be confused with user-control channels, creating safety and stability risk.

## 6) File references

- `docs/deep_extraction/philips_phase2_static.md`
- `docs/deep_extraction/resound_phase2_static.md`
- `docs/deep_extraction/rexton_phase2_static.md`
- `docs/deep_extraction/starkey_phase2_static.md`
- `docs/ble_reference.md`
- `docs/command_dictionary.md`

## 7) Code references

- Philips: `c.i.a.a.u.l`, `c.i.a.a.u.k`, `CharacteristicUuidProvider`
- ReSound: `GNConstants`, `HandleBasedPlatform`, `serverDescription.LookupCharacteristicsByHandle`
- Rexton: `BasicCommandProtocol`, `ProgrammingConnection`, `FapiGattMessenger`
- Starkey: `PiccoloCommand`, `PiccoloUiCommand`, `ServiceLibPiccolo`, `ControlObjectId`

## 8) Reminders for future reference

- Keep every UUID entry tagged with confidence (`confirmed`, `partial`, `unknown`).
- Do not collapse handle-based protocols into static UUID-only models.
- Maintain per-vendor separation even where UUIDs overlap (`POLARIS` family), because value semantics can diverge.
- Preserve a changelog per app version so UUID additions/removals are traceable.
