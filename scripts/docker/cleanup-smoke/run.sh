#!/usr/bin/env bash
set -euo pipefail

cd /repo

export PENGUINS_STATE_DIR="/tmp/penguins-test"
export PENGUINS_CONFIG_PATH="${PENGUINS_STATE_DIR}/penguins.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${PENGUINS_STATE_DIR}/credentials"
mkdir -p "${PENGUINS_STATE_DIR}/agents/main/sessions"
echo '{}' >"${PENGUINS_CONFIG_PATH}"
echo 'creds' >"${PENGUINS_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${PENGUINS_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm penguins reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${PENGUINS_CONFIG_PATH}"
test ! -d "${PENGUINS_STATE_DIR}/credentials"
test ! -d "${PENGUINS_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${PENGUINS_STATE_DIR}/credentials"
echo '{}' >"${PENGUINS_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm penguins uninstall --state --yes --non-interactive

test ! -d "${PENGUINS_STATE_DIR}"

echo "OK"
