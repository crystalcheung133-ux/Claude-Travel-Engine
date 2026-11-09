# Our Memories — Heyzine link integration

- The four original homepage live cards remain unchanged.
- After trip, primary button opens https://heyzine.com/flip-book/1aeb62aaf8.html directly, in the same browser tab.
- Existing day links while trip is active remain unchanged.
- The previous built-in PDF reader and local PDF are kept as assets, but homepage no longer enters that reader.
- The Heyzine book is hosted externally; its own controls determine tapping, zooming, and downloading.
- Service worker cache name updated to ensure browser clients receive changed button action.
- This patch does not resolve pre-existing CI failures; deployment/browser validation is still needed.
