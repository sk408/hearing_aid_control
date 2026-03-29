# ReSound UUID Exhaustive Static Registry - 2026-03-28

This document is the static registry companion to the master dossier and captures all major UUID families surfaced from ReSound Smart 3D `1.43.1` extraction artifacts.

## Source Inputs

- `artifacts/extracted/resound_1.43.1/gatt_descriptions/*.xml`
- `docs/deep_extraction/resound_phase2_static.md`
- `docs/resound_uuid_reference_master_2026-03-28.md`

## Registry Coverage

- Unique UUIDs observed in static XML inventory: **100**
- Profile files parsed:
  - `CommonServiceDescription.xml`
  - `Dooku2ServiceDescription.xml`
  - `Dooku3ServiceDescription.xml`
  - `Dooku3ServiceDescriptionOmnia.xml`
  - `DookuServiceDescription.xml`
  - `DookuServiceDescription3_1_1.xml`
  - `Palpatine6ServiceDescription.xml`
  - `MystiqueServiceDescription.xml`
  - `DFUServiceDescription.xml`
  - `NonGNServiceDescription.xml`

## A) Standard BLE Service/Characteristic UUIDs

| UUID | Kind | Usage |
|---|---|---|
| `00001800-0000-1000-8000-00805f9b34fb` | service | Generic Access |
| `0000180A-0000-1000-8000-00805f9b34fb` | service | Device Information |
| `00002A00-0000-1000-8000-00805f9b34fb` | characteristic | Device Name |
| `00002A29-0000-1000-8000-00805f9b34fb` | characteristic | Manufacturer Name |
| `00002A27-0000-1000-8000-00805f9b34fb` | characteristic | Hardware Revision |
| `00002A26-0000-1000-8000-00805f9b34fb` | characteristic | Firmware Revision |
| `00002A24-0000-1000-8000-00805f9b34fb` | characteristic | Model Number |
| `00002A25-0000-1000-8000-00805f9b34fb` | characteristic | Serial Number |
| `00002A50-0000-1000-8000-00805f9b34fb` | characteristic | PnP ID |

## B) GN Service (`0000FEFE...`) Core Characteristic UUIDs

High-frequency first-party GN characteristics across Dooku/Palpatine/Mystique variants:

