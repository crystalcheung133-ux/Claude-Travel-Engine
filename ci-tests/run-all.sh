#!/bin/sh
set -u
failed=0
run(){ echo "== $1 =="; shift; "$@" || failed=1; echo ""; }
run "FOUNDATION" sh ci-tests/suites/01-foundation.sh
run "DATA INTEGRITY" sh ci-tests/suites/02-data-integrity.sh
run "VN PRODUCT CONTRACTS" sh ci-tests/suites/03-product-contracts.sh
run "ANALYTICS" sh ci-tests/suites/04-analytics.sh
run "PORTABILITY" sh ci-tests/suites/05-portability.sh
run "RUNTIME RELIABILITY" sh ci-tests/suites/06-runtime-reliability.sh
run "GENERICITY" sh ci-tests/suites/07-genericity.sh
run "BOOKING / EXPENSE" sh ci-tests/suites/08-booking-expense.sh
run "EXPENSE SAVE SAFETY" sh ci-tests/suites/10-expense-save-safety.sh
run "EXPENSE COMMIT BOUNDARY" sh ci-tests/suites/11-expense-commit-boundary.sh
run "RELEASE" sh ci-tests/suites/09-release.sh
[ "$failed" -eq 0 ] || { echo "MASTER CI SUITE FAILED"; exit 1; }
echo "MASTER CI SUITE PASSED"

echo "== ENGINE 25.4.32 STUDIO POPUP == "
node ci-tests/test-engine-interaction-contract.js

echo "== PRESENTATION SHELL OWNERSHIP =="
node ci-tests/test-presentation-shell-ownership.js styles.css
echo "== PRESENTATION SHELL INTERACTION =="
node ci-tests/test-presentation-shell-interaction.js styles.css admin.js

echo "== RELEASE HYGIENE =="
node ci-tests/test-release-hygiene.js .
