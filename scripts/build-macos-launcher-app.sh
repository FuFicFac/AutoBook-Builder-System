#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPLE_SCRIPT="${ROOT_DIR}/launchers/macos/AutoBookBuilderLauncher.applescript"
APP_OUT="${ROOT_DIR}/launchers/macos/AutoBookBuilderLauncher.app"

if ! command -v osacompile >/dev/null 2>&1; then
  echo "osacompile not found (macOS required)."
  exit 1
fi

rm -rf "${APP_OUT}"
osacompile -o "${APP_OUT}" "${APPLE_SCRIPT}"
echo "Built: ${APP_OUT}"
