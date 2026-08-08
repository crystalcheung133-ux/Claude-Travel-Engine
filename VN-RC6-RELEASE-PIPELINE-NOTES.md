# VN RC6 — Release Pipeline + Interaction Enforcement

Build: Saigon Companion RC6
Engine candidate: Travel Engine 25.3.3

## Root cause fixed
RC5 release metadata checksummed repository/development files while the production manifest contract forbade them. RC6 regenerates release metadata from the production runtime allow-set only.

## Release boundary
- `.github/`, `ci-tests/`, Markdown, SQL, source Edge Function and release metadata are repository/development artifacts and are excluded from Vercel publication.
- `bookings.html` is removed. The standalone consolidated Booking page is no longer a Companion route.
- `bookings-runtime.js` remains repository compatibility source only and is excluded from production publication.

## Interaction contract
- Trip menu exposes Stay / Restaurants / Spa / Activities / Transport as separate semantic entries.
- Stay list shows Total / Cashback / Net before opening detail.
- Timeline Guide opens the Guide modal and remains on the Day URL.
- Timeline Booking opens the Trip booking modal and remains on the Day URL.
- Closing modal returns to the source page/context.
- Booking deletion no longer redirects to bookings.html.

## Dual currency
Expenses exposes Paying in with AUD + destination currency (VND for VN); settlement remains AUD.

## Build identity gate
Production HTML carries `meta[name="travel-engine-build"] = VN-RC6|25.3.3` and runtime `TRIP_CONFIG.version = RC6-25.3.3`. Browser CI checks both before testing interactions.

## Validation
Local static/runtime gates PASS: syntax, release integrity, HTML structure, entity integrity, Guide address integrity, Timeline integrity, UX contract, portability runtime, runtime integrity, VN reference integration.
Browser Playwright gate is configured in GitHub CI and must pass there before freeze.
