# Travel Engine 25.2.7 — Booking Foundation v1

Baseline: Travel Engine 25.2.6 Analytics Consolidated.

## Implemented

- Added generic `bookings.html` + `bookings-runtime.js` Booking Centre.
- Reusable taxonomy: Accommodation / Restaurants / Spa / Activities / Transport.
- Empty booking categories are hidden automatically.
- Status model reduced to Pending / Confirmed for Booking Centre and Studio editor.
- `not booked` / `to be booked` normalize to Pending.
- Removed Cancelled from Studio status choices; Studio now supports Delete Booking.
- Booking Authority stores deletion tombstones so removed bookings stay hidden without mutating the deploy source file.
- Booking detail rendering continues to omit empty fields; pending generic detail suppresses empty payment/deposit blocks.
- Trip menu booking access consolidated through Booking Centre across production pages.
- Added Booking Foundation CI contract.

## Not implemented in this release

- VN migration/rebuild.
- Booking-specific Supabase collaborative sync.
- Builder mapping from reconciled Master JSON into Engine booking data.

## Compatibility

Existing NZ booking records continue to resolve from `BOOKINGS_DATA`. Categories not present in the instance are not displayed.
