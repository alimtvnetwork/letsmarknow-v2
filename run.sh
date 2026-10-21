#!/usr/bin/env bash
# run.sh — Fullstack Runner & Environment Installer
# Rebuilds the LetsMarkNow Chrome Extension and concurrently launches frontend + backend.
# Automatically detects missing dependencies, installs them on first run, or proceeds directly.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT_FE=5173
PORT_BE=3000

BUILD_ONLY=false
INSTALL=false
FRONTEND_ONLY=false
BACKEND_ONLY=false
SKIP_BUILD=false
CI=false

# Read run.config.json if jq is available
if [ -f "$SCRIPT_DIR/run.config.json" ] && command -v jq &> /dev/null; then
    PORT_FE=$(jq -r '.ports.frontend // 5173' "$SCRIPT_DIR/run.config.json")
    PORT_BE=$(jq -r '.ports.backend // 3000' "$SCRIPT_DIR/run.config.json")
fi

# Parse flags
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -b|--build|--build-only) BUILD_ONLY=true ;;
        -i|--install) INSTALL=true ;;
        -f|--fe|--frontend-only) FRONTEND_ONLY=true ;;
        -be|--backend-only) BACKEND_ONLY=true ;;
        -s|--skip-build) SKIP_BUILD=true ;;
        -c|--ci) CI=true ;;
        -h|--help)
            echo "========================================================================"
            echo "  LetsMarkNow — Chrome Extension & Fullstack Runner (run.sh)"
            echo "========================================================================"
            echo "USAGE:"
            echo "  ./run.sh                    Check deps -> Rebuild extension -> Run dev"
            echo "  ./run.sh -b, --build-only   Rebuild extension and exit"
            echo "  ./run.sh -i, --install      Force install/update dependencies"
            echo "  ./run.sh -f, --frontend-only Start frontend only"
            echo "  ./run.sh -be, --backend-only Start backend only"
            echo "  ./run.sh -s, --skip-build   Skip extension rebuild"
            echo "  ./run.sh -c, --ci           CI Mode (build and test all)"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "========================================================================"
echo "  LetsMarkNow — Chrome Extension & Fullstack Runner"
echo "========================================================================"

# Step 1: Check dependencies
echo ""
echo "[1/3] Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js v18+ and rerun." >&2
    exit 1
fi
echo "  • Node.js : $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed. Please install npm and rerun." >&2
    exit 1
fi
echo "  • npm     : $(npm -v)"

# Check if node_modules exist
ROOT_MISSING=false
BE_MISSING=false
if [ ! -d "$SCRIPT_DIR/node_modules/vite" ]; then ROOT_MISSING=true; fi
if [ ! -d "$SCRIPT_DIR/backend/node_modules/fastify" ]; then BE_MISSING=true; fi

if [ "$INSTALL" = true ] || [ "$ROOT_MISSING" = true ] || [ "$BE_MISSING" = true ]; then
    echo ""
    echo "[DEPENDENCY ACTION] Missing or uninitialized dependencies detected. Running installer..."
    if [ -f "$SCRIPT_DIR/local-install.sh" ]; then
        bash "$SCRIPT_DIR/local-install.sh"
    else
        cd "$SCRIPT_DIR" && npm install
        cd "$SCRIPT_DIR/backend" && npm install
    fi
    echo "[OK] Dependencies ready."
else
    echo "  • Root node_modules    : OK"
    echo "  • Backend node_modules : OK"
    echo "[OK] Dependencies verified. Direct run proceeding without reinstall."
fi

# Ensure backend .env exists
if [ ! -f "$SCRIPT_DIR/backend/.env" ] && [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
    cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
    echo "  • Created backend/.env from .env.example"
fi

mkdir -p "$SCRIPT_DIR/backend/data"

# Step 2: Rebuild Extension
if [ "$SKIP_BUILD" = false ] && [ "$BACKEND_ONLY" = false ]; then
    echo ""
    echo "[2/3] Rebuilding Chrome Extension (dist/extension)..."
    cd "$SCRIPT_DIR"
    npm run build:extension
    echo "[OK] Chrome extension rebuilt successfully -> dist/extension/"
else
    echo ""
    echo "[2/3] Skipping extension build."
fi

# Step 3: Handle Modes
if [ "$CI" = true ]; then
    echo ""
    echo "[CI MODE] Running Test Suites..."
    cd "$SCRIPT_DIR"
    npm test
    cd "$SCRIPT_DIR/backend"
    npm test
    echo "[OK] CI pipeline verified successfully!"
    exit 0
fi

if [ "$BUILD_ONLY" = true ]; then
    echo ""
    echo "[OK] BuildOnly completed. Exiting."
    exit 0
fi

# Step 4: Run Services
echo ""
echo "[3/3] Starting fullstack services..."
echo "========================================================================"
echo "  Services Online:"
if [ "$BACKEND_ONLY" = false ]; then
    echo "  • Frontend Dev Server : http://localhost:$PORT_FE"
fi
if [ "$FRONTEND_ONLY" = false ]; then
    echo "  • Fastify API Server  : http://localhost:$PORT_BE"
    echo "  • Health Check        : http://localhost:$PORT_BE/v1/health"
    echo "  • SQLite Database     : backend/data/letsmarknow.db"
fi
echo "  • Chrome Extension    : dist/extension (Load unpacked)"
echo "========================================================================"
echo "Press Ctrl+C to terminate all services."
echo ""

PIDS=()

cleanup() {
    echo ""
    echo "[SHUTDOWN] Stopping all LetsMarkNow services..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    wait 2>/dev/null || true
    echo "[OK] All services cleanly stopped."
}

trap cleanup INT TERM EXIT

cd "$SCRIPT_DIR"
if [ "$FRONTEND_ONLY" = false ]; then
    (cd backend && npm run dev) &
    PIDS+=($!)
fi

if [ "$BACKEND_ONLY" = false ]; then
    npm run dev -- --port "$PORT_FE" &
    PIDS+=($!)
fi

wait
