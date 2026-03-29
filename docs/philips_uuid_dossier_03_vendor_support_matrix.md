# Philips Hearing Aid UUID Dossier 03: Vendor Support Matrix

Date: 2026-03-28
Scope: Philips-relevant UUIDs and characteristics, mapped across Philips, Rexton, ReSound, and Starkey evidence currently in workspace.

---

## 1) Confidence Labels

- `confirmed`: directly evidenced in vendor-specific docs/static decode.
- `partial`: listed in a vendor reference but behavior/presence is not fully established.
- `none`: no evidence in current workspace corpus.

---

## 2) Philips-Centered Service Support Matrix

| Service UUID | Philips | Rexton | ReSound | Starkey | Notes |
|---|---|---|---|---|---|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | confirmed | confirmed | none | none | Shared Demant/WSA lineage in current docs. |
| `14293049-77d7-4244-ae6a-d3873e4a3184` | confirmed (legacy) | none | none | none | PRE_POLARIS service. |
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | confirmed | confirmed | partial | none | Bonding/bonded-device contexts. |
| `0000180a-0000-1000-8000-00805f9b34fb` | confirmed | confirmed | confirmed | partial | Standard DIS. |
| `0000180f-0000-1000-8000-00805f9b34fb` | confirmed | confirmed | partial | partial | Battery service visibility differs by stack. |
| `7d74f4bd-c74a-4431-862c-cce884371592` | confirmed | partial | confirmed | none | MFi path presence in Philips/ReSound docs. |
| `0000fdf0-0000-1000-8000-00805f9b34fb` | partial | partial | confirmed | none | ASHA service support is stack-dependent in docs. |

---

## 3) Philips Characteristic Support (Cross-Vendor Comparison)

### 3.1 Characteristics with cross-vendor evidence

| Characteristic UUID | Philips | Rexton | ReSound | Starkey | Observed role |
|---|---|---|---|---|---|
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | confirmed | confirmed | none | none | streaming/volume-like control path |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | confirmed | confirmed | none | none | HIID / device identifier |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | confirmed | confirmed | none | none | partner HIID |
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | confirmed | confirmed | none | none | bonded-feed / extended path |
| `6efab52e-3002-4764-9430-016cef4dfc87` | confirmed | confirmed | none | none | bonded-device access control |
| `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87` | partial | none | partial | none | appears in cross-vendor docs; active semantics unresolved |

### 3.2 Philips-dominant channels (no strong non-Philips evidence in current corpus)

| Characteristic UUID | Philips | Rexton | ReSound | Starkey | Current interpretation |
|---|---|---|---|---|---|
| `1454e9d6-f658-4190-8589-22aa9e3021eb` | confirmed | none | none | none | main volume/mute bytes |
| `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1` | confirmed | none | none | none | tinnitus/mic volume path |
| `535442f7-0ff7-4fec-9780-742f3eb00eda` | confirmed | none | none | none | program select/active id |
| `68bfa64e-3209-4172-b117-f7eafce17414` | confirmed | none | none | none | program-list gate |
| `bba1c7f1-b445-4657-90c3-8dbd97361a0c` | confirmed | none | none | none | program metadata stream |
| `42e940ef-98c8-4ccd-a557-30425295af89` | confirmed | none | none | none | program-info version |
| `dcbe7a3e-a742-4527-aeb5-cd8dee63167f` | confirmed | none | none | none | available-program bitset |
| `58bbccc5-5a57-4e00-98d5-18c6a0408dfd` | confirmed | none | none | none | volume ranges |
| `d01ab591-d282-4ef5-b83b-538e0bf32d85` | confirmed | none | none | none | streaming state/source |
| `60415e72-c345-417a-bb2b-bbba95b2c9a3` | confirmed | none | none | none | EQ/gain payloads |
| `6e557876-ccc4-40e0-8c2d-651542c5ad3d` | confirmed | none | none | none | soundscape/environment |
| `786ff607-774d-49d6-80a5-a17e08823d91` | confirmed | none | none | none | bonded stream activation |
| `bc6829c4-b750-48e6-b6f4-48ec866a1efb` | confirmed | none | none | none | uptime/session counters |
| `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | partial | none | none | none | one-byte unresolved status |
| `268c4933-d2ed-4b09-b1da-cf5fd8e3a8a3` | inactive-in-baseline | none | none | none | no-op in this build |
| `d5d0affb-35b8-4fdc-a50b-f777c90293b8` | partial (legacy) | none | none | none | PRE_POLARIS-only marker |

---

## 4) Potential Philips UUIDs with unresolved activation status

The following are referenced as candidate/unlabeled Philips channels in broader project docs but are not in the recovered active callback map for current baseline:

- `29d9ed98-a469-4536-ade2-f981bc1d605e`
- `87749df4-7ccf-48f8-aa87-704bad0e0e16`
- `8a1695c7-5c40-4b42-8965-d97076e22b8d`
- `9188040d-6c67-4c5b-b112-36a304b66dad`
- `b31b99bf-5257-41d3-86df-ad84b30aea8e`
- `ee224395-69b5-4622-8645-ff2566532795`
- `adcf079a-bf94-4c4c-97e7-afef5aa06b38`

Matrix status for all above:

- Philips: `partial`
- Rexton/ReSound/Starkey: `none` (in current corpus)

---

## 5) Standards-aligned characteristics expected around Philips devices

These are likely available when ASHA path is active, but current Philips app-layer decode emphasizes proprietary control channels:

- `6333651e-c481-4a3e-9169-7c902aad37bb` (ASHA read-only properties)
- `f0d28fea-5d20-4087-84a8-6b6f2fb08de0` (ASHA audio control point)
- `38663f1a-e711-488c-b1a2-4a7870e6a5e5` (ASHA audio status point)
- `00e4ca9e-ab14-41e4-8823-f9e70c7e91df` (ASHA volume)
- `2d410339-82b6-42aa-b34e-e2e01df8cc1a` (ASHA LE PSM)

Vendor support snapshot:

- Philips: partial
- ReSound: confirmed/partial (vendor docs show ASHA usage)
- Rexton: partial
- Starkey: no evidence in current corpus

---

## 6) Source References

- `docs/philips_hearlink.md`
- `docs/deep_extraction/philips_phase2_static.md`
- `docs/ble_reference.md`
- `docs/reverse_gap_matrix.md`
- `docs/uuid_master_vendor_matrix_2026-03-28.md`

---

## 7) Practical Usage Reminder

For Philips-focused control tooling, use this order of trust:

1. Philips `confirmed` rows in this dossier.
2. Philips `partial` rows after runtime verification.
3. Philips `partial` rows only in exploratory/diagnostic mode.

Never treat `partial`, `inferred`, or `inactive-in-baseline` channels as safe user-control endpoints without bounded test validation.

