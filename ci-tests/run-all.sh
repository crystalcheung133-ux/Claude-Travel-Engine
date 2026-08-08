#!/bin/sh
set -u
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
failed=0
run(){ label="$1"; shift; echo; echo "== $label =="; "$@" || failed=1; }
run "1/18 JS syntax gate" sh ci-tests/test-syntax.sh
run "2/18 Release integrity" sh ci-tests/test-checksums.sh
run "3/18 HTML structure" sh ci-tests/test-html-structure.sh
run "4/18 Entity linkage" node ci-tests/test-entity-integrity.js
run "5/18 Guide address integrity" python3 ci-tests/address-integrity-test.py
run "6/18 Timeline integrity" node ci-tests/test-timeline-integrity.js
run "7/18 UX contract" node ci-tests/test-ux-contract.js
run "8/18 Runtime production integrity" node ci-tests/test-runtime-integrity.js
run "9/18 Admin modal safe-area" node ci-tests/test-rc25-2-3.js
run "10/18 Analytics runtime" node ci-tests/test-analytics-v1.js
run "11/18 Analytics permission" node ci-tests/test-analytics-permission-contract.js
run "12/18 Booking Foundation" node ci-tests/test-booking-foundation.js
run "13/18 VN reference integration" node ci-tests/test-vn-reference-integration.js
run "14/18 Dual-currency Expenses" node ci-tests/test-dual-currency-expenses.js .
run "15/18 RC9 presentation" node ci-tests/test-rc9-presentation-contract.js
run "16/18 RC10 presentation + guide" node ci-tests/test-rc10-presentation-contract.js
run "17/18 RC11 sync + content" node ci-tests/test-rc11-sync-content-contract.js
run "18/18 RC12 identity + UI" node ci-tests/test-rc12-identity-ui-contract.js
if [ "$failed" -ne 0 ]; then echo; echo "ONE OR MORE TESTS FAILED"; exit 1; fi
echo; echo "ALL VN REFERENCE TESTS PASSED"

node ci-tests/test-rc11-sync-content-contract.js

node ci-tests/test-rc13-browser-acceptance-contract.js
