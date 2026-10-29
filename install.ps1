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

# 1. Prepare Target Directory & Stop Any Existing Running Instances
Write-Host ""
Write-Host "[1/5] Preparing installation directory..." -ForegroundColor Yellow

# Terminate running instances before updating files
$backendExe = Join-Path $installDir "backend.exe"
if (Test-Path $backendExe) {
    try {
        Start-Process -FilePath $backendExe -ArgumentList "--stop" -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
    } catch { }
}
Get-Process -Name "LetsMarkNow", "backend" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

try {
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.CommandLine -and $_.CommandLine.Contains($installDir)) {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }
} catch { }

Start-Sleep -Milliseconds 400

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

    # Copy web dashboard SPA
    $localWeb = Join-Path $PSScriptRoot "dist\web"
    if (Test-Path $localWeb) {
        $targetWebDir = Join-Path $installDir "web"
        if (Test-Path $targetWebDir) {
            Remove-Item -Recurse -Force $targetWebDir
        }
        Copy-Item -Recurse $localWeb $targetWebDir -Force
        Write-Host "  * Web dashboard SPA copied -> $targetWebDir" -ForegroundColor DarkGray
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
            & robocopy "$localNodeModules" "$targetNodeModules" /E /XJ /NFL /NDL /NJH /NJS /NC /NS /NP /MT:16 | Out-Null
        }
    }
} else {
    Write-Host "  * Acquiring package from GitHub ($Repo)..." -ForegroundColor Cyan
    $tempZip = Join-Path $env:TEMP "LetsMarkNow-Portable.zip"
    $downloadSuccess = $false

    # Strategy 1: Direct CDN Asset Download (bypasses GitHub REST API rate limits completely)
    $versionTag = if ($Version -and $Version -ne "latest") { $Version -replace '^v','' } else { "1.0.13" }
    $directUrls = @(
        "https://github.com/$Repo/releases/download/v$versionTag/LetsMarkNow-Portable-v$versionTag.zip",
        "https://github.com/$Repo/releases/download/$versionTag/LetsMarkNow-Portable-$versionTag.zip",
        "https://github.com/$Repo/releases/download/v1.0.13/LetsMarkNow-Portable-v1.0.13.zip",
        "https://github.com/$Repo/releases/download/v1.0.12/LetsMarkNow-Portable-v1.0.12.zip",
        "https://github.com/$Repo/releases/download/v1.0.11/LetsMarkNow-Portable-v1.0.11.zip",
        "https://github.com/$Repo/releases/download/v1.0.10/LetsMarkNow-Portable-v1.0.10.zip",
        "https://github.com/$Repo/releases/download/v1.0.9/LetsMarkNow-Portable-v1.0.9.zip",
        "https://github.com/$Repo/releases/download/v1.0.8/LetsMarkNow-Portable-v1.0.8.zip",
        "https://github.com/$Repo/releases/download/v1.0.7/LetsMarkNow-Portable-v1.0.7.zip"
    )

    foreach ($url in $directUrls) {
        try {
            Write-Host "  * Trying direct download: $url..." -ForegroundColor DarkGray
            Invoke-WebRequest -Uri $url -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
            if ((Test-Path $tempZip) -and ((Get-Item $tempZip).Length -gt 1000000)) {
                $downloadSuccess = $true
                Write-Host "  * Downloaded application bundle successfully." -ForegroundColor Green
                break
            }
        } catch {
            # Try next direct link
        }
    }

    # Strategy 2: Fallback to GitHub REST API if direct CDN download missed
    if (-not $downloadSuccess) {
        Write-Host "  * Falling back to GitHub Releases API..." -ForegroundColor DarkGray
        $headers = @{ "User-Agent" = "LetsMarkNow-Installer" }
        $apiUrl = "https://api.github.com/repos/$Repo/releases"

        try {
            $releases = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get
            if ($Version -eq "latest") {
                $targetRelease = $releases | Select-Object -First 1
            } else {
                $targetRelease = $releases | Where-Object { $_.tag_name -eq "v$Version" -or $_.tag_name -eq $Version } | Select-Object -First 1
            }

            if ($targetRelease) {
                $portableAsset = $targetRelease.assets | Where-Object { $_.name -like "*Portable*.zip" } | Select-Object -First 1
                if ($portableAsset) {
                    Invoke-WebRequest -Uri $portableAsset.browser_download_url -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
                    $downloadSuccess = $true
                }
            }
        } catch {
            Write-Host "  [WARN] GitHub API resolution failed: $_" -ForegroundColor DarkYellow
        }
    }

    if (-not $downloadSuccess -or -not (Test-Path $tempZip)) {
        throw "Failed to download LetsMarkNow application bundle. Please download manually from https://github.com/$Repo/releases."
    }

    Write-Host "  * Extracting package to $installDir..." -ForegroundColor Cyan
    Expand-Archive -Path $tempZip -DestinationPath $installDir -Force
    Remove-Item -Force $tempZip -ErrorAction SilentlyContinue
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
if (-not (Test-Path $installedUnins)) {
    try {
        $directUninsUrl = "https://github.com/$Repo/releases/download/v$versionTag/uninstall.ps1"
        Invoke-WebRequest -Uri $directUninsUrl -OutFile $installedUnins -UseBasicParsing -ErrorAction SilentlyContinue
    } catch { }
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
$installedVersion = if ($targetRelease -and $targetRelease.tag_name) { $targetRelease.tag_name -replace '^v','' } elseif ($Version -ne "latest") { $Version -replace '^v','' } else { "1.0.13" }
Set-ItemProperty -Path $regKey -Name "DisplayName" -Value "LetsMarkNow"
Set-ItemProperty -Path $regKey -Name "DisplayVersion" -Value $installedVersion
Set-ItemProperty -Path $regKey -Name "Publisher" -Value "LetsMarkNow"
Set-ItemProperty -Path $regKey -Name "InstallLocation" -Value $installDir
Set-ItemProperty -Path $regKey -Name "DisplayIcon" -Value (Join-Path $installDir "favicon.ico")
Set-ItemProperty -Path $regKey -Name "UninstallString" -Value $uninsCommand
Set-ItemProperty -Path $regKey -Name "NoModify" -Value 1 -Type DWord
Set-ItemProperty -Path $regKey -Name "NoRepair" -Value 1 -Type DWord
Write-Host "  * Registered in Windows Programs and Features" -ForegroundColor DarkGray

# 5b. Register Backend Service to auto-start on Windows Logon (Zero External Dependencies)
$startupKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$backendExePath = Join-Path $installDir "backend.exe"
if (Test-Path $backendExePath) {
    Set-ItemProperty -Path $startupKey -Name "LetsMarkNowBackend" -Value "`"$backendExePath`"" -Force
    Write-Host "  * Registered backend service to auto-start on Windows startup (Zero Dependencies)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] LetsMarkNow installed successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 6. Auto-Launch Backend Service & Dual-Window Chromium Workspace
if (-not $SkipLaunch) {
    # 6a. Start Backend Service
    $backendExe = Join-Path $installDir "backend.exe"
    if (Test-Path $backendExe) {
        Write-Host ""
        Write-Host "[LAUNCH] Starting LetsMarkNow Backend Service..." -ForegroundColor Cyan
        Start-Process -FilePath $backendExe
        for ($i = 0; $i -lt 80; $i++) {
            Start-Sleep -Milliseconds 250
            try {
                $resp = Invoke-RestMethod -Uri "http://127.0.0.1:3000/v1/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
                if ($resp -and $resp.status -eq "ok") {
                    Write-Host "  * Backend & Web App online at http://127.0.0.1:3000 (Health: OK)" -ForegroundColor Green
                    break
                }
            } catch { }
        }
    }

    # 6b. Start Chromium Workspace (Window 1: Extension, Window 2: Web Dashboard)
    Write-Host ""
    Write-Host "[LAUNCH] Starting LetsMarkNow Workspace (Extension Window + Web Dashboard Window)..." -ForegroundColor Cyan
    $exeToLaunch = Join-Path $installDir "LetsMarkNow.exe"
    Start-Process -FilePath $exeToLaunch
}
