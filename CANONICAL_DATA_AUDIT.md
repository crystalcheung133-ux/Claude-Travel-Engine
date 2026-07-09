# CANONICAL DATA AUDIT — Travel Companion Master

Audit target: `Claude-Travel-Engine-main (2).zip`  
Mode: **Audit only. No code changed.**

## 1. Current architecture summary

This ZIP is a **V4 multi-page master**, not the reduced Alpha engine.

It currently has:

- `data.js` as the main data file for `PLACES`, `CATEGORIES`, `DAY_LINKS`, `GUIDE_ORDER`, `FRIENDS`, `TRIP_DATA`, `TRIP_ORDER`.
- `script.js` as the central runtime file for modals, Trip cards, Guide cards, Moments, Expenses, menu positioning, swipe navigation and several later overrides.
- Individual HTML pages still exist for Days and Places.
- Most standalone Place pages are now dynamic shells using `renderPlacePage('place-key')` and `PLACES` data.
- Day pages are still hardcoded timeline pages.
- `guide.html` still hardcodes its visible category lists, even though modal content comes from `PLACES`.
- `trip.html` still contains its own static Trip page content, while bottom-menu Trip cards use `TRIP_DATA` through `openTripCard()`.

Most important finding: **the previous `TRIP_DATA.city` runtime override problem appears already removed in this ZIP.** I found no active `TRIP_DATA.city = ...` assignment inside `script.js`. The active Trip modal data source is now `data.js` → `TRIP_DATA`.

## 2. File map

| File / group | Current role | Data source status | Risk |
|---|---|---|---|
| `data.js` | Main content data file | Canonical for `PLACES`, `TRIP_DATA`, `FRIENDS`, guide order/category data | High-value file; should become Stage 1 authority |
| `script.js` | Runtime/render/interaction logic | Still contains many versioned runtime function overrides | High risk of override confusion |
| `index.html` | Home shell + loading splash + modals/menus | Contains homepage hardcoded copy/layout and splash markup | Medium |
| `trip.html` | Static Trip page | Has hardcoded Trip content independent of `TRIP_DATA` | Duplicate source of truth |
| `itinerary.html` | Static itinerary overview | Hardcoded day overview | Duplicate with day pages |
| `day1.html`–`day5.html` | Static daily timelines | Hardcoded itinerary cards/actions/maps | Not canonical yet |
| `guide.html` | Static Guide landing/category page | Hardcoded category lists; modals use `PLACES` | Partial duplicate with `data.js` |
| Place pages e.g. `bakes.html`, `lune.html` | Dynamic place detail shell | Use `renderPlacePage(key)` and `PLACES` | Mostly safe |
| `moments.html` | Moments page shell | Runtime data from `localStorage`; place labels from `PLACES` | Function override risk in `script.js` |
| `expenses.html` | Expenses page shell | Runtime data from `localStorage`; friends from `FRIENDS` | Heavy function override risk |
| `styles.css` | Main visual style | Many version blocks, including home v37 and splash CSS | CSS cascade risk |
| `styles.clean.css` | Extra/unused-looking stylesheet copy | Not referenced by HTML pages found in audit | Possible stale file |
| `sw.js` | PWA service worker | Caches app shell and pages | Cache version must change after real deploy changes |
| `manifest.json` | PWA manifest | Start URL `./index.html` | Safe |
| `splash-logo.png`, logos/icons | Assets | Referenced by splash / PWA / watermark | Safe |

## 3. Global data objects found

Defined in `data.js`:

- `PLACES` — the main place database. Used by Guide modal, Place pages, Moments labels, quick info cards.
- `CATEGORIES` — category lists for Guide menu and Guide modal list.
- `DAY_LINKS` — maps place keys to day links. Used by `visitDayHTML()` in `script.js`.
- `GUIDE_ORDER` — previous/next order for Guide modal navigation.
- `FRIENDS` — four friend labels/emojis.
- `TRIP_DATA` — Trip modal cards.
- `TRIP_ORDER` — previous/next order for Trip modal navigation.

