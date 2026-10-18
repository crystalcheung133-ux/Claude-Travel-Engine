/* guide-sync-runtime.js — Engine 25.7.3 / RC29.136 Guide auto-sync.
   Save Guide writes locally first (checked + read back), enqueues a durable pending mutation in
   SAVE_SYNC, then writes to Supabase trip_guides with:
     - optimistic concurrency (conditional update on the remote updated_at the edit was based on),
     - three-way field merge (base = last synced patch) so another device's unrelated edits are kept,
     - read-back verification before the mutation is confirmed and the queue entry cleared.
   Guide is independent of any Timeline publication. */
(function(root){'use strict';
const cfg=root.SYNC_CONFIG||{},table=cfg.tables?.guides||'trip_guides';
const state={timer:null,inFlight:null,lastSyncAt:null};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';const t=JSON.stringify(v);return t===undefined?'null':t}
function configured(){return !!(cfg.enabled&&cfg.url&&cfg.anonKey&&cfg.tripId&&root.SUPABASE?.isConfigured?.()&&root.GUIDE_AUTHORITY)}
function db(){return root.SUPABASE.getClient()}
async function fetchOne(id){const q=await db().from(table).select('id,payload,updated_at').eq('trip_id',cfg.tripId).eq('id',id).maybeSingle();if(q.error)throw q.error;return q.data||null}
async function pull(){await root.SUPABASE.getSession();const q=await db().from(table).select('id,payload,updated_at').eq('trip_id',cfg.tripId);if(q.error)throw q.error;return q.data||[]}
/* three-way merge: remote fields stay unless THIS device changed them since base. */
function merge(base,local,remote){
  const out=Object.assign({},remote||{}),overwritten=[];
  Object.keys(local||{}).forEach(k=>{
    const changed=stable((base||{})[k])!==stable(local[k]);
    if(!changed&&(remote||{})[k]!==undefined)return;       // untouched here: keep remote value
    if(changed&&remote&&Object.prototype.hasOwnProperty.call(remote,k)&&stable(remote[k])!==stable((base||{})[k])&&stable(remote[k])!==stable(local[k]))overwritten.push({field:k,remote:clone(remote[k])});
    out[k]=clone(local[k]);
  });
  return {merged:out,overwritten};
}
/* transport: runs one verified cloud write for one Guide record */
async function transport(entry){
  if(!configured())return {verified:false,code:'GUIDE_SYNC_NOT_CONFIGURED'};
  await root.SUPABASE.getSession();
  const id=entry.recordId,rec=root.GUIDE_AUTHORITY.records()[id];
  if(!rec)return {verified:true,remoteVersion:null};          // record no longer exists locally
  const sentUpdatedAt=rec.updatedAt,local=clone(rec.patch||{}),base=rec.base?clone(rec.base.patch||{}):{};
  for(let attempt=0;attempt<4;attempt++){
    const remote=await fetchOne(id);
    const m=merge(base,local,remote&&remote.payload);
    const now=new Date().toISOString();let wrote;
    if(remote){
      wrote=await db().from(table).update({payload:m.merged,updated_at:now}).eq('trip_id',cfg.tripId).eq('id',id).eq('updated_at',remote.updated_at).select('id,updated_at');
    }else{
      wrote=await db().from(table).insert({id,trip_id:cfg.tripId,payload:m.merged,updated_at:now}).select('id,updated_at');
    }
    if(wrote.error){if(!remote&&/duplicate|23505/i.test(String(wrote.error.message||wrote.error.code)))continue;throw wrote.error}
    if(!wrote.data||!wrote.data.length)continue;               // stale: someone wrote in between → re-read & re-merge
    const back=await fetchOne(id);
    if(!back||stable(back.payload||{})!==stable(m.merged))throw new Error('GUIDE_REMOTE_VERIFY_FAILED');
    root.GUIDE_AUTHORITY.applySynced(id,m.merged,back.updated_at,sentUpdatedAt);
    if(m.overwritten.length)document.dispatchEvent(new CustomEvent('travelengine:guideconflict',{detail:{id,overwritten:m.overwritten}}));
    return {verified:true,remoteVersion:back.updated_at};
  }
  const e=new Error('version_conflict_unresolved');e.conflict=true;throw e;
}
if(root.SAVE_SYNC)root.SAVE_SYNC.registerTransport('guide',transport);
function enqueueRecord(id){const rec=root.GUIDE_AUTHORITY.records()[id];if(!rec)return {ok:false,reason:'missing'};return root.SAVE_SYNC.enqueue('guide',id,{patch:rec.patch,updatedAt:rec.updatedAt},{})}
/* Save one Guide patch: checked local write → durable enqueue → bounded verified sync. */
async function saveNow(key,patch,opts){
  const local=root.GUIDE_AUTHORITY.saveChecked(key,patch);
  if(!local.ok)return {ok:false,committed:false,reason:local.reason,label:root.SAVE_SYNC?root.SAVE_SYNC.labels.error:'Could not save'};
  if(!root.SAVE_SYNC)return {ok:true,committed:true,synced:false,label:'Saved ✓'};
  const q=enqueueRecord(key);
  if(!q.ok)return {ok:false,committed:true,persistedLocally:false,reason:q.reason,label:root.SAVE_SYNC.labels.error};
  if(!configured())return {ok:true,committed:true,synced:false,label:root.SAVE_SYNC.labels.pending};
  const r=await root.SAVE_SYNC.flushEntry('guide',key,{timeoutMs:(opts&&opts.timeoutMs)||8000});
  return {ok:true,committed:true,synced:!!r.synced,label:r.label,reason:r.reason};
}
/* Pull remote changes (never clobbers a record that has unsynced local edits) and queue any
   legacy local edit that was never confirmed (records without a synced base). */
async function syncNow(){
  if(!configured()||!navigator.onLine)return;
  if(state.inFlight)return state.inFlight;
  state.inFlight=(async()=>{try{
    const remote=await pull(),local=root.GUIDE_AUTHORITY.records(),remoteMap=new Map(remote.map(r=>[r.id,r]));
    Object.keys(local).forEach(id=>{const l=local[id],r=remoteMap.get(id);
      if(root.SAVE_SYNC.hasPending('guide',id))return;
      if(!l.base&&(!r||String(l.updatedAt||'')>String(r.updated_at||'')))enqueueRecord(id);
    });
    root.GUIDE_AUTHORITY.mergeRemote(remote.map(r=>({id:r.id,patch:r.payload||{},updatedAt:r.updated_at})));
    await root.SAVE_SYNC.flushAll({domain:'guide',timeoutMs:15000});
    state.lastSyncAt=new Date().toISOString();
    document.dispatchEvent(new CustomEvent('travelengine:guidesyncchanged',{detail:{lastSyncAt:state.lastSyncAt}}));
  }catch(e){console.warn('[Guide sync]',e?.message||e)}finally{state.inFlight=null}})();return state.inFlight;
}
function queueSync(delay=120){clearTimeout(state.timer);state.timer=setTimeout(syncNow,delay)}
document.addEventListener('travelengine:guidesaved',e=>{const k=e&&e.detail&&e.detail.key;if(k&&root.SAVE_SYNC)enqueueRecord(k);queueSync(20)});
window.addEventListener('online',()=>queueSync(50));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queueSync(100)});setInterval(()=>{if(document.visibilityState==='visible')syncNow()},30000);queueSync(0);
root.GUIDE_SYNC=Object.freeze({syncNow,queueSync,saveNow,isConfigured:configured,merge,getState:()=>({lastSyncAt:state.lastSyncAt})});
})(globalThis);
