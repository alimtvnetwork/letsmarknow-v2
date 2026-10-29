# local-install.ps1 — Standalone Environment Installer
# Automatically installs Node.js/npm dependencies for LetsMarkNow (root frontend + extension and backend).
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  LetsMarkNow — Environment Dependency Installer" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Verify Node.js
Write-Host "`n[1/4] Checking Node.js runtime..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] Node.js is not found in PATH." -ForegroundColor Red
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "[INFO] Attempting to install Node.js LTS via winget..." -ForegroundColor Cyan
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        Write-Host "[IMPORTANT] Please restart your terminal after Node.js finishes installing." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "[ERROR] Please install Node.js v18+ from https://nodejs.org and re-run." -ForegroundColor Red
        exit 1
    }
} else {
    $nodeVer = (node -v).Trim()
    Write-Host "[OK] Node.js $nodeVer detected." -ForegroundColor Green
}

# 2. Verify npm
Write-Host "`n[2/4] Checking npm package manager..." -ForegroundColor Yellow
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm not found in PATH." -ForegroundColor Red
    exit 1
} else {
    $npmVer = (npm -v).Trim()
    Write-Host "[OK] npm $npmVer detected." -ForegroundColor Green
}

# 3. Install Root Frontend & Extension Dependencies
Write-Host "`n[3/4] Installing root frontend & extension dependencies (npm install)..." -ForegroundColor Yellow
$rootNeedInstall = $Force -or (-not (Test-Path "$PSScriptRoot\node_modules"))
if ($rootNeedInstall) {
    Push-Location "$PSScriptRoot"
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Root npm install failed with code $LASTEXITCODE." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "[OK] Root dependencies installed successfully." -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[OK] Root node_modules already exists. Skipping." -ForegroundColor Green
}

# 4. Install Backend Dependencies
Write-Host "`n[4/4] Installing backend dependencies (backend/package.json)..." -ForegroundColor Yellow
$beNeedInstall = $Force -or (-not (Test-Path "$PSScriptRoot\backend\node_modules"))
if ($beNeedInstall) {
    Push-Location "$PSScriptRoot\backend"
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Backend npm install failed with code $LASTEXITCODE." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "[OK] Backend dependencies installed successfully." -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[OK] Backend node_modules already exists. Skipping." -ForegroundColor Green
}

# Ensure SQLite data folder exists
$dataPath = Join-Path "$PSScriptRoot" "backend\data"
if (-not (Test-Path $dataPath)) {
    New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
}

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "  Installation Complete! Environment is ready to run." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
exit 0
