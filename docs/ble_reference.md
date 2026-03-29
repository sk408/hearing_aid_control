# Complete BLE UUID Reference — All Manufacturers

## Standard BLE Services

| UUID | Name | Philips | Starkey | ReSound | Rexton |
|------|------|:-------:|:-------:|:-------:|:------:|
| `00001800-0000-1000-8000-00805f9b34fb` | Generic Access | | | | x |
| `00001801-0000-1000-8000-00805f9b34fb` | Generic Attribute | | | | x |
| `0000180a-0000-1000-8000-00805f9b34fb` | Device Information | x | | x | x |
| `0000180f-0000-1000-8000-00805f9b34fb` | Battery Service | x | | | x |
| `0000184f-0000-1000-8000-00805f9b34fb` | BLE 0x184F | | | x | |
| `0000fdf0-0000-1000-8000-00805f9b34fb` | ASHA | x | | x | |
| `0000fd20-0000-1000-8000-00805f9b34fb` | BLE 0xFD20 | | | x | |
| `0000fd71-0000-1000-8000-00805f9b34fb` | BLE 0xFD71 | | | x | |
| `0000fefe-0000-1000-8000-00805f9b34fb` | BLE 0xFEFE | | | x | |

## Standard BLE Characteristics

| UUID | Name | Found In |
|------|------|----------|
| `00002a00-0000-1000-8000-00805f9b34fb` | Device Name | Rexton |
| `00002a01-0000-1000-8000-00805f9b34fb` | Appearance | Rexton |
| `00002a05-0000-1000-8000-00805f9b34fb` | Service Changed | Rexton |
| `00002a19-0000-1000-8000-00805f9b34fb` | Battery Level | Rexton |
| `00002a24-0000-1000-8000-00805f9b34fb` | Model Number | Philips, Rexton |
| `00002a25-0000-1000-8000-00805f9b34fb` | Serial Number | Rexton |
| `00002a26-0000-1000-8000-00805f9b34fb` | Firmware Revision | Philips, ReSound, Rexton |
| `00002a27-0000-1000-8000-00805f9b34fb` | Hardware Revision | Rexton |
| `00002a28-0000-1000-8000-00805f9b34fb` | Software Revision | Philips, Rexton |
| `00002a29-0000-1000-8000-00805f9b34fb` | Manufacturer Name | Philips, Rexton |
| `00002902-0000-1000-8000-00805f9b34fb` | CCCD | ReSound, Rexton |

## Cross-Platform Services

| UUID | Name | Found In |
|------|------|----------|
| `7d74f4bd-c74a-4431-862c-cce884371592` | MFi HAP (Apple) | Philips, ReSound |
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | ASHA / Bonding Service | Philips, Rexton |

## Shared Custom UUIDs

| UUID | Found In | Label |
|------|----------|-------|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | Philips, Rexton | Hi Service (POLARIS) |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | Philips, Rexton | Hi Id |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Philips, Rexton | Partner Id |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | Philips, Rexton | Oble Volume / Streaming Control |
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | Philips, Rexton | Extended Feature |
| `6efab52e-3002-4764-9430-016cef4dfc87` | Philips, Rexton | Bonded Device Info Access |
| `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87` | Philips, ReSound | Shared Demant/GN heritage |
| `9a04f079-9840-4286-ab92-e65be0885f95` | Starkey, Rexton (DEX) | Piccolo Service |

---

## Philips/Oticon Proprietary

### Services
| UUID | Generation |
|------|-----------|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | POLARIS (current) |
| `14293049-77d7-4244-ae6a-d3873e4a3184` | PRE_POLARIS (legacy) |

### Characteristics (under service `56772eaf`)

