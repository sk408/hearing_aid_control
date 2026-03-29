# Windows RE Toolchain Setup (winget-first)

This setup installs host-side tooling only:

- `apktool` (via winget package `APK Editor Studio`, using bundled `apktool.jar`)
- `smali` and `baksmali` (jar wrappers in repo)
- `frida-tools` (Python host CLI)

Android test-device setup is intentionally deferred.

## 1) Prerequisites

Run and confirm:

```powershell
winget --version
java -version
python --version
pip --version
```

## 2) Install apktool source package via winget

```powershell
winget install --id AlexanderGorishnyak.APKEditorStudio --accept-package-agreements --accept-source-agreements
```

This package bundles:

- `C:\Program Files (x86)\APK Editor Studio\tools\apktool.jar`

## 3) Create project-local command wrappers

Project-local tools live in:

- `tools/reverse/apktool.cmd`
- `tools/reverse/smali.cmd`
- `tools/reverse/baksmali.cmd`

Jar files used:

- `tools/reverse/apktool.jar`
- `tools/reverse/smali-2.5.2.jar`
- `tools/reverse/baksmali-2.5.2.jar`

## 4) Install Frida host CLI

```powershell
python -m pip install --upgrade frida-tools
```

## 5) Verification commands

```powershell
& "C:\Projects\hearing_aid_control\tools\reverse\apktool.cmd" --version
& "C:\Projects\hearing_aid_control\tools\reverse\smali.cmd" --version
& "C:\Projects\hearing_aid_control\tools\reverse\baksmali.cmd" --version
frida --version
frida-ps -D local
```

Expected:

- apktool reports `2.11.0` (or newer)
- smali/baksmali report version banner
- frida reports installed version
- `frida-ps -D local` lists host processes

## 6) Deferred device phase (later)

Not part of current scope:

- Android USB debugging and ADB trust setup
- `frida-server` deployment on Android device
- BLE runtime capture and nRF Connect validation workflow

