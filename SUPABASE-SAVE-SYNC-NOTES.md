# Supabase changes for Save & Sync (RC29.136) — READ BEFORE DEPLOYING

**Status: NOTHING in this file has been run against any Supabase project.** I had no staging
credentials, and the SQL for `trip_guides`, `trip_publications`, `publish_trip_snapshot` and
`ccmv_booking_sync_mutate` is not in the ZIP, so I could not inspect the real schema.
Deploy to a STAGING project first. Nothing below is required for the client code to run.

## What the client code now assumes (verify against your schema)
| Table / RPC | Client assumption |
|---|---|
| `trip_guides` | columns `id, trip_id, payload (jsonb), updated_at`; anon/authenticated role may `select`, `insert`, `update` rows for its trip (the previous code already upserted, so insert/update should already be allowed). |
| `trip_publications` | readable with the publishable key (the existing `sync-runtime.js` already reads it by REST) with columns `trip_id, schema_version, version, payload`. |
| `publish_trip_snapshot` | unchanged signature `(p_trip_id, p_schema_version, p_payload, p_admin_pin)`; returns a row with `version`. New payload field `data.itineraryBase` is inside the existing jsonb — no schema change. |
| `bookings` + `booking-sync` Edge Function | **unchanged** — no Edge Function redeploy is needed for this release. |

## Optional hardening (recommended, NOT applied by the client)
### 1. Remove the remaining race in Timeline publishing
The client merges against the latest published row before publishing, but `publish_trip_snapshot`
has no compare-and-set, so two devices publishing in the same second can still interleave. To close it,
add an optional `p_expected_version int default null` argument to the RPC that raises
`version_conflict` when `p_expected_version is not null and p_expected_version <> current_max_version`.
I have not written this because the RPC body is not in the project files; send me
`SUPABASE_STAGE_13_ONE_CLICK_PUBLISH.sql` and I will produce an exact migration.

### 2. Server-assigned `updated_at` for `trip_guides` (stops client-clock skew)
```sql
-- STAGING FIRST. Idempotent.
create or replace function public.trg_trip_guides_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := greatest(clock_timestamp(), coalesce(old.updated_at, '-infinity'::timestamptz) + interval '1 millisecond');
  return new;
end $$;

drop trigger if exists trip_guides_touch on public.trip_guides;
create trigger trip_guides_touch
  before update on public.trip_guides
  for each row execute function public.trg_trip_guides_touch();
```
Effect: every committed update strictly advances `updated_at`, so the client's compare-and-set
(`update … where updated_at = <value I read>`) can never be defeated by two writes in the same millisecond or
by a device with a wrong clock. The client works without it; this only tightens it.

## Rollback
Client: redeploy the previous ZIP (pending-queue key `<trip>:pending_mutations:v1` is simply ignored).
SQL: `drop trigger if exists trip_guides_touch on public.trip_guides; drop function if exists public.trg_trip_guides_touch();`
