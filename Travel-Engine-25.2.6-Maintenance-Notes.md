# Travel Engine 25.2.6 — Maintenance Notes

Use this as the next Travel Engine baseline instead of pre-analytics 25.2.5.

For a new trip instance, replace/configure instance-owned values in `trip-config.js`, `data.js`, theme/asset/locale/geo config and deployment Supabase settings. Reusable runtimes should not be edited merely to change trip id or traveller names.

`identityStorageKey` is optional for new trips. If omitted, storage uses `<storageNamespace>:traveller_identity:v1`. The NZ reference instance explicitly keeps `nz_friend` so already-deployed NZ devices retain their selected family.

Analytics SQL is now trip-neutral. `TRIP_CONFIG.storageNamespace` supplies the event `trip_id`; post-trip queries should substitute that value for `<TRIP_ID>`.

Historical RC25.2.3 and Analytics v1.1/v1.2 hotfix reports were removed from this clean baseline archive. Current baseline reports and CI remain source-only and are excluded from Vercel production publishing by `.vercelignore`.
