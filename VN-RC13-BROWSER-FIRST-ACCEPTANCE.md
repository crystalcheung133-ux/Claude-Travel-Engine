# VN RC13 — Browser-first acceptance hardening

Engine: Travel Engine 25.4.0

Fixed contracts:
- First-device traveller selector cannot be dismissed; close is hidden both by DOM state and CSS.
- Header identity renders emoji + full traveller name.
- Mobile custom expense split keeps full traveller names readable and moves controls below identity when necessary.
- FX helper uses a meaningful inverse rate (for VN: 1 AUD ≈ xx,xxx VND) plus entered-amount conversion.
- Mobile timeline time rail cannot overlap content; long labels wrap at spaces.
- Timeline booking status resolves canonical booking.status before any display label.
- Booking override storage is now trip-namespaced to prevent cross-trip/stale local state leakage.
- RC12 escaped-newline CSS packaging corruption repaired.
- Browser CI now enforces all six acceptance points.
