# build-installer.ps1
# Automates the building of LetsMarkNow extension, backend bundle, launcher binaries, Inno Setup installer, and portable ZIP.

[CmdletBinding()]
param(
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

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

    # 2. Build Chrome Extension and Web Dashboard
    Write-Host "`n[1/6] Building Chrome Extension and Web Dashboard SPA..." -ForegroundColor Yellow
    npm run build:extension
    if ($LASTEXITCODE -ne 0) {
        throw "Chrome Extension build failed."
    }
    npm run build:web
    if ($LASTEXITCODE -ne 0) {
        throw "Web Dashboard build failed."
    }

    # 3. Bundle Backend (Fastify + SQLite API)
    Write-Host "`n[2/6] Bundling Backend server with esbuild..." -ForegroundColor Yellow
    npm --prefix backend run bundle
    if ($LASTEXITCODE -ne 0) {
        throw "Backend bundling failed."
    }

    # Bundling standalone node.exe into backend directory if available
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd -and (Test-Path $nodeCmd.Source)) {
        $backendNodeExe = Join-Path $repoRoot "backend\node.exe"
        if (-not (Test-Path $backendNodeExe)) {
            Write-Host "  * Bundling node.exe for standalone execution..." -ForegroundColor DarkGray
            Copy-Item $nodeCmd.Source $backendNodeExe -Force
        }
    }

    # 4. Compile Launcher Binaries (bin\LetsMarkNow.exe and bin\backend.exe)
    Write-Host "`n[3/6] Compiling native Launcher binaries with csc.exe..." -ForegroundColor Yellow
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

    $iconPath = Join-Path $repoRoot "public\favicon.ico"

    # 4a. Compile LetsMarkNow.exe
    $launcherSrc = Join-Path $repoRoot "installer\launcher\LetsMarkNow.cs"
    $launcherOut = Join-Path $binDir "LetsMarkNow.exe"
    & $cscPath /target:winexe /optimize+ /win32icon:"$iconPath" /out:"$launcherOut" "$launcherSrc" /reference:System.Windows.Forms.dll
    if ($LASTEXITCODE -ne 0) {
        throw "LetsMarkNow.exe compilation failed."
    }
    Write-Host "  * Main Launcher compiled -> bin\LetsMarkNow.exe" -ForegroundColor Green

    # 4b. Compile backend.exe
    $backendSrc = Join-Path $repoRoot "installer\launcher\backend.cs"
    $backendOut = Join-Path $binDir "backend.exe"
    & $cscPath /target:winexe /optimize+ /win32icon:"$iconPath" /out:"$backendOut" "$backendSrc"
    if ($LASTEXITCODE -ne 0) {
        throw "backend.exe compilation failed."
    }
    Write-Host "  * Backend Launcher compiled -> bin\backend.exe" -ForegroundColor Green

    # 5. Prepare staging directory inside dist-installer
    $distInstallerDir = Join-Path $repoRoot "dist-installer"
    if (-not (Test-Path $distInstallerDir)) {
        New-Item -ItemType Directory -Path $distInstallerDir | Out-Null
    }

    $portableStageDir = Join-Path $distInstallerDir "stage"
    if (Test-Path $portableStageDir) {
        Remove-Item -Recurse -Force $portableStageDir -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Path $portableStageDir | Out-Null

    # Copy launcher binaries, shortcuts, web dashboard and extension
    Copy-Item $launcherOut (Join-Path $portableStageDir "LetsMarkNow.exe")
    Copy-Item $backendOut (Join-Path $portableStageDir "backend.exe")
    Copy-Item $iconPath (Join-Path $portableStageDir "favicon.ico")
    Copy-Item (Join-Path $repoRoot "uninstall.ps1") (Join-Path $portableStageDir "uninstall.ps1")
    Copy-Item -Recurse (Join-Path $repoRoot "dist\extension") (Join-Path $portableStageDir "extension")
    Copy-Item -Recurse (Join-Path $repoRoot "dist\web") (Join-Path $portableStageDir "web")

    # Copy backend service files
    $stageBackend = Join-Path $portableStageDir "backend"
    New-Item -ItemType Directory -Path $stageBackend | Out-Null
    Copy-Item -Recurse (Join-Path $repoRoot "backend\dist") (Join-Path $stageBackend "dist")
    Copy-Item (Join-Path $repoRoot "backend\package.json") (Join-Path $stageBackend "package.json")
    if (Test-Path (Join-Path $repoRoot "backend\.env")) {
        Copy-Item (Join-Path $repoRoot "backend\.env") (Join-Path $stageBackend ".env")
    }
    if (Test-Path (Join-Path $repoRoot "backend\node.exe")) {
        Copy-Item (Join-Path $repoRoot "backend\node.exe") (Join-Path $stageBackend "node.exe")
    }

    # Copy backend node_modules using robocopy with /XJ (exclude junction points) for maximum Windows speed
    $backendNM = Join-Path $repoRoot "backend\node_modules"
    $stageNM = Join-Path $stageBackend "node_modules"
    if (Test-Path $backendNM) {
        $prevNativeEAP = $PSNativeCommandUseErrorActionPreference
        $PSNativeCommandUseErrorActionPreference = $false
        & robocopy "$backendNM" "$stageNM" /E /XJ /NFL /NDL /NJH /NJS /NC /NS /NP /MT:16
        # In robocopy, exit codes < 8 indicate success
        if ($LASTEXITCODE -ge 8) {
            throw "robocopy node_modules failed with code $LASTEXITCODE"
        }
        $global:LASTEXITCODE = 0
        $PSNativeCommandUseErrorActionPreference = $prevNativeEAP
    }

    # Copy install.ps1 and uninstall.ps1 into dist-installer
    Copy-Item (Join-Path $repoRoot "install.ps1") (Join-Path $distInstallerDir "install.ps1") -Force
    Copy-Item (Join-Path $repoRoot "uninstall.ps1") (Join-Path $distInstallerDir "uninstall.ps1") -Force

    # 6. Create Portable Package (.zip)
    Write-Host "`n[4/6] Packaging Portable ZIP..." -ForegroundColor Yellow
    $portableZip = Join-Path $distInstallerDir "LetsMarkNow-Portable-v$Version.zip"
    if (Test-Path $portableZip) {
        Remove-Item -Force $portableZip
    }

    $sevenZip = Get-Command "7z.exe", "7z" -ErrorAction SilentlyContinue
    if (-not $sevenZip) {
        $sevenZipPaths = @(
            "${env:ProgramFiles}\7-Zip\7z.exe",
            "${env:ProgramFiles(x86)}\7-Zip\7z.exe"
        )
        foreach ($sz in $sevenZipPaths) {
            if (Test-Path $sz) {
                $sevenZip = Get-Item $sz
                break
            }
        }
    }

    if ($sevenZip) {
        Write-Host "  * Packaging with 7-Zip..." -ForegroundColor DarkGray
        Push-Location $portableStageDir
        try {
            $szCmd = if ($sevenZip -is [System.IO.FileInfo]) { $sevenZip.FullName } else { $sevenZip.Source }
            & $szCmd a -tzip -mx=3 "$portableZip" * | Out-Null
            if ($LASTEXITCODE -ne 0) {
                throw "7-Zip packaging failed with exit code $LASTEXITCODE"
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "  * Packaging with .NET ZipFile..." -ForegroundColor DarkGray
        Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
        [System.IO.Compression.ZipFile]::CreateFromDirectory($portableStageDir, $portableZip, [System.IO.Compression.CompressionLevel]::Fastest, $false)
    }
    Write-Host "  * Portable ZIP created -> dist-installer\LetsMarkNow-Portable-v$Version.zip" -ForegroundColor Green

    # 7. Compile Inno Setup Installer
    Write-Host "`n[5/6] Compiling Inno Setup Installer..." -ForegroundColor Yellow
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

    # Clean up stage folder
    if (Test-Path $portableStageDir) {
        Remove-Item -Recurse -Force $portableStageDir -ErrorAction SilentlyContinue
    }

    # 8. Generate Checksums
    Write-Host "`n[6/6] Generating SHA-256 Checksums..." -ForegroundColor Yellow
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
    $global:LASTEXITCODE = 0
}
catch {
    $err = "$($_.Exception.Message)`n$($_.ScriptStackTrace)"
    Write-Host "::error title=Build Script Exception::$err"
    throw
}
finally {
    Pop-Location
}
