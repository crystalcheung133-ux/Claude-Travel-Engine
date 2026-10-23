#!/usr/bin/env node
/* RC29.138 GATING approved-itinerary contract for Days 2, 4 and 5 (shipped Master + Booking + Guide wiring).
   Encodes exactly what the owner approved; it is not a snapshot of whatever happens to be in data.js. */
const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),c);
const D=JSON.parse(JSON.stringify(c.TRAVEL_DATASETS)),I=D.ITINERARY_DATA,B=D.BOOKINGS_DATA,P=D.PLACES,L=D.DAY_LINKS; // JSON clone: avoids cross-realm deepStrictEqual prototype mismatch
const get=(d,id)=>I[d].items.find(x=>x.id===id);const ids=d=>I[d].items.map(x=>x.id);
let n=0;const eq=(a,b,m)=>{n++;assert.deepStrictEqual(a,b,m);};const ok=(v,m)=>{n++;assert.ok(v,m);};
// ---- Day 1
ok(get('1','airport-transfer').bookingId==='bk-transfer-in','transfer booking retained');
ok(get('1','airport-transfer').guideIds.includes('fusion'),'hotel guide on transfer card');
ok(require('fs').readFileSync(path.join(root,'day.html'),'utf8').includes('🏨 Hotel Booking'),'hotel booking action on transfer card');
// ---- Day 2
eq(ids('2'),['running-bean','shopping-tqd','quan-cua-ca-mau-d2','qspa-d2','post-office','vincom-new-playground','rue-miche-ledition','lune'],'Day 2 order');
eq(get('2','running-bean').time,'09:00','Running Bean 09:00');
eq(get('2','shopping-tqd').guideIds[0],'garmentory','Day 2 shopping starts at 11 Garmentory');
ok(/Garmentory/.test(get('2','shopping-tqd').title)&&/Tr[ầa]n Quang Di[ệe]u/.test(get('2','shopping-tqd').title),'11 Garmentory / Trần Quang Diệu shopping');
eq(get('2','quan-cua-ca-mau-d2').time,'13:00–13:45','Quán Cua Cà Mau 13:00–13:45');
ok(/Grab/.test(get('2','quan-cua-ca-mau-d2').route)&&/Qspa/.test(get('2','quan-cua-ca-mau-d2').route),'Grab to Qspa after lunch');
ok(get('2','qspa-d2').time.startsWith('14:30'),'Qspa 14:30');
ok(!ids('2').includes('pizza4ps'),'no Day 2 Pizza Timeline card');
// ---- Day 4
eq(ids('4'),['pink-church','push-push-d4','pizza4ps','thao-dien-open-list','moc-huong-d4','complex-0123-d4','aum-d4'],'Day 4 order');
eq(get('4','pink-church').time,'09:00–09:40','Pink Church starts 09:00');
eq(get('4','pink-church').guideIds,['pink-church','cong'],'Pink Church + Cộng combined into one stop');
eq(get('4','pink-church').placeId,'pink-church','Pink Church card navigates to Pink Church');
ok(/OHQUAO/.test(get('4','pink-church').route),'Pink Church -> OHQUAO');
eq(get('4','push-push-d4').placeId,'ohquao-local-edit','OHQUAO Local Edit navigation');
ok(/Grab/.test(get('4','push-push-d4').route)&&/Pizza 4P/.test(get('4','push-push-d4').route),'OHQUAO -> Grab -> Pizza 4P’s');
eq(get('4','push-push-d4').time,'09:45–10:25','OHQUAO visit time');
eq(get('4','pizza4ps').time,'11:00','Pizza 11:00');
eq(B['bk-pizza4ps'].day,4,'Pizza booking is Day 4');eq(B['bk-pizza4ps'].time,'11:00','Pizza booking 11:00');
eq(B['bk-pizza4ps'].address,'44 Trần Ngọc Diện, Thảo Điền, Hồ Chí Minh, Vietnam','Pizza booking branch/address');
eq(P.pizza4ps.address,'44 Trần Ngọc Diện, Thảo Điền, Hồ Chí Minh, Vietnam','Pizza guide address');
eq(get('4','thao-dien-open-list').guideIds,['in-the-mood-d4','grade-b-d4','youon-thao-dien','vina-design-thao-dien','dakao-quartier','aurora-saigon','wicky-candle','ohquao'],'In The Mood → Grade B → YouOn → Vina → dakao → Aurora → Wicky → OHQUAO');
eq(get('4','moc-huong-d4').time,'15:45–17:45','Mộc Hương 15:45–17:45');
eq(get('4','complex-0123-d4').time,'17:45–18:40','0123 Complex 17:45–18:40');
ok(get('4','aum-d4').time.startsWith('19:00'),'AUM 19:00');
['heartburn','kokonic','dalaland','mieu'].forEach(k=>ok(!Object.keys(P).some(x=>x.includes(k))&&!JSON.stringify(I['4']).includes(k),'no standalone '+k+' activity/guide'));
eq(L['ohquao-local-edit'],[['Day 4','day.html?day=4#push-push-d4']],'OHQUAO Local Edit Guide has Day 4 link');
ok(!/Pizza 4P[^"]{0,30}Hai B[àa] Tr[ưu]ng/.test(JSON.stringify(P['currency-guide'])),'Currency Guide has no Pizza 4P’s Hai Bà Trưng reference');
ok(!/Day 2[^"]{0,60}Hai B[àa] Tr[ưu]ng lunch/.test(JSON.stringify(P['currency-guide'])),'Currency Guide Day 2 lunch wording removed');
// ---- Day 5
eq(ids('5'),['day5-easy-morning','day5-free-browse','hotel-checkout','bep-me-in','fine-arts','ha-spa','day5-optional-dinner','airport-departure'],'Day 5: exactly eight cards');
eq(get('5','day5-easy-morning').time,'AM','Easy Morning AM');eq(get('5','day5-free-browse').time,'AM','Shopping Nearby AM');
eq(get('5','hotel-checkout').time,'12:00','Check-out 12:00');eq(get('5','bep-me-in').time,'12:30','Bếp Mẹ Ỉn 12:30');
eq(get('5','fine-arts').time,'PM','Fine Arts PM');eq(get('5','ha-spa').time,'15:30','Hạ Spa 15:30');
eq(get('5','airport-departure').time,'18:00','Airport 18:00');
ok(JSON.stringify(get('5','day5-free-browse').guideGroups||[]).includes('"marou"'),'Shopping Nearby carries the Marou Guide');
['running-bean','hotel-luggage','grab-ha-spa'].forEach(id=>ok(!ids('5').includes(id),'no obsolete Day 5 '+id));
// ---- Booking time authority is unchanged (owner decision): bookings keep deciding displayed time.
ok(B['bk-aum-d4'].time==='19:00'&&!B['bk-quan-cua-ca-mau'],'Booking times remain the display authority');
console.log('APPROVED ITINERARY: PASS ('+n+' checks)');
