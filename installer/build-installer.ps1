# build-installer.ps1
# Automates the building of LetsMarkNow extension, launcher binary, Inno Setup installer, and portable ZIP.

[CmdletBinding()]
param(
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
Push-Location $repoRoot

try {
    # 1. Determine Version
    if (-not $Version) {
        if (Test-Path "$repoRoot\package.json") {
            $pkg = Get-Content "$repoRoot\package.json" -Raw | ConvertFrom-Json
            $Version = $pkg.version
        }
        if (-not $Version) {
            $Version = "1.0.0"
        }
    }
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  Building LetsMarkNow Distribution v$Version" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan

    # 2. Build Chrome Extension
    Write-Host "`n[1/5] Building Chrome Extension..." -ForegroundColor Yellow
    npm run build:extension
    if ($LASTEXITCODE -ne 0) {
        throw "Extension build failed."
    }

    # 3. Compile Launcher Executable (bin\LetsMarkNow.exe)
    Write-Host "`n[2/5] Compiling native Launcher binary with csc.exe..." -ForegroundColor Yellow
    $binDir = Join-Path $repoRoot "bin"
    if (-not (Test-Path $binDir)) {
        New-Item -ItemType Directory -Path $binDir | Out-Null
    }

    $cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
    if (-not (Test-Path $cscPath)) {
        $cscCmd = Get-Command csc.exe -ErrorAction SilentlyContinue
        if ($cscCmd) {
            $cscPath = $cscCmd.Source
        }
    }
    if (-not $cscPath) {
        throw "C# compiler csc.exe not found on system."
    }

    $launcherSrc = Join-Path $repoRoot "installer\launcher\LetsMarkNow.cs"
    $launcherOut = Join-Path $binDir "LetsMarkNow.exe"
    $iconPath = Join-Path $repoRoot "public\favicon.ico"

    & $cscPath /target:winexe /optimize+ /win32icon:"$iconPath" /out:"$launcherOut" "$launcherSrc" /reference:System.Windows.Forms.dll
    if ($LASTEXITCODE -ne 0) {
        throw "Launcher compilation failed."
    }
    Write-Host "  * Launcher compiled -> bin\LetsMarkNow.exe" -ForegroundColor Green

    # 4. Prepare output directory
    $distInstallerDir = Join-Path $repoRoot "dist-installer"
    if (-not (Test-Path $distInstallerDir)) {
        New-Item -ItemType Directory -Path $distInstallerDir | Out-Null
    }

    # Copy install.ps1 and uninstall.ps1 into dist-installer
    Copy-Item (Join-Path $repoRoot "install.ps1") (Join-Path $distInstallerDir "install.ps1") -Force
    Copy-Item (Join-Path $repoRoot "uninstall.ps1") (Join-Path $distInstallerDir "uninstall.ps1") -Force

    # 5. Create Portable Package (.zip)
    Write-Host "`n[3/5] Packaging Portable ZIP..." -ForegroundColor Yellow
    $portableStageDir = Join-Path $env:TEMP "LetsMarkNow-Portable"
    if (Test-Path $portableStageDir) {
        Remove-Item -Recurse -Force $portableStageDir
    }
    New-Item -ItemType Directory -Path $portableStageDir | Out-Null

    Copy-Item $launcherOut (Join-Path $portableStageDir "LetsMarkNow.exe")
    Copy-Item $iconPath (Join-Path $portableStageDir "favicon.ico")
    Copy-Item (Join-Path $repoRoot "installer\launcher\launch.html") (Join-Path $portableStageDir "launch.html")
    Copy-Item (Join-Path $repoRoot "uninstall.ps1") (Join-Path $portableStageDir "uninstall.ps1")
    Copy-Item -Recurse (Join-Path $repoRoot "dist\extension") (Join-Path $portableStageDir "extension")

    $portableZip = Join-Path $distInstallerDir "LetsMarkNow-Portable-v$Version.zip"
    if (Test-Path $portableZip) {
        Remove-Item -Force $portableZip
    }
    Compress-Archive -Path "$portableStageDir\*" -DestinationPath $portableZip -CompressionLevel Optimal
    Remove-Item -Recurse -Force $portableStageDir
    Write-Host "  * Portable ZIP created -> dist-installer\LetsMarkNow-Portable-v$Version.zip" -ForegroundColor Green

    # 6. Compile Inno Setup Installer
    Write-Host "`n[4/5] Compiling Inno Setup Installer..." -ForegroundColor Yellow
    $isccCmd = Get-Command iscc -ErrorAction SilentlyContinue
    $iscc = if ($isccCmd) { $isccCmd.Source } else { $null }
    if (-not $iscc) {
        $innoDefaultPaths = @(
            "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
            "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
            "${env:ProgramFiles(x86)}\Inno Setup 5\ISCC.exe"
        )
        foreach ($p in $innoDefaultPaths) {
            if (Test-Path $p) {
                $iscc = $p
                break
            }
        }
    }

    if ($iscc) {
        $issFile = Join-Path $repoRoot "installer\LetsMarkNow.iss"
        & $iscc "/DMyAppVersion=$Version" "$issFile"
        if ($LASTEXITCODE -ne 0) {
            throw "Inno Setup compilation failed."
        }
        Write-Host "  * Installer created -> dist-installer\LetsMarkNow-Setup-v$Version.exe" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Inno Setup compiler (ISCC.exe) not found on local PATH." -ForegroundColor Yellow
        Write-Host "         (GitHub Actions workflow will automatically provision Inno Setup)." -ForegroundColor Yellow
    }

    # 7. Generate Checksums
    Write-Host "`n[5/5] Generating SHA-256 Checksums..." -ForegroundColor Yellow
    $checksumFile = Join-Path $distInstallerDir "checksums.txt"
    $checksums = @()
    Get-ChildItem -Path $distInstallerDir -File | Where-Object { $_.Name -ne "checksums.txt" } | ForEach-Object {
        $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
        $line = "$hash  $($_.Name)"
        $checksums += $line
        Write-Host "  * $line" -ForegroundColor DarkGray
    }
    $checksums | Set-Content -Path $checksumFile -Encoding UTF8
    Write-Host "  * Checksums saved -> dist-installer\checksums.txt" -ForegroundColor Green

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "  [SUCCESS] All distribution artifacts ready in dist-installer/" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
}
finally {
    Pop-Location
}
