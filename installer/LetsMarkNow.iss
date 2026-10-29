; Inno Setup Script for LetsMarkNow
; Produces standalone one-click installer for Windows (x64/x86)

#ifndef MyAppVersion
  #define MyAppVersion "0.2.11"
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
UninstallDisplayIcon={app}\favicon.ico
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Main Launcher
Source: "..\bin\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
; App Icon
Source: "..\public\favicon.ico"; DestDir: "{app}"; Flags: ignoreversion
; Pre-built Chrome Extension
Source: "..\dist\extension\*"; DestDir: "{app}\extension"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\favicon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\favicon.ico"; Tasks: desktopicon

[Run]
; Auto-launch browser with extension loaded in fullscreen immediately upon setup completion
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
