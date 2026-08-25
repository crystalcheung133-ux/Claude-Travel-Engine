const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('data.js','utf8')+'\n;globalThis.__X={I:ITINERARY_DATA,P:PLACES,B:BOOKINGS_DATA};',c);const {I,P,B}=c.__X;const d2=I['2'].items,ids=Array.from(d2,x=>x.id);
assert.deepEqual(ids,['com-tam-moc','garmentory','shopping-tqd','pizza4ps','qspa-d2','post-office','vincom-new-playground','lune']);
assert.equal(d2.find(x=>x.id==='post-office').time,'~16:30–17:10');assert(d2.find(x=>x.id==='post-office').route.includes('Vincom'));
const v=d2.find(x=>x.id==='vincom-new-playground');assert.equal(v.time,'~17:15–18:10');assert(v.route.includes('LÚNE'));assert(v.showShoppingDirectory===true);
assert(!ids.includes('ivoire'));assert(!ids.includes('hotel-reset'));assert.equal(B['bk-lune'].time,'18:45');assert(P['new-playground'].address.includes('Vincom Center Đồng Khởi'));
const sd=fs.readFileSync('shopping-directory-data.js','utf8');for(const x of ['PLANNED · Day 1 · Nguyễn Trãi Local Fashion Walk','PUSH PUSH · The New Playground','BLACKORP · Vincom Đồng Khởi','PLANNED · Day 4 · Thảo Điền Lifestyle','PLANNED · Day 5 · Last Shopping'])assert(sd.includes(x));
console.log('DAY 2 QSPA → SIGHTSEEING → VINCOM + SHOPPING CONTRACT: PASS');
