# Travel Engine — Analytics Event Map v1.2

Analytics is silent and additive. Every event contains `event_id`, `trip_id`, `traveller_id`, `session_id`, `actor_type`, `event_type`, `page_type`, optional `entity_type` / `entity_id`, minimal `metadata`, and `occurred_at`.

`traveller_id` comes from the deployment's configured participant identity model. `actor_type=admin` is assigned whenever Trip Studio/Admin Mode is active; traveller analysis should filter to `actor_type='traveller'`.

| Event | Entity | Minimal context | Purpose |
|---|---|---|---|
| `page_view` | page/day/guide | day id where applicable | Home/Days/Guide/Booking/Expenses/Moments usage |
| `day_open` | day | day identifier | Explicit day-link usage |
| `guide_category_open` | guide_category | category id | Category usefulness |
| `guide_open` | guide | Guide key + category | Guide card usefulness |
| `navigate_use` | guide/action | current Guide key where known | Navigation demand |
| `booking_link_use` | booking | booking id, source=guide | Guide → Booking usage |
| `options_open` | guide_group | item/group id + option count | Alternatives/Options usage |
| `guide_day_link_use` | day | target day + Guide key | Guide → Day usage |
| `booking_centre_open` | trip_section | section id | Trip/Booking Centre usage |
| `booking_open` | booking | booking id + type | Individual booking usage |
| `expense_entry_open` | feature | expense_entry | Expense entry modal usage |

Not collected: GPS, typed notes, expense values/details, Moment text/photos, booking personal details, device fingerprint data, scrolling/touch telemetry.
