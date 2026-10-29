#!/usr/bin/env bash
# local-install.sh — Standalone Environment Installer
# Automatically installs Node.js/npm dependencies for LetsMarkNow (root frontend + extension and backend).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================="
echo "  LetsMarkNow — Environment Dependency Installer"
echo "======================================================="

# 1. Verify Node.js
echo ""
echo "[1/4] Checking Node.js runtime..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js v18+ and rerun." >&2
    exit 1
fi
echo "[OK] Node.js $(node -v) detected."

# 2. Verify npm
echo ""
echo "[2/4] Checking npm package manager..."
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed. Please install npm and rerun." >&2
    exit 1
fi
echo "[OK] npm $(npm -v) detected."

# 3. Root dependencies
echo ""
echo "[3/4] Installing root dependencies..."
cd "$SCRIPT_DIR"
if [ ! -d "node_modules" ] || [ "$1" = "--force" ]; then
    npm install
    echo "[OK] Root dependencies installed."
else
    echo "[OK] Root node_modules already exists. Skipping."
fi

# 4. Backend dependencies
echo ""
echo "[4/4] Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ] || [ "$1" = "--force" ]; then
    npm install
    echo "[OK] Backend dependencies installed."
else
    echo "[OK] Backend node_modules already exists. Skipping."
fi

mkdir -p "$SCRIPT_DIR/backend/data"

echo ""
echo "======================================================="
echo "  Installation Complete! Environment is ready to run."
echo "======================================================="
exit 0
