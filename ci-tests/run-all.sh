#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo '[1/10] JS syntax'; sh ci-tests/test-syntax.sh
echo '[2/10] HTML assets'; node ci-tests/test-html-assets.js
echo '[3/10] HTML structure'; sh ci-tests/test-html-structure.sh
echo '[4/10] Entity linkage'; node ci-tests/test-entity-integrity.js
echo '[5/10] Guide address integrity'; python3 ci-tests/address-integrity-test.py
echo '[6/10] Trip identity clean'; node ci-tests/test-trip-identity-clean.js
echo '[7/10] Browser recovery static'; node ci-tests/test-japan-browser-recovery.js
echo '[8/10] Canonical integrity + production projection'; node ci-tests/test-canonical-integrity.js
echo '[9/10] Navigation context ownership'; node ci-tests/test-navigation-context.js
echo '[10/10] Checksums + manifest'; sh ci-tests/test-checksums.sh
echo 'ALL CI TESTS PASSED'
