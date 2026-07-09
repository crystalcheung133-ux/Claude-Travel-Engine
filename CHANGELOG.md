# CHANGELOG — Stage 1 Cleanup Implementation

Based on: `CANONICAL_DATA_MAP.md` + `CANONICAL_DATA_AUDIT.md`
Scope: Stage 1 hardening only. No Alpha rewrite. No page files deleted. No day/place page merging.

Exactly **3 files changed**. Every other file (all HTML pages, `styles.css`, `manifest.json`, all image assets) is byte-for-byte identical to the input ZIP — verified by checksum, not just "didn't mean to touch it."

---

## 1. `data.js`

**Change:** Added a `"general"` entry to the `PLACES` object (the fallback "Moments" place card — title "Moments", category MOMENTS, used when a Moment is logged against no specific place).

**Why:** This entry previously only existed at runtime, injected by `script.js` on every page load (see below). Per the Map's Stage 1 rule ("`data.js` should be the only active source for ... Places / Guide content"), it now lives in `data.js` alongside every other place.

**Behaviour change:** None. Same object, same keys, same values — just moved from a runtime mutation into the canonical file so it's actually where you'd look for it.

**Diff size:** +242 bytes, appended as the last key in `PLACES` (all 45 existing place entries untouched, same order, same content).

---

## 2. `script.js`

### 2a. Removed `PLACES.general` runtime injection

**Before:**
```js
/* v3.0 Premium Experience overrides */
try{
  PLACES.general = {title:'Moments', emoji:'✨', cat:'MOMENTS', sub:'Every place has a story', ...};
}catch(e){}
```

**After:** replaced with a one-line comment pointing to `data.js` (see above). The mutation is gone because the data itself moved.

**Behaviour change:** None — same object now arrives via `data.js` instead of being patched in after the fact.

### 2b. Stopped mutating `CATEGORIES[cat]` in place

**Before** (inside the `openGuideCategory` "v2.1.9 alphabetical guide wrapper"):
```js
openGuideCategory = function(cat){
  if (CATEGORIES && CATEGORIES[cat]) {
    CATEGORIES[cat] = CATEGORIES[cat].slice().sort((a,b)=>...);
  }
  return _originalOpenGuideCategory(cat);
};
```
This **permanently reassigned** `CATEGORIES[cat]` to a newly-sorted array on every single call — silently mutating canonical data at runtime, exactly the pattern the Audit flags as a risk (Audit §5.1).

**After:**
```js
openGuideCategory = function(cat){
  /* Stage 1 cleanup note: ... Removed — _originalOpenGuideCategory() already
     sorts a copy internally (see line ~19), so behaviour is unchanged. */
  return _originalOpenGuideCategory(cat);
};
```

**Why this is safe, not just "probably fine":** the base `openGuideCategory` function (defined earlier in the same file, before any wrapper) already does:
```js
function openGuideCategory(cat){
 const list=(CATEGORIES[cat]||[]).slice().sort((a,b)=>a.title.localeCompare(b.title));
 ...
}
```
— i.e. it **already sorts a fresh copy on every read**, independent of whatever order `CATEGORIES[cat]` happens to be in. The wrapper's mutation was 100% redundant: it changed the canonical array's stored order for no visible effect, since the very next line always re-sorts anyway. Removing it changes zero pixels on screen and removes the one confirmed unsafe mutation in the runtime layer.

Two *other* nearby lines that read `CATEGORIES[cat]` and sort a local copy without reassigning (the base function above, and the separate "v3.1 Shopping Directory shortcut" wrapper) were **left exactly as-is** — they were already following the "sort copies, don't mutate" rule and needed no change.

### 2c. Added a developer note at the top of the file

A comment block was added at the very top of `script.js` stating: `data.js` is canonical for the 7 shared data objects; this file should render, not replace; and that Moments/Expenses still contain several chained function-override "wrappers" (documented, not touched — see DEFERRED_CLEANUP.md). This is documentation only — zero functional change.

**Total functional diff in `script.js`:** two mutations removed, zero mutations added, zero function signatures changed, zero render output changed.

---

## 3. `sw.js`

**Change:** `CACHE_NAME` bumped to `'saigon-companion-v4-stage1-cleanup-20260709'`.

**Why:** the Map is explicit that "`sw.js` cache name must update whenever deploy changes cached files" and that cache-first behaviour means old installs won't see changes otherwise. Since `data.js` and `script.js` are both in the precached asset list, the version string was bumped so existing installs actually pick up this pass instead of serving a stale cache.

**Behaviour change:** none to the fetch/cache *strategy* itself — same cache-first-with-refresh logic as before, just a new cache generation.

---

## Explicitly NOT changed (by design, per the Map/Audit's own Stage 1 boundaries)

- `trip.html` static content — left as the known duplicate of `TRIP_DATA`, per Audit §6.1 recommendation.
- `guide.html` hardcoded category lists — left as the known duplicate of `CATEGORIES`, per Audit §6.2.
- `day1.html`–`day5.html` — left hardcoded, no `ITINERARY_DATA` introduced, per Audit §9.
- All Moments/Expenses function-override chains in `script.js` (`openMomentsModal`, `saveMoments`, `renderMoments`, `saveExpense`, `renderExpenses`, `openExpenseModal`, `resetExpenseForm`, `editExpense`, `setFriend`, etc.) — left fully intact, per explicit instruction not to consolidate without individual regression testing.
- `styles.clean.css` — left in place (confirmed unreferenced by any HTML page, but removal is a Stage 2 item per Audit §9, not Stage 1).
- `styles.css` — untouched, byte-identical.
- All 45+ static HTML pages — untouched, byte-identical.
- PWA manifest, icons, logos — untouched, byte-identical.

