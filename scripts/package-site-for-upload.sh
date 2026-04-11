#!/usr/bin/env bash
# Copy the static site to a folder suitable for upload (FTP, S3, etc.),
# omitting large screenshot PNGs — the live site uses .jpg only.
#
# Usage:
#   ./scripts/package-site-for-upload.sh           # writes ./_deploy/
#   ./scripts/package-site-for-upload.sh /tmp/site # custom output directory
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/_deploy}"

mkdir -p "$OUT"
rsync -a \
  --delete \
  --exclude '.git/' \
  --exclude '_deploy/' \
  --exclude '.DS_Store' \
  --exclude 'images/screenshots/*/*.png' \
  "$ROOT/" "$OUT/"

echo "Packaged site (no screenshot PNGs) -> $OUT"
echo "Upload the contents of that directory to your host."
