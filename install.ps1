# install.ps1 - Windows One-Liner / Standalone Installer for LetsMarkNow
# Installs to %LOCALAPPDATA%\LetsMarkNow without administrative privileges and auto-launches in Google Chrome fullscreen.

[CmdletBinding()]
param(
    [string]$Version = "latest",
    [string]$Repo = "alimtvnetwork/letsmarknow-v2",
    [switch]$SkipLaunch
)

$ErrorActionPreference = "Stop"

$installDir = "$env:LOCALAPPDATA\LetsMarkNow"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  LetsMarkNow - Windows Installer" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Prepare Target Directory
Write-Host ""
Write-Host "[1/5] Preparing installation directory..." -ForegroundColor Yellow
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}
Write-Host "  * Install Path: $installDir" -ForegroundColor Green

# 2. Acquire Application Files (Local Repo vs GitHub Release)
Write-Host ""
Write-Host "[2/5] Acquiring LetsMarkNow application bundle..." -ForegroundColor Yellow

$isLocalRepo = $false
if (-not [string]::IsNullOrEmpty($PSScriptRoot)) {
    $localBin = Join-Path $PSScriptRoot "bin\LetsMarkNow.exe"
    $localExt = Join-Path $PSScriptRoot "dist\extension"
    $localIco = Join-Path $PSScriptRoot "public\favicon.ico"
    if ((Test-Path $localBin) -and (Test-Path $localExt) -and (Test-Path $localIco)) {
        $isLocalRepo = $true
    }
}

$targetRelease = $null

if ($isLocalRepo) {
    Write-Host "  * Installing from local repository files..." -ForegroundColor Cyan
    Copy-Item $localBin (Join-Path $installDir "LetsMarkNow.exe") -Force
    Copy-Item $localIco (Join-Path $installDir "favicon.ico") -Force

    $localBackendExe = Join-Path $PSScriptRoot "bin\backend.exe"
    if (Test-Path $localBackendExe) {
        Copy-Item $localBackendExe (Join-Path $installDir "backend.exe") -Force
    }

    $targetExtDir = Join-Path $installDir "extension"
    if (Test-Path $targetExtDir) {
        Remove-Item -Recurse -Force $targetExtDir
    }
    Copy-Item -Recurse $localExt $targetExtDir -Force

    $localLaunch = Join-Path $PSScriptRoot "installer\launcher\launch.html"
    if (Test-Path $localLaunch) {
        Copy-Item $localLaunch (Join-Path $installDir "launch.html") -Force
    }

    # Copy backend service files
    $localBackend = Join-Path $PSScriptRoot "backend"
    if (Test-Path $localBackend) {
        $targetBackend = Join-Path $installDir "backend"
        if (-not (Test-Path $targetBackend)) {
            New-Item -ItemType Directory -Path $targetBackend -Force | Out-Null
        }
        $targetDist = Join-Path $targetBackend "dist"
        if (-not (Test-Path $targetDist)) {
            New-Item -ItemType Directory -Path $targetDist -Force | Out-Null
        }
        if (Test-Path (Join-Path $localBackend "dist\server.js")) {
            Copy-Item (Join-Path $localBackend "dist\server.js") (Join-Path $targetDist "server.js") -Force
        }
        if (Test-Path (Join-Path $localBackend "package.json")) {
            Copy-Item (Join-Path $localBackend "package.json") (Join-Path $targetBackend "package.json") -Force
        }
        if (Test-Path (Join-Path $localBackend ".env")) {
            Copy-Item (Join-Path $localBackend ".env") (Join-Path $targetBackend ".env") -Force
        }
        if (Test-Path (Join-Path $localBackend "node.exe")) {
            Copy-Item (Join-Path $localBackend "node.exe") (Join-Path $targetBackend "node.exe") -Force
        }
        $localNodeModules = Join-Path $localBackend "node_modules"
        $targetNodeModules = Join-Path $targetBackend "node_modules"
        if ((Test-Path $localNodeModules) -and (-not (Test-Path $targetNodeModules))) {
            Copy-Item -Recurse $localNodeModules $targetNodeModules -Force
        }
    }
} else {
    Write-Host "  * Downloading package from GitHub ($Repo)..." -ForegroundColor Cyan
    $headers = @{ "User-Agent" = "LetsMarkNow-Installer" }
    $apiUrl = "https://api.github.com/repos/$Repo/releases"

    try {
        $releases = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get

        if ($Version -eq "latest") {
            # Find latest release or pre-release
            $targetRelease = $releases | Select-Object -First 1
        } else {
            $targetRelease = $releases | Where-Object { $_.tag_name -eq "v$Version" -or $_.tag_name -eq $Version } | Select-Object -First 1
        }

        if (-not $targetRelease) {
            throw "Could not find a valid release for version $Version on GitHub ($Repo)."
        }

        $portableAsset = $targetRelease.assets | Where-Object { $_.name -like "*Portable*.zip" } | Select-Object -First 1
        if (-not $portableAsset) {
            throw "Portable ZIP asset not found in release $($targetRelease.tag_name)."
        }

        $downloadUrl = $portableAsset.browser_download_url
        $tempZip = Join-Path $env:TEMP "LetsMarkNow-Portable.zip"

        Write-Host "  * Downloading: $($portableAsset.name)..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing

        Write-Host "  * Extracting to $installDir..." -ForegroundColor Cyan
        Expand-Archive -Path $tempZip -DestinationPath $installDir -Force
        Remove-Item -Force $tempZip -ErrorAction SilentlyContinue
    } catch {
        Write-Host "[ERROR] Failed to download package from GitHub: $_" -ForegroundColor Red
        throw $_
    }
}

