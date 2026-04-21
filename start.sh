#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT/.run"
mkdir -p "$RUN_DIR"

already_running() {
  local pidfile="$1"
  [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null
}

if already_running "$RUN_DIR/backend.pid" || already_running "$RUN_DIR/frontend.pid"; then
  echo "Something is already running. Run ./stop.sh first."
  exit 1
fi

if [ ! -d "$ROOT/backend/.venv" ]; then
  echo "==> Creating backend virtualenv…"
  python3 -m venv "$ROOT/backend/.venv"
  "$ROOT/backend/.venv/bin/pip" install --upgrade pip
  "$ROOT/backend/.venv/bin/pip" install -r "$ROOT/backend/requirements.txt"
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "==> Installing frontend dependencies…"
  (cd "$ROOT/frontend" && npm install)
fi

echo "==> Starting backend on http://localhost:8000"
(
  cd "$ROOT/backend"
  setsid "$ROOT/backend/.venv/bin/uvicorn" app.main:app --reload --host 127.0.0.1 --port 8000 \
    > "$RUN_DIR/backend.log" 2>&1 < /dev/null &
  echo $! > "$RUN_DIR/backend.pid"
)

echo "==> Starting frontend on http://localhost:5173"
(
  cd "$ROOT/frontend"
  setsid npm run dev > "$RUN_DIR/frontend.log" 2>&1 < /dev/null &
  echo $! > "$RUN_DIR/frontend.pid"
)

sleep 1
echo ""
echo "  Backend:  http://localhost:8000  (PID $(cat "$RUN_DIR/backend.pid"))"
echo "  Frontend: http://localhost:5173  (PID $(cat "$RUN_DIR/frontend.pid"))"
echo ""
echo "  Logs:   $RUN_DIR/backend.log, $RUN_DIR/frontend.log"
echo "  Stop:   ./stop.sh"
