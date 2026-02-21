#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
RUNTIME_DIR="${ROOT_DIR}/.runtime"
PID_FILE="${RUNTIME_DIR}/autobook.pid"
LOG_FILE="${RUNTIME_DIR}/autobook.log"
APP_URL="http://127.0.0.1:8787"

mkdir -p "${RUNTIME_DIR}"

if ! command -v node >/dev/null 2>&1; then
  echo "[autobook] node is not installed or not on PATH."
  exit 1
fi

if [[ ! -f "${FRONTEND_DIR}/package.json" ]]; then
  echo "[autobook] frontend/package.json not found."
  exit 1
fi

if curl -fsS "${APP_URL}/api/health" >/dev/null 2>&1; then
  EXISTING_PID="$(lsof -ti tcp:8787 -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  if [[ -n "${EXISTING_PID}" ]]; then
    echo "${EXISTING_PID}" > "${PID_FILE}"
    echo "[autobook] Already running at ${APP_URL} (pid ${EXISTING_PID})."
  else
    echo "[autobook] Already running at ${APP_URL}."
  fi
  if command -v open >/dev/null 2>&1; then
    open "${APP_URL}" >/dev/null 2>&1 || true
  fi
  exit 0
fi

if [[ ! -d "${FRONTEND_DIR}/node_modules" ]]; then
  echo "[autobook] Installing dependencies (first run)..."
  (cd "${FRONTEND_DIR}" && npm install)
fi

if [[ -f "${PID_FILE}" ]]; then
  EXISTING_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [[ -n "${EXISTING_PID}" ]] && kill -0 "${EXISTING_PID}" 2>/dev/null; then
    echo "[autobook] Already running (pid ${EXISTING_PID})."
    if command -v open >/dev/null 2>&1; then
      open "${APP_URL}" >/dev/null 2>&1 || true
    fi
    exit 0
  fi
fi

echo "[autobook] Starting Auto Book Builder..."
(
  cd "${FRONTEND_DIR}"
  nohup node server.js >>"${LOG_FILE}" 2>&1 &
  echo $! > "${PID_FILE}"
)

PID="$(cat "${PID_FILE}")"

for _ in $(seq 1 30); do
  if curl -fsS "${APP_URL}/api/health" >/dev/null 2>&1; then
    echo "[autobook] Running at ${APP_URL} (pid ${PID})"
    if command -v open >/dev/null 2>&1; then
      open "${APP_URL}" >/dev/null 2>&1 || true
    fi
    exit 0
  fi
  sleep 1
done

echo "[autobook] Started process (pid ${PID}) but health check did not pass yet."
echo "[autobook] Check logs: ${LOG_FILE}"
exit 1
