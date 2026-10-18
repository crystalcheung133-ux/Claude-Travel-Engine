/* save-sync-core.js — Engine 25.8.0 Save & Sync coordinator.

   ONE save contract for every user-editable domain (booking, timeline-day, guide):

     validate → durable pending record (outbox) → local apply → cloud write →
     read-back verify → "Saved & Synced ✓"  → clear ONLY the confirmed mutation.

   This module owns no domain data and no transport. Each domain keeps its existing
   local authority (BOOKING_AUTHORITY, ITINERARY_AUTHORITY, GUIDE_AUTHORITY) and its
   existing cloud transport; a domain registers a small adapter here:

     adapter = {
       configured():        boolean   cloud is configured + usable in this deployment
       push(entry):         Promise<{ok:true,revision,record}|{conflict:true,remote}|{retry:true,error}|{fatal:true,error}>
       fetch(recordId):     Promise<{revision,record}|null>      authoritative read-back
       verify(entry,remote):boolean   the committed remote record holds what the user saved
       merge(entry,remote): {merged,conflicts[]}                 3-way merge (optional)
       applyCommitted(id,record,revision)                        write confirmed remote into the local authority
       applyRemoteChoice(id,record,revision)                     "use theirs" resolution (optional, defaults to applyCommitted)
     }

   Guarantees:
   - A failed cloud write never deletes or alters the user's latest edit; the pending record
     stays in the outbox until the remote read-back proves it was committed.
   - "Saved & Synced ✓" is emitted only after a verified read-back. Anything else is
     "Saved locally · Sync pending" (and only if the local write genuinely succeeded).
   - The base revision is the revision the USER edited from, never a freshly re-read one,
     so a stale device produces a conflict instead of silently overwriting newer data.
   - Retries re-send the same mutationId (idempotent) and never create a second record.
   - Pull paths must consult hasPending(domain,id) and must not overwrite a pending edit.
   No credentials are ever written to the outbox. */
