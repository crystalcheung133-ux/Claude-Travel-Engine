/* A. PERSISTENCE — durable pending queue (unit, real save-sync-queue.js, fake transport). */
const assert=require('assert'),h=require('./harness');
(async()=>{
console.log('A. Persistence · durable queue');
await h.test('local storage failure stops the save (no false success)',()=>{
  const c=h.baseline();c.localStorage.failWrites=true;
  const r=c.SAVE_SYNC.enqueue('booking','b1',{time:'10:00'},{});
  assert.strictEqual(r.ok,false);assert.strictEqual(r.reason,'storage-failed');assert.strictEqual(c.SAVE_SYNC.pendingCount(),0);
});
await h.test('offline: saved locally, sync pending, nothing lost, label is truthful',async()=>{
  const c=h.baseline();c.navigator.onLine=false;c.SAVE_SYNC.registerTransport('booking',async()=>({verified:true}));
  const r=await c.SAVE_SYNC.saveAndSync('booking','b1',{time:'10:00'},{commitLocal:()=>({ok:true})});
  assert.strictEqual(r.ok,true);assert.strictEqual(r.synced,false);assert.strictEqual(r.label,'Saved locally · Sync pending');
  assert.strictEqual(c.SAVE_SYNC.pendingCount('booking'),1);
});
await h.test('failed commitLocal never queues and never claims saved',async()=>{
  const c=h.baseline();const r=await c.SAVE_SYNC.saveAndSync('booking','b1',{},{commitLocal:()=>({ok:false,reason:'storage-failed'})});
  assert.strictEqual(r.ok,false);assert.strictEqual(c.SAVE_SYNC.pendingCount(),0);
});
await h.test('unverified or throwing transport keeps the entry; never reports Synced',async()=>{
  for(const t of [async()=>({verified:false}),async()=>{throw new Error('net')},async()=>({})]){
    const c=h.baseline();c.SAVE_SYNC.registerTransport('x',t);
    const r=await c.SAVE_SYNC.saveAndSync('x','r1',{v:1},{});
    assert.strictEqual(r.synced,false);assert.notStrictEqual(r.label,'Saved & Synced ✓');assert.strictEqual(c.SAVE_SYNC.pendingCount(),1);
    assert.strictEqual(c.SAVE_SYNC.list()[0].payload.v,1,'latest edit must survive failed sync');
  }
});
await h.test('verified transport shows Saved & Synced and clears only that mutation',async()=>{
  const c=h.baseline();let sent;c.SAVE_SYNC.registerTransport('x',async e=>{sent=e;return {verified:true,remoteVersion:3}});
  const r=await c.SAVE_SYNC.saveAndSync('x','r1',{v:1},{});
  assert.strictEqual(r.label,'Saved & Synced ✓');assert.strictEqual(c.SAVE_SYNC.pendingCount(),0);assert.ok(sent.mutationId);
});
await h.test('edit made while a write is in flight is NOT cleared by the older confirmation',async()=>{
  const c=h.baseline();let release;const gate=new Promise(r=>release=r);
  c.SAVE_SYNC.registerTransport('x',async e=>{await gate;return {verified:true,remoteVersion:2}});
  c.SAVE_SYNC.enqueue('x','r1',{v:1},{});
  const inflight=c.SAVE_SYNC.flushEntry('x','r1',{});
  c.SAVE_SYNC.enqueue('x','r1',{v:2},{});          // user edits again mid-flight
  release();const r=await inflight;
  assert.strictEqual(c.SAVE_SYNC.pendingCount(),1,'newer edit must remain queued');
  assert.strictEqual(c.SAVE_SYNC.list()[0].payload.v,2);assert.strictEqual(r.synced,false);
});
await h.test('retry never duplicates: repeated saves coalesce to one entry per record',()=>{
  const c=h.baseline();for(let i=0;i<25;i++)c.SAVE_SYNC.enqueue('booking','b1',{n:i},{});
  assert.strictEqual(c.SAVE_SYNC.pendingCount(),1);assert.strictEqual(c.SAVE_SYNC.list()[0].payload.n,24);
});
await h.test('pending queue survives a page reload (rehydrated from storage)',async()=>{
  const c=h.baseline();c.navigator.onLine=false;c.SAVE_SYNC.enqueue('guide','g1',{patch:{title:'T'}},{});
  const c2=h.makeContext();c2.localStorage=c.localStorage;['storage-config.js','storage.js','save-sync-queue.js'].forEach(f=>h.load(c2,f));
  assert.strictEqual(c2.SAVE_SYNC.pendingCount('guide'),1);
});
await h.test('conflict entries are kept (never dropped) and labelled for review',async()=>{
  const c=h.baseline();c.SAVE_SYNC.registerTransport('x',async()=>{const e=new Error('version_conflict_unresolved');e.conflict=true;throw e});
  const r=await c.SAVE_SYNC.saveAndSync('x','r1',{v:1},{});
  assert.strictEqual(r.label,'Saved locally · Needs review');assert.strictEqual(c.SAVE_SYNC.conflictCount(),1);
});
await h.test('no credentials are written to the queue',async()=>{
  const c=h.baseline();c.navigator.onLine=false;c.SAVE_SYNC.enqueue('timeline','itinerary',{days:['1']},{});
  assert.ok(!/pin|secret|service_role|token/i.test(c.localStorage.getItem(c.STORAGE_CONFIG.keys.pendingMutations)));
});
h.done('A. queue');
})();
