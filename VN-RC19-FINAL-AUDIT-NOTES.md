# VN RC19 — Final Guide + Booking Audit

Build: Travel Engine 25.4.6 · VN RC19

## Guide/content fixes
- Mộc Hương Wellness fixed to the Thảo Điền branch at 61 Xuân Thủy with 09:00–22:00 daily hours.
- Nhà Suga Nguyễn Huệ fixed to 8/F, 42 Nguyễn Huệ with 09:00–20:00 daily hours and head-spa-specific copy.
- Tỉnh Thức Spa fixed to 118/54 Trần Quang Diệu with 10:00–20:30 daily hours; stale Monday-hours warning removed.
- Hạ Spa fixed to 334 Nguyễn Trọng Tuyển with 08:30–22:00 daily hours for the trip reference.
- Saigon Concept fixed to 14 Trần Ngọc Diện with 09:00–18:00 daily hours.
- Dauple by Ka's fixed to 70 Phạm Hồng Thái with 09:30–21:30 daily hours.
- LOUH Saigon fixed to 61 Nguyễn Bá Huân with 10:00–18:00 daily hours; all “address unverified” copy removed.
- OHQUAO and Push Push audit notes updated to reflect selected verified branches.
- Saigon Cooking Class remains a scheduled session (10:00–13:00), not a Trading Hours venue.
- Removed several stale “check Instagram / confirm hours before departure” tips from already-verified shopping cards.
- Mộc Kim’s visible hour copy is internally consistent with the selected Guide hours.

## Booking navigation contract
- Every booking detail card now renders Previous / Next controls at the bottom.
- Navigation stays within the current booking category.
- First / last items disable the unavailable direction instead of wrapping.
- A category containing only one booking still shows 1 / 1 with both controls disabled for consistent UI.
- Accommodation, Activities, Restaurants, Spa and Transport all use the shared Engine navigation contract.

## Validation
- Release metadata regenerated only after all source changes.
- Full local VN reference suite passes.
- Final Full Deploy ZIP is re-extracted and the same full suite is run against the extracted artifact before delivery.
