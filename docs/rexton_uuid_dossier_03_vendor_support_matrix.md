# Rexton Hearing Aid UUID Dossier 03: Vendor Support Matrix

Date: 2026-03-28  
Scope: Rexton UUID support comparison against Philips, ReSound, and Starkey evidence in workspace.

## 1) Service support matrix

| UUID | Rexton | Philips | ReSound | Starkey | Notes |
|---|---|---|---|---|---|
| `8b82105d-0f0c-40bb-b422-3770fa72a864` | confirmed | none | none | none | Rexton Terminal IO family |
| `c8f7a831-21b2-45b8-87f8-bd49a13eff49` | confirmed | none | none | none | Rexton programming family |
| `d1d4dc2a-215f-44d2-b44c-0f4de3c91af2` | confirmed | none | none | none | Rexton FAPI service |
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | confirmed | confirmed | none | none | shared POLARIS stack |
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | confirmed | confirmed | partial | none | bonding-related overlap |
| `0000180a-0000-1000-8000-00805f9b34fb` | confirmed | confirmed | confirmed | partial | standard DIS |

## 2) Characteristic overlap matrix

| UUID | Rexton | Philips | ReSound | Starkey | Notes |
|---|---|---|---|---|---|
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | confirmed | confirmed | none | none | shared HI ID |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | confirmed | confirmed | none | none | shared partner ID |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | confirmed/partial | confirmed | none | none | shared volume-like path |
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | confirmed | confirmed | none | none | bonded feed overlap |
| `6efab52e-3002-4764-9430-016cef4dfc87` | confirmed | confirmed | none | none | bonded control overlap |
| `8b8276e8-0f0c-40bb-b422-3770fa72a864` | confirmed | none | none | none | Rexton-only basic control |
| `c8f75466-...-bd49a13eff49` | confirmed | none | none | none | Rexton-only control request |
| `c8f70447-...-bd49a13eff49` | confirmed | none | none | none | Rexton-only control response |
| `c8f723da-...-bd49a13eff49` | confirmed | none | none | none | Rexton-only FAPI request |
| `c8f7690c-...-bd49a13eff49` | confirmed | none | none | none | Rexton-only FAPI response |

## 3) Semantic overlap (same behavior, different transport)

| Feature | Rexton path | Philips path | ReSound path | Starkey path |
|---|---|---|---|---|
| Volume | Basic control opcode `0x04` | `1454...` two-byte payload | GN handle write to attenuation characteristic | Piccolo ExecuteFeature `0x0435` |
| Program | Basic control opcode `0x05` | `5354...` one-byte program id | GN handle write to active program handle | Piccolo ExecuteFeature `0x0434` |
| Mute | partial in basic/OBLE patterns | byte1 inversion in volume-like channels | attenuation zero semantic | Piccolo ExecuteFeature `0x043A` |
| Stream control | basic/OBLE/FAPI dependent | `d01a...`, `786f...`, bonded flow | GN stream status/type + handles | Piccolo `0x043D` accessory stream |

## 4) Cross-vendor reminders

- Shared UUID does not guarantee identical payload schema.
- Rexton-specific `8b82/c8f7` families remain unique in current corpus and should be treated as first-party WSA channels.
- Philips/Rexton overlap is strongest in POLARIS domain; ReSound/Starkey mostly overlap at concept level rather than UUID identity.
