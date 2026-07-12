# Stage 4E-19 — Days Timeline / Activity Cards
Baseline: Stage 4E-17G1. Scope: Days Timeline / Activity Cards only (`day.html?day=1..5`). No other page touched.

---

## 4E-19A — Active Source & Dependency Audit

**Renderer class inventory (day.html, single renderer, confirmed identical markup contract for all 5 days):**
`.timeline`, `.timeline-item`, `.timeline-time`, `.timeline-main`, `.route-hint` (+ `strong`), `.timeline-actions` / `.timeline-actions--multi`, `.timeline-action` (+ `--map`/`--guide`/`--directory`/`--moment`), `.time-legend` (+ `span`).
Verified programmatically (jsdom render of all 5 days from `data.js`): all 5 days use the same structural contract; 2 of 5 days (Day 2, Day 3) exercise the `--multi` variant.

**Classification of pre-edit CSS (50 rule-blocks / 58 selector references touched `.timeline*`/`.route-hint`/`.time-legend`):**

| Category | Examples | Disposition |
|---|---|---|
| **Dead / superseded duplicates** | early `.timeline-time{font-weight:800}`; early `.timeline-actions button,a{...}` baseline; mobile 3-col `.timeline-actions` grid; `.timeline-actions a`/`.map-button` color rules later beaten by the unified button-skin rule | Removed |
| **Active, Days-exclusive** | `.timeline`, `.timeline-item` layout, `.timeline-main`, `.route-hint`, `.time-legend`, accent-stripe `:before`, desktop button geometry, mobile `@media(max-width:760px)` fragment, Stage 4F-S1F mobile action geometry | Relocated verbatim into canonical |
| **Active, entangled with other pages (necessary split)** | `.timeline-main h3` weight/color (shared with `.prose-block h2`/`.guide-list-title`/`.menu-title`); `.timeline-main p` font-size/line-height (shared with `.quick-info-value`/`.prose-block li`) | Days-only token extracted into canonical; shared remainder left in place for other pages |
| **Protected shared dependency (left untouched)** | `.timeline-item` background/border/border-radius/box-shadow/position/overflow/isolation (card-system + Stage 1.1 visual-alignment blocks); `.timeline-item::after` watermark-disable; `.timeline-main p` color/font-weight (sitewide muted-text rule); `.timeline-action`/`.pill` shared button skin; `.content-page` box + 112px bottom clearance | Not touched — still supplies Days' current rendered result |

`!important` chain (property-level, resolved by source order + specificity, confirmed against jsdom-rendered output): background/border/shadow/border-radius for the card surface, and the button skin, are won by the **later, broader, shared** rules (Stage 1.1 visual-alignment, unified button-skin) — not by any Days-only rule. Layout/geometry (grid-template-columns, padding, gap, font-size, min-height) is won by Days-only rules, with Stage 4F-S1F winning the ≤720px button geometry over the ≤760px/unconditional Days baseline.

**Audit question — answer:**
> 可以 reset presentation chain，但必須保留既有 renderer、navigation 及 mobile action geometry behavior。

Confirmed: the chain can be safely consolidated into one canonical implementation, provided (1) the renderer/markup/class-name contract is left untouched, (2) Stage 4F-S1F mobile action geometry is preserved byte-for-byte, and (3) the shared card-system/button-skin/typography dependencies that other pages also rely on are left in place rather than duplicated or deleted.

---

## 4E-19B — Presentation Contract Freeze

**Preserved visual contract** — desktop (time column, card content stability, button alignment, route-hint position, multi-action non-squeeze, spacing) and mobile (no cramped columns, Stage 4F geometry, button wrapping, no horizontal overflow, sticky bar/bottom-nav clearance, no odd bottom whitespace) — all confirmed unchanged (see 19E).

**Untouched behavior contract:** itinerary data, `data.js`, activity IDs, Guide navigation, Shopping Directory flow, Map action, Moments action, day-to-day swipe, hash scrolling, sticky-nav offset, Day renderer logic, no UI redesign. Confirmed: `data.js`, `script.js`, `day.html` are **byte-identical** to baseline (see verification below).

---

## 4E-19C — Historical Presentation Reset (executed)

