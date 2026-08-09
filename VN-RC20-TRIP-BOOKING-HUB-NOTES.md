# VN RC20 — Trip Booking Hub cleanup

- Trip primary menu is now booking/logistics only.
- Removed Checklist and Emergency from the primary Trip menu; underlying data/runtime retained for compatibility rather than destructively deleted.
- Trip page copy now describes bookings rather than general essentials.
- Release identity bumped to VN RC20 / Travel Engine 25.4.7.
- Added CI assertion preventing Checklist/Emergency from returning to the primary Trip menu.
- Static CI suite passes locally. Browser portability test is included but could not be executed in this container because Playwright is not installed; GitHub CI should run it in its Playwright-enabled job.
