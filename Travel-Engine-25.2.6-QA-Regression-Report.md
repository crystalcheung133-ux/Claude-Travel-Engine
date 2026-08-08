# Travel Engine 25.2.6 — QA / Regression Report

Date: 8 Aug 2026
Source baseline: `NZ-Companion-RC25.2.5-Analytics-System-v1.2-Full-Deploy.zip`
Working method: separate extracted copy; source ZIP was not modified.

## Result

**Automated regression suite: PASS — 17/17 gates.**

- JS syntax: PASS (43/43 JS files)
- Release checksums / manifest: PASS (63 checksum entries; 62 production runtime files)
- HTML structure: PASS (10/10)
- Entity linkage: PASS
- Guide address integrity: PASS
- Timeline integrity: PASS
- UX contract: PASS
- RC24.7 focused contract: PASS
- RC24.7.2 regression contract: PASS
- RC25.1 contract: PASS
- RC25.1.6 consistency contract: PASS
- RC25.2.2 guide/route contract: PASS
- Runtime production integrity: PASS
- RC25.2.3 admin safe-area contract: PASS
- Analytics v1.2 runtime contract: PASS
- Analytics INSERT-only permission contract: PASS
- Travel Engine portability / NZ decoupling contract: PASS

## Portability verification

The new `ci-tests/test-engine-portability.js` rejects NZ trip-id, `nz_friend`, Lee fallback, fixed NZ party-order and NZ export-filename literals from reusable runtime files. The deployed NZ compatibility identity key is intentionally retained only in `trip-config.js`, which is instance-owned.

Analytics remains local-first, offline-queued, sessionised, admin-separated and failure-isolated. The Supabase browser contract remains INSERT-only for analytics.

## Browser interaction status

No new browser-interaction claim is made for 25.2.6. The prior environment blocked local/file Chromium navigation, so this release relies on the unchanged UI/workflow regression contracts plus the new portability gate. No UI redesign or navigation workflow change was introduced.

## Release classification

25.2.6 is an **Engine baseline**, not a new NZ Production Frozen release and not a Generator migration. The NZ reference configuration/data remains present so the mature behaviour can still be regression-tested; reusable runtime ownership has been decoupled from NZ-specific identity/trip literals.
