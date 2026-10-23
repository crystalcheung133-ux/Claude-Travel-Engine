#!/bin/sh
# Real-browser release gate. ALL steps are gating (RC29.138): a failing step fails the gate.
# External services (fonts, weather, FX, production Supabase ...) are MOCKED locally by every test; nothing is sent.
set -eu
python3 - <<'PY'
try:
    import playwright
except Exception as e:
    raise SystemExit("BROWSER GATE BLOCKED: Python Playwright is not installed: "+str(e))
PY
echo "== BROWSER RELEASE SMOKE =="
PYTHONDONTWRITEBYTECODE=1 python3 ci-tests/test-browser-release-smoke.py
echo "== BROWSER MIGRATION + RENDERED TIMELINE (R1) =="
PYTHONDONTWRITEBYTECODE=1 python3 ci-tests/test-browser-migration-render.py
echo "== BROWSER SAVE & SYNC PERSISTENCE =="
PYTHONDONTWRITEBYTECODE=1 python3 ci-tests/test-browser-save-sync.py
echo "BROWSER RELEASE GATE PASSED"
