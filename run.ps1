# run.ps1 - Fullstack Runner and Environment Installer
# Rebuilds the LetsMarkNow Chrome Extension and concurrently launches frontend + backend.
# Automatically detects missing dependencies, installs them on first run, or proceeds directly.

[CmdletBinding()]
param(
    [Alias('b')][switch]$BuildOnly,
    [Alias('i')][switch]$Install,
    [Alias('f')][switch]$FrontendOnly,
    [Alias('be')][switch]$BackendOnly,
    [Alias('s')][switch]$SkipBuild,
    [Alias('c')][switch]$CI,
    [Alias('h', '?')][switch]$Help,
    [int]$PortFE = 5173,
    [int]$PortBE = 3000
)

$ErrorActionPreference = "Stop"

if ($Help) {
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "  LetsMarkNow - Chrome Extension and Fullstack Runner (run.ps1)" -ForegroundColor Cyan
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  .\run.ps1                     Check deps -> Rebuild extension -> Run frontend + backend"
    Write-Host "  .\run.ps1 -BuildOnly          Rebuild Chrome extension and exit"
    Write-Host "  .\run.ps1 -Install            Force install/update all dependencies before running"
    Write-Host "  .\run.ps1 -FrontendOnly       Run frontend dev server only"
    Write-Host "  .\run.ps1 -BackendOnly        Run backend Fastify/SQLite server only"
    Write-Host "  .\run.ps1 -SkipBuild          Skip rebuilding the Chrome extension"
    Write-Host "  .\run.ps1 -CI                 CI Mode: build extension and execute full test suites"
    Write-Host "  .\run.ps1 -PortFE 5173        Specify frontend dev server port"
    Write-Host "  .\run.ps1 -PortBE 3000        Specify backend API server port"
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    exit 0
}

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  LetsMarkNow - Chrome Extension and Fullstack Runner" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

# Read run.config.json if present
$configFile = Join-Path $PSScriptRoot "run.config.json"
if (Test-Path $configFile) {
    try {
        $config = Get-Content $configFile -Raw | ConvertFrom-Json
        if ($config.ports.frontend -and -not $PSBoundParameters.ContainsKey('PortFE')) {
            $PortFE = [int]$config.ports.frontend
        }
        if ($config.ports.backend -and -not $PSBoundParameters.ContainsKey('PortBE')) {
            $PortBE = [int]$config.ports.backend
        }
    } catch {
        # ignore parse failure, use defaults
    }
}

# -------------------------------------------------------------------------
# Step 1: Pre-flight Dependency and Runtime Verification
# -------------------------------------------------------------------------
Write-Host ""
Write-Host "[1/3] Checking dependencies..." -ForegroundColor Yellow

# Verify Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] Node.js is not found in PATH." -ForegroundColor Red
    if (Get-Command gitmap -ErrorAction SilentlyContinue) {
        Write-Host "[INFO] Attempting installation via GitMap AUM..." -ForegroundColor Cyan
        gitmap aum install nodejs
    } else {
        $installScript = Join-Path $PSScriptRoot "local-install.ps1"
        if (Test-Path $installScript) {
            & $installScript
        } else {
            Write-Host "[ERROR] Please install Node.js v18+ from https://nodejs.org and rerun." -ForegroundColor Red
            exit 1
        }
    }
} else {
    $nodeVer = (node -v).Trim()
    Write-Host "  * Node.js : $nodeVer" -ForegroundColor Green
}

# Verify npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm is not found in PATH." -ForegroundColor Red
    exit 1
} else {
    $npmVer = (npm -v).Trim()
    Write-Host "  * npm     : $npmVer" -ForegroundColor Green
}

# Check if root and backend node_modules exist
$rootModulesPath = Join-Path $PSScriptRoot "node_modules"
$backendModulesPath = Join-Path $PSScriptRoot "backend\node_modules"

$isRootMissing = (-not (Test-Path $rootModulesPath)) -or (-not (Test-Path (Join-Path $rootModulesPath "vite")))
$isBackendMissing = (-not (Test-Path $backendModulesPath)) -or (-not (Test-Path (Join-Path $backendModulesPath "fastify")))

if ($Install -or $isRootMissing -or $isBackendMissing) {
    Write-Host ""
    Write-Host "[DEPENDENCY ACTION] Missing or uninitialized dependencies detected. Running installer..." -ForegroundColor Magenta
    $installScript = Join-Path $PSScriptRoot "local-install.ps1"
    if (Test-Path $installScript) {
        & $installScript -Force:$Install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Dependency installation failed." -ForegroundColor Red
            exit 1
        }
    } else {
        if ($isRootMissing -or $Install) {
            Write-Host "  * Installing root dependencies..." -ForegroundColor Cyan
            & npm install
        }
        if ($isBackendMissing -or $Install) {
            Write-Host "  * Installing backend dependencies..." -ForegroundColor Cyan
            & npm --prefix backend install
        }
    }
    Write-Host "[OK] Dependencies ready." -ForegroundColor Green
} else {
    Write-Host "  * Root node_modules    : OK" -ForegroundColor Green
    Write-Host "  * Backend node_modules : OK" -ForegroundColor Green
    Write-Host "[OK] Dependencies verified. Direct run proceeding without reinstall." -ForegroundColor Green
}

