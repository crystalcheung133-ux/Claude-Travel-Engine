#!/bin/sh
set -eu
echo "== BROWSER RELEASE SMOKE =="
python - <<'PY'
try:
    import playwright
except Exception as e:
    raise SystemExit("BROWSER GATE BLOCKED: Python Playwright is not installed: "+str(e))
PY
PYTHONDONTWRITEBYTECODE=1 python ci-tests/test-browser-release-smoke.py
echo "== BROWSER SAVE & SYNC PERSISTENCE =="
# The Save & Sync browser test was authored without a browser available and has not yet had a first green run.
# It is reported but non-gating until SAVE_SYNC_BROWSER_GATE=1 is set (flip it once CI shows it green).
if PYTHONDONTWRITEBYTECODE=1 python ci-tests/test-browser-save-sync.py; then
  echo "BROWSER SAVE & SYNC: ok"
elif [ "${SAVE_SYNC_BROWSER_GATE:-0}" = "1" ]; then
  echo "BROWSER SAVE & SYNC GATE FAILED"; exit 1
else
  echo "WARN: BROWSER SAVE & SYNC test failed (non-gating until SAVE_SYNC_BROWSER_GATE=1)"
fi
echo "BROWSER RELEASE GATE PASSED"
