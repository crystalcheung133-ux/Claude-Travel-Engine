# DEFERRED CLEANUP — not done in this pass, on purpose

Everything below was identified by the Audit/Map or found during Stage 1 implementation, and deliberately **left alone**. Nothing here was force-deleted or rewritten. This is the list to work from for Stage 2+, whenever you're ready to test each item individually.

---

## 1. Duplicate static content (documented, not converted)

### `trip.html` — static Trip page
Still has its own hardcoded content, completely separate from `TRIP_DATA` in `data.js`. Editing one does not affect the other.
**Why deferred:** Audit explicitly recommends leaving this alone or manually syncing, and NOT converting it to dynamic rendering without regression testing. Converting it would touch a page's structure/output — bigger than a Stage 1 "remove unsafe mutation" change.
**Stage 2 option:** render `trip.html`'s sections from `TRIP_DATA` directly, so there's truly one source. Needs visual regression testing since `trip.html`'s layout may not map 1:1 onto the modal's HTML structure.

### `guide.html` — static category lists
Hardcodes its visible category sections, while the Guide *modal* (opened from other pages) reads from `CATEGORIES` in `data.js`. Same duplication pattern as Trip.
**Why deferred:** Audit §6.2 — same reasoning as above.
**Stage 2 option:** render category sections dynamically from `CATEGORIES`.

### `day1.html`–`day5.html` — hardcoded timelines
No `ITINERARY_DATA` object exists; all times/titles/route hints/map links are inline HTML per day.
**Why deferred:** Audit §9 and Map §5 both explicitly say not to touch this until a canonical `ITINERARY_DATA` object is designed and all activity-card types are defined — this is a bigger data-modelling task, not a mutation-removal task.

---

## 2. Runtime function-override chains in `script.js` (untouched)

These are **chains of reassignment** — each later version wraps and calls the previous one, so the *last* assignment in file order is what actually executes. They are not necessarily bugs (many are legitimate incremental feature patches), but they make the effective behaviour hard to trace without reading the whole chain in order.

| Function | Reassigned at (approx.) |
|---|---|
| `openMomentsModal` | initial def, then reassigned, then wrapped again |
| `saveMoments` | initial def, then reassigned, then wrapped again |
| `renderMoments` | initial def, then reassigned |
| `saveExpense` | initial def, then reassigned/wrapped **6 times** |
| `renderExpenses` | initial def, then reassigned twice |
| `openExpenseModal` | initial def, then reassigned/wrapped **5 times** |
| `resetExpenseForm` | initial def, then reassigned, then wrapped |
| `editExpense` | initial def, then wrapped twice |
| `setFriend` | initial def, then wrapped twice |
| `toggleMenu` / `toggleTripMenu` / `toggleGuideMenu` / `toggleDays` | replaced once, for mini-menu positioning |

**Why deferred:** the Audit is explicit — Moments and Expenses carry legacy `localStorage` format compatibility (`moment_<key>`, `moments_list`, `moment_latest_<key>` for Moments; a single `expenses` array for Expenses). Consolidating these wrapper chains into one final implementation each is real, valuable cleanup — but it changes the actual code path that reads/writes a real user's saved data, and the instruction was explicit: **do not consolidate without individual regression testing.** A Stage 1 pass that just removes "safe" mutations is not the place to also silently rewrite the thing that reads someone's saved trip expenses.

**Stage 2 option:** pick ONE of these (e.g. `saveExpense`) at a time, trace the full chain to confirm what the final effective behaviour actually is, write that down, replace the chain with one function, then manually test: add an expense, edit it, delete it, reload the page, confirm `localStorage['expenses']` still has the right shape. Repeat per function. Do not batch these.

---

## 3. `styles.clean.css` — likely-stale file

Present in the ZIP, not referenced by any HTML page (confirmed: `grep`'d every `.html` file for `styles.clean.css`, zero matches).

**Why deferred:** the Audit itself lists this as a Stage 2 candidate ("Remove `styles.clean.css` if confirmed unused"), not Stage 1. I've now done the "confirm unused" part (see REGRESSION_REPORT.md), but per your instruction not to force-delete anything even when it looks safe, I left the file in the ZIP. It costs nothing at runtime (nothing loads it) — it's just dead weight in the repo.

**Stage 2 option:** safe to delete once you're comfortable — nothing in the shipped ZIP loads it, confirmed by grep across every HTML file.

---

## 4. Not in scope at all for Stage 1 (per your explicit instructions)

- No Alpha rewrite.
- No page files deleted.
- No day/place pages merged into a `place.html?id=...` pattern.
- CSS cascade/visual output: untouched, byte-identical `styles.css`.

---

## Suggested order for Stage 2, if/when you want it

1. `styles.clean.css` removal (zero risk, 30 seconds).
2. Trace + consolidate ONE Expenses function at a time, test after each.
3. Trace + consolidate ONE Moments function at a time, test after each (preserve legacy localStorage keys).
4. `guide.html` → render categories from `CATEGORIES` (visual regression test required).
5. `trip.html` → render from `TRIP_DATA` (visual regression test required).
6. Design `ITINERARY_DATA` and convert day pages — biggest item, do last, only once 1–5 are stable.

---

## Stage 1.5 addendum

Stage 1.5 added `BOOKINGS_DATA`, `ITINERARY_SCHEMA_EXAMPLES`, and `PLACE_SCHEMA_EXAMPLES` to `data.js` (see `STAGE_1_5_INFORMATION_MIGRATION.md`). The following are deferred from that stage:

- **No UI renders `BOOKINGS_DATA` yet** — no booking-status badge on any card, nothing in Trip/Guide/Day pages reads it. Wiring this in needs its own visual design pass (ties into the CCMV family visual system already applied in this Golden Master) plus its own regression test — not bundled into a data-shape stage.
- **`PLACES` was not migrated to the `PLACE_SCHEMA_FIELDS` naming.** `PLACE_SCHEMA_EXAMPLES` only previews 2 places in the new shape, for comparison. A full migration would touch every renderer that reads `PLACES` (Guide modal, place pages, Moments labels) and needs the same care as the Stage 1 items above.
- **Day pages still don't read `ITINERARY_SCHEMA_EXAMPLES`/`ITINERARY_ACTIVITY_TYPES`.** Those exist to fix the vocabulary ahead of time; actually building a data-driven day renderer is still the Stage 2 "biggest item, do last" task noted above.
