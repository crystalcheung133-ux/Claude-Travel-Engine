# Stage E2C.2 — Japan Identity and Trip Detail Recovery

## Fixed

- Added one shared Trip identity binder for `data-brand-text`, logos, titles, theme metadata and geo labels.
- Replaced stale NZ first-paint fallback on the Japan homepage with build-generated Japan identity.
- Trip popup remains the category selector.
- Selecting a Trip item now opens only the requested full-page detail; the landing grid is not repeated above the detail.
- No Guide, Day, storage, Expenses, Moments, Studio or Export behaviour changed.

## Browser gates

1. Homepage must show Tokyo · Hakone · Fuji / Onsen Trip, never New Zealand Companion.
2. Header logo must load.
3. Bottom Trip opens popup.
4. Selecting Flights opens Flights detail only, without the six-card landing grid.
5. Console: zero blocking errors.
6. Network: zero 404s.