# 3. Ensure Uninstaller Script is in place
Write-Host ""
Write-Host "[3/5] Setting up uninstaller..." -ForegroundColor Yellow
$installedUnins = Join-Path $installDir "uninstall.ps1"
if (-not [string]::IsNullOrEmpty($PSScriptRoot)) {
    $localUnins = Join-Path $PSScriptRoot "uninstall.ps1"
    if (Test-Path $localUnins) {
        Copy-Item $localUnins $installedUnins -Force
    }
}
if ((-not (Test-Path $installedUnins)) -and $targetRelease) {
    try {
        $uninsAsset = $targetRelease.assets | Where-Object { $_.name -eq "uninstall.ps1" } | Select-Object -First 1
        if ($uninsAsset) {
            Invoke-WebRequest -Uri $uninsAsset.browser_download_url -OutFile $installedUnins -UseBasicParsing
        }
    } catch {
        # proceed with existing files
    }
}
if (Test-Path $installedUnins) {
    Write-Host "  * Uninstaller ready -> $installedUnins" -ForegroundColor Green
}

# 4. Create Desktop and Start Menu Shortcuts
Write-Host ""
Write-Host "[4/5] Creating Desktop and Start Menu shortcuts..." -ForegroundColor Yellow
try {
    $wsh = New-Object -ComObject WScript.Shell
    $uninsFilePath = Join-Path $installDir "uninstall.ps1"

    # Desktop Shortcut (creates on standard Desktop & OneDrive Desktop if present)
    $desktopDirs = @(
        [Environment]::GetFolderPath('Desktop'),
        (Join-Path $env:USERPROFILE "Desktop"),
        (Join-Path $env:USERPROFILE "OneDrive\Desktop")
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

    foreach ($dp in $desktopDirs) {
        $desktopLink = Join-Path $dp "LetsMarkNow.lnk"
        $shortcut = $wsh.CreateShortcut($desktopLink)
        $shortcut.TargetPath = Join-Path $installDir "LetsMarkNow.exe"
        $shortcut.WorkingDirectory = $installDir
        $shortcut.IconLocation = Join-Path $installDir "favicon.ico"
        $shortcut.Description = "LetsMarkNow - Browser Tab Workspace"
        $shortcut.Save()
        Write-Host "  * Created Desktop shortcut: $desktopLink" -ForegroundColor DarkGray
    }

    # Start Menu Shortcuts
    $programsPath = [Environment]::GetFolderPath('Programs')
    $appLink = Join-Path $programsPath "LetsMarkNow.lnk"
    $appShortcut = $wsh.CreateShortcut($appLink)
    $appShortcut.TargetPath = Join-Path $installDir "LetsMarkNow.exe"
    $appShortcut.WorkingDirectory = $installDir
    $appShortcut.IconLocation = Join-Path $installDir "favicon.ico"
    $appShortcut.Save()
    Write-Host "  * Created Start Menu shortcut: $appLink" -ForegroundColor DarkGray

    $uninsLink = Join-Path $programsPath "Uninstall LetsMarkNow.lnk"
    $uninsShortcut = $wsh.CreateShortcut($uninsLink)
    $uninsShortcut.TargetPath = "powershell.exe"
    $uninsShortcut.WorkingDirectory = $installDir
    $uninsShortcut.Arguments = '-ExecutionPolicy Bypass -File ' + [char]34 + $uninsFilePath + [char]34
    $uninsShortcut.IconLocation = Join-Path $installDir "favicon.ico"
    $uninsShortcut.Save()
    Write-Host "  * Created Uninstall shortcut: $uninsLink" -ForegroundColor DarkGray
} catch {
    Write-Host "  [WARN] Could not create shell shortcuts: $_" -ForegroundColor DarkYellow
}

# 5. Register in Windows Programs and Features (Control Panel)
$regKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\LetsMarkNow"
if (-not (Test-Path $regKey)) {
    New-Item -Path $regKey -Force | Out-Null
}
$uninsCommand = 'powershell.exe -ExecutionPolicy Bypass -File ' + [char]34 + $uninsFilePath + [char]34
$installedVersion = if ($targetRelease -and $targetRelease.tag_name) { $targetRelease.tag_name -replace '^v','' } elseif ($Version -ne "latest") { $Version -replace '^v','' } else { "1.0.4" }
Set-ItemProperty -Path $regKey -Name "DisplayName" -Value "LetsMarkNow"
Set-ItemProperty -Path $regKey -Name "DisplayVersion" -Value $installedVersion
Set-ItemProperty -Path $regKey -Name "Publisher" -Value "LetsMarkNow"
Set-ItemProperty -Path $regKey -Name "InstallLocation" -Value $installDir
Set-ItemProperty -Path $regKey -Name "DisplayIcon" -Value (Join-Path $installDir "favicon.ico")
Set-ItemProperty -Path $regKey -Name "UninstallString" -Value $uninsCommand
Set-ItemProperty -Path $regKey -Name "NoModify" -Value 1 -Type DWord
Set-ItemProperty -Path $regKey -Name "NoRepair" -Value 1 -Type DWord
Write-Host "  * Registered in Windows Programs and Features" -ForegroundColor DarkGray

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] LetsMarkNow installed successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 6. Auto-Launch Backend Service & Google Chrome in Fullscreen
if (-not $SkipLaunch) {
    # 6a. Start Backend Service
    $backendExe = Join-Path $installDir "backend.exe"
    if (Test-Path $backendExe) {
        Write-Host ""
        Write-Host "[LAUNCH] Starting LetsMarkNow Backend Service..." -ForegroundColor Cyan
        Start-Process -FilePath $backendExe
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Milliseconds 200
            try {
                $resp = Invoke-RestMethod -Uri "http://localhost:3000/v1/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
                if ($resp -and $resp.status -eq "ok") {
                    Write-Host "  * Backend service online at http://localhost:3000 (Health: OK)" -ForegroundColor Green
                    break
                }
            } catch { }
        }
    }

    # 6b. Start Chrome in Fullscreen
    Write-Host ""
    Write-Host "[LAUNCH] Starting LetsMarkNow in Google Chrome fullscreen mode..." -ForegroundColor Cyan
    $exeToLaunch = Join-Path $installDir "LetsMarkNow.exe"
    Start-Process -FilePath $exeToLaunch
}
