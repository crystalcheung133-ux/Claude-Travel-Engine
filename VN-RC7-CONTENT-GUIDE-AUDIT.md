# VN RC7 Content / Guide Audit

## Contract applied
- Primary prose: Traditional Chinese with Hong Kong travel tone.
- Proper nouns and useful travel terms may remain in English/Vietnamese (Grab, WhatsApp, Head Spa, restaurant names).
- No generic tourism filler. Guide prose must explain what is distinctive, what to order/do, or a practical trip-specific point.
- Booking fields stay structured and must not leak into Guide prose.
- Timeline wins when itinerary wording/time conflicts with older Master content.

## RC7 corrections
- Omakase Tiger Timeline/Guide wording normalized from full English to the VN Companion tone.
- Omakase Tiger `bookingName` restored to `Crystal Cheung`; deposit remains structured as VND 2,000,000 and is not part of Booked Under.
- Scheduled Spa/Cooking Class operational copy normalized where it had reverted to full-English migration text.
- Repeated `To next stop` wording normalized to `下一站` while keeping Grab / venue proper nouns.
- Return-hotel / optional-supper labels normalized.
- Four traveller emoji are now rendered from Party config, not only stored in config.
- Day 1–5 now carry explicit, distinct emoji: 🛬 / 👩‍🍳 / 🌿 / 🛍️ / ✈️.
- Booking rows now prefer entity-specific emoji (e.g. 🍣 Omakase, 🍕 Pizza, 🥂 LÚNE, 👩‍🍳 Cooking Class) with category fallback.

## Deliberately retained
- English/Vietnamese proper nouns, brand names, addresses, Grab, WhatsApp, Head Spa and short category terms where they are clearer than forced translation.
- Existing curated Guide descriptions that already contain concrete venue/trip value; they were not padded or rewritten merely for length.
