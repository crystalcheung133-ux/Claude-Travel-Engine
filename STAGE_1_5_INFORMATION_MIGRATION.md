# STAGE 1.5 — INFORMATION MIGRATION TEMPLATE

Base: `Claude-Travel-Engine-main-stage1-ccmv-family-visual-1143c-calibrated-logo.zip` (Golden Master)
Scope: data-shape preparation only. Not a UI change. Not an Alpha rewrite. No files deleted.

**3 files touched, everything else byte-identical to the Golden Master** (checksum-verified): `data.js`, `script.js`, `sw.js`.

---

## What this is for

Right now, filling in real confirmed booking details (restaurant reservations, spa times, cooking class, airport transfer, hotel, tickets) would mean inventing a new place to put that information every time, because no shared shape exists for "a booking" yet. Stage 1.5 fixes that: it adds the data shapes, with real worked examples, so that when the actual confirmations come in, it's a data-entry task — fill in the fields — not a rebuild.

**Nothing in the current UI reads any of this yet.** Trip modal, Guide modal, Day pages, Moments, Expenses, Comments, Emoji reactions all render exactly what they rendered before, from exactly the same `PLACES` / `CATEGORIES` / `DAY_LINKS` / `TRIP_DATA` objects as before. This stage is purely additive.

---

## 1. `BOOKINGS_DATA` (in `data.js`)

An object keyed by booking id. Three real, filled-in samples ship with this stage:

| Booking id | Type | Status | Links to |
|---|---|---|---|
| `omakase-tiger-booking` | `restaurant` | `toBook` | `PLACES.omakase-tiger`, `dayId: 'day1'` |
| `cooking-class-booking` | `cookingClass` | `confirmed` | `PLACES.cooking`, `dayId: 'day2'` |
| `airport-transfer-booking` | `airportTransfer` | `pending` | no `PLACES` entry (`placeId: null`) — demonstrates the "logistics booking with no matching place" case |

Every booking carries all 17 requested fields (`id, type, title, status, date, time, placeId, dayId, guests, reference, contact, address, mapUrl, paymentStatus, notes, reminders, attachmentsPlaceholder`), even where the real value isn't known yet — those are explicit `null` / `[]`, not missing keys, so a future renderer can always safely read `booking.reference` etc. without an `undefined` check.

**To add a real booking later:** copy one of the three samples, change the values, add it as a new key in `BOOKINGS_DATA`. No other file needs to change for the data to exist. Wiring it into a visible UI is a separate, later step (see "What's deferred" below).

## 2. `ITINERARY_ACTIVITY_TYPES` + `ITINERARY_SCHEMA_EXAMPLES` (in `data.js`)

`ITINERARY_ACTIVITY_TYPES` is the fixed vocabulary of activity kinds a day's timeline can eventually contain: `meal, transport, experience, spa, shoppingWindow, buffer, rest, ticket, booking, note`.

`ITINERARY_SCHEMA_EXAMPLES` has one fully worked example per type — not invented placeholder text, but built from real trip content already in `PLACES` / `BOOKINGS_DATA` (the `meal` example is the real Omakase Tiger dinner, the `experience` example is the real cooking class, etc.), so you can see exactly what a real entry looks like for each type.

This is **documentation-as-data**, not a validator — there's no schema-validation library in this project, so nothing enforces this shape at runtime. Its job is to fix the vocabulary before anyone builds a day-page renderer, so five different days don't each invent slightly different field names.

## 3. `PLACE_SCHEMA_FIELDS` + `PLACE_SCHEMA_EXAMPLES` (in `data.js`)

`PLACE_SCHEMA_FIELDS` lists the forward-looking unified place shape requested: `id, name, category, district, address, hours, mapUrl, phone, website, price, style, whyGo, routeFit, bookingId, notes`.

**This does not replace `PLACES`.** `PLACES` keeps its current field names (`title`, `cat`, `maps`, `desc`, etc.) because Guide, Trip, Days, and Moments all read those exact field names today — renaming them would be precisely the kind of UI-breaking rewrite Stage 1.5 is explicitly not meant to do.

`PLACE_SCHEMA_EXAMPLES` is a *preview*: the same two real places (`omakase-tiger`, `cooking`) mapped into the new field names, side by side with their real `PLACES` entries, so a future migration can compare old-shape vs new-shape before touching any renderer.

## 4. Helper functions (in `script.js`, appended at the very end)

Three small, pure, read-only functions:

- `getBookingsForDay(dayId)` — all bookings for a given day
- `getBookingsForPlace(placeId)` — all bookings for a given place
- `getBookingStatusLabel(status)` — status code → display label (e.g. `'confirmed'` → `'✅ Confirmed'`)

None of these are called anywhere else in the file. None are attached to a button or `onclick`. None write to the DOM or `localStorage` — verified in `REGRESSION_REPORT.md` by checking that calling them leaves the DOM untouched. They exist purely so a future stage doesn't have to re-invent this lookup logic from scratch. Safe to delete if a later design takes a different approach — nothing else in the app depends on them.

---

## What's deferred (not done in this stage, on purpose)

- **No UI renders `BOOKINGS_DATA` yet.** No booking status badge, no "confirmed" indicator on any card, nothing in Trip/Guide/Day pages reads it. Wiring this in is a Stage 2+ task and needs its own visual design + regression pass, per your instruction not to force-display data the UI doesn't already show.
- **`day1.html`–`day5.html` are unchanged.** `ITINERARY_SCHEMA_EXAMPLES` gives the target shape for a future day-page data model, but the actual day pages are still the hardcoded HTML they were before. No day page was touched.
- **`PLACES` was not migrated to the new field names.** Only `PLACE_SCHEMA_EXAMPLES` previews what that would look like, for two places, as a comparison reference.
- **No file-upload mechanism exists** for `attachmentsPlaceholder` — it's a shape placeholder (`{label, url}` pairs) only, matching the spec's own wording ("attachmentsPlaceholder").

See `DEFERRED_CLEANUP.md` (carried over from Stage 1) for the still-open Stage 1 items — those are unaffected by this stage and remain deferred for the same reasons as before.
