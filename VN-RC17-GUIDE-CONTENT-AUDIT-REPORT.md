# VN RC17 — Guide Content Audit Report

**Build:** Travel Engine 25.4.4 · VN RC17

## Audit scope

- Audited 48 place records; 46 are Guide-facing categories.
- Cross-checked Guide classification against the current Timeline authority and Booking linkage.
- Dining user-facing status is constrained to **Booked / Planned / Optional**.
- Generic or unverified `出發前再確認營業時間` placeholders are no longer rendered as Trading Hours; unverified hours are hidden.
- Stay cards do not carry venue opening-hours metadata.
- Cash / FX backup is Practical, not Activities.
- Shopping is restored as a first-class Guide feature with a direct Home button plus day/route grouping.

## Shopping restored

13 shopping entities are now represented in the Guide directory. Route groups:
- **Day 2 · Central optional extension** — 1 shop(s)
- **Day 2 · Nguyễn Trãi / Central** — 3 shop(s)
- **Day 3 · Pink Church / en route** — 1 shop(s)
- **Day 3 · Thảo Điền** — 2 shop(s)
- **Day 3 · Thảo Điền optional** — 1 shop(s)
- **Day 4 · Trần Quang Diệu** — 4 shop(s)
- **Day 5 · Saigon Centre** — 1 shop(s)

## Dining status audit

- **Booked** — 1
- **Optional** — 3
- **Planned** — 14
- **—** — 1

Booked is reserved for a confirmed reservation (currently Omakase Tiger). Planned means it is in the Timeline but not booked. Optional means it is genuinely skippable / backup.

## Specific fixes

- Fusion Original: removed meaningless `24 Hours` / venue-hours presentation; Stay section now focuses on nights/guests/useful stay information.
- Social Club Rooftop: card now states it is the 24/F Hôtel des Arts rooftop bar, with skyline/sunset cocktail context, useful hours and Optional status.
- Shopping: restored LOUH, Dalla Saigon, Rubies Rubies, LANE Cì and Takashimaya to the Guide inventory in addition to the earlier Day 2/Day 3 brands.
- LOUH: no invented storefront hours or address are displayed while the physical showroom remains unverified.
- Notre-Dame / Pink Church: exterior-photo wording is no longer misrepresented as an Opening Hours field.
- Cooking Class: scheduled class information belongs to Booking/Timeline rather than a generic venue Trading Hours field.

## Regression protection

- Added `test-rc17-guide-content-audit.js` for Shopping inventory/route groups, Dining status vocabulary, Stay-hours suppression, Practical FX classification and Social Club content.
- Converted the RC15 Moments/Timeline test from a hard-coded release identity to a release-neutral capability contract.
- Full local reference suite: **PASS**.

## Guide-facing matrix

