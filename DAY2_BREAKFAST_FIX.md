RC29.139 scoped fix: Day 2 duplicate breakfast reconciliation.
- Cơm Tấm Mộc retired from Day 2 when Running Bean exists.
- Any non-default manually edited notes from the retired breakfast are transferred verbatim to Running Bean.
- Reconciliation applies to legacy local overrides and baseline-bearing publication rebase.
- Existing tests updated to assert one breakfast and note preservation.
- Does NOT solve baseline-less incompatible cloud publication (e.g. v552+) or all Booking hydration conflicts. Not approved for production deployment.
