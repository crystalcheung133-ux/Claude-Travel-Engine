#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo '[1/8] JS syntax'; sh ci-tests/test-syntax.sh
echo '[2/8] HTML assets'; node ci-tests/test-html-assets.js
echo '[3/8] HTML structure'; sh ci-tests/test-html-structure.sh
echo '[4/8] Entity linkage'; node ci-tests/test-entity-integrity.js
echo '[5/8] Guide address integrity'; python3 ci-tests/address-integrity-test.py
echo '[6/8] Trip identity clean'; node ci-tests/test-trip-identity-clean.js
echo '[7/8] Browser recovery static'; node ci-tests/test-japan-browser-recovery.js
echo '[8/8] Checksums + manifest'; sh ci-tests/test-checksums.sh
echo 'ALL CI TESTS PASSED'
