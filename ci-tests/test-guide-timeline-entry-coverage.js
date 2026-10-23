'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8')+';globalThis.__audit={CATEGORIES,ITINERARY_DATA,PLACES,DAY_LINKS};',ctx);
const {CATEGORIES,ITINERARY_DATA,PLACES,DAY_LINKS}=ctx.__audit;
const seen=new Set();
for(const day of Object.values(ITINERARY_DATA))for(const item of day.items||[]){
 if(item.placeId)seen.add(item.placeId);
 for(const id of item.guideIds||[])seen.add(id);
 for(const group of item.guideGroups||[])for(const id of group.guideIds||[])seen.add(id);
}
const ids=[...new Set(Object.values(CATEGORIES).flat().map(x=>x.key))];
for(const id of ids){assert(PLACES[id],`Missing Guide ${id}`);assert(seen.has(id),`Guide ${id} has no Timeline entry`);}
for(const id of ['workshop-coffee','mozaic-space','takashimaya'])assert(seen.has(id),`${id} missing Timeline entry`);
const html=fs.readFileSync(path.join(root,'day.html'),'utf8');
assert(html.includes('contextualGuideGroups')&&html.includes('openGuideGroupFromDay'), 'Timeline contextual guide buttons not rendered');
console.log(`GUIDE TIMELINE ENTRY COVERAGE: PASS (${ids.length} categorized Guides; Workshop Coffee, Mozaic Space, Takashimaya)`);
