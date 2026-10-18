const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const data=fs.readFileSync('data.js','utf8');const ctx={};vm.createContext(ctx);vm.runInContext(data+'\n;globalThis.__data={PLACES,BOOKINGS_DATA,ITINERARY_DATA,DAY_LINKS};',ctx);
const d=ctx.__data;const booking=d.BOOKINGS_DATA['bk-aum-d4'];const day=d.ITINERARY_DATA['4'];const items=day.items||day.timeline||[];
assert(booking,'missing aum booking');assert.equal(booking.time,'19:00');assert.equal(booking.day,4);assert.equal(booking.placeId,'aum-saigon');assert.equal(booking.bookingMethod,'WhatsApp');
assert(d.PLACES['aum-saigon'],'missing aum Guide');assert(d.DAY_LINKS['aum-saigon'],'missing Guide -> Timeline link');
const dinner=items.find(x=>x.id==='aum-d4');assert(dinner,'missing farewell dinner Timeline');assert.equal(dinner.bookingId,booking.id);assert.equal(dinner.placeId,booking.placeId);assert(dinner.guideIds.includes('aum-saigon'));
assert.equal(items.some(x=>x.id==='quince-d4'),false,'retired Quince Timeline still active');assert(!JSON.stringify(items).includes('Quince'),'stale Quince navigation');
const previous=items[items.indexOf(dinner)-1];assert(previous,'dinner needs preceding stop');assert(/aum/i.test(previous.route),'previous stop still routes to wrong dinner');
console.log('DAY4 AUM BOOKING / TIMELINE / GUIDE / ROUTE: PASS');
