const fs=require('fs'),assert=require('assert'),vm=require('vm');
let s=fs.readFileSync('data.js','utf8')+'\n;globalThis.__x={PLACES,CATEGORIES,GUIDE_ORDER,DAY_LINKS,BOOKINGS_DATA,ITINERARY_DATA};';let c={};vm.createContext(c);vm.runInContext(s,c);const {PLACES,GUIDE_ORDER,DAY_LINKS,BOOKINGS_DATA,ITINERARY_DATA}=c.__x;
const retired=['cooking','moc-kim','tinh-thuc','quince']; for(const k of retired){assert(!PLACES[k],`retired Guide remains: ${k}`);assert(!GUIDE_ORDER.includes(k),`retired Guide order remains: ${k}`)}
for(const k of ['kocochi','cu-chi','nara-spa','oc-dao']) assert(PLACES[k],`new Guide missing: ${k}`);
for(const k of ['bk-cooking','bk-moc-kim','bk-tinh-thuc','bk-quince']) assert(!BOOKINGS_DATA[k],`retired booking remains: ${k}`);
for(const k of ['bk-kocochi','bk-cu-chi','bk-nara']) assert(BOOKINGS_DATA[k],`new booking missing: ${k}`);
assert.equal(BOOKINGS_DATA['bk-pizza4ps'].day,4);assert.equal(BOOKINGS_DATA['bk-pizza4ps'].time,'13:00');assert.equal(BOOKINGS_DATA['bk-lune'].time,'18:30');assert.equal(BOOKINGS_DATA['bk-moc-huong'].day,2);assert.equal(BOOKINGS_DATA['bk-little-bear'].day,2);assert.equal(BOOKINGS_DATA['bk-kocochi'].day,4);
const ids=d=>ITINERARY_DATA[String(d)].items.map(x=>x.id);
assert.equal(JSON.stringify(ids(2)),JSON.stringify(['running-bean','pink-church','push-push','quan-thuy','thao-dien-walk-1','bakes','moc-huong','thao-dien-walk-2','little-bear']));
assert.equal(JSON.stringify(ids(3)),JSON.stringify(['cu-chi','man-moi','war-museum','nara-spa','oc-dao']));
assert.equal(JSON.stringify(ids(4)),JSON.stringify(['com-tam-moc','garmentory','shopping-tqd','pizza4ps','shopping-nguyen-trai','kocochi','lune']));
for(const d of [2,3,4]){const a=ITINERARY_DATA[String(d)].items;for(let i=0;i<a.length-1;i++)assert(a[i].route&&a[i].route.trim(),`Day ${d} missing Next Leg after ${a[i].id}`)}
assert(ITINERARY_DATA['3'].items[0].details.join(' ').includes('14:30'), 'Cu Chi anchor missing');
assert(ITINERARY_DATA['2'].items.find(x=>x.id==='quan-thuy').route.includes('OHQUAO'),'Day 2 Thảo Điền transfer must name OHQUAO start');
assert(ITINERARY_DATA['4'].items.find(x=>x.id==='pizza4ps').route.includes('LIBÉ Nguyễn Trãi'),'Day 4 afternoon transfer must name LIBÉ start');
assert(BOOKINGS_DATA['bk-man-moi']&&BOOKINGS_DATA['bk-man-moi'].timelineItemId==='man-moi','Mặn Mòi booking/deep-link missing');
for(const id of ['bk-kocochi','bk-nara','bk-moc-huong'])assert(BOOKINGS_DATA[id].timelineItemId,`${id} own-card timeline link missing`);
const sd=fs.readFileSync('shopping-directory-data.js','utf8');for(const stale of ['Day 3 · Thảo Điền','Day 4 · Phú Nhuận 第一輪','Tỉnh Thức Spa → Dalla','Grab to Quince'])assert(!sd.includes(stale),`stale shopping route remains: ${stale}`);
console.log('D2–D4 ITINERARY RECONCILIATION: PASS');
