# Memory Edition – Reader fix

- Home: restored original four live dashboard cards. Only the after-trip primary link changes from Open Day 5 to Our Memories.
- Reader: fullscreen button toggles immersive layout by hiding top title/description while keeping compact controls; the browser fullscreen API is also requested where supported. On iPhone Safari the CSS immersive layout is the fallback; browser address bars are controlled by Safari.
- Reader: original, locally included instrumental music `memory-theme.mp3` with manual play/pause and default muted playback state. Background audio may be interrupted by browser/OS restrictions.
- Existing: PDF, pagination, keyboard/swipe, zoom, resume, Save, Share preserved.

## Verification

Static: JavaScript syntax, required assets and DOM references checked. Browser automation unavailable in this runtime because Chromium blocked test URLs with ERR_BLOCKED_BY_ADMINISTRATOR. Final iOS Safari and deployed URL tests still required for viewport fullscreen, audio and share-sheet behavior.
