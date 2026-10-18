/* A/D. PERSISTENCE (Guide) — real guide-authority.js + guide-sync-runtime.js vs fake Supabase. */
const assert=require('assert'),h=require('./harness');
function device(tables,hooks,shared){
  const client=h.fakeSupabase(tables,hooks);
  const c=h.makeContext({SUPABASE:{isConfigured:()=>true,getSession:async()=>{},getClient:()=>client},
    SYNC_CONFIG:{enabled:true,url:'https://staging.invalid',anonKey:'anon',tripId:'fixture-trip',tables:{guides:'trip_guides'}}});
  if(shared)c.localStorage=shared;
  ['storage-config.js','storage.js','save-sync-queue.js','guide-authority.js','guide-sync-runtime.js'].forEach(f=>h.load(c,f));
  return c;
}
const row=(t,id)=>(t.trip_guides||[]).find(r=>r.id===id);
(async()=>{
console.log('A. Persistence · Guide');
await h.test('Guide Save → checked local write → verified cloud write → queue cleared',async()=>{
  const t={trip_guides:[]},c=device(t);
  const r=await c.GUIDE_SYNC.saveNow('p1',{title:'Edited',address:'1 Test St',notes:['mine']});
  assert.strictEqual(r.ok,true);assert.strictEqual(r.label,'Saved & Synced ✓');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(row(t,'p1').payload)),{title:'Edited',address:'1 Test St',notes:['mine']});assert.strictEqual(c.SAVE_SYNC.pendingCount('guide'),0);
});
await h.test('local storage failure: Save reports failure, nothing queued, nothing claimed',async()=>{
  const t={trip_guides:[]},c=device(t);c.localStorage.failWrites=true;
  const r=await c.GUIDE_SYNC.saveNow('p1',{title:'X'});assert.strictEqual(r.ok,false);assert.strictEqual(row(t,'p1'),undefined);
});
await h.test('intentional blank field persists to the cloud (not resurrected by defaults)',async()=>{
  const t={trip_guides:[]},c=device(t);await c.GUIDE_SYNC.saveNow('p1',{phone:'123',website:''});
  assert.strictEqual(row(t,'p1').payload.website,'');
});
await h.test('two devices edit DIFFERENT fields from the same base: both edits survive (3-way merge)',async()=>{
  const t={trip_guides:[]},a=device(t),b=device(t);
  await a.GUIDE_SYNC.saveNow('p1',{title:'T0',phone:'P0'});await b.GUIDE_SYNC.syncNow();
  await a.GUIDE_SYNC.saveNow('p1',{title:'Title from A'});
  await b.GUIDE_SYNC.saveNow('p1',{phone:'Phone from B'});
  const p=row(t,'p1').payload;assert.strictEqual(p.title,'Title from A');assert.strictEqual(p.phone,'Phone from B');
});
await h.test('concurrent remote write between read and write is detected (CAS) and merged, never overwritten',async()=>{
  const t={trip_guides:[]};let raced=false;
  const hooks={beforeUpdate(name,filters,tables){if(raced)return;raced=true;const r=tables.trip_guides[0];r.payload=Object.assign({},r.payload,{hours:'from other device'});r.updated_at=new Date(Date.now()+5000).toISOString();}};
  const a=device(t,hooks);await a.GUIDE_SYNC.saveNow('p1',{title:'T0'});
  const r=await a.GUIDE_SYNC.saveNow('p1',{title:'T1'});
  assert.strictEqual(r.ok,true);const p=row(t,'p1').payload;assert.strictEqual(p.title,'T1');assert.strictEqual(p.hours,'from other device','concurrent edit must not be lost');
});
await h.test('a remote pull never clobbers a local edit that has not synced yet',async()=>{
  const t={trip_guides:[{id:'p1',trip_id:'fixture-trip',payload:{title:'remote'},updated_at:'2999-01-01T00:00:00.000Z'}]},c=device(t);
  c.navigator.onLine=false;await c.GUIDE_SYNC.saveNow('p1',{title:'local unsynced'});
  c.GUIDE_AUTHORITY.mergeRemote([{id:'p1',patch:{title:'remote'},updatedAt:'2999-01-01T00:00:00.000Z'}]);
  assert.strictEqual(c.GUIDE_AUTHORITY.records().p1.patch.title,'local unsynced');
});
await h.test('cloud that does not persist the write is detected: stays pending, label not Synced',async()=>{
  const t={trip_guides:[]},c=device(t,{dropWrite:true});
  const r=await c.GUIDE_SYNC.saveNow('p1',{title:'X'});assert.strictEqual(r.synced,false);assert.strictEqual(c.SAVE_SYNC.pendingCount('guide'),1);
});
await h.test('offline Guide Save is kept and delivered after reconnect',async()=>{
  const t={trip_guides:[]},c=device(t);c.navigator.onLine=false;
  const r=await c.GUIDE_SYNC.saveNow('p1',{title:'Offline edit'});assert.strictEqual(r.label,'Saved locally · Sync pending');
  c.navigator.onLine=true;await c.SAVE_SYNC.flushAll({});assert.strictEqual(row(t,'p1').payload.title,'Offline edit');assert.strictEqual(c.SAVE_SYNC.pendingCount(),0);
});
await h.test('Guide Save writes ONLY the fields the form edits (never wipes worth/notes/price/etc.), blanks included',()=>{
  const src=h.fs.readFileSync(h.path.join(h.ROOT,'guide-runtime.js'),'utf8');
  const fn=src.slice(src.indexOf('function saveGuideEdit'),src.indexOf('window.openGuideEdit='));
  let sent=null;const form={querySelector(){return {disabled:false}},insertBefore(){},firstChild:null};
  const ctx=h.vm.createContext({$:()=>form,FormData:function(){this.get=k=>({title:' T ',address:'',phone:'1',website:'',hours:'',description:'D',usefulInfo:'a\n\n b '})[k]},
    GUIDE_SYNC:{saveNow:(k,p)=>{sent=p;return Promise.resolve({ok:true,label:'x'})}},GUIDE_AUTHORITY:{},openGuideModal(){},document:{createElement(){return {setAttribute(){}}}},alert(){}});
  ctx.window=ctx;h.vm.runInContext(fn,ctx);h.vm.runInContext("saveGuideEdit('k')",ctx);
  assert.deepStrictEqual(Object.keys(sent).sort(),['address','description','hours','phone','title','usefulInfo','website']);
  assert.strictEqual(sent.address,'');assert.deepStrictEqual(JSON.parse(JSON.stringify(sent.usefulInfo)),['a','b']);
});
h.done('C. guide');
})();
