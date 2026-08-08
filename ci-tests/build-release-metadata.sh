#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
# Production runtime = root-level web/runtime assets only. Repository/dev artifacts are excluded.
find . -maxdepth 1 -type f -printf '%f\n' \
 | grep -Ev '^(SHA256SUMS\.txt|PRODUCTION-FILE-MANIFEST\.txt|VERSION\.txt|.*\.md|.*\.sql|BOOKING-SYNC-EDGE-FUNCTION\.ts|bookings\.html|bookings-runtime\.js)$' \
 | sort > /tmp/travel-engine-prod-files.$$
{
  echo 'Saigon Companion Production File Manifest'
  echo 'Generated: 2026-08-08'
  echo 'Base: current Travel Engine release identity from trip-config.js'
  echo 'Reference trip: Vietnam'
  echo
  echo 'Production root files:'
  echo
  sed 's/^/- /' /tmp/travel-engine-prod-files.$$
} > PRODUCTION-FILE-MANIFEST.txt
: > SHA256SUMS.txt
while IFS= read -r f; do sha256sum "$f" >> SHA256SUMS.txt; done < /tmp/travel-engine-prod-files.$$
sha256sum PRODUCTION-FILE-MANIFEST.txt >> SHA256SUMS.txt
rm -f /tmp/travel-engine-prod-files.$$
