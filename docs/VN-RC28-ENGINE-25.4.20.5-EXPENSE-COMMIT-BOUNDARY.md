# VN RC28 / Travel Engine 25.4.20.5

## Fixes
- Booking deposit fields (`depositAmount`, `depositCurrency`) now prefill Booking → Expense.
- Once the Expense is written to local storage, Save is considered successful.
- Modal closes immediately at that commit boundary.
- Rendering, sync queue and dual-write happen after close and are isolated.
- A post-save UI/sync exception can no longer show "Could not save" after the transaction was actually saved.

This directly prevents the confusing state where an Expense exists twice because the user was told the first Save failed.
