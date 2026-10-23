#!/bin/sh
set -u
PYTHONDONTWRITEBYTECODE=1
export PYTHONDONTWRITEBYTECODE
failed=0
run(){ echo "== $1 =="; shift; "$@" || failed=1; echo ""; }
run "FOUNDATION" sh ci-tests/suites/01-foundation.sh
run "DATA INTEGRITY" sh ci-tests/suites/02-data-integrity.sh
run "VN PRODUCT CONTRACTS" sh ci-tests/suites/03-product-contracts.sh
run "RETIRED SPA + DAY 2 SHOPPING REGRESSION" node ci-tests/test-retired-spa-and-day2-shopping.js
run "ANALYTICS" sh ci-tests/suites/04-analytics.sh
run "PORTABILITY" sh ci-tests/suites/05-portability.sh
run "RUNTIME RELIABILITY" sh ci-tests/suites/06-runtime-reliability.sh
run "GENERICITY" sh ci-tests/suites/07-genericity.sh
run "BOOKING / EXPENSE" sh ci-tests/suites/08-booking-expense.sh
run "EXPENSE SAVE SAFETY" sh ci-tests/suites/10-expense-save-safety.sh
run "EXPENSE COMMIT BOUNDARY" sh ci-tests/suites/11-expense-commit-boundary.sh
run "INVARIANTS" sh ci-tests/suites/12-invariants.sh
run "RELEASE" sh ci-tests/suites/09-release.sh
run "STUDIO POPUP WORKSPACE" node ci-tests/test-studio-popup-workspace-contract.js styles.css admin.js
run "PRESENTATION SHELL OWNERSHIP" node ci-tests/test-presentation-shell-ownership.js styles.css
run "PRESENTATION SHELL INTERACTION" node ci-tests/test-presentation-shell-interaction.js styles.css admin.js
run "RELEASE HYGIENE" node ci-tests/test-release-hygiene.js .
run "RETIRED BOOKINGS RUNTIME TOMBSTONE" node ci-tests/test-retired-bookings-runtime.js
run "SINGLE RELEASE IDENTITY" node ci-tests/test-single-release-identity.js
run "SUPABASE SDK EXACT PIN" node ci-tests/test-supabase-sdk-pin.js
run "BOOKING / GUIDE MODAL STACKING" node ci-tests/test-booking-guide-modal-stacking.js styles.css
run "TRIP / GUIDE SHELL CONSOLIDATION" node ci-tests/test-trip-guide-shell-consolidation.js styles.css
run "STUDIO HOME PREVIEW BOUNDS" node ci-tests/test-studio-home-preview-fit.js styles.css admin.js
run "STUDIO LIFECYCLE CONSOLIDATION" node ci-tests/test-studio-lifecycle-consolidation.js
run "STUDIO HEADER BADGE" node ci-tests/test-studio-header-badge.js styles.css admin.js
run "VN HEADER THEME" node ci-tests/test-vn-header-theme.js styles.css
run "CANONICAL STUDIO + EXPENSE DEEP-LINK" node ci-tests/test-canonical-studio-expense-deeplink.js
run "CANONICAL STUDIO VISUAL CONTRACT 25.6.2" node ci-tests/test-studio-visual-contract-2562.js
run "BOOKING MASTER STATUS + STUDIO EDIT" node ci-tests/test-booking-master-status-studio-edit.js
run "BOOKING SINGLE STATUS AUTHORITY" node ci-tests/test-booking-single-status-authority.js
run "RC29.121 BOOKING MOBILE + MULTIVISIT" node ci-tests/test-rc29117-booking-mobile-multivisit.js
run "RC29.125 QSPA MULTIVISIT TRANSPORT" node ci-tests/test-rc29125-qspa-multivisit-transport.js
run "RC29.126 BOOKING PLANNED-VISITS VERIFY (KEY-ORDER INSENSITIVE)" node ci-tests/test-booking-plannedvisits-verify-order-insensitive.js
run "EXPENSE SUITE FAILURE ACCUMULATION" node ci-tests/test-expense-suite-failure-accumulation.js
run "BOOKING CONTACT CHANNEL UX" node ci-tests/test-booking-contact-channel-ux.js
run "BOOKING SAVE POST-COMMIT INTEGRITY" node ci-tests/test-booking-save-post-commit-integrity.js
run "RC29.77 SETTLEMENT CHECKPOINT" node ci-tests/test-rc2976-settlement-checkpoint.js
run "RC29.80 GUIDE / SHARED PLACE OWNERSHIP" node ci-tests/test-rc2980-guide-place-ownership.js
run "RC29.80 TIMELINE RELATIONSHIP HYDRATION" node ci-tests/test-rc2980-timeline-relationship-hydration.js
run "RC29.85 GUIDE OWNERSHIP + MODAL FOREGROUND" node ci-tests/test-rc2985-guide-ownership-foreground.js .
run "RC29.86 GUIDE LANGUAGE + SHOPPING + BIDIRECTIONAL FOREGROUND" node ci-tests/test-rc2986-guide-language-shopping-bidirectional.js .
run "CUSTOM ACTIVITY NONPLACE LIFECYCLE" node ci-tests/test-custom-activity-nonplace-lifecycle.js
run "VN MULTIPLE PAYERS" node ci-tests/test-vn-multiple-payers.js
run "VN BACKLOG CLOSEOUT" node ci-tests/test-vn-backlog-closeout.js
run "RC29.97 EXPENSE AUTHORITY + FX REALISM" node ci-tests/test-rc2997-expense-authority.js
run "RC29.101 EXPENSE SCROLL + BALANCE + ACTIONS" node ci-tests/test-rc29101-expense-scroll-balance-actions.js
run "RC29.102 HISTORY + TERMINALS" node ci-tests/test-rc29102-history-terminals.js
run "SW PRECACHE HTML DEPENDENCIES" node ci-tests/test-sw-precache-html-dependencies.js
run "RC29.130 MAP ADDRESS ROUTING" node ci-tests/test-rc29130-map-address-routing.js
run "RC29.131 TIMELINE AUTHORITY REBASE" node ci-tests/test-rc29131-timeline-authority-rebase.js
run "MOC HUONG GUIDE OVERRIDE COMPATIBILITY" node ci-tests/test-moc-huong-guide-override-migration.js
run "test-day2-day4-migration.js" node ci-tests/test-day2-day4-migration.js
run "test-day5-migration-safety.js" node ci-tests/test-day5-migration-safety.js
run "test-day5-saved-override-revision.js" node ci-tests/test-day5-saved-override-revision.js
run "RC29.138 BROWSER-SHAPED MASTER ACCESS + BASELINE" node ci-tests/test-real-global-master.js
run "RC29.138 MIGRATION FIXTURES (browser-shaped globals)" node ci-tests/test-migration-fixtures.js
run "RC29.138 APPROVED ITINERARY DAY 2/4/5" node ci-tests/test-approved-itinerary.js
run "DAY 4 OHQUAO + SPA SYNC CONTRACT" node ci-tests/test-ohquao-spa-sync-contract.js
run "OHQUAO GUIDE SHOPPING CONTRACT" node ci-tests/test-ohquao-guide-shopping.js
node ci-tests/test-ohquao-shopping-directory.js
run "RC29.77 LIVE FX SAVE" node ci-tests/test-rc2977-live-fx-save.js



