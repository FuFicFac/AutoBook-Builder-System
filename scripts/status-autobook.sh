#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.runtime"
PID_FILE="${RUNTIME_DIR}/autobook.pid"
APP_URL="http://127.0.0.1:8787"

if [[ -f "${PID_FILE}" ]]; then
  PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [[ -n "${PID}" ]] && kill -0 "${PID}" 2>/dev/null; then
    if curl -fsS "${APP_URL}/api/health" >/dev/null 2>&1; then
      echo "[autobook] running (pid ${PID}) at ${APP_URL}"
      exit 0
    fi
    echo "[autobook] process alive (pid ${PID}) but health endpoint unavailable"
    exit 1
  fi
fi

echo "[autobook] stopped"
exit 1
