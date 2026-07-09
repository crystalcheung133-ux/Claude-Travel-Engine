# REGRESSION REPORT — Stage 1 Cleanup

I don't have a browser in this environment, so "regression testing" here means two things:
**(A)** static/automated checks I actually ran and can show output for, and
**(B)** a manual click-through checklist for you to run once, before/after deploying — mapped directly to the Map's own §5 test list. Please treat (A) as "verified", and (B) as "not yet verified — please do this."

---

## A. Automated checks performed

### A1. File-level diff — confirms blast radius
Checksummed every file in the ZIP against the input. Result: **only `data.js`, `script.js`, `sw.js` changed.** Every HTML page, `styles.css`, `manifest.json`, all icons/logos are byte-identical to what you gave me.

### A2. Syntax validation
```
node --check data.js    → OK
node --check script.js  → OK
node --check sw.js      → OK
```

### A3. Runtime behaviour harness
I loaded `data.js` + `script.js` together in a Node `vm` context with a minimal DOM/localStorage shim (not a browser, but real JS execution of the real files — not a mock of the logic) and exercised the exact render paths from the Map's §4 "Render-path quick reference." Output:

| Check | Result |
|---|---|
| `PLACES.general` exists with correct title/emoji/cat/desc/etc. | ✅ matches expected values exactly |
| `openGuideCategory('CAFÉS')` called 3× in a row — does `CATEGORIES['CAFÉS']` keep the same array **reference** (i.e. never reassigned/mutated)? | ✅ `true` — same reference before and after |
| Same call — is the rendered list still correctly alphabetically sorted? | ✅ yes (`Bakes… → Cộng… → Maison… → The Cafe… → The Running…`) |
| `openTripCard(key)` for all 7 keys in `TRIP_ORDER` (checklist, city, emergency, flights, money, stay, tips, weather) | ✅ all resolve, all read the correct `TRIP_DATA[key].title` |
| `openGuideModal('lune')` | ✅ no throw |
| Moments fallback: `PLACES[missingKey] || PLACES.general || {...}` when key doesn't exist | ✅ correctly resolves to the canonical `PLACES.general`, same object |
| `renderPlacePage()` for `bakes`, `lune`, `fusion` (representative Cafés/Restaurant/Stay pages) | ✅ all render without throwing |
| `openGuideCategory('SHOP')` — the special Shopping Directory shortcut branch | ✅ still fires correctly |

This confirms, in actual executed code (not just reading it), that:
- the `CATEGORIES` mutation is gone (no more reassignment — verified by reference equality, not just "looks removed"),
- `PLACES.general` behaves identically whether it comes from the old runtime injection or the new canonical entry,
- nothing in the Trip modal, Guide modal, or standalone place page render paths throws or changes shape.

### A4. What this harness does *not* cover
It has no real DOM, no CSS, no click events, no service worker, no localStorage persistence across page loads. It cannot tell you whether something *looks* right, only whether the JS *runs* and produces the same data shapes. That's what section B is for.

---

## B. Manual checklist — please run this once (mirrors Map §5)

None of these are expected to have changed, but they're the actual product and deserve a real look before you trust it for the trip:

- [ ] **Home + loading** — splash still plays, home page still loads
- [ ] **Trip modal** — City, Stay, Flights all open with correct content (unchanged content, just confirming the modal still opens/reads from `data.js` as before)
- [ ] **Guide modal** — open a category (e.g. Cafés), confirm list still sorted, click into a place
- [ ] **One standalone place page** — e.g. `lune.html`, confirm it renders fully
- [ ] **One Day page → Moment button** — confirm it still opens the Moments modal correctly, including for a place that might fall back to the general "Moments" card
- [ ] **Moments page** — existing moments still show up (this pass didn't touch localStorage or Moments render logic at all)
- [ ] **Expenses page** — add/edit an expense still works (this pass didn't touch Expenses logic at all)
- [ ] **PWA** — after deploying, force-refresh once (or clear site data) to confirm the new `sw.js` cache name picks up cleanly

## Why confidence is high despite not having a browser

- The two behavioural changes in this pass (remove `CATEGORIES` mutation, move `PLACES.general`) were each proven **redundant-safe** before removal — not just "probably fine": the base `openGuideCategory` already re-sorts a copy on every call regardless of stored order (see CHANGELOG.md §2b), and `PLACES.general`'s content was moved verbatim, not rewritten.
- Nothing touching Moments/Expenses/Day pages/Trip static page/Guide static page was touched at all — those remain exactly as they were, warts and all, per your explicit Stage 1 boundary.
- The automated harness executes the real files, not a paraphrase of them.
