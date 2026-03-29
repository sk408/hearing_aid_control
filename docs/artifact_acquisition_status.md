# Artifact Acquisition Status

This file tracks additional version acquisition for the deep extraction program.

## Current local baseline artifacts

- Philips: `Philips HearLink_2.5.0.10268_Apkpure.apk`
- ReSound: `ReSound Smart 3D_1.43.1_APKPure.xapk`
- Rexton: `Rexton App_2.7.32.16308_APKPure.xapk`
- Starkey: `My Starkey_2.1.0_APKPure.apk`

## Additional versions targeted (balanced strategy)

Goal is 3 versions total per vendor where possible (baseline + 2 additional).

## Philips (priority 1)

- Candidate versions identified:
  - 2.4.1.10089
  - 2.3.0.9837
- Source pages discovered:
  - `https://www.apkturbo.com/apps/philips-hearlink/com.philips.hearlink/`
- Blocker:
  - Source is fronted by anti-bot challenge in automated context; scripted fetch returns HTML challenge page instead of APK binary.

## ReSound (priority 2)

- Candidate versions identified:
  - 1.41.0
  - 1.37.0
- Source pages discovered:
  - `https://www.androidout.com/item/android-apps/914566/resound-smart-3d/apk/`
- Blocker:
  - Automated download endpoint resolution does not directly return binary in this environment; fetched content resolves to HTML app page shell.
- Progress:
  - Existing local baseline XAPK was successfully unpacked.
  - Managed assemblies were extracted from `libassemblies.armeabi-v7a.blob.so` and are usable for deep analysis.

## Rexton (priority 3)

- Candidate versions identified:
  - 2.7.31.16301
  - 2.7.30.16291
  - (older) 2.6.71.14406
- Source page discovered:
  - `https://rexton-app.en.aptoide.com/versions`
- Blocker:
  - Version list is accessible, but direct binary URLs are not exposed in static fetch output and require interactive flow.
- Progress:
  - Existing local baseline XAPK was successfully unpacked.
  - Managed assemblies were extracted from `libassemblies.arm64-v8a.blob.so` and are ready for phase-2 decoding.

## Starkey (priority 4)

- Candidate newer versions identified:
  - 4.1.1
  - 6.0.1
- Source pages discovered:
  - `https://apkcombo.com/my-starkey/com.starkey.mystarkey.release/`
- Blocker:
  - Static source gives latest generic download path; reliable old-version direct binary links not exposed in this non-interactive flow.
- Progress:
  - Baseline APK successfully decoded with apktool for smali-level extraction.
  - Piccolo command/object numeric IDs were recovered from local baseline artifact.

## What is needed to unblock acquisition

- Either:
  - manual placement of additional APK/XAPK files in `artifacts/source_apks/<vendor>/`
- Or:
  - approved interactive browser-assisted download pass to resolve anti-bot and dynamic links per source.