| UUID | Function | Type |
|------|----------|------|
| `e5892ebe-97d0-4f97-8f8e-cb85d16a4cc1` | Microphone/Audio Control | Write |
| `60415e72-c345-417a-bb2b-bbba95b2c9a3` | EQ/Gain Control | Write |
| `9215a295-b813-483f-9f85-b700d0b7bc75` | Tinnitus / Make Audible | Notify |
| `1454e9d6-f658-4190-8589-22aa9e3021eb` | Volume Control | Write |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | Streaming Control | Write |
| `535442f7-0ff7-4fec-9780-742f3eb00eda` | Control | Write |
| `68bfa64e-3209-4172-b117-f7eafce17414` | Program/Device List | R/W |
| `bba1c7f1-b445-4657-90c3-8dbd97361a0c` | Program Config | R/W |
| `51939bb6-a635-4b1e-903b-76cd9dff3fac` | Bonded Device | R/W |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | Audio Control | R/W |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Audio Control | R/W |
| `42e940ef-98c8-4ccd-a557-30425295af89` | Audio/Streaming | R/W |
| `58bbccc5-5a57-4e00-98d5-18c6a0408dfd` | Audio/Data | R/W |
| `d01ab591-d282-4ef5-b83b-538e0bf32d85` | Audio | R/W |
| `e24fac83-b5a8-4b9b-8fda-803fffb0c21c` | Audio/Data | R/W |
| `6e557876-ccc4-40e0-8c2d-651542c5ad3d` | Soundscape/Environment | R/W |
| `24e1dff3-ae90-41bf-bfbd-2cf8df42bf87` | (shared with ReSound) | R/W |
| `bc6829c4-b750-48e6-b6f4-48ec866a1efb` | Extended Feature | R/W |
| `34dfc7cb-5252-430b-ba6d-df2fe87914e7` | Extended Feature | R/W |
| `6efab52e-3002-4764-9430-016cef4dfc87` | Streaming/Bond | Write |
| `786ff607-774d-49d6-80a5-a17e08823d91` | Bonded Streaming | Write |
| `d5d0affb-35b8-4fdc-a50b-f777c90293b8` | PRE_POLARIS only | R/W |

### Unlabeled Characteristics (from `CharacteristicUuidProvider.java`)

Found in the POLARIS provider; switch-case handler not yet mapped. Function unknown.

| UUID | Function | Type |
|------|----------|------|
| `29d9ed98-a469-4536-ade2-f981bc1d605e` | Unknown | — |
| `87749df4-7ccf-48f8-aa87-704bad0e0e16` | Unknown | — |
| `8a1695c7-5c40-4b42-8965-d97076e22b8d` | Unknown | — |
| `9188040d-6c67-4c5b-b112-36a304b66dad` | Unknown | — |
| `b31b99bf-5257-41d3-86df-ad84b30aea8e` | Unknown | — |
| `ee224395-69b5-4622-8645-ff2566532795` | Unknown | — |
| `adcf079a-bf94-4c4c-97e7-afef5aa06b38` | Unknown | — |

---

## Starkey Proprietary

### Services
| UUID | Protocol / Label |
|------|-----------------|
| `9a04f079-9840-4286-ab92-e65be0885f95` | Piccolo Service |
| `48ddf118-efd0-48fc-8f44-b9b8e17be397` | HA Configuration Service (GattConsolidationDispatcher) |
| `5446ec0e-d711-11e4-b9d6-1681e6b88ec1` | E2E Notification Service |

### HA Configuration Service Characteristics (`48ddf118`)
| UUID | Label | Access |
|------|-------|--------|
| `6401a620-89c5-4135-b4af-ea1c2e1ce524` | Control_Point | Write |
| `38278651-76d7-4dee-83d8-894f3fa6bb99` | Data_Source | Notify |
| `26ddeaca-a73c-4b61-a1de-87c5375b2706` | Feature_Support | Read |

### Piccolo Service Characteristics (`9a04f079`)
| UUID | Label | Access |
|------|-------|--------|
| `a287a5f9-0fa3-bc84-2a41-c9da6d85bd4e` | Piccolo Primary | R/W/Notify |
| `37a691f4-7686-4280-caca-fba8b44b9360` | Piccolo Fallback | R/W/Notify |

### HIP (Hearing Instrument Profile) Characteristics
| UUID | Label | Access |
|------|-------|--------|
| `896c9932-d4ea-11e1-af55-58b035fea743` | HA ID | Read |
| `896c98ba-d4ea-11e1-af52-58b035fea743` | HA Info | Read |
| `896c9950-d4ea-11e1-af56-58b035fea743` | Other HA ID | Read |
| `896c990a-d4ea-11e1-af54-58b035fea743` | Side (L/R) | Read |
| `896c96ee-d4ea-11e1-af46-58b035fea743` | Versions | Read |
| `0b2be3d9-ba60-429f-b61a-e9b564167c97` | WiCross Device Type | Read |

### SSI (Streaming Serial Interface) Characteristics (`5446xxxx` family)
| UUID | Label | Access |
|------|-------|--------|
| `5446e255-d711-11e4-b9d6-1681e6b88ec1` | SSI Next Long Packet | Notify |
| `5446e448-d711-11e4-b9d6-1681e6b88ec1` | SSI Last Long Packet | Notify |
| `5446fb18-d711-11e4-b9d6-1681e6b88ec1` | Streaming Enable / Accessory Control | Write |
| `5446ea24-d711-11e4-b9d6-1681e6b88ec1` | Associated Device List / Accessory Status | R/Notify |
| `5446e63c-d711-11e4-b9d6-1681e6b88ec1` | Accessory Secondary Write | Write |
| `5446daa2-d711-11e4-b9d6-1681e6b88ec1` | Tinnitus Config | R/W/Notify |
| `60fb6208-9b02-468e-aba8-b702dd6f543a` | Battery Level (Morse) | Notify |

