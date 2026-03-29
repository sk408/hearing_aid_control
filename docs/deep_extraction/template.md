# Deep Extraction Template (Per Vendor)

Use this template for each APK/vendor pass so outputs are comparable.

## Vendor and version

- Vendor:
- App version:
- APK/XAPK artifact:
- Extraction date:
- Analyst:

## Scope for this pass

- Included operations: volume, program, mute, stream
- Excluded operations: fitting, firmware, telecare
- Confidence goal: move entries from inferred -> partial or confirmed

## Primary command path

- Entry points (UI/domain -> BLE):
  - file:
  - class/symbol:
- Transport/wire path:
  - file:
  - class/symbol:
- Response decode path:
  - file:
  - class/symbol:

## Operation dictionary (this vendor)

For each operation, fill this tuple:
`operation -> UUID/characteristic -> request bytes -> response bytes -> confidence -> evidence`

### Volume

- Route:
- Request bytes:
- Response bytes:
- Confidence:
- Evidence path(s):

### Program switch

- Route:
- Request bytes:
- Response bytes:
- Confidence:
- Evidence path(s):

### Mute/unmute

- Route:
- Request bytes:
- Response bytes:
- Confidence:
- Evidence path(s):

### Stream control

- Route:
- Request bytes:
- Response bytes:
- Confidence:
- Evidence path(s):

## Known vs inferred delta

- Promoted to confirmed in this pass:
- Promoted to partial in this pass:
- Still inferred:

## Immediate next decompile targets

- file:
  - reason:
  - expected artifact:
- file:
  - reason:
  - expected artifact:

## Safety boundaries

- Do not write to fitting/programming characteristics.
- Do not test writes without encrypted/bonded BLE session.
- Restrict active testing to user-safe controls only.

## Exit criteria for this pass

- At least one operation reaches confirmed payload bytes.
- All four operations have explicit route candidates.
- Open unknowns reduced and tracked with exact file targets.

