const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={console};vm.createContext(c);vm.runInContext(fs.readFileSync('data.js','utf8')+'\n;globalThis.__X={P:PLACES,I:ITINERARY_DATA,B:BOOKINGS_DATA};',c);const {P,I,B}=c.__X;
assert(P['norah-spa-2']); assert.equal(P['norah-spa-2'].address,'74C Hai Bà Trưng, Sài Gòn, Ho Chi Minh City, Vietnam');
assert(B['bk-norah-spa-2']); assert.equal(B['bk-norah-spa-2'].whatsapp,'+84 70 544 0248');
assert.equal(B['bk-pizza4ps'].title,'Pizza 4P’s Hai Bà Trưng'); assert(B['bk-pizza4ps'].address.includes('151A–151B Hai Bà Trưng'));
const d2=I['2'].items; assert.deepEqual(Array.from(d2,x=>x.id),['com-tam-moc','garmentory','shopping-tqd','pizza4ps','norah-spa-2','vincom-new-playground','post-office','lune']);
assert.equal(d2.find(x=>x.id==='norah-spa-2').time,'14:00–16:00'); assert(d2.find(x=>x.id==='norah-spa-2').showShoppingDirectory===true);
assert.equal(I['3'].items.find(x=>x.id==='nara-spa').time,'17:15–19:15'); assert.equal(I['5'].items.find(x=>x.id==='ha-spa').time,'15:30–17:30');
console.log('VN ROUTE-FIRST SPA / 120-MIN PLANNING CONTRACT: PASS');
