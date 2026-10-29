; Inno Setup Script for LetsMarkNow
; Produces standalone one-click installer and uninstaller for Windows (x64/x86)

#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif

#define MyAppName "LetsMarkNow"
#define MyAppPublisher "LetsMarkNow"
#define MyAppURL "https://letsmarknow.com"
#define MyAppExeName "LetsMarkNow.exe"

[Setup]
AppId={{D3F9B7A2-7711-4E6C-9AC4-4B29A72CE042}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\{#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\dist-installer
OutputBaseFilename=LetsMarkNow-Setup-v{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\public\favicon.ico
UninstallDisplayName={#MyAppName}
UninstallDisplayIcon={app}\favicon.ico
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Main Launcher
Source: "..\bin\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
; Backend Executable
Source: "..\bin\backend.exe"; DestDir: "{app}"; Flags: ignoreversion
; App Icon
Source: "..\public\favicon.ico"; DestDir: "{app}"; Flags: ignoreversion
; Uninstaller script
Source: "..\uninstall.ps1"; DestDir: "{app}"; Flags: ignoreversion
; Pre-built Chrome Extension
Source: "..\dist\extension\*"; DestDir: "{app}\extension"; Flags: ignoreversion recursesubdirs createallsubdirs
; Pre-built Web Dashboard SPA
Source: "..\dist\web\*"; DestDir: "{app}\web"; Flags: ignoreversion recursesubdirs createallsubdirs
; Backend Service Files (from staged build directory)
Source: "..\dist-installer\stage\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Start Menu App Shortcut
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\favicon.ico"
; Start Menu Uninstaller Shortcut
Name: "{autoprograms}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"; WorkingDir: "{app}"; IconFilename: "{app}\favicon.ico"
; Desktop Shortcut (ALWAYS created unconditionally)
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\favicon.ico"

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "LetsMarkNowBackend"; ValueData: """{app}\backend.exe"""; Flags: uninsdeletevalue

[UninstallRun]
Filename: "{app}\backend.exe"; Parameters: "--stop"; Flags: runhidden

[UninstallDelete]
Type: filesandordirs; Name: "{app}\Profile"
Type: filesandordirs; Name: "{app}\extension"
Type: filesandordirs; Name: "{app}\backend"
Type: filesandordirs; Name: "{app}"
Type: files; Name: "{autodesktop}\{#MyAppName}.lnk"

[Run]
; Auto-launch backend server in background
Filename: "{app}\backend.exe"; Flags: nowait skipifsilent
; Auto-launch Google Chrome with extension loaded in fullscreen immediately upon setup completion
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
