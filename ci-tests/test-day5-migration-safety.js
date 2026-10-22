const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={console};c.globalThis=c;vm.createContext(c);
vm.runInContext(fs.readFileSync('data.js','utf8'),c);
const master=c.TRAVEL_DATASETS.ITINERARY_DATA['5'].items;
assert.deepStrictEqual(Array.from(master,x=>x.id),['day5-easy-morning','day5-free-browse','hotel-checkout','bep-me-in','fine-arts','ha-spa','day5-optional-dinner','airport-departure']);
const old=[{id:'day5-free-browse',details:['MY SHOPPING NOTE']},{id:'hotel-checkout',details:['CHECKOUT']},{id:'hotel-luggage',details:['MY LUGGAGE NOTE'],route:'MY LUGGAGE ROUTE'},{id:'ha-spa',details:['SPA NOTE']},{id:'grab-ha-spa',details:['MY GRAB NOTE'],route:'MY GRAB ROUTE'}];
c.getAdminDraft=()=>({changes:{itineraryDay5:{items:old}}});
vm.runInContext(fs.readFileSync('itinerary-authority.js','utf8'),c);
const items=c.ITINERARY_AUTHORITY.getPendingDayItems('5');
assert(!items.some(x=>['hotel-luggage','grab-ha-spa'].includes(x.id)));
assert(items.find(x=>x.id==='hotel-checkout').details.includes('MY LUGGAGE NOTE'));
assert(items.find(x=>x.id==='hotel-checkout').details.includes('MY LUGGAGE ROUTE'));
assert(items.find(x=>x.id==='ha-spa').details.includes('MY GRAB NOTE'));
assert(items.find(x=>x.id==='ha-spa').details.includes('MY GRAB ROUTE'));
console.log('DAY5 MIGRATION SAFETY: PASS');
// An old-revision pending draft gains the newly introduced Easy Morning.
const oldDraft={items:old,masterRevision:'pre-day5-eight-card-master'};
c.getAdminDraft=()=>({changes:{itineraryDay5:oldDraft}});
const migrated=c.ITINERARY_AUTHORITY.getPendingDayItems('5');
assert(migrated.some(x=>x.id==='day5-easy-morning'),'old pending draft must gain Easy Morning');
assert(migrated.find(x=>x.id==='hotel-checkout').details.includes('MY LUGGAGE NOTE'));
// A current-revision deliberate removal must not be reversed.
c.getAdminDraft=()=>({changes:{itineraryDay5:{items:old,masterRevision:c.MASTER_ITINERARY_REVISION}}});
const currentDraft=c.ITINERARY_AUTHORITY.getPendingDayItems('5');
assert(!currentDraft.some(x=>x.id==='day5-easy-morning'),'current revision manual deletion must survive');
console.log('DAY5 PENDING DRAFT REVISION GUARD: PASS');
