# Travel Engine 25.4.25 — Canonical Scrollable Modal Sheet

This replaces the rejected sticky-action direction.

Canonical mobile modal behaviour:
1. modal opens at the top of its card;
2. persistent Studio status + traveller header remain above;
3. bottom navigation remains below;
4. the card itself scrolls within the bounded usable viewport;
5. primary action stays at the real bottom of the form in normal document flow;
6. scrolling to the bottom reveals the complete action with bottom breathing room;
7. closing and reopening resets the card to the top.

The same contract applies to Expense, Moments, Unexpected, Guide, Trip/Booking and Studio modal sheets.