### E2E Notification Characteristics (`5446ec0e` service)
| UUID | Label |
|------|-------|
| `0990d720-893f-4365-b03c-0718186506f9` | E2E Notification Channel 1 |
| `a0370d1b-e805-4dda-b41a-1f011d2a4a7a` | E2E Notification Channel 2 |

### Voice Assistant (GASS) Service Characteristics
| UUID | Label | Access |
|------|-------|--------|
| `b5a0badd-7739-4712-8804-a60a0ed9bdec` | Status Point | Notify |
| `c43b2a46-e802-4ea4-81b1-97987cd33b1c` | Control Point | Write/Notify |
| `7de95c7f-12de-40a9-b77c-6712da671217` | Audio Source Enable | Notify |
| `d0b6dc42-03c8-457a-a347-ade8d1c4e98d` | Unknown GASS char | — |
| `84f9e90a-884a-4bb3-85f2-e77399189874` | Unknown GASS char | — |

### Smart Reminders Characteristics
| UUID | Label |
|------|-------|
| `985c6f7d-ac66-445a-b65e-573fc0d72f46` | Put-on HA Toggle Reminder |
| `ae1badbf-a989-4d02-bbe8-25cb10254202` | Self-check Reminder Toggle |

### Piccolo Control Objects
| Object | Function |
|--------|----------|
| MicrophoneVolume | Main volume |
| TinnitusVolume | Tinnitus masker |
| StreamingVolume | Audio stream volume |
| AccessoryStreamingVolume | Accessory volume |
| BalanceVolume | L/R balance |

---

## ReSound/GN Hearing Proprietary

### GN Proprietary Service Family (`e0262760`)

| UUID | Suffix |
|------|--------|
| `e0262760-08c2-11e1-9073-0e8ac72ea010` | a010 |
| `e0262760-08c2-11e1-9073-0e8ac72ea011` | a011 |
| `e0262760-08c2-11e1-9073-0e8ac72ea110` | a110 |
| `e0262760-08c2-11e1-9073-0e8ac72ea111` | a111 |
| `e0262760-08c2-11e1-9073-0e8ac72ea112` | a112 |
| `e0262760-08c2-11e1-9073-0e8ac72ea113` | a113 |
| `e0262760-08c2-11e1-9073-0e8ac72ea210` | a210 |

### Custom Characteristics

| UUID |
|------|
| `12257119-ddcb-4a12-9a08-1cd4df7921bb` |
| `1959a468-3234-4c18-9e78-8daf8d9dbf61` |
| `1bcd1f06-1e72-4dad-8edb-8bfaeb4fe812` |
| `213885c7-488a-412c-ba95-e36436b88c42` |
| `497eeb9e-b194-4f35-bc82-36fd300482a6` |
| `4d56d4f5-af39-4885-9525-9f68c18ff451` |
| `53df4e1c-43e1-497e-8edf-589f48aafd9a` |
| `6d27fe99-0bfc-4c5e-9a3f-a4a271bb3d2a` |
| `6eae2d11-57a1-43bf-be4a-6326d0d94e88` |
| `7009c09b-b94f-42d4-8d68-676059f153ab` |
| `8b51a2ca-5bed-418b-b54b-22fe666aadd2` |
| `8d17ac2f-1d54-4742-a49a-ef4b20784eb3` |
| `97c1c193-ea53-4312-9bd9-e52207d5e03d` |
| `98e3949e-d4dd-421c-87b2-5a5ddc1ac26f` |
| `a53062b9-7dfd-446c-bca5-1e13269560bd` |
| `add69bfc-edc7-40a4-ba5e-5f0107c3b3ac` |
| `b69669b0-effb-4568-9862-7d82f3391170` |
| `bf41a31e-7619-42c2-aa34-5f434d16dd5f` |
| `c853ac0b-2175-4d1d-8396-8f866d1ba821` |
| `c97d21d3-d79d-4df8-9230-bb33fa805f4e` |
| `de1e1fd9-6056-4d89-8c49-5c3907ab694f` |
| `deb1c8c1-ec5e-42d3-9d0f-4d108a3c612c` |
| `e09369ec-150b-40b0-abd5-841ca383d7fa` |

---

## Rexton/WSA Proprietary

### Hearing Instrument Service (shared with Philips/Oticon)
| UUID | Label |
|------|-------|
| `56772eaf-2153-4f74-acf3-4368d99fbf5a` | Hi Service |
| `83e28ff3-25ad-4bfe-aaf0-5a95dba4b56b` | Hi State |
| `5f35c43d-e0f4-4da9-87e6-9719982cd25e` | Hi Id |
| `353ecc73-4d2c-421b-ac1c-8dcb35cd4477` | Partner Id |
| `50632720-4c0f-4bc4-960a-2404bdfdfbca` | Oble Volume |
| `d28617fe-0ad5-40c5-a04a-bc89051ff755` | Ear |
| `bdf8a334-1c7b-46e9-b4c2-800b8966136b` | Identifiers |

