#!/bin/sh
set -u
node ci-tests/test-expense-save-safety.js
echo "EXPENSE SAVE SAFETY: PASS"