Defined in `script.js`:

- `MOODS` — available Moment emoji/reaction labels. This is logic/config, not trip content.
- `currentMood`, `currentMomentKey`, `editingExpenseIndex` — runtime state.

No separate `BOOKING_DATA`, `ITINERARY_DATA`, or `GUIDE_DATA` object exists in this ZIP.

## 4. Script load order

Typical pages load:

```html
<script src="data.js"></script>
<script src="script.js"></script>
```

This means:

1. Data globals are created first.
2. `script.js` then defines render functions and may mutate/override functions or data.
3. Standalone place pages then call `renderPlacePage('key')` after both scripts have loaded.

Key implication: any data mutation in `script.js` after `data.js` will win at runtime. In this ZIP, I did **not** find active `TRIP_DATA.city = ...` overrides, but function overrides still exist heavily.

## 5. Runtime overrides / mutation findings

### 5.1 Data object mutation

| Location | Mutation | Status | Recommendation |
|---|---|---|---|
| `script.js` around line 385 | `PLACES.general = {...}` | Active mutation; adds fallback Moments place | Move to `data.js` if Stage 1 wants strict data authority |
| `script.js` around lines 352–354 | Sorts `CATEGORIES[cat]` in place | Active mutation of data order | Avoid mutating `CATEGORIES`; sort a copy only |
| No active `TRIP_DATA.city = ...` found | Previous problem appears removed | Good | Keep Trip content in `data.js` |

### 5.2 Function overrides / wrappers

`script.js` contains many later-version wrappers/overrides. These are the biggest maintenance risk.

Important active overrides found:

- `openGuideCategory` defined initially, then wrapped twice:
  - around line 350: alphabetical guide wrapper
  - around line 372: Shopping Directory shortcut wrapper
- `openMomentsModal` initially defined, then reassigned at line 415, then wrapped again at line 933.
- `saveMoments` initially defined, then reassigned at line 432, then wrapped at line 938.
- `renderMoments` initially defined, then reassigned at line 490.
- `saveExpense` initially defined, then reassigned/wrapped repeatedly at lines 516, 661, 692, 722, 871, 1056.
- `renderExpenses` initially defined, then reassigned at lines 559 and 605.
- `openExpenseModal` initially defined, then reassigned/wrapped at lines 645, 687, 716, 864, 1028.
- `resetExpenseForm` initially defined, then reassigned at line 861 and wrapped at line 1034.
- `editExpense` initially defined, then wrapped at lines 914 and 1040.
- `setFriend` initially defined, then wrapped at lines 945 and 1051.
- `toggleMenu`, `toggleTripMenu`, `toggleGuideMenu`, `toggleDays` are replaced around lines 770–781 for improved mini-menu positioning.

These are not necessarily broken; many are feature-preserving patches. But they make the effective runtime behavior hard to predict unless traced in order.

## 6. Duplicate sources of truth

### 6.1 Trip content

There are **two Trip representations**:

1. `data.js` → `TRIP_DATA` → used by bottom-menu Trip modal via `openTripCard()`.
2. `trip.html` → static content page.

These are separate. Editing `trip.html` will not change the bottom Trip modal. Editing `data.js` will not change the static sections inside `trip.html`.

Recommendation for Stage 1: document clearly that bottom Trip cards are controlled by `data.js`. Do not delete `trip.html` yet. If consistency is required, either manually sync `trip.html` content or convert `trip.html` to render from `TRIP_DATA` in a later stage.

### 6.2 Guide content

There are two Guide representations:

1. `data.js` → `PLACES` and `CATEGORIES` → used by Guide modal and dynamic Place pages.
2. `guide.html` → hardcoded category sections and buttons.

Editing `PLACES` changes modal/detail content, but may not update the visible static list in `guide.html` unless that list is regenerated or manually updated.

