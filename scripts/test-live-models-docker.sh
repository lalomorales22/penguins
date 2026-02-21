#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${PENGUINS_IMAGE:-${PENGUINS_IMAGE:-penguins:local}}"
CONFIG_DIR="${PENGUINS_CONFIG_DIR:-${PENGUINS_CONFIG_DIR:-$HOME/.penguins}}"
WORKSPACE_DIR="${PENGUINS_WORKSPACE_DIR:-${PENGUINS_WORKSPACE_DIR:-$HOME/.penguins/workspace}}"
PROFILE_FILE="${PENGUINS_PROFILE_FILE:-${PENGUINS_PROFILE_FILE:-$HOME/.profile}}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e PENGUINS_LIVE_TEST=1 \
  -e PENGUINS_LIVE_MODELS="${PENGUINS_LIVE_MODELS:-${PENGUINS_LIVE_MODELS:-all}}" \
  -e PENGUINS_LIVE_PROVIDERS="${PENGUINS_LIVE_PROVIDERS:-${PENGUINS_LIVE_PROVIDERS:-}}" \
  -e PENGUINS_LIVE_MODEL_TIMEOUT_MS="${PENGUINS_LIVE_MODEL_TIMEOUT_MS:-${PENGUINS_LIVE_MODEL_TIMEOUT_MS:-}}" \
  -e PENGUINS_LIVE_REQUIRE_PROFILE_KEYS="${PENGUINS_LIVE_REQUIRE_PROFILE_KEYS:-${PENGUINS_LIVE_REQUIRE_PROFILE_KEYS:-}}" \
  -v "$CONFIG_DIR":/home/node/.penguins \
  -v "$WORKSPACE_DIR":/home/node/.penguins/workspace \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"