See `DEFERRED_CLEANUP.md` for the full list with reasoning, and `REGRESSION_REPORT.md` for what was checked before shipping this.

## Stage 1.1 — CCMV Product Family Visual Alignment
- Visual-only CSS alignment using Journey Planner 11.43 as reference.
- Preserved Travel Engine / Companion content, data, render logic, navigation, PWA and storage.
- Calmed home dashboard, loading screen, cards, buttons, typography, spacing, gold/cream/ink tones.
- Reduced repeated watermarks, texture, gradients and emoji dominance while keeping Companion identity.

- 11.43a loading hotfix: enlarged splash logo and restored staged sequence (logo -> slogan -> Vietnam 2026). No data/render logic changed.


## 11.43b CCMV Family Visual Alignment
- Refined loading slogan typography and muted gold colour.
- Rebalanced front-page hero title with a softer feminine editorial serif.
- Added selective bottom-right CCMV watermark signatures to Front, Moments, and Expenses hero cards.
- Added limited feature-card watermark use without changing data/render logic.

## 11.43c visual alignment
- Calibrated all new logo/watermark usage to the user-provided CCMV logo asset.
- Added pale blush loading background and Planner-reference serif typography.
- Strengthened Saigon Companion hero title hierarchy and added a clear front-page logo.
- Feature-card watermarks now use the complete uncropped logo.

---

# Stage 1.5 — Information Migration Template

Base: `Claude-Travel-Engine-main-stage1-ccmv-family-visual-1143c-calibrated-logo.zip`

**3 files changed. Every other file — all HTML pages, `styles.css`, `manifest.json`, all images/icons/logos — is byte-for-byte identical to the Golden Master, verified by checksum.**

## `data.js`

**Appended** (nothing existing was edited, reordered, or removed):

- `BOOKINGS_DATA` — object with 3 real, fully-filled-in sample bookings: `omakase-tiger-booking`, `cooking-class-booking`, `airport-transfer-booking`. See `STAGE_1_5_INFORMATION_MIGRATION.md` for the full field reference.
- `ITINERARY_ACTIVITY_TYPES` — array of 10 allowed activity type strings.
- `ITINERARY_SCHEMA_EXAMPLES` — one worked example per activity type, built from real `PLACES`/`BOOKINGS_DATA` content.
- `PLACE_SCHEMA_FIELDS` — array of 15 forward-looking place field names.
- `PLACE_SCHEMA_EXAMPLES` — 2 real places (`omakase-tiger`, `cooking`) previewed in the new field shape.

**Not changed:** `PLACES`, `CATEGORIES`, `DAY_LINKS`, `GUIDE_ORDER`, `FRIENDS`, `TRIP_DATA`, `TRIP_ORDER` — all identical to the Golden Master, same content, same order, same field names.

**Diff size:** +312 lines, all appended after the existing `TRIP_ORDER` declaration.

## `script.js`

**Appended** (nothing existing was edited, reordered, or removed):

- `getBookingsForDay(dayId)`
- `getBookingsForPlace(placeId)`
- `getBookingStatusLabel(status)`

All three are pure, read-only, wrapped in `try/catch` so they can never throw into a calling context, and not invoked anywhere else in the file.

**Diff size:** +45 lines, appended at the very end of the file, after the existing `(function(){ ... ensurePaidByUI() ... })()` IIFE.

## `sw.js`

**Change:** `CACHE_NAME` bumped from `'ccmv-companion-1143b'` to `'ccmv-companion-1143c-stage1-5'`.

**Why:** `data.js` and `script.js` are both in the precached asset list; per the project's own PWA convention, the cache name must change whenever a cached file changes, or existing installs keep serving the stale version.

**Behaviour change:** none to the cache/fetch strategy itself — same logic, new cache generation.

## Explicitly NOT changed

- No HTML file touched — all 50+ pages byte-identical to the Golden Master.
- `styles.css` — untouched, byte-identical (this stage is data-only, no visual changes).
- `PLACES`, `TRIP_DATA`, `CATEGORIES`, `DAY_LINKS`, `GUIDE_ORDER`, `FRIENDS`, `TRIP_ORDER` — untouched.
- All existing render functions (`openTripCard`, `openGuideModal`, `openGuideCategory`, `renderPlacePage`, `openMomentsModal`, `saveMoments`, `renderMoments`, `openExpenseModal`, `saveExpense`, `renderExpenses`, `setFriend`, etc.) — untouched, not called by any new code.
- No new `onclick` handlers, no new buttons, no new visible UI anywhere.

See `REGRESSION_REPORT.md` for what was verified before shipping this, and `STAGE_1_5_INFORMATION_MIGRATION.md` for how to use the new structures going forward.

## 11.43d CCMV Planner Alignment Patch
- Base: Stage 1.5 master file.
- Loading page adjusted closer to Journey Planner: smaller calibrated logo, blush-cream background, cleaner composition, same logo → slogan → Vietnam sequence.
- Front page brand/header strengthened with clear CCMV logo and heavier Saigon Companion editorial serif treatment.
- Bottom menu popups changed to fully opaque ivory surfaces so the front page no longer shows through.
- CSS-only visual patch; no data/render/navigation logic changed.
