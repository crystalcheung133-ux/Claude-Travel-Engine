const fs=require('fs'),assert=require('assert');
const pages=['index.html','day.html','itinerary.html','trip.html','expenses.html','moments.html','memory.html','place.html'];
const expected=["openGuideCategory('ATTRACTIONS')","openGuideCategory('DINING')","openGuideCategory('EXPERIENCES')","openGuideCategory('SHOP')","openGuideCategory('STAY')","openGuideCategory('WELLNESS')"];
for(const f of pages){const s=fs.readFileSync(f,'utf8');let pos=-1;for(const token of expected){const next=s.indexOf(token);assert(next>pos,`${f}: missing/out-of-order ${token}`);pos=next;}assert(!s.includes("openGuideCategory('ACTIVITIES')"),`${f}: legacy Activities menu remains`);}
const runtime=fs.readFileSync('guide-runtime.js','utf8');
assert(runtime.includes("return 'EXPERIENCES'"),'Activities/Experience must map to Experiences');
assert(runtime.includes("return 'WELLNESS'"),'Spa/Wellness must map to Wellness');
assert(runtime.includes("WELLNESS:['SPA','WELLNESS']"),'Wellness sources missing');
console.log('RC22 Guide taxonomy contract PASS');
