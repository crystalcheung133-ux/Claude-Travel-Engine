# Saigon Companion RC26 — Travel Engine 25.4.20.3 Backport

Backported current generic Engine capability without replacing VN trip content/theme.

Included:
- portability cleanup and completeness gate;
- runtime reliability tests;
- capability-suite CI;
- Stage 1 single-party/open-state genericity;
- Booking ↔ Expense final 25.4.20.3 workflow;
- shared-expense notification;
- bidirectional Expense currency display;
- root/report cleanup and RELEASE.json.

Not replayed:
- intermediate 25.4.20/.1/.2 hotfixes;
- NZ-specific data/UI;
- enterprise device registration;
- parallel itinerary tracks/presence windows.

Reset database RPC signature migration remains deferred because it requires coordinated Supabase production migration.
