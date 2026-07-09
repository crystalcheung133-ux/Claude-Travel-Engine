# CANONICAL DATA MAP — Travel Companion Master

Audit target: `Claude-Travel-Engine-main (2).zip`  
Mode: **Map only. No code changed.**

## 1. Where to edit things now

| What you want to change | Current effective file | Notes |
|---|---|---|
| Bottom-menu Trip card content e.g. City, Stay, Flights, Money | `data.js` → `TRIP_DATA` | Rendered by `openTripCard()` in `script.js`; not controlled by `trip.html` |
| Trip card order / next / previous | `data.js` → `TRIP_ORDER` | Used by `openTripCard()` |
| Static Trip page content | `trip.html` | Separate from Trip modal; duplicate source |
| Place / restaurant / spa / shop detail content | `data.js` → `PLACES` | Used by Guide modal and standalone place pages |
| Place category list used by menu/modal | `data.js` → `CATEGORIES` | `guide.html` visible page also hardcodes lists |
| Guide modal previous/next order | `data.js` → `GUIDE_ORDER` | Used by `guideNavButtons()` |
| Visit Day buttons inside Guide quick info | `data.js` → `DAY_LINKS` | Used by `visitDayHTML()` |
| Friend names / emojis | `data.js` → `FRIENDS` | Used across modals, moments, expenses |
| Moment emoji options | `script.js` → `MOODS` | This is interaction config, not trip content |
| Day timeline content | `day1.html`–`day5.html` | Hardcoded; not data-driven yet |
| Itinerary overview | `itinerary.html` | Hardcoded overview page |
| Homepage hero/card content | `index.html` | Static markup and CSS classes |
| Loading animation | `index.html` + `styles.css` | Splash markup/JS in index, styling in CSS |
| Mobile/desktop visual layout | `styles.css` | Watch CSS cascade and media queries |
| PWA cache/offline behavior | `sw.js` | Change `CACHE_NAME` after cached-file edits |
| Expenses save/render logic | `script.js` | Many wrappers; final behavior determined near end of file |
| Expenses data | browser `localStorage['expenses']` | No server persistence in this ZIP |
| Moments save/render logic | `script.js` | Multiple wrappers; preserve legacy localStorage support |
| Moments data | browser `localStorage` | `moments_list`, `moment_<key>`, `moment_latest_<key>` |

## 2. Desired Stage 1 canonical rules

After Stage 1, the codebase should follow these rules:

### Content data

- `data.js` should be the only active source for:
  - Trip modal content
  - Places / Guide content
  - Guide categories
  - Friends
  - Guide order
  - Place-to-day links

### Runtime logic

- `script.js` should render from data, not secretly replace content data.
- `script.js` may keep interaction config like `MOODS` until a later config split.
- `script.js` should not mutate `PLACES`, `CATEGORIES`, or `TRIP_DATA` unless there is a documented runtime-only reason.

### HTML

- `index.html`, `trip.html`, `guide.html`, `day*.html`, `moments.html`, `expenses.html`, place pages should remain for Stage 1.
- HTML can keep page shells and containers.
- Existing hardcoded content should not be deleted in Stage 1 unless it has a verified data-rendered replacement.

### CSS

- `styles.css` remains the visual authority.
- No Stage 1 data cleanup should change visual output.

### PWA

- `sw.js` cache name must update whenever deploy changes cached files.
- Cache-first behavior means old PWA installs may not reflect changes unless cache version changes.

## 3. Specific source-of-truth decisions

### Trip modal

Canonical source: `data.js` → `TRIP_DATA`.

Renderer: `script.js` → `openTripCard(key)`.

Do not edit `trip.html` when trying to change the bottom-menu Trip modal.

### Static Trip page

Current source: `trip.html`.

Status: duplicate display page.

Recommended Stage 1 action: leave it alone or manually sync. Do not convert dynamically yet unless regression testing is done.

### Guide modal and Place detail pages

Canonical source: `data.js` → `PLACES`.

Renderers:

- `openGuideModal(key)` for modal.
- `renderPlacePage(key)` for standalone place pages.

Recommended Stage 1 action: keep as canonical. Move `PLACES.general` into `data.js`.

### Guide landing page

Current source: `guide.html` hardcoded category sections.

Status: duplicate category display.

Recommended Stage 1 action: document only. Convert to dynamic later.

### Days

Current source: `day1.html`–`day5.html` hardcoded timelines.

Status: not canonical data-driven yet.

Recommended Stage 1 action: do not migrate yet. Build `ITINERARY_DATA` in a later stage after all activity-card types are defined.

### Moments

Data source: localStorage.

Label/content source: `PLACES`, `FRIENDS`, `MOODS`.

Implementation status: several runtime wrappers. Do not consolidate in Stage 1 unless individually tested.

### Expenses

Data source: localStorage.

Implementation status: heavily patched through repeated wrappers. Do not consolidate in Stage 1 unless there is a full regression test.

## 4. Render-path quick reference

### Bottom Trip card

`onclick openTripCard('city')`  
→ `script.js: openTripCard()`  
→ `data.js: TRIP_DATA.city`  
→ `#tripModalContent`

### Guide modal

`onclick openGuideModal('lune')`  
→ `script.js: openGuideModal()`  
→ `data.js: PLACES.lune`  
→ `#guideModalContent`

### Standalone place page

`lune.html`  
→ loads `data.js` then `script.js`  
→ inline `renderPlacePage('lune')`  
→ `data.js: PLACES.lune`  
→ `#placeMain`

### Day timeline

`day3.html`  
→ hardcoded HTML timeline  
→ Guide/Moment buttons call `openGuideModal()` / `openMomentsModal()`

### Moments

`openMomentsModal(placeKey)`  
→ final active wrapper in `script.js`  
→ `PLACES[placeKey]`, `FRIENDS[getFriend()]`, localStorage  
→ `#momentsModal`

### Expenses

`openExpenseModal()` / `saveExpense()`  
→ final active wrappers near end of `script.js`  
→ localStorage `expenses`  
→ `#expensePageList` / modal / dashboard widgets

### Loading

`index.html`  
→ `#ccmvSplash` markup  
→ inline JS hides/removes splash  
→ `styles.css` controls look and blocking behavior

## 5. Implementation advice for Claude

Use this map to avoid editing the wrong file:

1. Start by moving only safe data mutations:
   - `PLACES.general` from `script.js` to `data.js`.
   - Change category sorting to sort copies instead of mutating `CATEGORIES`.
2. Do not touch `day*.html` yet.
3. Do not touch static `trip.html` unless the request is explicitly about the static Trip page.
4. Do not rewrite Moments/Expenses yet; just document final active functions.
5. After any change, test:
   - Home + loading
   - Trip modal City/Stay/Flights
   - Guide modal
   - One standalone place page
   - One Day page Moment button
   - Moments page
   - Expenses page and add/edit expense
   - PWA after cache version update
