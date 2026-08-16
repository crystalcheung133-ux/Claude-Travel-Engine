const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('data.js','utf8')+'\n;globalThis.__X={I:ITINERARY_DATA,B:BOOKINGS_DATA};',c);const {I,B}=c.__X,ids=d=>Array.from(I[String(d)].items,x=>x.id);
assert.deepEqual(ids(2),['com-tam-moc','garmentory','shopping-tqd','pizza4ps','norah-spa-2','post-office','ivoire','hotel-reset','lune']);
for(const [id,time,event] of [['bk-pizza4ps','12:45','pizza4ps'],['bk-norah-spa-2','14:00','norah-spa-2'],['bk-lune','18:30','lune']]){assert(B[id]);assert.equal(B[id].day,2);assert.equal(B[id].date,'2026-10-31');assert.equal(B[id].time,time);assert.equal(B[id].timelineItemId,event)}
assert.deepEqual(ids(4),['running-bean','pink-church','push-push','thao-dien-open-list']); assert(I['4'].items[3].details.some(x=>x.includes('120 分鐘')));
const sd=fs.readFileSync('shopping-directory-data.js','utf8');assert(sd.includes('Day 1 · Nguyễn Trãi Morning Walk'));assert(sd.includes('Day 2 · Morning Run'));assert(sd.includes('Day 4 · Thảo Điền'));
console.log('D1/D2/D4 CANONICAL RECONCILIATION: PASS');
