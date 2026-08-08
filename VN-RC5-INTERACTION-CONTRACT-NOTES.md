# VN RC5 — Interaction Contract Fix

- Dual-currency Expenses selector is explicit and always visible when home and destination currencies differ.
- Trip Booking is separated into Stay, Restaurants, Spa, Activities and Transport popup entries; no generic Booking page jump.
- Accommodation list shows Total, Cashback and Net when present.
- Timeline Booking actions resolve by bookingId with event/place fallback.
- Timeline Guide remains an in-page Guide modal.
- Routine Grab/taxi/walk transitions never render as standalone cards merely because the destination has a booking.
- Browser portability regression updated to catch the RC4 Grab failure and dual-currency visibility.
