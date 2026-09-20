/* guide-sync-runtime.js — Engine 25.7.2 Guide auto-sync.
   Guide is independent of Timeline publication: Save Guide writes locally first,
   then syncs per-place overrides across devices in the background. */
(function(root){'use strict';
const cfg=root.SYNC_CONFIG||{},table=cfg.tables?.guides||'trip_guides';
const state={timer:null,inFlight:null,lastSyncAt:null};
function configured(){return !!(cfg.enabled&&cfg.url&&cfg.anonKey&&cfg.tripId&&root.SUPABASE?.isConfigured?.()&&root.GUIDE_AUTHORITY)}
async function pull(){await root.SUPABASE.getSession();const q=await root.SUPABASE.getClient().from(table).select('id,payload,updated_at').eq('trip_id',cfg.tripId);if(q.error)throw q.error;return q.data||[]}
async function push(records){if(!records.length)return;await root.SUPABASE.getSession();const q=await root.SUPABASE.getClient().from(table).upsert(records,{onConflict:'id'});if(q.error)throw q.error}
async function syncNow(){
 if(!configured()||!navigator.onLine)return;
 if(state.inFlight)return state.inFlight;
 state.inFlight=(async()=>{try{
   const remote=await pull(),local=root.GUIDE_AUTHORITY.records();
   const remoteMap=new Map(remote.map(r=>[r.id,r]));const toPush=[];
   Object.keys(local).forEach(id=>{const l=local[id],r=remoteMap.get(id);if(!r||String(l.updatedAt||'')>String(r.updated_at||''))toPush.push({id,trip_id:cfg.tripId,payload:l.patch||{},updated_at:l.updatedAt})});
   await push(toPush);
   const rows=toPush.length?await pull():remote;
   root.GUIDE_AUTHORITY.mergeRemote(rows.map(r=>({id:r.id,patch:r.payload||{},updatedAt:r.updated_at})));
   state.lastSyncAt=new Date().toISOString();
   document.dispatchEvent(new CustomEvent('travelengine:guidesyncchanged',{detail:{lastSyncAt:state.lastSyncAt}}));
 }catch(e){console.warn('[Guide sync]',e?.message||e)}finally{state.inFlight=null}})();return state.inFlight;
}
function queueSync(delay=120){clearTimeout(state.timer);state.timer=setTimeout(syncNow,delay)}
window.addEventListener('online',()=>queueSync(50));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queueSync(100)});document.addEventListener('travelengine:guidesaved',()=>queueSync(20));setInterval(()=>{if(document.visibilityState==='visible')syncNow()},30000);queueSync(0);
root.GUIDE_SYNC=Object.freeze({syncNow,queueSync,isConfigured:configured,getState:()=>({lastSyncAt:state.lastSyncAt})});
})(globalThis);
