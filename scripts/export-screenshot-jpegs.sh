#!/usr/bin/env bash
# Regenerate JPEG screenshots from PNG sources (macOS `sips`).
# Run from anywhere: ./scripts/export-screenshot-jpegs.sh
# Override quality (1–100): JPEG_QUALITY=80 ./scripts/export-screenshot-jpegs.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
QUALITY="${JPEG_QUALITY:-82}"
SCREENSHOT_ROOT="$ROOT/images/screenshots"

if ! command -v sips >/dev/null 2>&1; then
  echo "error: sips not found (this script requires macOS)." >&2
  exit 1
fi

if [[ ! -d "$SCREENSHOT_ROOT" ]]; then
  echo "error: missing $SCREENSHOT_ROOT" >&2
  exit 1
fi

count=0
while IFS= read -r -d '' png; do
  jpg="${png%.png}.jpg"
  sips -s format jpeg -s formatOptions "$QUALITY" "$png" --out "$jpg" >/dev/null
  echo "$jpg"
  count=$((count + 1))
done < <(find "$SCREENSHOT_ROOT" -name 'screenshot-*.png' -print0)

echo "Done. Exported $count JPEG(s) at quality $QUALITY."
