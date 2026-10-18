#!/bin/sh
# Fixture-driven INVARIANT suite: relationships + data integrity. Valid for ANY itinerary.
set -u
failed=0
echo "== INVARIANTS (fixture-driven; real runtime modules; fake Supabase; no network) =="
node ci-tests/invariants/test-A-persistence-queue.js || failed=1
node ci-tests/invariants/test-B-booking-authority.js || failed=1
node ci-tests/invariants/test-C-guide-sync.js || failed=1
node ci-tests/invariants/test-D-timeline-sync.js || failed=1
node ci-tests/invariants/test-E-relationships.js || failed=1
node ci-tests/invariants/test-F-timeline-navigation.js || failed=1
node ci-tests/invariants/test-G-release-safety.js || failed=1
[ "$failed" -eq 0 ] || { echo "INVARIANTS: FAILED"; exit 1; }
echo "INVARIANTS: PASS"
