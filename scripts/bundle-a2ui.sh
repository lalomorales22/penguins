#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_FILE="$ROOT_DIR/src/canvas-host/a2ui/a2ui.bundle.js"

# The native app tree that originally produced this bundle is no longer part of
# the supported web/CLI-only repository. Keep the committed bundle as-is.
if [[ -f "$OUTPUT_FILE" ]]; then
  echo "A2UI bundle is committed; skipping rebuild."
  exit 0
fi

echo "Missing committed A2UI bundle at: $OUTPUT_FILE" >&2
echo "Restore it from git before building Penguins." >&2
exit 1