run "VN BOOKING DOCUMENTS + SHARE REGRESSION" node ci-tests/test-vn-booking-documents-share-regression.js
run "RC29.69 SHARED DOCUMENTS" node ci-tests/test-rc2966-shared-documents.js
run "RC29.69 DOCUMENTS PARITY" node ci-tests/test-rc2967-documents-parity-ux.js
run "RC29.69 UI + DOCUMENTS BROWSER" node ci-tests/test-rc2968-ui-docs-browser-contract.js
run "RC29.75 GUIDE SYNC + NEXT STOP" node ci-tests/test-rc2974-guide-sync-derived-next-stop.js
run "TIMELINE EDITOR TIME DISPLAY" node ci-tests/test-timeline-editor-time-display.js
run "RC29.75 VN LOCATION + COMPACT TIMELINE" node ci-tests/test-rc2974-vn-location-compact-timeline.js
[ "$failed" -eq 0 ] || { echo "POST-MASTER LEGACY SUITE FAILED"; exit 1; }

run "RC29.132 GUIDE MOBILE LAYOUT" node ci-tests/test-rc29132-guide-layout.js

run "ADVISORY CONTENT SNAPSHOTS" sh ci-tests/suites/13-advisory-content-snapshots.sh

# Real-browser gate (Chromium + WebKit, external services mocked). Gating: a failure fails CI.
# ALLOW_BROWSER_SKIP=1 exists only for machines without Playwright; it can never produce a clean PASS.
if [ "${ALLOW_BROWSER_SKIP:-0}" = "1" ]; then
  echo "== BROWSER RELEASE GATE: SKIPPED (ALLOW_BROWSER_SKIP=1) =="
  [ "$failed" -eq 0 ] || { echo "MASTER CI SUITE FAILED"; exit 1; }
  echo "MASTER CI SUITE (STATIC) PASSED - BROWSER GATE NOT RUN - NOT A RELEASE PASS"
  exit 3
fi
run "BROWSER RELEASE GATE" sh ci-tests/run-browser.sh
[ "$failed" -eq 0 ] || { echo "MASTER CI SUITE FAILED"; exit 1; }
echo "MASTER CI SUITE PASSED"
