#!/bin/sh
set -u
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
failed=0
run(){ label="$1"; shift; echo; echo "== $label =="; "$@" || failed=1; }
run "1/14 JS syntax gate" sh ci-tests/test-syntax.sh
run "2/14 Release integrity" sh ci-tests/test-checksums.sh
run "3/14 HTML structure" sh ci-tests/test-html-structure.sh
run "4/14 Entity linkage" node ci-tests/test-entity-integrity.js
run "5/14 Guide address integrity" python3 ci-tests/address-integrity-test.py
run "6/14 Timeline integrity" node ci-tests/test-timeline-integrity.js
run "7/14 UX contract" node ci-tests/test-ux-contract.js
run "8/14 Runtime production integrity" node ci-tests/test-runtime-integrity.js
run "9/14 Admin modal safe-area" node ci-tests/test-rc25-2-3.js
run "10/14 Analytics runtime" node ci-tests/test-analytics-v1.js
run "11/14 Analytics permission" node ci-tests/test-analytics-permission-contract.js
run "12/14 Booking Foundation" node ci-tests/test-booking-foundation.js
run "13/14 VN reference integration" node ci-tests/test-vn-reference-integration.js
run "14/14 Dual-currency Expenses" node ci-tests/test-dual-currency-expenses.js .
if [ "$failed" -ne 0 ]; then echo; echo "ONE OR MORE TESTS FAILED"; exit 1; fi
echo; echo "ALL VN REFERENCE TESTS PASSED"