- `86E2C601-D90A-2628-19B9-BDB38D5C7CF0` (`GNBatteryLevel`)
- `8D17AC2F-1D54-4742-A49A-EF4B20784EB3` (`GNLeftRight`)
- `C97D21D3-D79D-4DF8-9230-BB33FA805F4E` (`GNOwnID`)
- `497EEB9E-B194-4F35-BC82-36FD300482A6` (`GNOtherID`)
- `32C9322D-6B17-11CF-0234-6F0DA5EAFD75` (`GNMicAttenuation`)
- `054E99C7-FF34-1C12-59CD-E2C20D2E6743` (`GNStreamAttenuation`)
- `6726C057-9F99-0F3A-0BA6-D331181B1525` (`GNAvailablePrograms`)
- `DC82F820-63AC-F82F-1E89-372FDE4151F4` (`GNCurrentActiveProgram`)
- `FCC19FF1-7E4B-8094-1488-B63ED0870E30` (`GNAvailableProgramsVersion`)
- `75BB97E1-7A25-BE3F-761F-347A4EAC0ECE` (`GNProgramName`)
- `D6709E73-DF85-2BBF-1A32-B84F217BA6AD` (`GNProgramCategory`)
- `30F2AF33-8C1E-6C27-AA38-A3C842D355AD` (`GNProgramNameSelector`)
- `A980FB55-E063-443C-B879-02BE075584E4` (`GNDevInfoProductID`)
- `F5112C62-C5DE-439F-8201-99060C1B0EC0` (`GNDevInfoOptions`)
- `11E639DE-D0C7-409C-967E-B9D6B5E3F1F9` (`GNDevInfoPrivateLabelID`)
- `A93E1C00-45FE-4ACB-A5B0-0E9F8751AB64` (`GNAttenuationDefaults`)
- `D6709E73-DF85-2BBF-1A32-B84F217BA6AC` (`GNProgramEnvironmentID`)
- `EF6003F9-77A7-487D-BFA6-46EAE34AF279` (`GNInputMode`)
- `A19D7749-27C9-4860-BEBF-BB2762234A1C` (`GNCriticalAlgoStatus`)
- `3B70C9ED-82AF-4B1B-9ACC-D376A9CFAC18` (`GNSecurityStatus`)
- `9C21DF09-E38C-333D-5783-E9C13C9324A9` (`GNStreamStatus`)
- `23E2FAF2-EE21-4A38-9A9A-9AF67E44AE09` (`GNMelody`)
- `92EE3BF1-C224-41A9-BD00-B56904D0A081` (`GNLed`)
- `C42D87EA-2D5A-44FB-B682-FD699BC6414A` (`GNEarPieceConfiguration`)
- `85FE7725-107B-4AFD-B418-D95050637646` (`GNFittedPrograms`)
- `B3FAD9CB-2064-4658-BA99-AFF6DCB77FF7` (`GNLastFittedID`)
- `9062FD9D-153C-487F-ACB8-6A5FE8AABCEF` (`GNGainData`)
- `400FC36C-ABD9-40ED-95AA-CC186C73D02A` (`GNAllGainData`)
- `B4505C43-8A06-4FDE-AAF7-6A8B753885A3` (`GNAudiograms`)
- `74ADDC62-E885-47B2-9025-C4448B73B89E` (`GNWordRecognition`)
- `329F65A8-5693-4278-9CEC-0FDCEABAF333` (`GNSpeechNoiseRatio`)
- `2AFFDCED-9ED5-457B-A2CA-3B14ACB939FF` (`GNProximityPairingTable`)
- `6F3460CB-B5AB-4E8B-AC2B-F51874F9B1ED` (`GNProximityPairingOffset`)
- `737BE834-772F-48D9-B067-BDFEB1023C38` (`GNAccessoryWhiteList`)
- `E4336022-4DCE-4054-82AC-422E948F4F85` (`GNRemoteCtrl`)
- `75916C49-9A12-494A-B2D0-5E17E4338EFA` (`GNReadADL`)
- `E267B847-37C8-4400-BE59-ADF5497C355D` (`GNDevInfoFamilyName`)
- `85A91ABD-91A3-477F-87E7-D50EB10B2174` (`GNDevInfoDeviceID`)
- `47FF53AE-DD70-4131-8046-3B1634560C28` (`GNDevInfoBrandID`)
- `FE3196E3-CAE2-446C-943F-C137EA22E959` (`GNRFTCertificate`)
- `16025E7E-334B-46FB-AD05-2DFF664D2F72` (`GNRFTWrite`)
- `DE57A589-7067-4BA8-8B76-6DCAF537575B` (`GNRFTNotify`)
- `84E8DF2C-1C15-4268-8C42-133B390A5E70` (`GNDHR`)
- `43B526E1-D6BC-461E-BBCF-D968C3CE0843` (`GNCloudLogin`)
- `01BF7309-22E8-4E1E-84FD-5A8E6B47AAB6` (`GNStartDFU`)
- `8D552F91-15D0-4628-A03F-1A64FC88FA51` (`GNHiState`)
- `4E8CBF8C-C1FC-423F-B920-96437F358346` (`GNAllVolumes`)
- `4E8CBF8C-C1FC-423F-B920-96437F398346` (`GNPushButton`)
- `613C92ED-5644-4A7A-AAD0-B4B3EE028E26` (`GNLoadInSitu`)
- `650C3A00-CB6D-467D-A20B-3544F189D8AF` (`GNFeatureSupport`)

## C) Dooku3 / Dooku3_1_1 Extended GN UUIDs

- `4449301B-A5DD-4967-99DC-A051F71AC801` (`GNAccelerometerTapConfig`)
- `B4923AC8-4E3D-41DB-925F-0FA33D49337A` (`GNCurrentActiveStreamProgram`)
- `56E1134F-FFE9-4F7C-93FF-FBE2A30CC512` (`GNBondedBTAddress`)
- `9C2227DD-0164-4E1A-8799-99961BB23C6E` (`GNBondedSerialNumber`)
- `0F3FD4DD-B0A9-465D-BC36-5DD182AD8FC5` (`GNAutomaticStreaming`)
- `31EE192A-60C4-4194-8F88-84136765ADAF` (`GNDeleteStreamerBonding`)
- `29626EDD-5349-429E-B629-27DB46E4E1CD` (`GNMediaType`)
- `246540C2-92A9-4E81-ACBC-0CA154DB606E` (`GNAuracastControlPoint`)
- `F47AC10B-58CC-4372-A567-0E02B2C3D479` (`GNStartFittingAuthenticationWindow`)

## D) Palpatine / LEA-Specific Surfaces

- LEA service UUID:
  - `7D74F4BD-C74A-4431-862C-CCE884371592`
