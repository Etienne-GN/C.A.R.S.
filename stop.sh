#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT/.run"

stop_proc() {
  local name="$1"
  local pidfile="$RUN_DIR/$name.pid"

  if [ ! -f "$pidfile" ]; then
    echo "  $name: no pidfile"
    return
  fi

  local pid
  pid="$(cat "$pidfile")"

  if ! kill -0 "$pid" 2>/dev/null; then
    echo "  $name: not running (stale pid $pid)"
    rm -f "$pidfile"
    return
  fi

  kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.3
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
  fi
  echo "  $name: stopped (PID $pid)"
  rm -f "$pidfile"
}

stop_proc backend
stop_proc frontend
