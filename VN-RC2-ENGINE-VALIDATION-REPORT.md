# Saigon Companion RC2 — Engine-first validation

Built from Travel Engine 25.2.9 after promoting reference-trip defects into the Engine rather than continuing VN-only UI patches.

## Engine fixes exercised by RC2
- Guide semantic aliases: Restaurants/Cafés feed Dining; Experience/Spa feed Activities.
- A Guide category with one result opens the actual card directly (Stay → Fusion Original).
- Participant emoji are rendered from trip config.
- Trip menu is module-driven: Stay / Activities / Transport are first-class options; Rental Car is hidden when disabled.
- Booking Centre keeps grouped sections and shows sparse Total / Cashback / Net payment on list cards.
- Timeline CI is trip-neutral.

## VN data correction
- Emergency Info is limited to emergency services, hotel and consular contacts. Restaurant and spa booking numbers are removed from Emergency and remain in Booking/Guide where they belong.
