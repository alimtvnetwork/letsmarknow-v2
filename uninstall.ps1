# uninstall.ps1 - Uninstaller for LetsMarkNow
# Removes application files, shortcuts, isolated profiles, backend daemons, and Windows Registry entries.

[CmdletBinding()]
param(
    [switch]$Silent,
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"

$installDir = "$env:LOCALAPPDATA\LetsMarkNow"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  LetsMarkNow - Uninstaller" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not $Silent -and -not $Force) {
    $confirm = Read-Host "Are you sure you want to completely uninstall LetsMarkNow? (y/N)"
    if ($confirm -notmatch "^[yY]") {
        Write-Host "Uninstallation canceled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "[1/4] Closing any running LetsMarkNow processes..." -ForegroundColor Yellow

# Stop backend process cleanly
$backendExe = Join-Path $installDir "backend.exe"
if (Test-Path $backendExe) {
    try {
        Start-Process -FilePath $backendExe -ArgumentList "--stop" -Wait -WindowStyle Hidden
    } catch { }
}

# Terminate launcher and backend binaries
Get-Process -Name "LetsMarkNow", "backend" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Terminate any node.exe process spawned from the install directory
try {
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.CommandLine -and $_.CommandLine.Contains($installDir)) {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }
} catch { }

Start-Sleep -Milliseconds 500

Write-Host "[2/4] Removing desktop and start menu shortcuts..." -ForegroundColor Yellow
$shortcuts = @(
    (Join-Path ([Environment]::GetFolderPath('Desktop')) "LetsMarkNow.lnk"),
    (Join-Path "$env:USERPROFILE\Desktop" "LetsMarkNow.lnk"),
    (Join-Path ([Environment]::GetFolderPath('Programs')) "LetsMarkNow.lnk"),
    (Join-Path ([Environment]::GetFolderPath('Programs')) "Uninstall LetsMarkNow.lnk"),
    (Join-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs" "LetsMarkNow.lnk"),
    (Join-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs" "Uninstall LetsMarkNow.lnk")
)

foreach ($sc in $shortcuts) {
    if (Test-Path $sc) {
        Remove-Item -Path $sc -Force -ErrorAction SilentlyContinue
        Write-Host "  * Removed: $sc" -ForegroundColor DarkGray
    }
}

Write-Host "[3/4] Removing Windows Registry entries..." -ForegroundColor Yellow
$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\LetsMarkNow"
if (Test-Path $regPath) {
    Remove-Item -Path $regPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  * Removed Registry entry: $regPath" -ForegroundColor DarkGray
}

Write-Host "[4/4] Removing installation and profile files..." -ForegroundColor Yellow
if (Test-Path $installDir) {
    $currentScriptPath = $MyInvocation.MyCommand.Path
    $isSelfInInstallDir = $currentScriptPath -and $currentScriptPath.StartsWith($installDir, [System.StringComparison]::OrdinalIgnoreCase)

    if ($isSelfInInstallDir) {
        # Detached background removal via PowerShell to avoid file lock
        $cleanCmd = "Start-Sleep -Seconds 2; Remove-Item -Path '$installDir' -Recurse -Force -ErrorAction SilentlyContinue"
        Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-WindowStyle", "Hidden", "-Command", $cleanCmd)
        Write-Host "  * Directory scheduled for deletion: $installDir" -ForegroundColor DarkGray
    } else {
        Remove-Item -Path $installDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  * Removed: $installDir" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] LetsMarkNow has been completely uninstalled." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
