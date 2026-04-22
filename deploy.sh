#!/bin/bash
set -euo pipefail

BRANCH="${1:-main}"
CARS_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[C.A.R.S.] Deploying branch: $BRANCH"

cd "$CARS_DIR"

git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "[C.A.R.S.] Installing backend dependencies..."
pip install --break-system-packages -q -r backend/requirements.txt

echo "[C.A.R.S.] Building frontend..."
cd frontend
npm install --silent
npm run build
cd ..

echo "[C.A.R.S.] Restarting backend..."
rc-service cars-backend restart

echo "[C.A.R.S.] Done — running branch: $BRANCH"
