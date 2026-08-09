# VN RC27 / Travel Engine 25.4.20.4
Engine-level Expense save safety fix:
- Custom Split can leave exactly one amount blank; Save fills the remaining balance.
- Save locks on first tap.
- Edit/Create state is captured before async FX lookup.
- Successful local Save closes the Expense modal immediately.
- A second tap cannot create a duplicate transaction.
