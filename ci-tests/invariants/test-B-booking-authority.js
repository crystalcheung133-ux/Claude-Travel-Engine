/* B. BOOKING AUTHORITY — real booking-authority.js + booking-sync-runtime.js against a fake edge function. */
const assert=require('assert'),h=require('./harness');
function bookingCtx(revision,master,shared){
  const c=h.makeContext({BOOKINGS_DATA:JSON.parse(JSON.stringify(master))});
  if(shared)c.localStorage=shared;
  c.TRIP_CONFIG.bookingMasterRevision=revision;
  ['storage-config.js','storage.js','booking-authority.js'].forEach(f=>h.load(c,f));return c;
}
const master=(over)=>({b1:Object.assign({id:'b1',type:'dining',status:'pending',date:'2026-01-10',time:'10:00',venue:'Venue A',notes:'master note',dayId:'day1'},over||{}),
  b2:{id:'b2',type:'dining',status:'confirmed',date:'2026-01-11',time:'18:00',venue:'Venue B',notes:'',dayId:'day2'}});
(async()=>{
console.log('B. Booking authority');
await h.test('saved Booking edit is complete: unrelated fields + intentional blanks persist',()=>{
  const c=bookingCtx(1,master());
  const r=c.BOOKING_AUTHORITY.save('b1',{time:'11:30',venue:'',notes:'my manual note'},c.BOOKINGS_DATA);
  assert.ok(r.ok);const got=c.BOOKING_AUTHORITY.get('b1',c.BOOKINGS_DATA);
  assert.strictEqual(got.time,'11:30');assert.strictEqual(got.venue,'','blank must persist');assert.strictEqual(got.notes,'my manual note');assert.strictEqual(got.date,'2026-01-10');
});
await h.test('storage failure is reported, not swallowed',()=>{
  const c=bookingCtx(1,master());c.localStorage.failWrites=true;
  const r=c.BOOKING_AUTHORITY.save('b1',{time:'11:30'},c.BOOKINGS_DATA);assert.strictEqual(r.ok,false);
});
await h.test('DEPLOY: manual time/venue/notes edits survive a new master revision; untouched fields follow the new master',()=>{
  const a=bookingCtx(1,master());a.BOOKING_AUTHORITY.save('b1',{time:'11:30',venue:'',notes:'my manual note'},a.BOOKINGS_DATA);
  const newMaster=master({time:'10:15',venue:'Venue A2',notes:'new master note',date:'2026-01-12',extra:'added by deploy'});
  const b=bookingCtx(2,newMaster,a.localStorage);const got=b.BOOKING_AUTHORITY.get('b1',b.BOOKINGS_DATA);
  assert.strictEqual(got.time,'11:30','edited time must survive deploy');assert.strictEqual(got.venue,'','edited blank must survive deploy');
  assert.strictEqual(got.notes,'my manual note','manual Notes must survive deploy');
  assert.strictEqual(got.date,'2026-01-12','untouched date follows new master');assert.strictEqual(got.extra,'added by deploy');
});
await h.test('DEPLOY: deleted booking stays deleted — old defaults do not resurrect it',()=>{
  const a=bookingCtx(1,master());assert.ok(a.BOOKING_AUTHORITY.remove('b2',a.BOOKINGS_DATA).ok);
  const b=bookingCtx(2,master(),a.localStorage);assert.strictEqual(b.BOOKING_AUTHORITY.get('b2',b.BOOKINGS_DATA),null);assert.ok(b.BOOKING_AUTHORITY.get('b1',b.BOOKINGS_DATA));
});
await h.test('a legacy unstamped override cannot roll an authoritative status backwards',()=>{
  const a=bookingCtx(1,master());
  a.localStorage.setItem(a.STORAGE_CONFIG.keys.bookingOverrides,JSON.stringify({version:1,overrides:{b2:{id:'b2',status:'pending'}},deletedIds:[]}));
  const b=bookingCtx(1,master(),a.localStorage);assert.strictEqual(b.BOOKING_AUTHORITY.get('b2',b.BOOKINGS_DATA).status,'confirmed');
});
// ---- transport against fake edge function ----
function syncCtx(db,opts){
  opts=opts||{};
  const c=bookingCtx(1,master());
  Object.assign(c,{SYNC_CONFIG:{url:'https://staging.invalid',anonKey:'anon',tripId:'fixture-trip'},
    BOOKING_PERMISSIONS:{mode(){return 'collaborative'},currentPartyId(){return 'p1'},canEdit(){return true}}});
  c.TRIP_CONFIG.bookingManagement={sync:{enabled:true,accessToken:'t'}};
  c.__calls=[];c.__bump=opts.bump||0;
  c.fetch=async(url,o)=>{
    assert.ok(/staging\.invalid/.test(url),'tests must never reach a real host');
    const b=JSON.parse(o.body);c.__calls.push(b.action||'mutate');
    if(b.action==='read'){const rows=Object.values(db).filter(r=>!b.bookingId||r.booking_id===b.bookingId);return {ok:true,status:200,json:async()=>({ok:true,rows:JSON.parse(JSON.stringify(rows))})}}
    const m=b.mutation,p=m.payload,cur=db[m.recordId];
    if(c.__bump>0){c.__bump--;if(cur)cur.version+=1;return {ok:false,status:409,json:async()=>({ok:false,code:'version_conflict'})}}
    if(cur&&m.operation!=='create'&&m.baseVersion!==cur.version)return {ok:false,status:409,json:async()=>({ok:false,code:'version_conflict'})};
    const row={booking_id:m.recordId,version:(cur?cur.version:0)+1,booking_date:p.date,booking_time:opts.keepOldTime&&cur?cur.booking_time:p.time,status:p.status,notes:p.notes,payload:opts.keepOldTime&&cur?cur.payload:p};
    db[m.recordId]=row;return {ok:true,status:200,json:async()=>({ok:true,record:JSON.parse(JSON.stringify(row))})};
  };
  ['save-sync-queue.js'].forEach(f=>h.load(c,f));h.load(c,'booking-sync-runtime.js');return c;
}
const seed=()=>({b1:{booking_id:'b1',version:4,booking_date:'2026-01-10',booking_time:'10:00:00',status:'pending',notes:'cloud note',payload:{id:'b1',bookingId:'b1',time:'10:00',date:'2026-01-10',notes:'cloud note',status:'pending'}}});
async function saveVia(c,rec){c.SAVE_SYNC.enqueue('booking',rec.id,rec,{});return c.SAVE_SYNC.flushEntry('booking',rec.id,{timeoutMs:2000})}
await h.test('Booking Save → Supabase → read-back verified (time, status, notes) → queue cleared',async()=>{
  const db=seed(),c=syncCtx(db);
  const r=await saveVia(c,{id:'b1',bookingId:'b1',time:'11:45',date:'2026-01-10',status:'confirmed',notes:'keep my notes\nline2'});
  assert.strictEqual(r.synced,true);assert.strictEqual(r.label,'Saved & Synced ✓');
  assert.strictEqual(db.b1.booking_time,'11:45');assert.strictEqual(db.b1.status,'confirmed');assert.strictEqual(c.SAVE_SYNC.pendingCount(),0);
  assert.ok(c.__calls.filter(x=>x==='read').length>=2,'must read back after write');
});
await h.test('server that silently keeps the OLD time is detected: not Synced, edit kept pending',async()=>{
  const db=seed(),c=syncCtx(db,{keepOldTime:true});
  const r=await saveVia(c,{id:'b1',bookingId:'b1',time:'11:45',date:'2026-01-10',status:'pending',notes:'cloud note'});
  assert.strictEqual(r.synced,false);assert.strictEqual(c.SAVE_SYNC.pendingCount(),1);assert.strictEqual(c.SAVE_SYNC.list()[0].payload.time,'11:45');
});
await h.test('stale write (simultaneous edit): refreshes base version and retries, never blind-overwrites',async()=>{
  const db=seed(),c=syncCtx(db,{bump:1});
  const r=await saveVia(c,{id:'b1',bookingId:'b1',time:'12:00',date:'2026-01-10',status:'pending',notes:'cloud note'});
  assert.strictEqual(r.synced,true);assert.strictEqual(db.b1.version,6,'one concurrent bump + one write');
});
await h.test('persistent version conflict is not reported as synced and keeps the local edit',async()=>{
  const db=seed(),c=syncCtx(db,{bump:99});
  const r=await saveVia(c,{id:'b1',bookingId:'b1',time:'12:00',date:'2026-01-10',status:'pending',notes:'mine'});
  assert.strictEqual(r.synced,false);assert.strictEqual(c.SAVE_SYNC.list()[0].payload.notes,'mine');
});
await h.test('retry after a failed attempt creates exactly one remote record',async()=>{
  const db={},c=syncCtx(db);c.navigator.onLine=false;
  const rec={id:'bNew',bookingId:'bNew',time:'09:00',date:'2026-01-10',status:'pending',notes:''};
  await saveVia(c,rec);assert.strictEqual(Object.keys(db).length,0);
  c.navigator.onLine=true;await c.SAVE_SYNC.flushAll({});await c.SAVE_SYNC.flushAll({});
  assert.strictEqual(Object.keys(db).length,1);assert.strictEqual(db.bNew.version,1);assert.strictEqual(c.SAVE_SYNC.pendingCount(),0);
});
h.done('B. booking');
})();