Recommendation for Stage 1: keep `guide.html` but mark it as a duplicate display layer. Later stage can render Guide categories dynamically from `CATEGORIES`.

### 6.3 Day itinerary content

Day pages are hardcoded:

- `day1.html`–`day5.html` contain timeline times, titles, route hints, map URLs, and activity prose directly in HTML.
- `data.js` contains `DAY_LINKS`, but not a full canonical itinerary object.

Recommendation for Stage 1: do not attempt dynamic day renderer yet. Add an `ITINERARY_DATA` object only if the implementer is ready to keep day pages visually unchanged and tested. Otherwise defer to Stage 2.

### 6.4 Place detail content

Most standalone place pages are dynamic shells:

- Example `bakes.html`: `<main id="placeMain"></main>` then `renderPlacePage('bakes')`.
- Actual content comes from `PLACES`.

This part is close to canonical already.

### 6.5 Comments / Emoji / Moments

There are no permanent comment records in a server/database in this ZIP. Runtime state is localStorage based:

- One-per-place legacy moments use keys like `moment_<placeKey>`.
- Newer list-based Moments use `moments_list`.
- Latest moment summaries use `moment_latest_<placeKey>`.
- Mood/reaction labels come from `MOODS` in `script.js`.

There are several wrappers that preserve older localStorage formats. Do not remove them without explicit migration.

### 6.6 Expenses

Expenses are stored in `localStorage['expenses']`. Expense rendering and saving are repeatedly overridden in `script.js`. This area is high-risk and should not be cleaned aggressively without testing.

### 6.7 Loading / Splash

Loading is currently defined in `index.html`:

- `body` starts with `class="home-bg ccmv-splash-active"`.
- Splash markup is in `#ccmvSplash`.
- Inline JS hides/removes splash after timeout or click.
- `styles.css` controls visual presentation.

This is not currently data-driven. For now this is acceptable: Loading is a branding/UI layer, not trip data.

## 7. Render path map

### Trip → City / Stay / Flights / etc.

User action:

`Trip menu item onclick="openTripCard('city')"`

Runtime path:

`openTripCard(key)` in `script.js` around lines 249–264  
→ reads `TRIP_DATA[key]` from `data.js`  
→ writes HTML into `#tripModalContent`  
→ opens `#tripModal`.

Data source:

`data.js` → `TRIP_DATA`.

DOM target:

`#tripModalContent`.

Important note: `trip.html` static content does not control this modal.

### Guide → Place modal

User action:

`openGuideModal('place-key')` from Guide menu, Day timeline, or category list.

Runtime path:

`openGuideModal(key)` in `script.js` around lines 37–45  
→ reads `PLACES[key]`  
→ builds quick info, highlights, good-to-know  
→ writes into `#guideModalContent`  
→ opens `#guideModal`.

Data source:

`data.js` → `PLACES`.

DOM target:

`#guideModalContent`.

### Standalone Place page

User action:

Open e.g. `bakes.html`.

Runtime path:

Page loads `data.js` then `script.js`  
→ inline call `renderPlacePage('bakes')`  
→ `renderPlacePage()` reads `PLACES['bakes']`  
→ writes page body into `#placeMain`.

Data source:

`data.js` → `PLACES`.

DOM target:

`#placeMain`.

### Day → Activity / Guide / Moment

User action:

Open `day1.html` etc.

Runtime path:

HTML timeline is already hardcoded in each day page.  
Buttons call `openGuideModal(placeKey)` or `openMomentsModal(placeKey)`.

Data source:

Timeline display: hardcoded day HTML.  
Guide modal details: `data.js` → `PLACES`.  
Moment labels: `data.js` → `PLACES` and `FRIENDS`.

### Moments modal

User action:

Click Moment button.

Runtime path:

`openMomentsModal(key)` initial function exists around lines 49–59.  
Later versioned wrappers/replacements at lines 415 and 933 change final behavior.  
Final visible behavior depends on these wrappers executing in file order.

