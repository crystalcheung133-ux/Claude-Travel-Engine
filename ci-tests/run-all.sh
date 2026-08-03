#!/bin/sh
# CCMV Travel Engine — full regression test suite.
# Runs every check against the repository-root production files and exits non-zero if any fails.
# Usage: sh ci-tests/run-all.sh
cd "$(dirname "$0")"
overall=0

echo "== 1/5 JS syntax gate =="
sh test-syntax.sh || overall=1
echo ""

echo "== 2/5 Release integrity (checksums + manifest) =="
sh test-checksums.sh || overall=1
echo ""

echo "== 3/5 HTML structure =="
sh test-html-structure.sh || overall=1
echo ""

echo "== 4/5 Entity linkage (places/bookings/itinerary/parties) =="
node test-entity-integrity.js || overall=1
echo ""

echo "== 5/5 Guide address integrity =="
python3 address-integrity-test.py || overall=1
echo ""

echo "== E2A 1/6 Static residue scan =="
node test-e2a-residue-scan.js || overall=1
echo ""

echo "== E2A 2/6 Party rendering (NZ / non-NZ / no-trip fixtures) =="
node test-e2a-party-rendering.js || overall=1
echo ""

echo "== E2A 3/6 First-paint source (index.html) =="
node test-e2a-first-paint.js || overall=1
echo ""

echo "== E2A 4/6 Manifest generation (NZ / non-NZ fixtures) =="
node test-e2a-manifest.js || overall=1
echo ""

echo "== E2A 5/6 Missing-config failure handling =="
node test-e2a-missing-config.js || overall=1
echo ""

echo "== E2A 6/6 Generated manifest matches shipped manifest.webmanifest =="
node ../generate-manifest.js --check || overall=1
echo ""

echo "== E2A.1 1/2 Single failure authority + Complete Trip neutrality =="
node test-e2a1-identity-authority.js || overall=1
echo ""

echo "== E2A.1 2/2 Clean-room dependency gate =="
node test-e2a1-clean-room.js || overall=1
echo ""

echo "== E2B 1/4 Storage namespace + cross-trip isolation =="
node test-e2b-storage-namespace.js || overall=1
echo ""

echo "== E2B 2/4 One-time legacy migration =="
node test-e2b-migration.js || overall=1
echo ""

echo "== E2B 3/4 Reset namespace contract =="
node test-e2b-reset-contract.js || overall=1
echo ""

echo "== E2B 4/4 Runtime key ownership + page load order =="
node test-e2b-runtime-key-ownership.js || overall=1
echo ""

echo "== E2C 1/2 Navigation authority =="
node test-e2c-navigation-authority.js || overall=1
echo ""

echo "== E2C 2/2 Semantic route contract =="
node test-e2c-route-contract.js || overall=1
echo ""

echo "== E2C.1 Trip popup preservation =="
node test-e2c1-trip-popup.js || overall=1
echo ""

if [ "$overall" -eq 0 ]; then
  echo "ALL TESTS PASSED"
else
  echo "ONE OR MORE TESTS FAILED"
fi
exit $overall
