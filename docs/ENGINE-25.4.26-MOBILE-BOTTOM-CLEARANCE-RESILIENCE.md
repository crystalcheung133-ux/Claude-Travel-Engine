# Travel Engine 25.4.26 — Mobile Bottom Clearance Resilience

Root cause of the unchanged mobile overlap:
`updatePersistentChromeMetrics()` could run before the bottom navigation had a usable
layout box. It then wrote `--studio-bottom-nav-clearance: 0px`. Because a CSS custom
property existed, the CSS fallback was never used, so the modal still extended under
the fixed bottom navigation.

25.4.26 fixes the metric contract:
- a bottom-nav measurement below 24px is treated as invalid;
- invalid measurement removes the custom property instead of writing `0px`;
- CSS retains a non-zero mobile fallback;
- metrics are measured immediately, over two animation frames, and again after short delays;
- resize/orientation changes trigger the same scheduled remeasurement;
- modal bottom/end padding is increased so the final action can be fully revealed.

This is an Engine viewport-metrics fix, not an Expense-specific patch.