| ID | Title | Category | Status | Trading Hours | Route Group |
|---|---|---|---|---|---|
| fusion | Fusion Original Saigon Centre | STAY | — | Hidden / N/A | — |
| bakes | Bakes Thảo Điền | CAFÉS | planned | 07:30–22:30 daily | — |
| cafe-apartments | The Cafe Apartments | CAFÉS | planned | Individual venues vary; most operate about 08:00–22:00 | — |
| cong | Cộng Cà Phê Tân Định | CAFÉS | planned | Hidden / N/A | — |
| marou | Maison Marou | CAFÉS | planned | Hidden / N/A | — |
| running-bean | The Running Bean | CAFÉS | planned | 07:30–22:00 daily | — |
| bep-me-in | Bếp Mẹ Ỉn | RESTAURANTS | planned | 10:30–22:30 | — |
| com-tam-moc | Cơm Tấm Mộc | RESTAURANTS | planned | 09:00–21:30 daily | — |
| little-bear | Little Bear | RESTAURANTS | planned | Thu–Sun 18:00–22:00; Mon–Wed closed | — |
| lune | LÚNE Restaurant & Bar | RESTAURANTS | planned | Mon–Sat 11:30–14:00 & 17:00–22:30；Sunday closed | — |
| omakase-tiger | Omakase Tiger | RESTAURANTS | booked | Reservation confirmed · 17:30 | — |
| pho-sol | Phở SOL | RESTAURANTS | planned | 06:00–24:00 daily | — |
| pho-vietnam | Phở Việt Nam Bến Thành | RESTAURANTS | planned | 06:00–03:00 daily | — |
| pizza4ps | Pizza 4P’s Hai Bà Trưng | RESTAURANTS | planned | Mon–Fri 11:00–23:00；Sat–Sun 10:00–23:00 | — |
| quan-thuy | Quán Thuý 94 | RESTAURANTS | planned | 09:00–21:00 daily | — |
| quince | Quince Saigon | RESTAURANTS | planned | 17:30–late daily; last order 21:45 | — |
| libe | LIBÉ | SHOP | — | 09:30–21:30 | Day 2 · Nguyễn Trãi / Central |
| dauple | Dauple by Ka's | SHOP | — | 09:30–21:30 | Day 2 · Nguyễn Trãi / Central |
| nosbyn | NOSBYN | SHOP | — | 10:00–21:00 | Day 2 · Nguyễn Trãi / Central |
| new-playground | The New Playground | SHOP | — | 10:00–21:00 | Day 2 · Central optional extension |
| saigon-concept | Saigon Concept | SHOP | — | Hidden / N/A | Day 3 · Thảo Điền |
| ohquao | OHQUAO | SHOP | — | 10:00–20:00 | Day 3 · Thảo Điền |
| louh | LOUH Saigon | SHOP | — | Hidden / N/A | Day 3 · Thảo Điền optional |
| garmentory | 11 Garmentory | SHOP | — | 10:00–21:30 daily | Day 4 · Trần Quang Diệu |
| dalla-saigon | Dalla Saigon | SHOP | — | Hidden / N/A | Day 4 · Trần Quang Diệu |
| rubies | Rubies Rubies | SHOP | — | Hidden / N/A | Day 4 · Trần Quang Diệu |
| lane-ci | LANE Cì | SHOP | — | Hidden / N/A | Day 4 · Trần Quang Diệu |
| push-push | Push Push Official | SHOP | — | 09:30–21:30 | Day 3 · Pink Church / en route |
| nha-suga | Spa Nhà Suga Premium Korea Headspa – Nguyễn Huệ | SPA | — | Hidden / N/A | — |
| moc-kim | Mộc Kim Spa & Beauty | SPA | — | 09:15–21:00 daily | — |
| moc-huong | Mộc Hương Wellness | SPA | — | Hidden / N/A | — |
| tinh-thuc | Tỉnh Thức Spa | SPA | — | Hidden / N/A | — |
| ha-spa | Hạ Spa | SPA | — | 09:00–21:00 daily | — |
| post-office | Saigon Central Post Office | ATTRACTIONS | — | Mon–Fri 07:00–19:00；Sat 07:00–18:00；Sun 08:00–18:00 | — |
| notre-dame | Notre-Dame Cathedral | ATTRACTIONS | — | Hidden / N/A | — |
| book-street | Nguyễn Văn Bình Book Street | ATTRACTIONS | — | Mon–Fri 08:00–21:00；Sat–Sun 08:00–21:30 | — |
| pink-church | Tân Định Church | ATTRACTIONS | — | Hidden / N/A | — |
| war-museum | War Remnants Museum | ATTRACTIONS | — | 07:30–17:30 | — |
| fine-arts | Fine Arts Museum | ATTRACTIONS | — | 08:00–17:00 daily | — |
| cooking | Saigon Cooking Class | EXPERIENCE | — | Hidden / N/A | — |
| workshop-coffee | The Workshop Coffee | CAFÉS | — | 08:00–21:00 daily | — |
| cash-backup | Cash Backup · Saigon Centre | PRACTICAL | — | Ask hotel concierge or Takashimaya Information Desk during opening hours | — |
| late-night-supper | Late-night Hotel Supper | RESTAURANTS | optional | Oanh Cua about 06:00–22:00; late dessert availability varies — check GrabFood Open Now | — |
| man-moi | Mặn Mòi – Bến Nghé | RESTAURANTS | optional | 10:00–22:00 daily | — |
| social-club | Social Club Rooftop Bar | CAFÉS | optional | Sun–Thu 15:00–00:00; Fri–Sat 15:00–01:00 | — |
| takashimaya | Takashimaya Saigon | SHOP | — | Hidden / N/A | Day 5 · Saigon Centre |