/* publication-runtime.js — RC13 one-click Supabase publication.
   Builds the immutable trip snapshot locally, then calls the server-side
   publish_trip_snapshot RPC. The database allocates the next version under
   a transaction lock; no SQL download or service-role key is used. */
(function(root){
  'use strict';

  const state={busy:false,lastPublishedVersion:null};

  function clone(value){ return value==null?value:JSON.parse(JSON.stringify(value)); }
  function datasets(){
    return root.TRAVEL_DATASETS&&typeof root.TRAVEL_DATASETS==='object'?root.TRAVEL_DATASETS:{};
  }
  /* RC15: overrides are read through the single canonical resolver
     (itinerary-authority.js) so a publication can never embed a saved
     override that itself belongs to a previous master — the same validation
     Day rendering relies on is applied here too. */
  function mergedItinerary(){
    const source=datasets();
    const itinerary=clone(source.ITINERARY_DATA||{});
    const authority=root.ITINERARY_AUTHORITY;
    Object.keys(itinerary).forEach(function(day){
      const override=authority&&typeof authority.getDayOverrideItems==='function'?authority.getDayOverrideItems(day):null;
      if(Array.isArray(override)) itinerary[day].items=override;
    });
    return itinerary;
  }
  function buildPayload(){
    const source=datasets();
    const authority=root.ITINERARY_AUTHORITY;
    return {
      masterRevision:authority&&typeof authority.getMasterRevision==='function'?authority.getMasterRevision():(root.MASTER_ITINERARY_REVISION||null),
      data:{
        places:clone(source.PLACES||{}),
        categories:clone(source.CATEGORIES||{}),
        guideOrder:clone(source.GUIDE_ORDER||[]),
        dayLinks:clone(source.DAY_LINKS||{}),
        friends:clone(source.FRIENDS||{}),
        bookingsData:clone(source.BOOKINGS_DATA||{}),
        tripData:clone(source.TRIP_DATA||{}),
        tripOrder:clone(source.TRIP_ORDER||[]),
        itineraryData:mergedItinerary(),
        itineraryBase:pristineBase()
      }
    };
  }
  /* master items per day as shipped by the deploy this edit was made on; lets other devices rebase
     these edits onto a newer master after a deployment instead of discarding them. */
  function pristineBase(){
    const authority=root.ITINERARY_AUTHORITY,master=authority&&authority.getPristineMaster?authority.getPristineMaster():null;
    const out={};if(!master)return out;
    Object.keys(master).forEach(function(day){out[day]=(master[day]&&Array.isArray(master[day].items))?master[day].items:[];});
    return out;
  }
  function payloadIntegrity(payload){
    const data=payload&&payload.data;
    const counts={
      places:data&&data.places&&typeof data.places==='object'?Object.keys(data.places).length:0,
      guideOrder:data&&Array.isArray(data.guideOrder)?data.guideOrder.length:0,
      tripData:data&&data.tripData&&typeof data.tripData==='object'?Object.keys(data.tripData).length:0,
      tripOrder:data&&Array.isArray(data.tripOrder)?data.tripOrder.length:0,
      itineraryData:data&&data.itineraryData&&typeof data.itineraryData==='object'?Object.keys(data.itineraryData).length:0
    };
    const ok=counts.places>0&&counts.guideOrder>0&&counts.tripData>0&&counts.tripOrder>0&&counts.itineraryData>0;
    return {ok:ok,counts:counts};
  }
  function currentRemoteVersion(){
    const sync=root.TRIP_SYNC&&root.TRIP_SYNC.getState?root.TRIP_SYNC.getState():null;
    return sync&&Number.isFinite(Number(sync.remoteVersion))?Number(sync.remoteVersion):0;
  }
  function publicationStatusText(){
    const current=state.lastPublishedVersion||currentRemoteVersion();
    return current>0?'Latest published version: v'+current+'.':'Publish the saved Timeline directly to every Companion.';
  }
  function updateButton(status){
    const button=document.getElementById('preparePublicationButton');
    if(!button)return;
    button.disabled=state.busy;
    const strong=button.querySelector('strong');
    const small=button.querySelector('small');
    if(strong)strong.textContent=state.busy?'Publishing…':'Publish Latest Trip';
    if(small)small.textContent=status||publicationStatusText();
  }
  function rpcResultVersion(data){
    const row=Array.isArray(data)?data[0]:data;
    const version=Number(row&&row.version);
    return Number.isFinite(version)&&version>0?version:null;
  }
  function readableError(error){
    const message=error&&error.message?String(error.message):'Unknown publishing error';
    if(/function .* does not exist|Could not find the function|PGRST202/i.test(message)){
      return 'One-click Publish is not installed in Supabase yet. Run SUPABASE_STAGE_13_ONE_CLICK_PUBLISH.sql once, then try again.';
    }
    if(/Invalid Trip Studio credential/i.test(message))return 'Supabase rejected the Trip Studio credential.';
    return message;
  }
  async function publish(){
    if(state.busy)return false;
    if(!root.isAdminMode||!root.isAdminMode()){
      alert('Open Trip Studio before publishing.');return false;
    }
    if(root.hasUnsavedAdminChanges&&root.hasUnsavedAdminChanges()){
      alert('Save pending Trip Studio changes before publishing.');return false;
    }
    if(navigator.onLine===false){
      alert('Publishing needs an internet connection.');return false;
    }
    if(!root.SUPABASE||typeof root.SUPABASE.getClient!=='function'||typeof root.SUPABASE.getSession!=='function'){
      alert('Supabase is not available on this device.');return false;
    }
    const credential=typeof root.getAdminPublishCredential==='function'?root.getAdminPublishCredential():null;
    if(!credential){
      alert('Trip Studio session has expired. Close and reopen Trip Studio.');return false;
    }
    const confirmed=root.confirm('Publish the latest saved trip now?\n\nEvery Companion will receive the new version when it next connects.');
    if(!confirmed)return false;

    state.busy=true;updateButton('Creating a new immutable cloud version…');
    try{
      await root.SUPABASE.getSession();
      const cfg=root.SYNC_CONFIG||{};
      const rpcName=cfg.rpc&&cfg.rpc.publishTrip?cfg.rpc.publishTrip:'publish_trip_snapshot';
      const payload=buildPayload();
      const integrity=payloadIntegrity(payload);
      if(!integrity.ok){
        throw new Error('Publication blocked: Trip or Guide dataset is incomplete. Reload the latest deploy before publishing.');
      }
      const result=await root.SUPABASE.getClient().rpc(rpcName,{
        p_trip_id:cfg.tripId||(typeof TRIP_CONFIG!=='undefined'&&TRIP_CONFIG.storageNamespace)||'',
        p_schema_version:Number(cfg.schemaVersion)||1,
        p_payload:payload,
        p_admin_pin:credential
      });
      if(result&&result.error)throw result.error;
      const version=rpcResultVersion(result&&result.data);
      if(!version)throw new Error('Supabase returned no publication version.');
      state.lastPublishedVersion=version;
      updateButton('Published successfully · v'+version);

      if(root.TRIP_SYNC&&typeof root.TRIP_SYNC.fetchLatestPublished==='function'){
        await root.TRIP_SYNC.fetchLatestPublished({reloadOnChange:false});
      }
      document.dispatchEvent(new CustomEvent('travelengine:publicationpublished',{detail:{version:version}}));
      alert('Trip published successfully.\n\nCloud version v'+version+' is now live.');
      return true;
    }catch(error){
      console.error('One-click publication failed',error);
      const message=readableError(error);
      updateButton('Publish failed. No new version was created.');
      alert('Could not publish the trip.\n\n'+message);
      return false;
    }finally{
      state.busy=false;
      setTimeout(function(){updateButton();},5000);
    }
  }

  /* ===== RC29.137 automatic Timeline Save & Sync (no Publish step) =====
     Save → verified local commit (itinerary-authority) → durable queue entry → this transport.
     Reuses the existing publish_trip_snapshot RPC and the Trip Studio credential held ONLY in memory
     while Studio is unlocked; if Studio is locked the entry simply stays "Sync pending". */
  function stableJSON(value){
    if(Array.isArray(value))return '['+value.map(stableJSON).join(',')+']';
    if(value&&typeof value==='object')return '{'+Object.keys(value).filter(function(k){return value[k]!==undefined;}).sort().map(function(k){return JSON.stringify(k)+':'+stableJSON(value[k]);}).join(',')+'}';
    const t=JSON.stringify(value);return t===undefined?'null':t;
  }
  const VERIFY_FIELDS=['id','time','title','details','route','bookingId','placeId'];
  function dayFingerprint(items){return stableJSON((items||[]).map(function(it){const o={};VERIFY_FIELDS.forEach(function(f){if(it&&it[f]!==undefined)o[f]=it[f];});return o;}));}
  async function fetchLatestRow(){
    const cfg=root.SYNC_CONFIG||{},table=(cfg.tables&&cfg.tables.publications)||'trip_publications';
    const q=await root.SUPABASE.getClient().from(table).select('trip_id,schema_version,version,published_at,payload').eq('trip_id',cfg.tripId).eq('schema_version',Number(cfg.schemaVersion)||1).order('version',{ascending:false}).limit(1);
    if(q.error)throw q.error;
    return Array.isArray(q.data)&&q.data.length?q.data[0]:null;
  }
  async function timelineTransport(entry){
    const authority=root.ITINERARY_AUTHORITY;
    if(!root.SUPABASE||typeof root.SUPABASE.getClient!=='function')return {verified:false,code:'SUPABASE_UNAVAILABLE'};
    const credential=typeof root.getAdminPublishCredential==='function'?root.getAdminPublishCredential():null;
    if(!credential)return {verified:false,code:'STUDIO_LOCKED'};
    await root.SUPABASE.getSession();
    const cfg=root.SYNC_CONFIG||{};
    const days=(entry.payload&&entry.payload.days)||[];
    const latest=await fetchLatestRow();
    const payload=buildPayload();
    let conflicts=[];
    if(latest&&latest.payload&&latest.payload.data&&latest.payload.data.itineraryData){
      const remoteDays=latest.payload.data.itineraryData;
      const remoteMaster=latest.payload.masterRevision;
      const sameMaster=remoteMaster===payload.masterRevision;
      const behind=Number(latest.version)>Number(entry.baseVersion||0);
      Object.keys(remoteDays).forEach(function(day){
        const remoteItems=(remoteDays[day]&&remoteDays[day].items)||[];
        if(days.indexOf(String(day))>=0){
          if(!behind||!sameMaster)return;           // our edit is based on the latest: publish as saved
          const e=authority.getDayEntry(day);if(!e)return;
          const m=authority.mergeRemoteDay(e.items,e.baseItems,remoteItems);
          payload.data.itineraryData[day].items=m.items;conflicts=conflicts.concat(m.conflicts.map(function(c){return Object.assign({day:day},c);}));
        }else if(sameMaster&&payload.data.itineraryData[day]){
          payload.data.itineraryData[day].items=remoteItems;  // never overwrite another device's days with a stale copy
        }
      });
    }
    const integrity=payloadIntegrity(payload);
    if(!integrity.ok)return {verified:false,code:'PAYLOAD_INCOMPLETE'};
    const result=await root.SUPABASE.getClient().rpc((cfg.rpc&&cfg.rpc.publishTrip)||'publish_trip_snapshot',{
      p_trip_id:cfg.tripId,p_schema_version:Number(cfg.schemaVersion)||1,p_payload:payload,p_admin_pin:credential});
    if(result&&result.error)throw result.error;
    const version=rpcResultVersion(result&&result.data);
    if(!version)throw new Error('PUBLISH_NO_VERSION');
    // Read-back: the committed row must exist at >= version and contain every edited day as saved.
    const back=await fetchLatestRow();
    if(!back||Number(back.version)<version)throw new Error('TIMELINE_REMOTE_VERIFY_FAILED');
    const backDays=(back.payload&&back.payload.data&&back.payload.data.itineraryData)||{};
    for(const day of days){
      const want=payload.data.itineraryData[day]&&payload.data.itineraryData[day].items;
      const got=backDays[day]&&backDays[day].items;
      if(dayFingerprint(want)!==dayFingerprint(got))throw new Error('TIMELINE_REMOTE_VERIFY_FAILED');
    }
    if(authority&&authority.markSynced)authority.markSynced(days,Number(back.version));
    state.lastPublishedVersion=Number(back.version);
    if(conflicts.length)document.dispatchEvent(new CustomEvent('travelengine:timelineconflict',{detail:{conflicts:conflicts}}));
    return {verified:true,remoteVersion:Number(back.version),conflicts:conflicts};
  }
  if(root.SAVE_SYNC)root.SAVE_SYNC.registerTransport('timeline',timelineTransport);
  async function saveAndSyncTimeline(days){
    if(!root.SAVE_SYNC)return {ok:true,synced:false,label:'Saved ✓'};
    const prev=root.SAVE_SYNC.list('timeline')[0];
    const merged=Array.from(new Set(((prev&&prev.payload&&prev.payload.days)||[]).concat((days||[]).map(String))));
    const sync=root.TRIP_SYNC&&root.TRIP_SYNC.getState?root.TRIP_SYNC.getState():null;
    const queued=root.SAVE_SYNC.enqueue('timeline','itinerary',{days:merged},{baseVersion:sync&&Number.isFinite(Number(sync.activeVersion))?Number(sync.activeVersion):0});
    if(!queued.ok)return {ok:false,reason:queued.reason,label:root.SAVE_SYNC.labels.error};
    const r=await root.SAVE_SYNC.flushEntry('timeline','itinerary',{timeoutMs:12000});
    return {ok:true,synced:!!r.synced,label:r.label,reason:r.reason};
  }
  document.addEventListener('travelengine:adminsaved',function(event){
    const days=(event.detail&&event.detail.days)||[];
    if(!days.length)return;
    saveAndSyncTimeline(days).then(function(r){document.dispatchEvent(new CustomEvent('travelengine:timelinesyncresult',{detail:r}));}).catch(function(){});
  });

  function installButton(){
    const group=document.getElementById('tripStudioManagement');
    if(!group||document.getElementById('preparePublicationButton'))return;
    const button=document.createElement('button');
    button.id='preparePublicationButton';button.type='button';button.className='trip-studio-action publication-prepare-btn';button.hidden=true;
    button.innerHTML='<span><strong>Publish Latest Trip</strong><small>'+publicationStatusText()+'</small></span><span aria-hidden="true">☁️</span>';
    button.addEventListener('click',publish);group.appendChild(button);
  }
  function reflectMode(){
    installButton();
    const button=document.getElementById('preparePublicationButton');
    if(button)button.hidden=true;
  }

  root.TRIP_PUBLICATION=Object.freeze({saveAndSyncTimeline:saveAndSyncTimeline,timelineTransport:timelineTransport,buildPayload:buildPayload,validatePayload:payloadIntegrity,publish:publish,prepare:publish,getLastPublishedVersion:function(){return state.lastPublishedVersion;}});
  root.publishLatestTrip=publish;
  root.prepareCloudPublication=publish;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){installButton();reflectMode();},{once:true});
  else {installButton();reflectMode();}
  document.addEventListener('travelengine:adminmodechange',reflectMode);
})(globalThis);
