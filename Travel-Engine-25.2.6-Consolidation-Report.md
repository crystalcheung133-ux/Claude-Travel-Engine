# Travel Engine 25.2.6 — Analytics Consolidation & NZ Decoupling

## Baseline decision
25.2.6 is derived only from `NZ-Companion-RC25.2.5-Analytics-System-v1.2-Full-Deploy.zip`. It promotes the proven Analytics v1.2 layer into the reusable Travel Engine runtime while preserving the NZ instance as the reference configuration/data set.

## Decoupling boundary
Reusable runtime code no longer requires the literal NZ trip id, Lee identity, or `nz_friend` storage key. Those values are instance-owned by `trip-config.js` for backwards compatibility with the deployed NZ Companion. Future trips may supply their own `storageNamespace`, participant directory, admin identity and optional `identityStorageKey`.

## Changes
- Removed `nz-family-2026` fallback from sync and publication runtimes.
- Made traveller identity storage key config-driven; NZ keeps `nz_friend` only in its instance config so existing devices remain compatible.
- Removed `lee` fallbacks from core analytics/expense/moment reusable runtime paths.
- Made completion fallback language admin-generic.
- Made Analytics SQL reusable across trip ids while retaining INSERT-only browser permissions and no browser analytics reads/updates/deletes.
- Generalised post-trip analytics queries to `<TRIP_ID>`.
- Retained Analytics v1.2 event model, offline queue, session model, admin separation and INSERT-only retry behaviour unchanged.

## Deliberately not changed
NZ itinerary, places, bookings, theme, participant names, branding and trip-specific presentation remain in the reference instance files (`data.js`, `trip-config.js`, HTML content/assets). 25.2.6 is an Engine baseline with an NZ reference instance, not a blank Generator template. No unrelated UI or workflow refactor was performed.
