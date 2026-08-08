# Saigon Companion RC3 — Travel Engine 25.3.0 validation build

RC3 is regenerated from the Engine portability/runtime audit direction rather than patched as an isolated VN UI.

Validation targets from user testing:
- complete VN header logo, no cropped monogram
- currency converter can obtain VND→AUD through provider fallback
- hotel timeline actions resolve to Guide + Booking rather than dead Trip Info
- all booking buttons route through the generic booking detail router
- routine unbooked Grab/taxi transitions do not render as separate timeline cards
- mobile timeline time rail is narrower
- four-traveller Expenses split UI does not overlap
- Expenses uses green module accent; Moments uses pink module accent
- VN remains collaborative booking mode and Rental Car remains disabled

RC3 remains a validation build, not a production freeze.
