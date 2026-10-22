# CLAUDE_FIX_CHANGELOG — VN Companion RC29.138 (Timeline Migration + Hydration Fix)

Starting point: `VN_Companion_Claude_Reaudit_Fixes_NOT_FOR_DEPLOY.zip` (RC29.137 + the developer's first fix attempt).
No production Supabase record was read or written. Nothing was deployed. Booking-vs-Timeline time precedence is unchanged (your instruction).
`bk-pizza4ps.notes` and `bookingHandoff` were NOT touched.

## 1. R1 (Critical) — cloud Timeline edits loaded into memory but were not displayed
- **Files:** `itinerary-authority.js` (end of file).
- **Defect:** hydration had been moved after `itinerary-authority.js`, but `GenerationSelectionAdapter` builds `PRODUCTION_PROJECTION` when it loads (earlier), and nothing rebuilt it. The Day page renders from the projection, so hydrated Timeline notes never reached the DOM (reproduced: memory had the note, projection and DOM did not).
- **Fix:** hydration still runs after the authority exists (so older publications can be rebased) and, when it applied anything, the projection is rebuilt with `GenerationSelectionAdapter.rebuild(TRAVEL_DATASETS, TRIP_CONFIG)` immediately. If the rebuild throws (integrity failure of hydrated data) the page safely stays on the shipped Master and logs a warning with the integrity report.
- **Tests:** `test-browser-migration-render.py` E1 (same-revision) and E2 (old-revision publication): hydration succeeds, version 546 active, cache kept, edited notes are in the **rendered DOM**, repeated reloads render identically, days 1/3 unchanged. Probe on 6 page types (index, itinerary, day, trip, documents, expenses): projection updated on all. The new test FAILS on the previous build (verified).
- **Limitation:** if hydrated data violates `TravelEngineIntegrity` the cloud edit is not shown (page falls back to shipped Master + console warning).

## 2. One migration engine for Saved Override, Pending Draft and publication
- **Files:** `itinerary-authority.js` (`applyCrossDayMoves`, `legacyMigrateDay`, `moveAcrossStoreDays`, `movedUserLines`, default-text fingerprints, `normalizeStore`, `rebasePublishedItinerary`).
- **Defects fixed (audit #7–#10):** Day 2 Pizza notes were transferred only for cloud publications; Saved Override kept an obsolete Day 2 Pizza card; Day 5 Running Bean note lost on the Pending path; baseline-less data kept/resurrected obsolete cards.
- **Fix:** a single helper moves user-authored content: Day 2 Pizza 4P's → Day 4 Pizza 4P's (note lines, route, and "Previous Day 2 Pizza time" when a time was edited; the Day 2 card is removed, no duplicate Day 4 card); Day 5 Running Bean → Day 2 Running Bean. With a baseline, only lines the user added are moved; without a baseline, default text is recognised by fingerprint and everything else is preserved. Unedited default copies of retired cards (Com Tam Moc, Garmentory, Pizza) are no longer resurrected from baseline-less data; edited ones are kept (non-destructive). Used identically by the cloud rebase, the saved-store migration (revision-shaped and flat legacy) and draft migration.
- **Tests:** `test-migration-fixtures.js` (294 checks, browser-shaped globals) and `test-browser-migration-render.py` — fresh, saved (baseline / legacy / flat legacy / legacy unedited), pending (baseline / legacy), saved+pending, publication; deletions, edited notes/times on moved and merged cards, no duplicate ids, idempotence (stable storage, identical repeated resolution, fresh page load over migrated storage).
- **Limitations:** see `CLAUDE_OUTSTANDING_ISSUES.md` (legacy deletions are unknowable; fingerprint text comes from the old exported itinerary).

## 3. Pending Draft lifecycle
- **Files:** `itinerary-authority.js` (`makeDraftPayload`, `migrateDraftObject`, `getDraftMigrated`, `getPendingDayItems`), `day.html` (`markTimelineDayDirty`), `admin.js` (`replaceAdminDraft`).
- **Defects (audit #5):** drafts stored no baseline; old drafts masked the new Master; Running Bean note invisible from a draft.
- **Fix:** new drafts store `masterRevision`, `baseItems` (Master at that revision) and `basedOnItems` (the committed list the user started from). Existing drafts are migrated once, on load (before `admin.js` caches the draft), written back, and the in-memory cache is refreshed through `replaceAdminDraft`. Current-revision drafts without a baseline are upgraded in place. Baseline-less drafts are merged over the committed list (Saved Override or Master) with the same fingerprint rules.
- **Tests:** fixtures 4, 5, 5b, 6 in `test-migration-fixtures.js`; C/C2/D in the browser test; draft payload and `replaceAdminDraft` checked in the real browser; day.html/admin.js wiring asserted.

## 4. Saved Override / Pending Draft precedence
- **Files:** `itinerary-authority.js` (`getPendingDayItems`).
- **Defect:** a draft fully masked a newer saved edit.
- **Fix:** a draft is a layer over the committed list it was started from: `rebaseDay(draft.items, draft.basedOnItems, currentSavedItems)`. Draft edits and deletions win; saved-only edits survive underneath.
- **Tests:** fixture 6 (a newer saved edit made after the draft is NOT masked; the draft's content is still present).

## 5. Deletion preservation
- With a baseline (Saved Override, Pending Draft, publication) a user-deleted card stays deleted (tested). Without a baseline, deletion intent is unknowable; the safest non-destructive behaviour is kept (missing Master cards are restored) and documented. Once migrated, the store gets a baseline so later deletions persist.

## 6. Minor items
- `data.js`: Currency Guide no longer says "Day 2 · Hai Bà Trưng lunch area / Pizza 4P's Hai Bà Trưng" (now Day 4 / AUM dinner area); `DAY_LINKS['push-push']` added.
- `day.html`: Push Push hard-coded id special case removed (it is a normal `shopping` card; navigation verified in the browser); redundant `?0:0` removed; Day 2 shopping First Stop still opens 11 Garmentory.
- `guide-runtime.js`: Shopping Directory lead for Day 2 still said "Pizza 4P's 後到 Qspa"; now "Quán Cua Cà Mau 午餐後到 Qspa".
- Optional Quán Thuý 94 is kept (needs your confirmation).

## 7. CI, registry, release identity
- `run-all.sh`: final gate after every suite; banner printed only at the very end; stale RC29.133/134/132 headers removed; the real-browser gate is part of the run; `ALLOW_BROWSER_SKIP=1` can never give a clean pass (exit 3).
- `run-browser.sh`: all three steps gating (smoke, migration/render, Save & Sync); no non-gating step.
- Browser tests mock every external host (HTTP 503 locally); any unknown host fails. No test names or contacts the production project.
- `test-browser-save-sync.py` fixed (its "no external requests" assertion was wrong for an app that tries fonts/weather/FX/Supabase on load). `test-browser-release-smoke.py` now also mocks external services (it previously did not).
- `TEST-REGISTRY.json` + contract test updated (new tests registered; browser tests = smoke + migration/render + Save & Sync).
- 14 outdated content snapshots rewritten to the approved itinerary; all 25 pass.
- New gating `test-approved-itinerary.js` (43 checks): Day 2 / Day 4 / Day 5 contract.
- Release identity: RC29.138 / engine 25.7.4, asset token `rc29138-timeline-migration-fix`, `VERSION.txt`, `RELEASE.json`, `trip-config.js`, all pages/service worker; manifest + `SHA256SUMS.txt` regenerated (78 entries verified).
