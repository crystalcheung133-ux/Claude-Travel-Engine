# VN RC11 — Sync + Content Integrity Fixes

- Added trip-scoped Supabase RLS policies for `ccmv-vietnam-2026` while preserving NZ policies.
- Seeded `trip_generation` for the VN trip.
- Expense modal keeps the 💰 emoji after form reset / edit.
- Timeline renderer strips a duplicated `To next stop:` prefix from route body; the UI heading owns that label.
- Arrival airport transfer remains `pending`; invented booking-method details removed until a real booking is supplied.
- Browser/static regression coverage added.
