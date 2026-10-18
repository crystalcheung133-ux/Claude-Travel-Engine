/* save-sync-queue.js — Save & Sync reliability layer (RC29.136).
   ONE durable pending-mutation queue shared by Booking, Guide and Timeline.

   Contract:
     1. A mutation is only accepted after it has been written to local storage AND read back.
        If that fails, enqueue() returns {ok:false} and callers must keep the editor open.
     2. One pending entry per (domain, recordId). A newer edit replaces the payload and gets a
        new mutationId, so retries can never create duplicate records.
     3. A transport (registered per domain) performs the cloud write AND the read-back
        verification. It must resolve {verified:true,...}; anything else is "not synced".
     4. After a confirmed write only the entry whose mutationId was actually sent is removed.
        An edit made while the write was in flight stays queued.
     5. Entries are never dropped on failure; they are retried (online, focus, interval, boot).
     6. No credentials are stored here. Transports obtain credentials from memory at send time.
   Labels: 'Saved & Synced ✓' only when the queue is empty for that record after verification;
   'Saved locally · Sync pending' when local persistence succeeded but cloud has not confirmed. */
(function(root){
  'use strict';
  const KEY=(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.pendingMutations)||'travel_engine_pending_mutations_v1';
  const LABEL_SYNCED='Saved & Synced ✓',LABEL_PENDING='Saved locally · Sync pending',LABEL_CONFLICT='Saved locally · Needs review',LABEL_ERROR='Could not save';
  const transports=Object.create(null);
  const runtime={timer:null,inFlight:Object.create(null),started:false};
  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function store(){return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null;}
  function uuid(){return root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;}
  function entryKey(domain,recordId){return String(domain)+'::'+String(recordId);}
  function emptyState(){return {version:1,entries:{}};}
  function read(){
    const s=store();const raw=s?s.readJSON(KEY,null):null;
    if(!raw||Number(raw.version)!==1||!raw.entries||typeof raw.entries!=='object')return emptyState();
    return {version:1,entries:raw.entries};
  }
  /* write + read-back: returns true only if the exact serialized state is now in storage. */
  function write(state){
    const s=store();if(!s)return false;
    let ok=false;try{ok=!!s.writeJSON(KEY,state);}catch(_){ok=false;}
    if(!ok)return false;
    try{return JSON.stringify(s.readJSON(KEY,null))===JSON.stringify(state);}catch(_){return false;}
  }
  function emit(type,detail){
    try{if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('travelengine:savesync',{detail:Object.assign({type:type},detail||{})}));}catch(_){}
  }
  function list(domain){
    const st=read();return Object.keys(st.entries).map(k=>st.entries[k]).filter(e=>e&&(!domain||e.domain===domain));
  }
  function pendingCount(domain){return list(domain).length;}
  function conflictCount(domain){return list(domain).filter(e=>e.state==='conflict').length;}
  function hasPending(domain,recordId){return !!read().entries[entryKey(domain,recordId)];}
  function labelFor(domain,recordId){
    const e=read().entries[entryKey(domain,recordId)];
    if(!e)return LABEL_SYNCED;
    return e.state==='conflict'?LABEL_CONFLICT:LABEL_PENDING;
  }
  function status(){
    const all=list();
    return {pending:all.length,conflicts:all.filter(e=>e.state==='conflict').length,syncing:Object.keys(runtime.inFlight).length>0,
      online:!(root.navigator&&root.navigator.onLine===false),label:all.length?(all.some(e=>e.state==='conflict')?LABEL_CONFLICT:LABEL_PENDING):LABEL_SYNCED};
  }
  /* Durable enqueue. meta.baseVersion is only set when the record has none queued yet, so a
     burst of edits keeps pointing at the remote version the FIRST edit was based on. */
  function enqueue(domain,recordId,payload,meta){
    if(!domain||recordId==null||recordId==='')return {ok:false,reason:'invalid-mutation'};
    const st=read();const k=entryKey(domain,recordId);const prev=st.entries[k];
    const now=new Date().toISOString();
    const entry={
      mutationId:uuid(),domain:String(domain),recordId:String(recordId),operation:(meta&&meta.operation)||'upsert',
      payload:clone(payload),meta:Object.assign({},prev&&prev.meta||{},clone(meta||{})),
      baseVersion:prev?prev.baseVersion:(meta&&meta.baseVersion!=null?meta.baseVersion:null),
      createdAt:prev?prev.createdAt:now,updatedAt:now,attempts:0,state:'queued',lastError:''
    };
    if(prev&&prev.operation==='delete'&&entry.operation!=='delete')entry.operation='upsert';
    st.entries[k]=entry;
    if(!write(st))return {ok:false,reason:'storage-failed'};
    emit('queued',{domain:entry.domain,recordId:entry.recordId,mutationId:entry.mutationId});
    return {ok:true,entry:clone(entry)};
  }
  function registerTransport(domain,transport){transports[domain]=transport;}
  /* Remove ONLY the confirmed mutation. If it has been superseded, keep the newer entry. */
  function confirm(domain,recordId,mutationId,remoteVersion){
    const st=read();const k=entryKey(domain,recordId);const cur=st.entries[k];
    if(!cur)return {ok:true,removed:false};
    if(cur.mutationId!==mutationId){
      // Superseded while in flight: keep the newer edit, but advance its base to the version we just wrote.
      if(remoteVersion!=null)cur.baseVersion=remoteVersion;cur.state='queued';st.entries[k]=cur;write(st);
      return {ok:true,removed:false,superseded:true};
    }
    delete st.entries[k];
    if(!write(st))return {ok:false,reason:'storage-failed'};
    emit('confirmed',{domain:domain,recordId:recordId,mutationId:mutationId,remoteVersion:remoteVersion});
    return {ok:true,removed:true};
  }
  function markFailure(domain,recordId,mutationId,error,state){
    const st=read();const k=entryKey(domain,recordId);const cur=st.entries[k];
    if(!cur||cur.mutationId!==mutationId)return;
    cur.attempts=Number(cur.attempts||0)+1;cur.lastError=String(error&&error.message||error||'sync-failed').slice(0,300);
    cur.state=state||'queued';cur.lastAttemptAt=new Date().toISOString();st.entries[k]=cur;write(st);
    emit(cur.state==='conflict'?'conflict':'failed',{domain:domain,recordId:recordId,mutationId:mutationId,error:cur.lastError});
  }
  function withTimeout(promise,ms){
    if(!ms)return promise;
    return Promise.race([promise,new Promise(function(_,reject){setTimeout(function(){reject(new Error('SYNC_TIMEOUT'));},ms);})]);
  }
  /* Attempt one entry. Never throws. Resolves {synced,label,...}. */
  async function flushEntry(domain,recordId,opts){
    const k=entryKey(domain,recordId);const o=opts||{};
    if(runtime.inFlight[k])return runtime.inFlight[k];
    const st=read();const entry=st.entries[k];
    if(!entry)return {synced:true,label:LABEL_SYNCED,idle:true};
    const transport=transports[domain];
    if(!transport)return {synced:false,label:LABEL_PENDING,reason:'no-transport'};
    if(root.navigator&&root.navigator.onLine===false)return {synced:false,label:LABEL_PENDING,reason:'offline'};
    const sent=clone(entry);
    const run=(async function(){
      try{
        const result=await withTimeout(Promise.resolve(transport(clone(sent))),o.timeoutMs);
        if(!result||result.verified!==true)throw new Error((result&&result.code)||'SYNC_NOT_VERIFIED');
        const done=confirm(domain,recordId,sent.mutationId,result.remoteVersion);
        if(!done.ok)throw new Error('QUEUE_CLEAR_FAILED');
        return {synced:!hasPending(domain,recordId),label:labelFor(domain,recordId),result:result,superseded:!!done.superseded};
      }catch(error){
        const code=String(error&&error.message||error);
        if(error&&error.conflict===true||code==='version_conflict_unresolved'){markFailure(domain,recordId,sent.mutationId,error,'conflict');return {synced:false,label:LABEL_CONFLICT,reason:code};}
        if(code==='SYNC_TIMEOUT'){/* leave queued; transport may still finish — idempotent by record key */}
        markFailure(domain,recordId,sent.mutationId,error,'queued');
        return {synced:false,label:LABEL_PENDING,reason:code};
      }finally{delete runtime.inFlight[k];}
    })();
    runtime.inFlight[k]=run;return run;
  }
  async function flushAll(opts){
    const out=[];const entries=list(opts&&opts.domain).filter(e=>e.state!=='conflict'||(opts&&opts.includeConflicts));
    for(const e of entries)out.push(await flushEntry(e.domain,e.recordId,opts));
    emit('flushed',{count:out.length});
    return out;
  }
  /* Orchestrated Save: commitLocal() must succeed first; then durable enqueue; then an attempt
     bounded by timeoutMs so the editor is never held open indefinitely. */
  async function saveAndSync(domain,recordId,payload,options){
    const o=options||{};
    if(typeof o.commitLocal==='function'){
      let local;try{local=o.commitLocal();}catch(error){return {ok:false,committed:false,reason:(error&&error.message)||'save-failed',label:LABEL_ERROR};}
      if(!local||local.ok===false)return {ok:false,committed:false,reason:(local&&local.reason)||'save-failed',label:LABEL_ERROR};
    }
    const queued=enqueue(domain,recordId,payload,{operation:o.operation,baseVersion:o.baseVersion,meta:o.meta});
    if(!queued.ok)return {ok:false,committed:true,persistedLocally:false,reason:queued.reason,label:LABEL_ERROR};
    if(o.sync===false)return {ok:true,committed:true,synced:false,label:LABEL_PENDING};
    const flushed=await flushEntry(domain,recordId,{timeoutMs:o.timeoutMs==null?8000:o.timeoutMs});
    return {ok:true,committed:true,synced:!!flushed.synced,label:flushed.label,reason:flushed.reason,result:flushed.result};
  }
  function schedule(delay){clearTimeout(runtime.timer);runtime.timer=setTimeout(function(){flushAll({timeoutMs:15000}).catch(function(){});},delay==null?50:delay);}
  function start(){
    if(runtime.started)return;runtime.started=true;
    if(typeof root.addEventListener==='function'){
      root.addEventListener('online',function(){schedule(50);});
      root.addEventListener('focus',function(){schedule(200);});
    }
    if(typeof document!=='undefined'){
      document.addEventListener('visibilitychange',function(){if(!document.hidden)schedule(100);});
      document.addEventListener('travelengine:adminmodechange',function(){schedule(100);});
    }
    if(typeof root.setInterval==='function')root.setInterval(function(){if(pendingCount()&&!(typeof document!=='undefined'&&document.hidden))schedule(0);},20000);
    schedule(800);
  }
  const api={KEY:KEY,labels:Object.freeze({synced:LABEL_SYNCED,pending:LABEL_PENDING,conflict:LABEL_CONFLICT,error:LABEL_ERROR}),
    enqueue:enqueue,registerTransport:registerTransport,confirm:confirm,flushEntry:flushEntry,flushAll:flushAll,saveAndSync:saveAndSync,
    list:list,pendingCount:pendingCount,conflictCount:conflictCount,hasPending:hasPending,labelFor:labelFor,status:status,start:start,schedule:schedule};
  root.SAVE_SYNC=api;
  /* Minimal status toast so Save always reports its truthful state (inline style; no theme change). */
  function toast(text){
    if(typeof document==='undefined'||!document.body||!text)return;
    let el=document.getElementById('saveSyncToast');
    if(!el){el=document.createElement('div');el.id='saveSyncToast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
      el.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:99999;padding:10px 16px;border-radius:999px;background:rgba(20,20,20,.92);color:#fff;font:600 14px/1.2 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:90vw;text-align:center';
      document.body.appendChild(el);}
    el.textContent=text;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(function(){el.hidden=true;},3500);
  }
  if(typeof document!=='undefined'){
    document.addEventListener('travelengine:timelinesyncresult',function(e){toast(e.detail&&e.detail.label);});
    document.addEventListener('travelengine:adminsaved',function(){toast('Saved locally · syncing…');});
  }
  api.toast=toast;
  start();
})(globalThis);
