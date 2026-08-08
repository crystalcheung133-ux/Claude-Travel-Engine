# Travel Engine 25.2.8 — Booking Collaboration Foundation

## Scope

25.2.8 extends the 25.2.7 Booking Foundation without changing the booking taxonomy or trip UI. It introduces one Booking system with a selectable per-trip permission mode.

## Permission modes

- `admin` — default and backwards-compatible with NZ. Booking edits require PIN-unlocked Trip Studio.
- `collaborative` — any configured party/traveller can edit shared Booking state. Studio is not required for booking edits.

The mode is controlled by `TRIP_CONFIG.bookingManagement.mode`; this is a trip configuration choice, not a forked Booking Engine.

## Collaborative transport

When `bookingManagement.sync.enabled` is true, booking changes are pushed through the generic Supabase `booking-sync` Edge Function and pulled on load/focus/online/visibility/poll. The transport uses the existing shared trip access-token model and records the editing party.

Admin mode remains local unless a future trip explicitly enables remote sync.

## Behaviour preserved

- Pending / Confirmed only.
- Delete means remove a booking that is no longer required.
- Empty booking fields remain hidden.
- Accommodation / Restaurants / Spa / Activities / Transport remain the shared taxonomy.
- Existing NZ default remains Admin-managed.

## Backend contract

The generic Edge Function reads a private `trip_booking_access` row to determine `admin` versus `collaborative`; VN legacy access remains backward-compatible. The Bookings table may carry a JSON `payload` so the Engine can sync trip-neutral booking fields without expanding SQL columns for every future booking attribute.

## Supabase deployment status

The collaboration backend foundation was deployed during this validation slice:

- `bookings.payload jsonb` added for trip-neutral Booking fields.
- private `trip_booking_access` configuration added with `admin` / `collaborative` modes.
- VN registered as `collaborative` with Crystal as the admin party for compatibility.
- `booking-sync` Edge Function upgraded to v7. It now validates the trip token server-side, validates the party against the trip, enforces the stored Booking mode, supports token-protected reads, and persists the generic payload.
- Existing VN Companion remains behaviourally compatible because its old client still only exposes writes to Crystal/Admin; the new Engine client can use collaborative writes when VN is rebuilt.

No VN UI rebuild was performed in this phase.