# Ensure backend .env exists
$beEnvFile = Join-Path $PSScriptRoot "backend\.env"
$beEnvExample = Join-Path $PSScriptRoot "backend\.env.example"
if ((-not (Test-Path $beEnvFile)) -and (Test-Path $beEnvExample)) {
    Copy-Item $beEnvExample $beEnvFile
    Write-Host "  * Created backend\.env from .env.example" -ForegroundColor DarkGray
}

# Ensure backend data directory exists for SQLite
$beDataDir = Join-Path $PSScriptRoot "backend\data"
if (-not (Test-Path $beDataDir)) {
    New-Item -ItemType Directory -Path $beDataDir -Force | Out-Null
}

# -------------------------------------------------------------------------
# Step 2: Rebuild Extension (unless skipped or backend-only)
# -------------------------------------------------------------------------
if (-not $SkipBuild -and -not $BackendOnly) {
    Write-Host ""
    Write-Host "[2/3] Rebuilding Chrome Extension (dist/extension)..." -ForegroundColor Yellow
    $buildStart = Get-Date
    & npm run build:extension
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Chrome extension build failed with code $LASTEXITCODE." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    $buildSecs = [Math]::Round(((Get-Date) - $buildStart).TotalSeconds, 1)
    Write-Host "[OK] Chrome extension rebuilt in $buildSecs s -> dist/extension/" -ForegroundColor Green
    Write-Host "     To install in Chrome: chrome://extensions -> Developer mode -> Load unpacked -> select dist/extension" -ForegroundColor DarkCyan
} else {
    Write-Host ""
    Write-Host "[2/3] Skipping extension build (-SkipBuild or -BackendOnly)." -ForegroundColor DarkGray
}

# -------------------------------------------------------------------------
# Step 3: Handle Modes (-CI, -BuildOnly, or Concurrent Services)
# -------------------------------------------------------------------------

# CI Mode: Run test suites and exit
if ($CI) {
    Write-Host ""
    Write-Host "[CI MODE] Running Frontend and Backend Test Suites..." -ForegroundColor Magenta
    
    Write-Host ""
    Write-Host ">> Running Frontend Tests (vitest)..." -ForegroundColor Cyan
    & npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Frontend tests failed." -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host ">> Running Backend Tests (vitest)..." -ForegroundColor Cyan
    & npm --prefix backend run test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Backend tests failed." -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Green
    Write-Host "  [CI SUCCESS] All builds and test suites passed cleanly!" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
    exit 0
}

# BuildOnly Mode: Exit immediately
if ($BuildOnly) {
    Write-Host ""
    Write-Host "[OK] BuildOnly completed. Exiting." -ForegroundColor Green
    exit 0
}

# Start Concurrent Services: Frontend and Backend
Write-Host ""
Write-Host "[3/3] Starting fullstack services..." -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  Services Online:" -ForegroundColor Cyan
if (-not $BackendOnly) {
    Write-Host "  * Frontend Dev Server : http://localhost:$PortFE" -ForegroundColor Green
}
if (-not $FrontendOnly) {
    Write-Host "  * Fastify API Server  : http://localhost:$PortBE" -ForegroundColor Green
    Write-Host "  * Health Check        : http://localhost:$PortBE/v1/health" -ForegroundColor Green
    Write-Host "  * SQLite Database     : backend/data/letsmarknow.db" -ForegroundColor Green
}
Write-Host "  * Chrome Extension    : dist/extension (Load unpacked)" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to terminate all services." -ForegroundColor DarkYellow
Write-Host ""

$childProcesses = @()

try {
    # 1. Start Backend Fastify Server
    if (-not $FrontendOnly) {
        $beDir = Join-Path $PSScriptRoot "backend"
        $beProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $beDir -PassThru -NoNewWindow
        $childProcesses += $beProc
    }

    # 2. Start Frontend Vite Server
    if (-not $BackendOnly) {
        $feProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev -- --port $PortFE" -WorkingDirectory $PSScriptRoot -PassThru -NoNewWindow
        $childProcesses += $feProc
    }

    # Monitor running processes
    while ($true) {
        Start-Sleep -Milliseconds 1000
        foreach ($proc in $childProcesses) {
            if ($proc.HasExited) {
                Write-Host ""
                Write-Host "[WARN] Service process (PID $($proc.Id)) exited with code $($proc.ExitCode)." -ForegroundColor Yellow
                break
            }
        }
    }
} finally {
    Write-Host ""
    Write-Host "[SHUTDOWN] Stopping all LetsMarkNow services..." -ForegroundColor Yellow
    foreach ($proc in $childProcesses) {
        if (-not $proc.HasExited) {
            try {
                cmd.exe /c "taskkill /PID $($proc.Id) /T /F" 2>$null
            } catch {
                try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
            }
        }
    }
    Write-Host "[OK] All services cleanly stopped." -ForegroundColor Green
}
