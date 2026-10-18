const fs=require('fs'),assert=require('assert'),vm=require('vm');
const raw=fs.readFileSync('data.js','utf8'),day=fs.readFileSync('day.html','utf8'),directory=fs.readFileSync('shopping-directory-data.js','utf8');
const c={};vm.createContext(c);vm.runInContext(raw+'\n;globalThis.__v={P:PLACES,B:BOOKINGS_DATA,I:ITINERARY_DATA,C:CATEGORIES,O:GUIDE_ORDER};',c);
const {P,B,I,C,O}=c.__v;
for(const id of ['norah-spa-2','nara-spa','mara-spa']){
 assert(!P[id],`retired ${id} resurfaced in places`);
 assert(!Array.from(O).includes(id),`retired ${id} resurfaced in guide order`);
 assert(!Array.from(C.SPA||[]).some(x=>x.key===id),`retired ${id} resurfaced in SPA category`);
 assert(!Object.values(B).some(x=>JSON.stringify(x).toLowerCase().includes(id)),`retired ${id} resurfaced in booking`);
 assert(!Object.values(I).some(x=>JSON.stringify(x).toLowerCase().includes(id)),`retired ${id} resurfaced in timeline`);
}
assert(P.qspa&&P['ha-spa']&&P['moc-huong'],'active spas missing');
assert(day.includes("String(item.id)==='shopping-tqd'?1:0"),'Fashion Walk first-stop index not independent');
const section=day.split("{label:'MORNING · LOCAL FASHION',stops:[")[1].split('],modes:')[0];
const seq=['11 Garmentory','BLACKORP','The Box Icon','AASTU','RUBIES Studio','Dalla Saigon','Lane Cì','Mì Workshop'];
let previous=-1;for(const name of seq){const i=section.indexOf("['"+name+"'");assert(i>previous,`Day 2 shopping order wrong: ${name}`);previous=i;}
const afternoon=day.split("{label:'AFTERNOON · VINCOM',stops:[")[1].split('],modes:')[0];
assert(!afternoon.includes('BLACKORP'),'BLACKORP duplicated in afternoon');
assert(directory.includes('<h3>BLACKORP</h3>')&&directory.includes('<h3>The Box Icon</h3>')&&directory.includes('<h3>AASTU</h3>'),'shopping directory cards not updated');
assert(section.includes('36 Đ. Trần Huy Liệu')&&section.includes('22 Đ. Trần Huy Liệu'),'route navigation addresses missing');
assert(directory.includes('36 Đ. Trần Huy Liệu')&&directory.includes('22 Đ. Trần Huy Liệu'),'directory addresses missing');
assert(!I['2'].items.find(x=>x.id==='vincom-new-playground').details.some(x=>x.includes('BLACKORP')),'afternoon timeline still includes BLACKORP');
console.log('RETIRED SPA ABSENCE + DAY 2 SHOPPING ROUTE: PASS');