- Palpatine 5 service UUID:
  - `4D56D4F5-AF39-4885-9525-9F68C18FF451`
- Palpatine characteristics:
  - `B9E8DB52-0C8F-4C9C-A2BD-550B8E7444C0` (`GNStdFeatures`)
  - `A7AF853B-E6AD-429F-A6A8-3292FDE43736` (`GNAllStdFeatures`)
  - `5B65E784-E3B8-4511-8E0F-91B5B6239887` (`GNUnmuteDefault`)

## E) DFU/Fit Services

- DFU service UUID:
  - `213885C7-488A-412C-BA95-E36436B88C42`
- DFU characteristics:
  - `DE1E1FD9-6056-4D89-8C49-5C3907AB694F` (`DFUMtu`)
  - `C853AC0B-2175-4D1D-8396-8F866D1BA821` (`DFUCertificateWrt`)
  - `7009C09B-B94F-42D4-8D68-676059F153AB` (`DFUFlashWrt`)
  - `24E1DFF3-AE90-41BF-BFBD-2CF8DF42BF87` (`DFU battery`)
- Fitting service UUID:
  - `A53062B9-7DFD-446C-BCA5-1E13269560BD`
- Fitting characteristics:
  - `611335B0-1326-4189-8325-36986BF4F69C` (`GNRieDetectData`)
  - `BF41A31E-7619-42C2-AA34-5F434D16DD5F` (`FitFittingData`)

## F) Lola Service

- Lola service UUID:
  - `D49AB80D-B084-4377-B2C7-D07A333D8068`
- Lola characteristics:
  - `5995FC54-4579-4525-A041-BE32278D9514` (`LolaOperation`)
  - `D833BDFA-9861-4898-A3D3-B5DAAD2AE2D1` (`LolaDeviceID`)
  - `E5054CC2-0132-422C-856D-CAFE4A19D042` (`LolaInfo`)
  - `DC833985-98C3-4178-BBA2-0C9611D04FC2` (`LolaProtocolInfo`)
  - `5B38E1B8-CF2B-4034-A360-EA77C0481961` (`LolaCertificate`)
  - `ADCC76C3-7D42-4DCB-8024-1EE782D51DE8` (`LolaRPTCommand`)

## G) Mystique-Only / Sparse-Profile Extensions

- `1FF8B26A-2771-4F92-B252-BD39ADB0506F`
- `00E8CA84-6410-4F0D-8B81-7493EA23DB26`
- `CAA48155-1A86-4C3D-92B0-75A590992593`
- `8A0942BD-1D12-4815-8C9C-9E4F5C3C3467`
- `303B4B3B-4DEA-4FB8-B050-43D0333DCA0E`
- `E33C5A76-F1DB-44B1-9CA2-0BB63492CB5C`
- `533C5A76-F1DB-44B1-9CA2-0BB63492CB5C`
- `453CABEC-212A-49DF-814C-C84CD50AAE90`
- `5E438BB2-D72D-417F-9D7A-9BC6862A5381`

## H) Protocol-Control UUIDs Not Present in XML Registry

From static decode notes, required for real operation despite XML omission:

- `1959A468-3234-4C18-9E78-8DAF8D9DBF61`
- `8B51A2CA-5BED-418B-B54B-22FE666AADD2`
- `97C1C193-EA53-4312-9BD9-E52207D5E03D`
- `12257119-DDCB-4A12-9A08-1CD4DF7921BB`
- `ADD69BFC-EDC7-40A4-BA5E-5F0107C3B3AC`
- `E09369EC-150B-40B0-ABD5-841CA383D7FA`

## I) e0262760 Cluster (First-Party GN Core)

Documented in protocol references in this repo:

- `e0262760-08c2-11e1-9073-0e8ac72ea010`
- `e0262760-08c2-11e1-9073-0e8ac72ea011`
- `e0262760-08c2-11e1-9073-0e8ac72ea110`
- `e0262760-08c2-11e1-9073-0e8ac72ea111`
- `e0262760-08c2-11e1-9073-0e8ac72ea112`
- `e0262760-08c2-11e1-9073-0e8ac72ea113`
- `e0262760-08c2-11e1-9073-0e8ac72ea210`

Status: transport-critical, semantically partial, dynamically confirm next.

## Registry Notes

- Some UUIDs change declared `size` across profiles; never assume one global payload shape.
- `size=0` in Lola/Fit context implies variable-length protocol payloads.
- This registry is static and should be merged with runtime traces before implementation lock-in.