### Terminal IO Service (`8b82xxxx-0f0c-40bb-b422-3770fa72a864`)
| UUID | Label |
|------|-------|
| `8b82105d-...-3770fa72a864` | Terminal IO Service |
| `8b822409-...-3770fa72a864` | Data RX |
| `8b82b999-...-3770fa72a864` | Data TX |
| `8b82cd2d-...-3770fa72a864` | Protocol Choice |
| `8b82a76f-...-3770fa72a864` | Ready for RX |
| `8b82f3b9-...-3770fa72a864` | Ready for TX |
| `8b8225e0-...-3770fa72a864` | Active Program Info |
| `8b8276e8-...-3770fa72a864` | Basic Control Command |
| `8b823656-...-3770fa72a864` | Configuration Check |
| `8b8246c8-...-3770fa72a864` | (Programming) |
| `8b821572-...-3770fa72a864` | (Terminal IO) |
| `8b82f55d-...-3770fa72a864` | (Terminal IO) |
| `8b820369-...-3770fa72a864` | (Terminal IO) |
| `8b820c6d-...-3770fa72a864` | (Terminal IO) |

### Control/FAPI Service (`c8f7xxxx-21b2-45b8-87f8-bd49a13eff49`)
| UUID | Label |
|------|-------|
| `c8f75466-...-bd49a13eff49` | Control Request |
| `c8f70447-...-bd49a13eff49` | Control Response |
| `c8f79c9a-...-bd49a13eff49` | (Control) |
| `c8f73dc3-...-bd49a13eff49` | (Control) |
| `c8f72804-...-bd49a13eff49` | Data Request |
| `c8f72fef-...-bd49a13eff49` | Data Response |
| `c8f7a8e4-...-bd49a13eff49` | (Data) |
| `c8f7a68a-...-bd49a13eff49` | (Data) |
| `c8f76c2c-...-bd49a13eff49` | Advanced Control Command |
| `c8f714d6-...-bd49a13eff49` | App Data |
| `c8f76c20-...-bd49a13eff49` | Configuration File |
| `c8f73c59-...-bd49a13eff49` | FB4H Data |
| `c8f7eea2-...-bd49a13eff49` | Identifiers |
| `c8f723da-...-bd49a13eff49` | FAPI Request |
| `c8f7690c-...-bd49a13eff49` | FAPI Response |
| `c8f7a831-...-bd49a13eff49` | Programming Service |
| + 8 more characteristics | (various) |

### Bonding Service
| UUID | Label |
|------|-------|
| `0a23ae62-c4c2-43d1-87b1-e8c83839a063` | Bonding Service |
| `d61cb039-62dc-4426-90ab-2077c7e9205e` | (Bonding) |
| `62dcc92f-59c2-4228-9a11-c85f18773530` | Device Type Input |
| `8e467a33-820e-40fa-8759-4cd7a197384d` | Pairing State |
| `ebee6f69-70b6-4bb9-b13b-9ba84953c233` | Battery Level |
| `6efab52e-3002-4764-9430-016cef4dfc87` | Bonded Device Info Access |
| `336e6111-6ce2-44f8-a2fd-9e92972121a7` | Bonded Device Info |

### FAPI Service (Fitting API / Remote Programming)
| UUID | Label |
|------|-------|
| `d1d4dc2a-215f-44d2-b44c-0f4de3c91af2` | Fapi Service |
| `c8f723da-21b2-45b8-87f8-bd49a13eff49` | FAPI Request |
| `c8f7690c-21b2-45b8-87f8-bd49a13eff49` | FAPI Response |

---

## UUID Count Summary

| Manufacturer | Services | Characteristics | Total Unique |
|-------------|----------|-----------------|--------------|
| Philips/Oticon | 6 | 29 (22 labeled + 7 unlabeled) | 35 |
| Starkey | 3 | 30 | 33 |
| ReSound/GN | 9+ | 23+ (unlabeled — in .NET assemblies) | 32+ |
| Rexton/WSA | 8+ | ~50 | 81 |
| **Cross-platform** | 3 | 8 | 11 |

## Key Cross-Manufacturer Finding

**Rexton (WS Audiology) and Philips (Oticon/Demant) share the same POLARIS BLE platform.**
7 UUIDs are identical between Rexton and Philips, including the primary service UUID (`56772eaf`),
volume control, and device identification characteristics. This means a single implementation
can target both manufacturers' hearing aids for basic control operations.