(function(root){
  'use strict';
  const LOG='[Save&Sync]';
  const LABELS=Object.freeze({
    synced:'Saved & Synced ✓',
    pending:'Saved locally · Sync pending',
    unconfigured:'Saved locally · Cloud sync not configured',
    conflict:'Saved locally · Changed on another device — review needed',
    failed:'Could not save — your changes were not stored'
  });
  const adapters={};
  const running=new Map();        // key -> Promise (single flight per record)
  const timers={retry:null,poll:null};
  let started=false;

  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function stable(v){
    if(Array.isArray(v))return '['+v.map(stable).join(',')+']';
    if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
    const t=JSON.stringify(v);return t===undefined?'null':t;
  }
  function same(a,b){return stable(a)===stable(b);}
  function uuid(){return root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;}
  function ns(){return String((root.TRIP_CONFIG&&root.TRIP_CONFIG.storageNamespace)||'trip');}
  function boxKey(){return (root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.saveOutbox)||(ns()+':save_outbox:v1');}
  function store(){return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null;}
  function entryKey(domain,id){return domain+'|'+id;}
  function online(){return !(root.navigator&&root.navigator.onLine===false);}

  /* ---------- durable outbox (verified writes) ---------- */
  function emptyBox(){return {version:1,entries:{}};}
  function readBox(){
    const s=store();const raw=s?s.readJSON(boxKey(),null):null;
    if(!raw||Number(raw.version)!==1||!raw.entries||typeof raw.entries!=='object')return emptyBox();
    return raw;
  }
  /* A write only counts if reading it back yields the same bytes. */
  function writeBox(box){
    const s=store();if(!s)return false;
    try{if(!s.writeJSON(boxKey(),box))return false;const back=s.readJSON(boxKey(),null);return !!back&&same(back,box);}
    catch(_){return false;}
  }
  function getEntry(domain,id){return clone(readBox().entries[entryKey(domain,id)]||null);}
  function hasPending(domain,id){return !!readBox().entries[entryKey(domain,id)];}
  function pendingIds(domain){return Object.values(readBox().entries).filter(e=>!domain||e.domain===domain).map(e=>e.recordId);}
  function pendingCount(){return Object.keys(readBox().entries).length;}

  /* ---------- status / events / toast ---------- */
  const state={last:null,lastByKey:{}};
  function emit(kind,entry,extra){
    const detail=Object.assign({kind:kind,label:LABELS[kind]||'',domain:entry&&entry.domain,recordId:entry&&entry.recordId,pending:pendingCount(),at:new Date().toISOString()},extra||{});
    state.last=detail;if(entry)state.lastByKey[entryKey(entry.domain,entry.recordId)]=detail;
    try{if(root.document&&typeof root.CustomEvent==='function')root.document.dispatchEvent(new root.CustomEvent('travelengine:savesync',{detail:detail}));}catch(_){}
    toast(detail);
    return detail;
  }
  function toast(detail){
    try{
      const doc=root.document;if(!doc||!doc.body||!doc.createElement)return;
      let el=doc.getElementById('saveSyncToast');
      if(!el){el=doc.createElement('div');el.id='saveSyncToast';el.className='save-sync-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.hidden=true;doc.body.appendChild(el);}
      el.textContent=detail.label;el.setAttribute('data-kind',detail.kind);el.hidden=false;
      if(timers.toast)root.clearTimeout(timers.toast);
      if(detail.kind==='synced')timers.toast=root.setTimeout(function(){el.hidden=true;},3200);
    }catch(_){}
  }

  /* ---------- 3-way merge helpers (shared by adapters) ---------- */
  function mergeFlat(base,mine,theirs,ignore){
    const skip=new Set(ignore||[]);const b=base||{},m=mine||{},t=theirs||{};
    const keys=new Set([].concat(Object.keys(b),Object.keys(m),Object.keys(t)));
    const merged=Object.assign({},t),conflicts=[];
    keys.forEach(function(k){
      if(skip.has(k))return;
      const mineChanged=!same(m[k],b[k]),theirsChanged=!same(t[k],b[k]);
      if(!mineChanged)return;                                   // keep theirs (already in merged)
      if(!theirsChanged||same(m[k],t[k])){if(m[k]===undefined)delete merged[k];else merged[k]=clone(m[k]);return;}
      conflicts.push(k);if(m[k]===undefined)delete merged[k];else merged[k]=clone(m[k]); // tentative: mine
    });
    return {merged:merged,conflicts:conflicts};
  }
  function mergeItems(baseList,mineList,theirsList,ignore){
    const idOf=x=>x&&x.id!=null?String(x.id):null;
    const B=(baseList||[]).filter(idOf),M=(mineList||[]).filter(idOf),T=(theirsList||[]).filter(idOf);
    const by=l=>new Map(l.map(x=>[idOf(x),x]));const bB=by(B),mB=by(M),tB=by(T);
    const conflicts=[];const out=T.map(clone);const outBy=()=>by(out);
    // deletions made by me
    B.forEach(function(bi){const id=idOf(bi);if(mB.has(id))return;
      const ti=tB.get(id);if(!ti)return;
      if(same(ti,bi)){const at=out.findIndex(x=>idOf(x)===id);if(at>=0)out.splice(at,1);}
      else conflicts.push(id+':delete-vs-edit');
    });
    // field-level merges for items present on all sides
    out.forEach(function(oi,i){const id=idOf(oi);const bi=bB.get(id),mi=mB.get(id),ti=tB.get(id);
      if(!bi||!mi||!ti)return;
      const r=mergeFlat(bi,mi,ti,ignore);out[i]=r.merged;r.conflicts.forEach(c=>conflicts.push(id+'.'+c));
    });
    // additions made by me (not in base): keep position relative to my previous neighbour
    M.forEach(function(mi,idx){const id=idOf(mi);if(bB.has(id))return;
      if(outBy().has(id)){const i=out.findIndex(x=>idOf(x)===id);const r=mergeFlat(null,mi,out[i],ignore);out[i]=r.merged;return;}
      let at=out.length;
      for(let p=idx-1;p>=0;p--){const f=out.findIndex(x=>idOf(x)===idOf(M[p]));if(f>=0){at=f+1;break;}}
      out.splice(at,0,clone(mi));
    });
    // order: apply my reordering only when the other side did not also reorder differently
    const common=M.map(idOf).filter(id=>bB.has(id)&&tB.has(id));
    const baseOrder=B.map(idOf).filter(id=>common.includes(id));
    const theirOrder=T.map(idOf).filter(id=>common.includes(id));
    if(!same(common,baseOrder)){
      if(same(theirOrder,baseOrder)){
        const mine2=common.slice();const slots=out.map((x,i)=>common.includes(idOf(x))?i:-1).filter(i=>i>=0);
        const items=new Map(out.map(x=>[idOf(x),x]));slots.forEach((slot,n)=>{out[slot]=items.get(mine2[n]);});
      }else if(!same(theirOrder,common))conflicts.push('order');
    }
    return {merged:out,conflicts:conflicts};
  }

  /* ---------- flush ---------- */
  function persistEntry(key,mutate){
    const box=readBox();const e=box.entries[key];if(!e)return null;
    mutate(e);e.updatedAt=new Date().toISOString();
    return writeBox(box)?e:null;
  }
  function removeIfSame(key,mutationId){
    const box=readBox();const e=box.entries[key];if(!e||e.mutationId!==mutationId)return false;
    delete box.entries[key];return writeBox(box);
  }
  async function flushOne(key){
    for(let round=0;round<4;round++){
      const box=readBox();const e=box.entries[key];if(!e)return {status:'synced',kind:'synced'};
      const a=adapters[e.domain];
      if(!a||!a.configured())return {status:'pending',kind:'unconfigured',entry:e};
      if(!online())return {status:'pending',kind:'pending',entry:e,reason:'offline'};
      if(e.state==='conflict')return {status:'conflict',kind:'conflict',entry:e};
      let res;
      try{res=await a.push(clone(e));}
      catch(error){persistEntry(key,x=>{x.attempts=(x.attempts||0)+1;x.lastError=String(error&&error.message||error);x.nextAttemptAt=Date.now()+backoff(x.attempts);});return {status:'pending',kind:'pending',entry:getEntry(e.domain,e.recordId),reason:'network'};}
      if(res&&res.ok){
        let remote;
        try{remote=await a.fetch(e.recordId);}catch(error){remote=undefined;}
        if(remote===undefined||!a.verify(clone(e),remote)){
          persistEntry(key,x=>{x.attempts=(x.attempts||0)+1;x.lastError='verify-failed';x.nextAttemptAt=Date.now()+backoff(x.attempts);});
          return {status:'pending',kind:'pending',entry:getEntry(e.domain,e.recordId),reason:'verify-failed'};
        }
        const latest=readBox().entries[key];
        if(latest&&latest.mutationId!==e.mutationId){
          // A newer edit arrived while this one was in flight: keep it, rebase it on what we just committed.
          persistEntry(key,x=>{x.baseRevision=remote?remote.revision:x.baseRevision;x.base=remote?clone(remote.record):x.base;x.attempts=0;});
          try{a.applyCommitted&&a.applyCommitted(e.recordId,remote&&remote.record,remote&&remote.revision,{keepLocalEdits:true});}catch(_){}
          continue;
        }
        if(!removeIfSame(key,e.mutationId))return {status:'pending',kind:'pending',entry:getEntry(e.domain,e.recordId),reason:'outbox-clear-failed'};
        try{a.applyCommitted&&a.applyCommitted(e.recordId,remote&&remote.record,remote&&remote.revision,{});}catch(error){console.warn(LOG,'applyCommitted',error);}
        return {status:'synced',kind:'synced',revision:remote&&remote.revision,record:remote&&remote.record};
      }
      if(res&&res.conflict){
        let remote=res.remote;
        if(!remote){try{remote=await a.fetch(e.recordId);}catch(_){remote=null;}}
        if(remote&&a.verify(clone(e),remote)){ // idempotent replay: the remote already holds exactly our intent
          const latest=readBox().entries[key];
          if(latest&&latest.mutationId===e.mutationId){removeIfSame(key,e.mutationId);try{a.applyCommitted&&a.applyCommitted(e.recordId,remote.record,remote.revision,{});}catch(_){}
            return {status:'synced',kind:'synced',revision:remote.revision,record:remote.record};}
          continue;
        }
        if(a.merge&&remote){
          const m=a.merge(clone(e),clone(remote));
          if(m&&Array.isArray(m.conflicts)&&m.conflicts.length===0){
            persistEntry(key,x=>{x.payload=m.merged;x.baseRevision=remote.revision;x.base=clone(remote.record);x.mutationId=uuid();x.attempts=0;});
            continue;
          }
          persistEntry(key,x=>{x.state='conflict';x.conflict={fields:(m&&m.conflicts)||[],remote:clone(remote)};});
          return {status:'conflict',kind:'conflict',entry:getEntry(e.domain,e.recordId)};
        }
        persistEntry(key,x=>{x.state='conflict';x.conflict={fields:['*'],remote:clone(remote)};});
        return {status:'conflict',kind:'conflict',entry:getEntry(e.domain,e.recordId)};
      }
      // transient or fatal: keep the entry exactly as saved
      persistEntry(key,x=>{x.attempts=(x.attempts||0)+1;x.lastError=String((res&&res.error&&res.error.message)||(res&&res.error)||'sync-failed');x.nextAttemptAt=Date.now()+backoff(x.attempts);});
      return {status:'pending',kind:'pending',entry:getEntry(e.domain,e.recordId),reason:res&&res.fatal?'fatal':'transient'};
    }
    return {status:'pending',kind:'pending',entry:null,reason:'rounds-exhausted'};
  }
  function backoff(attempts){return Math.min(5*60*1000,2000*Math.pow(2,Math.max(0,attempts-1)));}

  function flushKey(key){
    if(running.has(key))return running.get(key);
    const p=flushOne(key).then(function(result){
      const e=result.entry||null;
      const parts=key.split('|');const entry=e||{domain:parts[0],recordId:parts.slice(1).join('|')};
      emit(result.kind,entry,{reason:result.reason,fields:e&&e.conflict?e.conflict.fields:undefined});
      return result;
    }).finally(function(){running.delete(key);});
    running.set(key,p);return p;
  }
  async function flushAll(options){
    const force=!!(options&&options.force);const now=Date.now();
    const keys=Object.keys(readBox().entries).filter(function(k){const e=readBox().entries[k];return e&&e.state!=='conflict'&&(force||!e.nextAttemptAt||e.nextAttemptAt<=now);});
    const out=[];for(const k of keys)out.push(await flushKey(k));return out;
  }

  /* ---------- public: commit ---------- */
  /* commit(domain, recordId, payload, opts)
       opts.base          snapshot of the record BEFORE this edit (for 3-way merge)
       opts.baseRevision  remote revision the user edited from (null = never synced)
       opts.deleted       true for a deletion tombstone
       opts.validate      () => boolean|throws   (run first)
       opts.localApply    () => {ok:boolean,...} (apply to the local authority; rolled back on failure)
       opts.waitMs        how long to await cloud verification before returning "pending" (default 6000)
     Returns {ok, stage, kind, label, synced, record, revision}
       ok:false only when nothing was stored (validation or local persistence failed). */
  async function commit(domain,recordId,payload,opts){
    opts=opts||{};const a=adapters[domain];
    const fail=(stage,reason)=>{const d=emit('failed',{domain:domain,recordId:recordId},{reason:reason,stage:stage});return {ok:false,stage:stage,reason:reason,kind:'failed',label:LABELS.failed,detail:d};};
    if(!a)return fail('config','no-adapter:'+domain);
    if(!recordId)return fail('validate','missing-record-id');
    try{if(typeof opts.validate==='function'&&opts.validate()===false)return fail('validate','validation-failed');}
    catch(error){return fail('validate',String(error&&error.message||error));}
    const key=entryKey(domain,recordId);
    const box=readBox();const prev=box.entries[key]||null;
    const entry=prev?Object.assign({},prev,{payload:clone(payload),deleted:!!opts.deleted,mutationId:uuid(),attempts:0,state:'pending',conflict:undefined,lastError:'',nextAttemptAt:0,updatedAt:new Date().toISOString()})
      :{key:key,domain:domain,recordId:String(recordId),mutationId:uuid(),payload:clone(payload),deleted:!!opts.deleted,base:clone(opts.base===undefined?null:opts.base),baseRevision:(opts.baseRevision==null?null:opts.baseRevision),attempts:0,state:'pending',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(entry.conflict===undefined)delete entry.conflict;
    box.entries[key]=entry;
    if(!writeBox(box))return fail('local','outbox-write-failed');       // nothing claimed, nothing applied
    if(typeof opts.localApply==='function'){
      let applied;try{applied=opts.localApply();}catch(error){applied={ok:false,reason:String(error&&error.message||error)};}
      if(!applied||applied.ok===false){                                 // roll the outbox back to exactly what it was
        const rb=readBox();if(prev)rb.entries[key]=prev;else delete rb.entries[key];writeBox(rb);
        return fail('local',(applied&&applied.reason)||'local-apply-failed');
      }
    }
    const waitMs=opts.waitMs==null?6000:opts.waitMs;
    const flush=flushKey(key);
    const timeout=new Promise(r=>root.setTimeout(()=>r({status:'pending',kind:'pending',reason:'slow'}),waitMs));
    const result=waitMs===0?{status:'pending',kind:'pending',reason:'deferred'}:await Promise.race([flush,timeout]);
    return {ok:true,stage:'committed',kind:result.kind,label:LABELS[result.kind]||LABELS.pending,synced:result.status==='synced',record:result.record,revision:result.revision,conflict:result.status==='conflict'};
  }

  /* ---------- conflict resolution ---------- */
  async function resolveConflict(domain,recordId,choice){
    const key=entryKey(domain,recordId);const e=readBox().entries[key];const a=adapters[domain];
    if(!e||e.state!=='conflict'||!e.conflict||!a)return {ok:false,reason:'no-conflict'};
    const remote=e.conflict.remote;
    if(choice==='theirs'){
      if(!removeIfSame(key,e.mutationId))return {ok:false,reason:'outbox-write-failed'};
      try{(a.applyRemoteChoice||a.applyCommitted)(recordId,remote&&remote.record,remote&&remote.revision,{});}catch(error){console.warn(LOG,error);}
      emit('synced',e);return {ok:true,choice:'theirs'};
    }
    const ok=!!persistEntry(key,x=>{x.state='pending';x.baseRevision=remote?remote.revision:x.baseRevision;x.base=remote?clone(remote.record):x.base;x.mutationId=uuid();x.attempts=0;x.conflict=undefined;delete x.conflict;});
    if(!ok)return {ok:false,reason:'outbox-write-failed'};
    const r=await flushKey(key);return {ok:true,choice:'mine',result:r};
  }
  function conflicts(){return Object.values(readBox().entries).filter(e=>e.state==='conflict').map(clone);}
  /* Foreground helper: ask once per conflicted record. OK = keep mine, Cancel = use theirs. */
  async function promptConflicts(){
    if(!root.confirm)return;
    for(const e of conflicts()){
      const fields=(e.conflict&&e.conflict.fields||[]).filter(f=>f!=='*').join(', ')||'this record';
      const keep=root.confirm('Another device changed ('+fields+') since you opened this.\n\nOK = keep MY version\nCancel = use the OTHER device\'s version');
      await resolveConflict(e.domain,e.recordId,keep?'mine':'theirs');
    }
  }

  function register(domain,adapter){adapters[domain]=adapter;}
  function start(){
    if(started)return;started=true;
    const kick=function(){flushAll({force:true}).catch(function(error){console.warn(LOG,error);});};
    if(root.addEventListener){root.addEventListener('online',kick);root.addEventListener('focus',function(){flushAll().catch(function(){});});}
    if(root.document&&root.document.addEventListener)root.document.addEventListener('visibilitychange',function(){if(!root.document.hidden){flushAll().catch(function(){});}});
    timers.poll=root.setInterval(function(){if(!(root.document&&root.document.hidden))flushAll().catch(function(){});},20000);
    root.setTimeout(function(){flushAll({force:true}).catch(function(){});},1500);
  }

  root.SAVE_SYNC=Object.freeze({
    LABELS:LABELS,register:register,commit:commit,flush:flushKey,flushAll:flushAll,start:start,
    hasPending:hasPending,pendingIds:pendingIds,pendingCount:pendingCount,getEntry:getEntry,conflicts:conflicts,
    resolveConflict:resolveConflict,promptConflicts:promptConflicts,getState:function(){return clone(state.last);},
    mergeFlat:mergeFlat,mergeItems:mergeItems,stable:stable,same:same,readBox:readBox,adapters:function(){return Object.keys(adapters);}
  });
  if(root.document&&root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else root.setTimeout(start,0);
})(globalThis);
