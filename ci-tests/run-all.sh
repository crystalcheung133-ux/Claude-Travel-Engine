#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo '[1/9] JS syntax'; sh ci-tests/test-syntax.sh
echo '[2/9] HTML assets'; node ci-tests/test-html-assets.js
echo '[3/9] HTML structure'; sh ci-tests/test-html-structure.sh
echo '[4/9] Entity linkage'; node ci-tests/test-entity-integrity.js
echo '[5/9] Guide address integrity'; python3 ci-tests/address-integrity-test.py
echo '[6/9] Trip identity clean'; node ci-tests/test-trip-identity-clean.js
echo '[7/9] Browser recovery static'; node ci-tests/test-japan-browser-recovery.js
echo '[8/9] Canonical integrity + production projection'; node ci-tests/test-canonical-integrity.js
echo '[9/9] Checksums + manifest'; sh ci-tests/test-checksums.sh
echo 'ALL CI TESTS PASSED'
