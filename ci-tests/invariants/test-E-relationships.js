/* D. GUIDE COVERAGE + relationships + C. next-stop inputs. Self-tests use GENERATED fixtures; the real dataset is
   checked with the same invariant function (a valid user edit can never trip it; only a broken relationship can). */
const assert=require('assert'),h=require('./harness'),{check}=require('./relationship-invariants');
function fixture(days,per){
  const PLACES={},ITINERARY_DATA={},DAY_LINKS={},BOOKINGS_DATA={};
  for(let d=1;d<=days;d++){ITINERARY_DATA[d]={items:[]};for(let i=0;i<per(d);i++){
    const id=`it-${d}-${i}`,pid=`pl-${d}-${i}`;PLACES[pid]={id:pid,cat:i%2?'SHOP':'RESTAURANTS'};
    const it={id,time:'',title:'t',placeId:pid};if(i===0){const bid=`bk-${d}`;BOOKINGS_DATA[bid]={id:bid,timelineItemId:id,day:String(d),dayId:'day'+d};it.bookingId=bid}
    ITINERARY_DATA[d].items.push(it);DAY_LINKS[pid]=[['Day '+d,`day.html?day=${d}#${id}`]]}}
  return {PLACES,ITINERARY_DATA,DAY_LINKS,BOOKINGS_DATA};
}
const J=v=>JSON.parse(JSON.stringify(v));
const vm=h.vm,fs=h.fs,path=h.path;
(async()=>{
console.log('D. Guide coverage & relationships');
await h.test('any valid generated itinerary (1–6 days, 0–12 items/day) satisfies every relationship invariant',()=>{
  for(const days of [1,2,4,6])for(const n of [1,3,12]){assert.deepStrictEqual(check(fixture(days,()=>n)),[],`days=${days} n=${n}`)}
});
await h.test('reordering / moving / deleting activities keeps links valid (relationships are by id, not position)',()=>{
  const f=fixture(3,()=>4);f.ITINERARY_DATA[1].items.reverse();assert.deepStrictEqual(check(f),[]);
  const moved=f.ITINERARY_DATA[1].items.shift();f.ITINERARY_DATA[2].items.splice(1,0,moved);
  // moving across days legitimately changes the day: Guide return links must be re-pointed to the item's day by the app
  const issues=check(f).map(x=>x[0]);assert.ok(issues.includes('guide-return-anchor-missing')||issues.includes('booking-day-mismatch'),'moving an item across days must be detected if links were not updated');
});
await h.test('detects an orphaned active Guide, but excludes archived/hidden/reference Guides',()=>{
  const f=fixture(2,()=>2);f.PLACES.orphan={id:'orphan',cat:'RESTAURANTS'};f.DAY_LINKS.orphan=[['Day 1','day.html?day=1#it-1-0']];
  assert.deepStrictEqual(check(f).map(x=>x[0]),['guide-orphaned']);
  for(const flag of [{archived:true},{hidden:true},{reference:true},{status:'archived'}]){const g=J(f);Object.assign(g.PLACES.orphan,flag);assert.deepStrictEqual(check(g),[],JSON.stringify(flag))}
});
await h.test('Shopping Directory legitimately reaches SHOP guides of its day; orphan SHOP guides on other days are flagged',()=>{
  const f=fixture(2,()=>1);f.ITINERARY_DATA[1].items.push({id:'shop-window',type:'shoppingWindow',title:'Shopping'});
  f.PLACES.s1={id:'s1',cat:'SHOP'};f.DAY_LINKS.s1=[['Day 1','day.html?day=1#shop-window']];assert.deepStrictEqual(check(f),[]);
  f.PLACES.s2={id:'s2',cat:'SHOP'};f.DAY_LINKS.s2=[['Day 2','day.html?day=2#it-2-0']];assert.deepStrictEqual(check(f).map(x=>x[0]),['guide-orphaned']);
});
await h.test('detects broken links, stale anchors, duplicate ids and duplicated booking activities',()=>{
  const f=fixture(2,()=>2);f.ITINERARY_DATA[1].items[1].placeId='nope';f.ITINERARY_DATA[2].items[1].id='it-1-0';
  f.ITINERARY_DATA[1].items.push({id:'dup',bookingId:'bk-1'});
  const kinds=new Set(check(f).map(x=>x[0]));['timeline-guide-link-broken','timeline-duplicate-id','booking-duplicated-activity'].forEach(k=>assert.ok(kinds.has(k),k));
});

const ctx=vm.createContext({globalThis:{}});vm.runInContext(fs.readFileSync(path.join(h.ROOT,'data.js'),'utf8'),ctx);
const real={PLACES:vm.runInContext('PLACES',ctx),ITINERARY_DATA:vm.runInContext('ITINERARY_DATA',ctx),DAY_LINKS:vm.runInContext('DAY_LINKS',ctx),BOOKINGS_DATA:vm.runInContext('BOOKINGS_DATA',ctx)};
await h.test('SHIPPED dataset: broken links / stale anchors / duplicates / booking-day mismatches (gating)',()=>{
  const f=check(real).filter(x=>x[0]!=='guide-orphaned');assert.deepStrictEqual(f.map(x=>x.join(': ')),[],'relationship failures');
});
// Orphaned-guide findings on the SHIPPED itinerary need an owner decision (is the Guide meant to be reachable?).
// They are reported loudly but are not auto-"fixed" (that would change itinerary content). Set
// STRICT_GUIDE_COVERAGE=1 to make them gating once decided; ci-tests/guide-coverage-exemptions.json lists
// Guides the owner has explicitly decided are reference-only.
const exemptions=new Set(JSON.parse(fs.readFileSync(path.join(h.ROOT,'ci-tests/guide-coverage-exemptions.json'),'utf8')).guideIds||[]);
const orphans=check(real).filter(x=>x[0]==='guide-orphaned'&&!exemptions.has(x[1].split(' ')[0]));
if(orphans.length){
  console.log('  WARN '+orphans.length+' active Guide(s) have a Timeline return link but NO Timeline entry point (owner decision needed):');
  orphans.forEach(o=>console.log('       - '+o[1]));
  if(process.env.STRICT_GUIDE_COVERAGE==='1')await h.test('SHIPPED dataset: no orphaned active Guides (strict)',()=>{throw new Error(orphans.length+' orphaned')});
}else console.log('  ok  SHIPPED dataset: every eligible active Guide is reachable from Timeline');
h.done('E. relationships');
})();
