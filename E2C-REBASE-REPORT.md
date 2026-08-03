# Stage E2C-Rebase — Shared Popup Navigation Authority

## Implemented

- Day remains a full page.
- Bottom Trip opens one popup list; selecting an item opens a shared Trip detail popup card.
- Bottom Guide opens one popup category list; category and Place details remain inside the shared Guide popup.
- Timeline Guide and Trip actions open the same shared popup authorities.
- Modal hosts are injected once by `shared-popup-runtime.js`; HTML pages do not carry duplicated modal markup.
- Importer/Trip Package still supplies IDs and content only.

## Not changed

Storage, Expenses, Moments, Studio, Export, Supabase, Day rendering and Trip data were not redesigned.
