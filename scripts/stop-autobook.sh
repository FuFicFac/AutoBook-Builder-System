#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.runtime"
PID_FILE="${RUNTIME_DIR}/autobook.pid"

if [[ ! -f "${PID_FILE}" ]]; then
  PID_FROM_PORT="$(lsof -ti tcp:8787 -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  if [[ -n "${PID_FROM_PORT}" ]]; then
    echo "[autobook] Stopping pid ${PID_FROM_PORT} (found on :8787)..."
    kill "${PID_FROM_PORT}" 2>/dev/null || true
    sleep 1
    if kill -0 "${PID_FROM_PORT}" 2>/dev/null; then
      kill -9 "${PID_FROM_PORT}" 2>/dev/null || true
    fi
    echo "[autobook] Stopped."
  else
    echo "[autobook] No PID file found. Auto Book Builder may already be stopped."
  fi
  exit 0
fi

PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
if [[ -z "${PID}" ]]; then
  rm -f "${PID_FILE}"
  echo "[autobook] Empty PID file removed."
  exit 0
fi

if kill -0 "${PID}" 2>/dev/null; then
  echo "[autobook] Stopping pid ${PID}..."
  kill "${PID}" 2>/dev/null || true
  sleep 1
  if kill -0 "${PID}" 2>/dev/null; then
    kill -9 "${PID}" 2>/dev/null || true
  fi
  echo "[autobook] Stopped."
else
  echo "[autobook] Process ${PID} not running."
fi

rm -f "${PID_FILE}"
