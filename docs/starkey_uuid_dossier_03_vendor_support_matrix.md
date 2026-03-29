# Starkey Hearing Aid UUID Dossier 03: Vendor Support Matrix

Date: 2026-03-28  
Scope: Starkey UUID support vs Philips, ReSound, Rexton in current workspace corpus.

## 1) Service support matrix

| UUID | Starkey | Philips | ReSound | Rexton | Notes |
|---|---|---|---|---|---|
| `9a04f079-9840-4286-ab92-e65be0885f95` | confirmed | none | none | partial | Piccolo service; appears in some cross-reference context for Rexton |
| `48ddf118-efd0-48fc-8f44-b9b8e17be397` | confirmed | none | none | none | Starkey HA config service |
| `5446ec0e-d711-11e4-b9d6-1681e6b88ec1` | confirmed | none | none | none | Starkey E2E notification service |
| `0000180a-0000-1000-8000-00805f9b34fb` | partial | confirmed | confirmed | confirmed | standard DIS |

## 2) Characteristic overlap matrix

| UUID | Starkey | Philips | ReSound | Rexton | Notes |
|---|---|---|---|---|---|
| `a287a5f9-0fa3-bc84-2a41-c9da6d85bd4e` | confirmed | none | none | none | Starkey primary Piccolo char |
| `37a691f4-7686-4280-caca-fba8b44b9360` | confirmed | none | none | none | Starkey fallback Piccolo char |
| `6401a620-89c5-4135-b4af-ea1c2e1ce524` | confirmed | none | none | none | Starkey control point |
| `38278651-76d7-4dee-83d8-894f3fa6bb99` | confirmed | none | none | none | Starkey data source |
| `26ddeaca-a73c-4b61-a1de-87c5375b2706` | confirmed | none | none | none | Starkey feature support |
| `5446daa2-d711-11e4-b9d6-1681e6b88ec1` | confirmed | none | none | none | tinnitus config channel |
| `0990d720-893f-4365-b03c-0718186506f9` | confirmed | none | none | none | E2E channel 1 |
| `a0370d1b-e805-4dda-b41a-1f011d2a4a7a` | confirmed | none | none | none | E2E channel 2 |

## 3) Semantic overlap (same user operations, different protocols)

| Feature | Starkey | Philips | ReSound | Rexton |
|---|---|---|---|---|
| Volume | Piccolo feature `0x0435` | `1454...`/`5063...`/`e589...` payloads | GN handle writes to attenuation | basic control opcode `0x04` |
| Program | Piccolo feature `0x0434` | `5354...` one-byte select | GN handle write to current program | basic control opcode `0x05` |
| Mute | Piccolo feature `0x043A` | second-byte mute inversion | attenuation zero convention | partial/basic+legacy path |
| Stream start/stop | Piccolo feature `0x043D` | `786f...` + state channels | GN stream type/status handles | basic/OBLE/FAPI-dependent |

## 4) Reminders

- Starkey is protocol-distinct from Philips/ReSound/Rexton at UUID level despite high conceptual feature overlap.
- Porting control logic from one vendor to another should be behavior-based, not UUID-based.
