# RC29.135a — audit fixes (no version bump)

Base: VN Companion RC29.135 · Copy Audit & Sticky Guide Close. Release identity, RELEASE.json and
all other files are unchanged. Only sw.js and guide-authority.js differ (see RC29.135a-AUDIT-FIXES.diff);
SHA256SUMS.txt lines for those two files were regenerated. `sh ci-tests/run-all.sh` passes.

## 1. sw.js — network timeout (audit item 2)
- fetchWithTimeout(): 4 s time-to-headers limit (AbortController) for navigation and critical JS/CSS.
- navigationResponse(): if the first request timed out / failed, go straight to cache instead of
  making a second network request for index.html (previously two stalls before fallback).
- Behaviour on a healthy network is unchanged. Supabase/cross-origin requests still bypass the SW.
- Tested with a simulated stalled network: cache served at ~4.0 s, one network attempt.

## 2. guide-authority.js — sanitise Guide overrides (audit item 4)
Guide overrides sync across devices via trip_guides and are rendered with innerHTML in guide-runtime.js.
- All string values in a patch are sanitised on save, stage, mergeRemote AND read (so already-stored
  values are cleaned too): `<` `>` become full-width look-alikes (＜ ＞), keeping text like "<10 min" readable.
- Keys website / url / maps accept http(s) only (bare domains get https://); quotes/whitespace are percent-encoded.
- Edit form, saveGuideEdit and trip-runtime's booking→guide patch need no changes.
- Residual: a double quote inside free text is not altered (no current renderer puts patch text in an attribute).

## Not changed
- Audit item 1 (Studio PIN + booking access token in public trip-config.js): needs a decision and a
  server-side check; rotate the PIN/token before departure.
- RLS for non-analytics tables, CSS !important debt: out of scope for this patch.
