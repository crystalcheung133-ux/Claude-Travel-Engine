# CLAUDE_OUTSTANDING_ISSUES — RC29.138

## Deployment verdict: **NOT READY TO DEPLOY (yet)**
No known code defect from the two audits remains open. Two verification gates must still be passed before you deploy.

## Blocks deployment
| # | Issue | Why it blocks | What closes it |
|---|---|---|---|
| B1 | Production migration NOT TESTED | I had no authorized read-only snapshot; fixtures are not production | Replay an anonymized copy of the latest publication (v546+) and your device's saved store through the browser test |
| B2 | WebKit / real-device smoke NOT RUN here | The release gate requires WebKit (default CI fails without it, by design) | Push to GitHub: `sh ci-tests/run-all.sh` runs with WebKit installed; then a quick phone check |

## Does not block (documented limitations)
1. **Legacy deletions:** a Saved Override or Pending Draft written without a baseline cannot tell a deleted card from an omitted default; missing Master cards are restored (non-destructive). After the first migration the store has a baseline and later deletions persist.
2. **Fingerprints:** baseline-less data is classified by the old default text (from the exported itinerary). If the real old text differed, an unedited retired card is treated as edited and kept, or default words are copied as a note line to Day 4 Pizza / Day 2 Running Bean. Nothing is lost.
3. **Merged Day 5 cards:** luggage and transport times are preserved as note lines ("Previous hotel-luggage time: 14:45"), not as a time field.
4. **Edited retired cards** (Com Tam Moc, Garmentory) are kept as ordinary cards by design. If you deleted Day 4 Pizza yourself, an edited Day 2 Pizza card is kept rather than losing its note.
5. **Booking vs Timeline time:** unchanged by your instruction (a saved Timeline time on a booked card still displays the Booking time).
6. **Hydrated data that fails integrity** keeps the shipped Master and logs a console warning (cloud edits not shown).
7. **Quán Thuý 94** is still an optional Day 4 card — confirm whether to remove it.
8. **Old Pizza Booking Notes / `bookingHandoff`** still carry Hai Bà Trưng / Day 2 wording (yours to edit, not modified).
9. **Publications older than RC29.131** with no `itineraryBase` are still ignored (unchanged behaviour).
10. **Guide Notes** migration is covered by existing CI invariants only.