Removed or relocated, from their original scattered locations:
1. Dead duplicate `.timeline-time{font-weight:800}`.
2. Dead early `.timeline-actions button,a` baseline skin.
3. `.time-legend` + `.time-legend span` (relocated).
4. Dead mobile 3-column `.timeline-actions` grid (inside a `@media(max-width:760px)` block; only that declaration removed, rest of block untouched).
5. The full "Days: fix nested / squeezed itinerary cards" desktop block (relocated verbatim).
6. The `.timeline-item`/`.timeline-time`/`.timeline-main h3` fragment inside the `.trip-sheet` mobile media block (extracted; `.trip-sheet`/`.checklist-mini`/`.expense-page-shell` rules in that block left untouched).
7. `.timeline-item:before` + `:nth-child` accent-stripe rules (relocated verbatim).
8. `.route-hint` + `.route-hint strong` (relocated verbatim).
9. `.timeline-main h3` token split out of the shared `font-weight:900/color:#241b16` rule (shared remainder `.prose-block h2,.guide-list-title,.menu-title` left in place).
10. `.timeline-main p` token split out of the shared `font-size/line-height/font-weight/color` rule — **only** `font-size`/`line-height` relocated to canonical, since `font-weight`/`color` for `.timeline-main p` are actually owned by a later, still-untouched shared muted-text rule (verified before touching anything).
11. Dead `.timeline-actions a,.timeline-actions button` / `.timeline-actions a` tokens removed from two now-superseded `.pill`/`.map-button` color rules (rules kept for `.pill`/`.map-button`).
12. Stage 4F-S1F mobile action-geometry block relocated **verbatim** (unchanged text) from its old position to the canonical section, per the "preserve Stage 4F contract" requirement.

No shared multi-page selector group was deleted. Where a shared rule needed to lose only its Days-only token, the rule was edited in place, not removed.

---

## 4E-19D — Canonical Rebuild (executed)

One consolidated section appended at end of `styles.css`:

```
/* =========================================================
   STAGE 4E-19 — DAYS TIMELINE / ACTIVITY CARDS CANONICAL
   ========================================================= */
```

It contains, in order: timeline wrapper → timeline item layout → time column → activity card content column → activity typography → metadata/route-hint → time legend → action area/standard buttons → (desktop spacing = the unconditional rules above) → mobile layout (`@media(max-width:760px)`) → mobile action geometry (`@media(max-width:720px)`, Stage 4F-S1F, verbatim) → bottom clearance (documented as inherited, not duplicated). A comment block at the top of the section explicitly lists the protected shared dependencies that are intentionally *not* duplicated here.

No new section was created elsewhere; this is the single Days presentation authority.

---

## 4E-19E — Static Verification & Change Report

**Static verification performed:**
- ✅ Brace balance: 0 (balanced) — custom scanner + full-file parse.
- ✅ Full-file parse with the `css` npm parser: **627 top-level rules, 0 parsing errors** (catches malformed selectors/syntax).
- ✅ Duplicate-selector-group scan: 18 exact duplicates found file-wide, all pre-existing **except one intentional, documented pair** (`.timeline-main h3` inside `@media(max-width:760px)`: one is dead pre-existing residue with a "relocated" comment beside it, the other is the new canonical winner).
- ✅ Search for remaining old Days chains (everything before the canonical marker): only the documented **protected shared dependencies** remain (card-system watermark/isolation block, Stage 1.1 visual-alignment block, sitewide muted-text/button-skin/heading-weight rules) — no orphaned Days-only logic left outside canonical.
- ✅ Search for competing media-query rules: none found beyond the documented pre-existing dead residue (unchanged, harmless, non-`!important`, already losing before and after).
- ✅ Renderer class-name coverage: every class the renderer emits (`timeline`, `timeline-item`, `timeline-time`, `timeline-main`, `route-hint`, `time-legend`, `timeline-actions`(+`--multi`), `timeline-action`(+ 4 modifiers)) has a style source (canonical or protected dependency) — confirmed by direct enumeration against `day.html`.
- ✅ No empty/orphaned rule blocks left behind by the splits (0 found).
- ✅ JS/data confirmed unchanged (see below).
- ✅ No void-stage code used; only Stage 4E-17G1 baseline content relocated or, where explicitly noted as dead, removed.

