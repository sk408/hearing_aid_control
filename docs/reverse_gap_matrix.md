# Reverse Engineering Gap Matrix

This file tracks what is confirmed vs inferred for control-level BLE behavior.
It is focused on practical command extraction, not full protocol documentation.

## Confidence levels

- `confirmed`: explicit in decompiled code or standards docs
- `partial`: UUID/flow known, payload details incomplete
- `inferred`: behavior guessed from naming or context, not verified

## Vendor matrix

### Philips / Oticon (POLARIS)

- **Service/characteristic map:** `confirmed`
  - Main service and many labeled chars are in `docs/ble_reference.md` and `docs/philips_hearlink.md`.
- **Volume/program write payload bytes:** `partial`
  - `Oble Volume` range is documented as ASHA-aligned in `docs/control_operations.md`.
  - Most other POLARIS write payload layouts are still missing.
- **Program switching protocol:** `partial`
  - Candidate chars are known, concrete command byte schema is not.
- **Next high-value extraction:**
  - Trace write-buffer builders and switch handlers in JADX output for Philips.
  - Capture exact byte arrays per operation (volume up/down, program select, mute).

### Starkey (Piccolo)

- **Piccolo service + control object names:** `confirmed`
  - Service UUID and `ControlObjectId` names are documented.
- **Command framing + opcodes:** `partial`
  - Generic frame shape is documented (`[type, object, params...]`), exact numeric IDs/opcodes still missing.
- **Response decode map:** `inferred`
  - `PiccoloResponse` behavior is known at a high level, but field-level schema is not fully extracted.
- **Next high-value extraction:**
  - Build a table from decompiled classes: `operation -> command_type -> control_object_id -> payload format`.
  - Extract response type/error code values from response parser paths.

### Rexton / WSA (Terminal IO + Control/FAPI)

- **UUID families and characteristic labels:** `confirmed`
  - `8b82xxxx` (Terminal IO) and `c8f7xxxx` (Control/FAPI) are well mapped.
- **Basic Control opcodes:** `partial`
  - Candidate opcodes for volume/program/mute are documented but marked as needing live verification.
- **Control/FAPI frame schema:** `inferred`
  - Request/response channels are known, TLV/message schema still unknown.
- **Next high-value extraction:**
  - Identify serializers/parsers in MAUI/.NET assemblies and Java bridge code.
  - Produce message schema for Control Request and FAPI Request.

### ReSound / GN (`e0262760` family)

- **Core UUID family:** `confirmed`
  - `a010/a011/a110/a111/a112/a113/a210` list is stable.
- **Semantic mapping per characteristic:** `inferred`
  - `a110` (volume) and `a111` (program) are likely but not wire-verified.
- **Custom UUID role mapping:** `inferred`
  - Most custom characteristic roles are still guessed from naming.
- **Next high-value extraction:**
  - Re-extract and inspect .NET assemblies for command and payload builders.
  - Build characteristic-to-feature mapping with code references.

## Cross-vendor highest-priority unknowns

1. Starkey Piccolo numeric command and object IDs.
2. Philips POLARIS concrete write payload formats.
3. Rexton Basic Control opcode verification and Control/FAPI framing.
4. ReSound `a110/a111` payload encoding and custom characteristic semantics.

## Recommended execution order

1. Starkey Piccolo deep extraction
2. Philips POLARIS payload extraction
3. Rexton Terminal IO + Control/FAPI decoding
4. ReSound `e0262760` and custom map extraction

