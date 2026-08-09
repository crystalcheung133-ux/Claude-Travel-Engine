#!/bin/sh
set -u
failed=0
echo "== VN PRODUCT CONTRACTS =="
node ci-tests/test-ux-contract.js || failed=1
node ci-tests/test-rc25-2-3.js || failed=1
node ci-tests/test-booking-foundation.js || failed=1
node ci-tests/test-vn-reference-integration.js || failed=1
node ci-tests/test-dual-currency-expenses.js . || failed=1
node ci-tests/test-rc9-presentation-contract.js || failed=1
node ci-tests/test-rc10-presentation-contract.js || failed=1
node ci-tests/test-rc11-sync-content-contract.js || failed=1
node ci-tests/test-rc12-identity-ui-contract.js || failed=1
node ci-tests/test-rc13-browser-acceptance-contract.js || failed=1
node ci-tests/test-rc14-cache-visual-contract.js || failed=1
node ci-tests/test-rc15-moments-timeline-contract.js || failed=1
node ci-tests/test-rc16-guide-shopping-contract.js || failed=1
node ci-tests/test-rc17-guide-content-audit.js || failed=1
node ci-tests/test-rc18-shopping-navigation.js || failed=1
node ci-tests/test-rc19-guide-booking-contract.js || failed=1
node ci-tests/test-rc21-guide-taxonomy-contract.js || failed=1
node ci-tests/test-rc22-trip-day-address-contract.js || failed=1
node ci-tests/test-rc23-copy-feedback-rounded.js || failed=1
node ci-tests/test-rc24-copy-global-click.js || failed=1
node ci-tests/test-rc25-copy-eligibility-mobile.js || failed=1
node ci-tests/test-guide-menu-alignment.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "VN PRODUCT CONTRACTS: PASS"
