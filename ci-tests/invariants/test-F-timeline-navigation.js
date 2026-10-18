/* C. TIMELINE & NAVIGATION — executes the REAL buildDerivedNextStop() extracted from day.html against generated itineraries.
   Next Stop is derived from the current order; reorder/add/delete must recompute it. No itinerary content assumed. */
const assert=require('assert'),h=require('./harness');
const src=h.fs.readFileSync(h.path.join(h.ROOT,'day.html'),'utf8');
const a=src.indexOf('  function cleanStopTitle(value)'),b=src.indexOf('  function buildDerivedNextStop(item,index){'),e=src.indexOf('\n  function ',b+10);
assert(a>0&&b>a&&e>b,'next-stop block not found in day.html');
const block=src.slice(a,e);
function make(items,master){
  const ctx=h.vm.createContext({day:'1',workingItems:items,DAY_RENDER_DATA:{1:{items:master||items}},
    isTimelineRenderable:x=>!!(x&&x.title&&x.type!=='note'),timelineFinalAirport:()=>false,timelineInfoOnly:x=>x.type==='info',
    timelineHostDestination:x=>({routeQuery:x.address||''}),esc:s=>String(s),encodeURIComponent,RegExp,String,Number,JSON});
  h.vm.runInContext(block,ctx);return {build:(i)=>h.vm.runInContext('buildDerivedNextStop(workingItems['+i+'],'+i+')',ctx),ctx,set:v=>{ctx.workingItems=v}};
}
const mk=(n,tag)=>Array.from({length:n},(_,i)=>({id:`${tag||'s'}${i}`,title:`Stop ${tag||'s'}${i}`,address:`${i+1} ${tag||'s'} Street`,time:'10:00',route:'',type:'custom'}));
const title=html=>(html.match(/route-next-title">([^<]*)</)||[])[1];
const dest=html=>{const m=html.match(/destination=([^&"]*)/);return m&&decodeURIComponent(m[1])};
const orig=html=>{const m=html.match(/origin=([^&"]*)/);return m&&decodeURIComponent(m[1])};
(async()=>{
console.log('C. Timeline & navigation');
await h.test('Next Stop and Directions target the actual next item, for any item count',()=>{
  for(const n of [2,3,7,15]){const items=mk(n),t=make(items);
    for(let i=0;i<n-1;i++){const out=t.build(i);assert.strictEqual(title(out),`Stop s${i+1}`);assert.strictEqual(dest(out),`${i+2} s Street`);assert.strictEqual(orig(out),`${i+1} s Street`)}
    assert.strictEqual(t.build(n-1),'','the last stop has no next stop (no invented destination)')}
});
await h.test('REORDER recomputes Next Stop and navigation destination (no stale link)',()=>{
  const items=mk(5),t=make(items,items.slice());const moved=items.splice(3,1)[0];items.splice(0,0,moved);t.set(items);
  for(let i=0;i<items.length-1;i++){const out=t.build(i);assert.strictEqual(title(out),`Stop ${items[i+1].id}`);assert.strictEqual(dest(out),items[i+1].address)}
  assert.strictEqual(title(t.build(0)),'Stop s0','first-stop navigation points at the actual second item');
});
await h.test('DELETE and ADD recompute the neighbour relationship',()=>{
  const items=mk(4),t=make(items,items.slice());
  const del=items.slice();del.splice(1,1);t.set(del);assert.strictEqual(title(t.build(0)),'Stop s2');
  const add=items.slice();add.splice(1,0,{id:'new',title:'Brand new',address:'9 New Rd',type:'custom'});t.set(add);assert.strictEqual(title(t.build(0)),'Brand new');assert.strictEqual(dest(t.build(0)),'9 New Rd');
});
await h.test('stale route estimates are not trusted after a reorder (published next differs from current next)',()=>{
  const master=mk(3);master[0].route='🚶 Walk ~4 min · 🚕 Grab ~3 min';
  const same=make(JSON.parse(JSON.stringify(master)),master);assert.ok(/Walk/.test(same.build(0)),'estimate trusted while order matches');
  const reordered=JSON.parse(JSON.stringify(master));reordered.splice(1,0,reordered.splice(2,1)[0]);
  const t=make(reordered,master);assert.ok(!/Walk/.test(t.build(0))&&/Live ETA/.test(t.build(0)),'estimate for a different next stop must not be shown');
});
await h.test('item without a navigable address: handled explicitly (no invented origin/destination)',()=>{
  const items=mk(3);items[1].address='';const t=make(items);const out=t.build(0);
  assert.strictEqual(title(out),'Stop s1');assert.ok(!/destination=/.test(out),'no destination invented when next stop has no address');
  const out2=t.build(1);assert.strictEqual(orig(out2),null,'no origin invented; Maps uses the device location');
});
h.done('F. navigation');
})();