Data source:

Place title: `PLACES[key]`.  
Friend label: `FRIENDS[getFriend()]`.  
Saved content: `localStorage` keys (`moment_<key>`, `moments_list`, `moment_latest_<key>`).

### Moments page

User action:

Open `moments.html`.

Runtime path:

`DOMContentLoaded` calls `renderMoments()` from `script.js`.  
The final active `renderMoments` is the later override around line 490.

Data source:

`localStorage['moments_list']` plus legacy `moment_<placeKey>` entries.

DOM target:

`#momentsTimeline`.

### Expenses

User action:

Open Expenses page or Expenses tool/modal.

Runtime path:

Initial expense functions are defined at lines 105–243.  
Multiple later overrides/wrappers from line 516 onward control final behavior.  
The final effective `saveExpense`, `openExpenseModal`, `resetExpenseForm`, and `editExpense` are near the end of `script.js`.

Data source:

`localStorage['expenses']`.

DOM targets:

`#expensePageList`, `#expenseModal`, `#latestExpenseMini`, tool transaction history if present.

### Loading animation

User action:

Open `index.html`.

Runtime path:

`index.html` contains `#ccmvSplash` markup and inline JS.  
Inline JS removes splash after timeout/click.  
CSS in `styles.css` controls opacity/position/visibility.

Data source:

HTML + CSS, not `data.js`.

### PWA / cache

User action:

Open installed PWA or cached site.

Runtime path:

`sw.js` registers on page load.  
`CACHE_NAME = 'saigon-companion-v4-splash'`.  
`ASSETS` list controls precached files.  
Fetch handler uses cache-first, then network, then `offline.html`.

Important risk: after modifying any cached file, `CACHE_NAME` should be changed or users may see old versions.

## 8. Recommended Stage 1 cleanup scope

Safe Stage 1 goals:

1. Keep all pages and URLs.
2. Keep visual layout unchanged.
3. Keep `data.js` as canonical for:
   - `PLACES`
   - `CATEGORIES`
   - `DAY_LINKS`
   - `GUIDE_ORDER`
   - `FRIENDS`
   - `TRIP_DATA`
   - `TRIP_ORDER`
4. Move `PLACES.general` into `data.js` instead of mutating it in `script.js`.
5. Stop mutating `CATEGORIES[cat]` in place; sort copies only.
6. Do not touch Day dynamic architecture yet.
7. Do not delete Place HTML files.
8. Do not rewrite Moments/Expenses; only document final active function stack.
9. Add a short developer note at top of `script.js` warning that many versioned wrappers exist and must be consolidated later.

## 9. Deferred cleanup candidates

Defer these to Stage 2 or later:

- Convert `guide.html` category sections to render from `CATEGORIES`.
- Convert `trip.html` to render from `TRIP_DATA`.
- Convert `day1.html`–`day5.html` to render from a canonical `ITINERARY_DATA` object.
- Consolidate the many `saveExpense` / `openExpenseModal` / `renderExpenses` overrides into one final implementation.
- Consolidate the many Moments wrappers into one final implementation.
- Remove `styles.clean.css` if confirmed unused.
- Reduce standalone place pages into `place.html?id=...` only after comments/moments/guide actions are proven preserved.

## 10. Audit conclusion

This ZIP is already partly cleaned compared with the earlier broken patch phase. The most serious past issue — `script.js` overwriting `TRIP_DATA.city` — is not present in this version. However, the codebase still has two major risks:

1. **Static duplicate content** remains in `trip.html`, `guide.html`, and day pages.
2. **Runtime function overrides** remain heavy in `script.js`, especially Moments and Expenses.

For Claude implementation, the safest next step is not Alpha rewrite. It is Stage 1 hardening: keep current functionality, make `data.js` the acknowledged content authority, remove only safe data mutations, and document all deferred dynamic migration.
