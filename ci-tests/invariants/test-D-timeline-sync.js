/* A/C. PERSISTENCE + TIMELINE ORDER — real itinerary-authority.js + publication-runtime.js vs fake Supabase.
   All itineraries are generated: no assumption about any real itinerary content. */
const assert=require('assert'),h=require('./harness');
const J=v=>JSON.parse(JSON.stringify(v));
function master(days,perDay){return h.genItinerary(days,perDay)}
function rpcFactory(){return async(fn,args,tables)=>{tables.trip_publications=tables.trip_publications||[];
  const v=tables.trip_publications.reduce((m,r)=>Math.max(m,r.version),0)+1;
  tables.trip_publications.push({trip_id:args.p_trip_id,schema_version:args.p_schema_version,version:v,payload:J(args.p_payload)});return {data:[{version:v}],error:null}}}
function device(tables,m,opts){
  opts=opts||{};const hooks=Object.assign({rpc:rpcFactory()},opts.hooks||{});
  const client=h.fakeSupabase(tables,hooks);
  const ds={PLACES:{p:{}},CATEGORIES:{},GUIDE_ORDER:['p'],DAY_LINKS:{},FRIENDS:{},BOOKINGS_DATA:{},TRIP_DATA:{t:{}},TRIP_ORDER:['t'],ITINERARY_DATA:J(m)};
  const c=h.makeContext({ITINERARY_DATA:J(m),MASTER_ITINERARY_REVISION:opts.revision||'rev1',TRAVEL_DATASETS:ds,
    SUPABASE:{isConfigured:()=>true,getSession:async()=>{},getClient:()=>client},
    SYNC_CONFIG:{enabled:true,url:'https://staging.invalid',anonKey:'anon',tripId:'fixture-trip',schemaVersion:1,tables:{publications:'trip_publications'},rpc:{publishTrip:'publish_trip_snapshot'}},
    isAdminMode:()=>true,getAdminPublishCredential:()=>opts.locked?null:'in-memory-credential'});
  if(opts.storage)c.localStorage=opts.storage;
  ['storage-config.js','storage.js','save-sync-queue.js','itinerary-authority.js','publication-runtime.js'].forEach(f=>h.load(c,f));
  return c;
}
const edit=(c,day,items)=>c.ITINERARY_AUTHORITY.commitDayChangesChecked({['itineraryDay'+day]:{day,items}});
const last=t=>t.trip_publications[t.trip_publications.length-1];
(async()=>{
console.log('A/C. Persistence · Timeline order & sync');
await h.test('Timeline save fails loudly when local storage fails (draft must not be discarded)',()=>{
  const m=master(2,()=>3),c=device({},m);c.localStorage.failWrites=true;
  const r=edit(c,'1',m['1'].items);assert.strictEqual(r.ok,false);assert.strictEqual(r.reason,'storage-failed');
});
await h.test('add / delete / reorder persist and read back identically (any day/item counts)',()=>{
  for(const [days,n] of [[1,1],[3,5],[5,0],[2,9]]){
    const m=master(days,()=>n),c=device({},m);const items=J(m['1'].items);
    items.push({id:'new-1',time:'',title:'Added',details:'',route:'',type:'custom',nonPlace:true});
    if(items.length>2){items.splice(1,1);items.reverse()}
    const r=edit(c,'1',items);assert.ok(r.ok);
    assert.deepStrictEqual(c.ITINERARY_AUTHORITY.getDayOverrideItems('1').map(x=>x.id),items.map(x=>x.id));
  }
});
await h.test('intentional blanks (cleared time/notes) persist and are not refilled from master',()=>{
  const m=master(1,()=>3),c=device({},m);const items=J(m['1'].items);items[0].time='';items[0].details='';
  edit(c,'1',items);const got=c.ITINERARY_AUTHORITY.getDayOverrideItems('1');assert.strictEqual(got[0].time,'');assert.strictEqual(got[0].details,'');
});
await h.test('Timeline Save → automatic cloud write (no Publish) → read-back verified → queue cleared',async()=>{
  const t={},m=master(2,()=>4),c=device(t,m);const items=J(m['1'].items);items[2].time='21:05';items[2].title='Edited title';items.reverse();
  assert.ok(edit(c,'1',items).ok);
  const r=await c.TRIP_PUBLICATION.saveAndSyncTimeline(['1']);
  assert.strictEqual(r.synced,true);assert.strictEqual(r.label,'Saved & Synced ✓');assert.strictEqual(c.SAVE_SYNC.pendingCount('timeline'),0);
  const remote=last(t).payload.data.itineraryData['1'].items;assert.deepStrictEqual(remote.map(x=>x.id),items.map(x=>x.id));
  assert.strictEqual(remote.find(x=>x.id===items.find(y=>y.title==='Edited title').id).time,'21:05');
});
await h.test('Studio locked: edit stays "Sync pending", nothing published, no credential persisted',async()=>{
  const t={},m=master(1,()=>3),c=device(t,m,{locked:true});edit(c,'1',J(m['1'].items));
  const r=await c.TRIP_PUBLICATION.saveAndSyncTimeline(['1']);
  assert.strictEqual(r.synced,false);assert.strictEqual(r.label,'Saved locally · Sync pending');assert.ok(!t.trip_publications||!t.trip_publications.length);
  assert.ok(!/credential/.test(JSON.stringify([...c.localStorage.map.values()])));
});
await h.test('cloud that returns a version but did not persist the edit is detected (not Synced)',async()=>{
  const t={},m=master(1,()=>3);
  const c=device(t,m,{hooks:{rpc:async(fn,a,tb)=>{tb.trip_publications=tb.trip_publications||[];const p=J(a.p_payload);p.data.itineraryData['1'].items=[];tb.trip_publications.push({trip_id:a.p_trip_id,schema_version:1,version:1,payload:p});return {data:[{version:1}],error:null}}}});
  edit(c,'1',J(m['1'].items).reverse());const r=await c.TRIP_PUBLICATION.saveAndSyncTimeline(['1']);
  assert.strictEqual(r.synced,false);assert.strictEqual(c.SAVE_SYNC.pendingCount('timeline'),1);
});
await h.test('stale-write: another device published a different DAY meanwhile — it is preserved, not overwritten',async()=>{
  const t={},m=master(3,()=>3),a=device(t,m),b=device(t,m);
  const bi=J(m['2'].items);bi[0].title='B edited day 2';edit(b,'2',bi);await b.TRIP_PUBLICATION.saveAndSyncTimeline(['2']);
  const ai=J(m['1'].items);ai[1].time='07:11';edit(a,'1',ai);
  const r=await a.TRIP_PUBLICATION.saveAndSyncTimeline(['1']);assert.strictEqual(r.synced,true);
  const d=last(t).payload.data.itineraryData;assert.strictEqual(d['2'].items[0].title,'B edited day 2');assert.strictEqual(d['1'].items[1].time,'07:11');
});
await h.test('stale-write on the SAME day: edits to different items merge by id; same-field clash is reported, not silent',async()=>{
  const t={},m=master(1,()=>4),a=device(t,m),b=device(t,m);
  const bi=J(m['1'].items);bi[0].title='B title';bi[3].time='23:00';edit(b,'1',bi);await b.TRIP_PUBLICATION.saveAndSyncTimeline(['1']);
  const ai=J(m['1'].items);ai[1].details='A note';ai[3].time='22:00';edit(a,'1',ai);
  let clash=null;a.document.addEventListener('travelengine:timelineconflict',e=>clash=e.detail);
  const r=await a.TRIP_PUBLICATION.saveAndSyncTimeline(['1']);assert.strictEqual(r.synced,true);
  const items=last(t).payload.data.itineraryData['1'].items;
  assert.strictEqual(items[0].title,'B title','other device edit kept');assert.strictEqual(items[1].details,'A note','own edit kept');
  assert.ok(clash&&clash.conflicts.some(x=>x.field==='time'),'clash on the same field must be surfaced');
});
await h.test('DEPLOY: published edits are rebased onto a NEW master by item id (edits kept, deletes kept, new master items added)',()=>{
  const old=master(1,()=>4),c=device({},old);
  const edited=J(old['1'].items);edited[1].time='06:30';edited.splice(2,1);                    // user edit + user delete
  const deletedId=old['1'].items[2].id;
  const newMaster=J(old);newMaster['1'].items.push({id:'deploy-added',time:'20:00',title:'Added by deploy',type:'custom',nonPlace:true});
  newMaster['1'].items[0].title='Deploy fixed title';                                           // untouched by user → follows master
  const c2=device({},newMaster,{revision:'rev2'});
  const out=c2.ITINERARY_AUTHORITY.rebasePublishedItinerary({itineraryData:{'1':{items:edited}},itineraryBase:{'1':old['1'].items}});
  const ids=out['1'].items.map(x=>x.id);
  assert.ok(!ids.includes(deletedId),'deleted item must not be resurrected');assert.ok(ids.includes('deploy-added'));
  assert.strictEqual(out['1'].items.find(x=>x.id===old['1'].items[1].id).time,'06:30');assert.strictEqual(out['1'].items[0].title,'Deploy fixed title');
});
await h.test('snapshots with no itineraryBase are never rebased (cannot mask a newer master)',()=>{
  const m=master(1,()=>2),c=device({},m);assert.strictEqual(c.ITINERARY_AUTHORITY.rebasePublishedItinerary({itineraryData:{'1':{items:[]}}}),null);
});
await h.test('a synced override stops masking newer cloud data once the cloud version is hydrated',async()=>{
  const t={},m=master(1,()=>3),c=device(t,m);edit(c,'1',J(m['1'].items).reverse());await c.TRIP_PUBLICATION.saveAndSyncTimeline(['1']);
  assert.ok(c.ITINERARY_AUTHORITY.getDayOverrideItems('1'),'kept until hydrated');
  c.TRIP_SYNC={getState:()=>({hydrated:true,activeVersion:99})};assert.strictEqual(c.ITINERARY_AUTHORITY.getDayOverrideItems('1'),null);
});
h.done('D. timeline');
})();
