#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
FRONTEND_DIR_REAL="$(cd "${FRONTEND_DIR}" 2>/dev/null && pwd -P || true)"
RUNTIME_DIR="${ROOT_DIR}/.runtime"
PID_FILE="${RUNTIME_DIR}/autobook.pid"

is_expected_app_process() {
  local pid="$1"
  local cmd cwd cwd_real
  cmd="$(ps -p "${pid}" -o command= 2>/dev/null || true)"
  cwd="$(lsof -a -p "${pid}" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1 || true)"
  cwd_real="$(cd "${cwd}" 2>/dev/null && pwd -P || true)"
  if [[ "${cmd}" == *"node server.js"* ]] && [[ -n "${FRONTEND_DIR_REAL}" ]] && [[ "${cwd_real}" == "${FRONTEND_DIR_REAL}" ]]; then
    return 0
  fi
  return 1
}

if [[ ! -f "${PID_FILE}" ]]; then
  PID_FROM_PORT="$(lsof -ti tcp:8787 -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  if [[ -n "${PID_FROM_PORT}" ]]; then
    if ! is_expected_app_process "${PID_FROM_PORT}"; then
      echo "[autobook] Port :8787 is in use by a different process. Refusing to stop it."
      exit 1
    fi
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
  if ! is_expected_app_process "${PID}"; then
    echo "[autobook] PID ${PID} does not look like this app's frontend server. Refusing to stop it."
    exit 1
  fi
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