**Regression testing (jsdom-rendered computed styles, all 5 days, desktop 1280px + narrow 390px viewport, before vs after):**
All structural/geometry properties (`display`, `gridTemplateColumns`, `gap`, `padding`, `margin`, `fontSize`, `lineHeight`, `wordBreak`, `alignItems`, item/multi-card counts per day) matched **exactly**, before vs after, across all 5 days.

Two `color`-related diff lines appeared per day (`.timeline-main p` and the Map action's anchor color) where the jsdom "before" run had resolved a value that a real browser's cascade would **not** actually pick (jsdom doesn't reliably resolve `!important` vs `!important` ties when one side uses `var()`). Investigation confirmed: the CSS rule that is the *real* winner in a standards-compliant cascade (the shared muted-text rule and the shared button-skin rule, both later in source order and both untouched, byte-identical, just shifted to new line numbers) was present, unmodified, both before and after. Removing the now-dead competing declaration didn't change the true winner — it only changed which value jsdom's imperfect engine echoed back. This is a **test-harness artifact, not a rendering regression**; it was confirmed by direct byte-for-byte diff of the winning rule, not by jsdom output alone.

The mobile (`@media` width-gated) rules could not be exercised through jsdom's `getComputedStyle` (jsdom does not evaluate width-based `@media` for computed style), so those were instead verified by extracting and diffing the exact `@media(max-width:720px)` and `@media(max-width:760px)` rule text before vs after (order-independent): content is identical; the only difference was harmless reordering of *unrelated* media blocks that happened to sit next to the relocated ones.

**Files modified:** `styles.css` only.

**Counts:**
- Rule blocks referencing Days selectors before: **50** (58 selector references).
- Rule blocks referencing Days selectors remaining in their old locations after (protected shared dependencies): **21** (25 selector references) — untouched.
- Rule blocks/selector-references removed or relocated out of their old locations: **29 rule-blocks' worth / 33 selector references** (some rules deleted outright, some had only their Days-only token stripped, remainder rule kept for other pages).
- New canonical rule blocks added (single section, EOF): **23**.
- File length: 1333 → 1396 lines (net +63, entirely inside the canonical section plus short in-place comments explaining each relocation).

**Shared dependencies preserved (not touched):** `.content-page` box model + bottom clearance; `.page-hero`/`.module-hero` module header system; `.timeline-item` background/border/border-radius/box-shadow/position/overflow/isolation (card-system + Stage 1.1 block) and its `::after` watermark-disable; `.timeline-main p` color/font-weight (sitewide muted-text rule); `.timeline-action`/`.pill` shared button skin.

**JS changed:** No. **Data changed:** No. (`data.js`, `script.js`, `day.html` all byte-identical to baseline — confirmed by diff.)

**Manual regression checklist (for a human/visual pass before deploy):**
- [ ] Desktop: time column alignment, card padding, route-hint position/color on Day 1 (has route hints) and a day without.
- [ ] Desktop: a 3-action card and a multi-action (Day 2 or Day 3) card — buttons don't squeeze, directory/guide button spans correctly.
- [ ] Mobile ≤720px: 2-column action grid, guide button full-width on single-action cards, directory button full-width on multi-action cards, no horizontal overflow.
- [ ] Mobile 721–760px: 3-column desktop-style action grid still shows (Stage 4F-S1F only engages ≤720px) — confirm this is still the intended behavior.
- [ ] Accent-stripe color cycling (sky/olive/terracotta) still visible on the left edge of cards, all 5 days.
- [ ] Map button hover state (border accent) still works.
- [ ] Bottom of each Day page: no unexpected extra whitespace or clipped content above the bottom nav.
- [ ] Guide/Directory/Map/Moments navigation still functions from all 5 days (unchanged JS, but worth a click-through).

**Deploy recommendation:** Static verification is clean and the automated regression diff is fully explained (no genuine behavior change detected). Recommend proceeding to the manual regression checklist above before deploy; no further code changes anticipated unless the manual pass finds something.
