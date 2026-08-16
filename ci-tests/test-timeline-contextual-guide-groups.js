const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('data.js','utf8'); const ctx={}; vm.createContext(ctx); vm.runInContext(src+'\n;globalThis.__x={PLACES,ITINERARY_DATA};',ctx);
const I=ctx.__x.ITINERARY_DATA, P=ctx.__x.PLACES;
function item(day,id){return I[String(day)].items.find(x=>x.id===id)}
for(const [day,id,labels] of [
  [1,'post-office',['📮 Post Office','📚 Book Street','⛪ Cathedral']],
  [1,'nha-suga',['☕ Cafe Apartments','🫧 Headspa']],
  [4,'pink-church',['🩷 Pink Church','☕ Cộng']],
  [4,'thao-dien-open-list',['🛍 Browse','🥐 Bakes','🌿 Spa Picks']]
]){
 const x=item(day,id); assert(x,`${id} missing`); assert.deepStrictEqual(Array.from(x.guideGroups||[],g=>g.label),labels,`${id} contextual labels`);
 for(const g of x.guideGroups) for(const gid of g.guideIds) assert(P[gid],`${id} guide group dangling: ${gid}`);
}
assert.strictEqual(item(1,'nha-suga').bookingId,'bk-nha-suga','Headspa booking must remain direct');
const html=fs.readFileSync('day.html','utf8'); assert(html.includes('contextualGuideGroups'),'Day renderer must support contextual guide groups');
console.log('TIMELINE CONTEXTUAL GUIDE GROUPS: PASS');
