/* itinerary-authority.js — RC15 canonical itinerary authority.
   ONE owner for: master identity (masterRevision), saved-override validation,
   pending-draft validation, storage-format migration, and invalidation.
   Nothing else in the app should read or write STORAGE_CONFIG.keys.itineraryOverrides
   directly, and nothing else should decide whether a saved/pending itinerary
   change is still valid — every consumer (day.html, publication-runtime.js,
   export-runtime.js) calls into this module instead.

   Lifecycle implemented here (see RC15-ROOT-CAUSE-AUDIT.md):
     Current Master File + Saved Admin edits = Current Itinerary
     New Master File = new authoritative baseline; anything (saved override or
     pending draft change) stamped with a different masterRevision is invalid
     and is dropped — never applied, never left silently masking the master.

   masterRevision is a deterministic content hash of the shipped ITINERARY_DATA
   (computed in data.js, before any cloud hydration can touch it). It is NOT a
   build/version string and NOT a one-time migration flag — it changes exactly
   when the master's own itinerary content changes, so a stale override always
   fails validation against a newer master and a same-master edit always
   passes, regardless of build numbers or cache names. */
(function(root){
  'use strict';

  function log(){ if(root.console&&console.warn) console.warn.apply(console,['[ItineraryAuthority]'].concat(Array.prototype.slice.call(arguments))); }

  /* Defensive fallback hash — identical algorithm to the one in data.js.
     Only used if data.js has not yet set MASTER_ITINERARY_REVISION for some
     reason (should not happen in normal load order); data.js's own value is
     always used when present so there is a single source of truth. */
  function hashString(input){
    let h1=0xdeadbeef^input.length,h2=0x41c6ce57^input.length;
    for(let i=0;i<input.length;i++){
      const ch=input.charCodeAt(i);
      h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);
    }
    h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);
    return (4294967296*(2097151&h2)+(h1>>>0)).toString(16);
  }
  function computeRevisionFallback(){
    try{
      const source=root.ITINERARY_DATA||(root.TRAVEL_DATASETS&&root.TRAVEL_DATASETS.ITINERARY_DATA)||{};
      return hashString(JSON.stringify(source));
    }catch(error){ log('Could not compute fallback master revision',error); return null; }
  }
  function getMasterRevision(){
    return root.MASTER_ITINERARY_REVISION||computeRevisionFallback();
  }

  function storageKey(){ return (root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.itineraryOverrides)||'travel_engine_itinerary_overrides_v1'; }
  function localStore(){ return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null; }
  function draftKey(){ return (root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.adminDraft)||'travel_engine_admin_draft_v1'; }
  function clone(value){ return value==null?value:JSON.parse(JSON.stringify(value)); }

  const PRISTINE_MASTER=(function(){try{return (root.TRAVEL_DATASETS&&root.TRAVEL_DATASETS.ITINERARY_DATA||root.ITINERARY_DATA)?JSON.parse(JSON.stringify(root.TRAVEL_DATASETS&&root.TRAVEL_DATASETS.ITINERARY_DATA||root.ITINERARY_DATA)):null;}catch(_){return null;}})();
  function getPristineMaster(){return PRISTINE_MASTER?clone(PRISTINE_MASTER):null;}
  function currentMaster(){return PRISTINE_MASTER||((root.TRAVEL_DATASETS&&root.TRAVEL_DATASETS.ITINERARY_DATA)||root.ITINERARY_DATA||{});}
  function getDayEntry(dayKey){const e=getValidatedStore().dayChanges[String(dayKey)];return e?clone(e):null;}
  function emptyStore(){ return {masterRevision:getMasterRevision(),dayChanges:{}}; }
  function normalizeItems(items){
    return (Array.isArray(items)?items:[]).map(function(item){
      const next=clone(item);
      if(next&&next.type==='custom'&&!String(next.placeId||'').trim()&&next.nonPlace!==true) next.nonPlace=true;
      return next;
    });
  }
  function normalizeItineraryData(data){
    const out=clone(data||{});
    Object.keys(out).forEach(function(day){if(out[day]&&Array.isArray(out[day].items))out[day].items=normalizeItems(out[day].items);});
    return out;
  }


  /* RC29.131: Timeline edits are user intent, not disposable snapshots.
     New saves carry the master baseline that the user edited. On a later deploy we
     replay only the fields the user actually changed, including explicit empty values,
     and preserve add/delete/order operations by stable item id. */
  const USER_EDITABLE_FIELDS=['time','title','details','route'];
  function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}

  /* RC29.138 cross-day / legacy migration helpers ------------------------------------------------
     Legacy (baseline-less) data cannot tell a default line from a user-written line. These fragments
     fingerprint the DEFAULT text of cards that were retired or moved in this release. A line that matches a
     fragment is treated as default; any other line is treated as user content and is preserved. */
  const DEFAULT_LINE_FRAGMENTS={
    'com-tam-moc':['炭燒碎米飯早餐'],
    'garmentory':['本地設計師服飾'],
    'pizza4ps':['必食Pizza','自家芝士'],
    'running-bean':['步行4分鐘cafe','all day brunch']
  };
  function toLines(value){return Array.isArray(value)?value.map(String):(value?[String(value)]:[]);}
  function normLine(v){return String(v||'').replace(/\s+/g,'').toLowerCase();}
  function isDefaultLine(key,line){
    const n=normLine(line);return (DEFAULT_LINE_FRAGMENTS[key]||[]).some(f=>n.includes(normLine(f)));
  }
  function isAutoRoute(route){return !route||/^\s*(🚶|🚕|🚐|🚌|🛍|To next stop)/.test(String(route));}
  function isDefaultRetiredCard(item){
    if(!item||!item.id||!DEFAULT_LINE_FRAGMENTS[item.id])return false;
    return toLines(item.details).every(l=>isDefaultLine(item.id,l))&&isAutoRoute(item.route);
  }
  /* User-authored content of a moved/retired card, as note lines. With a baseline we diff against it;
     without one we exclude lines that match the known default fragments. */
  function movedUserLines(item,baseline,key,label){
    const lines=[],details=toLines(item&&item.details);
    if(baseline){
      const old=toLines(baseline.details);
      details.forEach(l=>{if(!old.includes(l))lines.push(l);});
      if(item.route&&!same(item.route,baseline.route))lines.push(String(item.route));
      if(item.time&&!same(item.time,baseline.time))lines.push('Previous '+label+' time: '+String(item.time));
    }else{
      details.forEach(l=>{if(!isDefaultLine(key,l))lines.push(l);});
      if(item&&item.route&&!isAutoRoute(item.route))lines.push(String(item.route));
    }
    return lines;
  }
  function appendLines(target,lines){
    if(!target||!lines||!lines.length)return false;
    const existing=toLines(target.details);let changed=false;
    lines.forEach(function(line){if(!existing.includes(line)){existing.push(line);changed=true;}});
    if(changed)target.details=existing;
    return changed;
  }
  function removeById(list,id){
    if(!Array.isArray(list))return;
    for(let i=list.length-1;i>=0;i--)if(list[i]&&list[i].id===id)list.splice(i,1);
  }
  /* Moves user content of cards that changed day in this release:
       Day 2 Pizza 4P's        -> Day 4 Pizza 4P's (Day 2 card never survives when its content is carried over)
       Day 5 Running Bean      -> Day 2 Running Bean (the Day 5 card is removed by migrateDay5Presentation)
     days: {day: itemsArray}  (mutated in place) ; src: {day:{items,baseItems|null}} = the user's RAW data;
     ensureDay(d): optional, returns the (possibly newly created) items array of a destination day. */
  function applyCrossDayMoves(days,src,ensureDay){
    const dest=function(d){return (ensureDay?ensureDay(d):days[d])||null;};
    const s2=src&&src['2'];
    const pizza=s2&&Array.isArray(s2.items)?s2.items.find(x=>x&&x.id==='pizza4ps'):null;
    if(pizza&&days['2']){
      const baseline=Array.isArray(s2.baseItems)?s2.baseItems.find(x=>x&&x.id==='pizza4ps'):null;
      const lines=movedUserLines(pizza,baseline,'pizza4ps','Day 2 Pizza');
      if(!lines.length){removeById(days['2'],'pizza4ps');}
      else{
        const day4=dest('4'),target=day4&&day4.find(x=>x&&x.id==='pizza4ps');
        if(target){appendLines(target,lines);removeById(days['2'],'pizza4ps');}
        /* else: Day 4 Pizza was deleted by the user -> keep the edited Day 2 card rather than lose the note. */
      }
    }
    const s5=src&&src['5'];
    const bean=s5&&Array.isArray(s5.items)?s5.items.find(x=>x&&x.id==='running-bean'):null;
    if(bean){
      const baseline=Array.isArray(s5.baseItems)?s5.baseItems.find(x=>x&&x.id==='running-bean'):null;
      const lines=movedUserLines(bean,baseline,'running-bean','Day 5 Running Bean');
      if(lines.length){
        const day2=dest('2'),target=day2&&day2.find(x=>x&&x.id==='running-bean');
        if(target)appendLines(target,lines);
      }
    }
    return days;
  }
  /* RC29.139: Cơm Tấm Mộc is a retired Day 2 breakfast, not a second stop.
     Carry any non-default notes to Running Bean before removing the obsolete card.
     This is intentionally ID-scoped; no other manually added meals are touched. */
  function reconcileDay2Breakfast(items,rawItems,rawBase){
    const list=normalizeItems(items), old=list.find(x=>x&&x.id==='com-tam-moc');
    if(!old)return list;
    const bean=list.find(x=>x&&x.id==='running-bean');
    if(!bean)return list; // never drop a user's note without a destination
    const source=(Array.isArray(rawItems)?rawItems:[]).find(x=>x&&x.id==='com-tam-moc')||old;
    const base=(Array.isArray(rawBase)?rawBase:[]).find(x=>x&&x.id==='com-tam-moc')||null;
    const notes=movedUserLines(source,base,'com-tam-moc','Day 2 Cơm Tấm Mộc');
    if(source.time&&source.time!=='09:00'&&!base)notes.push('Previous Cơm Tấm Mộc time: '+source.time);
    appendLines(bean,notes);
    removeById(list,'com-tam-moc');
    return list;
  }
  /* Baseline-less data: merge over the master, retire UNEDITED default copies of retired cards. */
  function legacyMigrateDay(day,items,masterItems){
    let list=legacyRebaseDay(items,masterItems);
    const masterIds=new Set(normalizeItems(masterItems).filter(x=>x&&x.id).map(x=>String(x.id)));
    if(String(day)==='2')list=list.filter(x=>!(x&&x.id&&['com-tam-moc','garmentory','pizza4ps'].includes(x.id)&&!masterIds.has(x.id)&&isDefaultRetiredCard(x)));
    if(String(day)==='2')list=reconcileDay2Breakfast(list,items,null);
    return String(day)==='5'?migrateDay5Presentation(list):list;
  }
  function moveAcrossStoreDays(dayChanges,src){
    const days={};Object.keys(dayChanges).forEach(function(d){days[d]=dayChanges[d].items;});
    applyCrossDayMoves(days,src,function(d){
      if(!dayChanges[d]){
        const m=normalizeItems(((currentMaster()[d]||{}).items)||[]);
        dayChanges[d]={items:m,baseItems:normalizeItems(m)};days[d]=dayChanges[d].items;
      }
      return days[d];
    });
  }
  function rebaseDay(savedItems,baseItems,currentItems){
    const saved=normalizeItems(savedItems),base=normalizeItems(baseItems),current=normalizeItems(currentItems);
    const baseBy=new Map(base.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const savedBy=new Map(saved.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const currentBy=new Map(current.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const deleted=new Set(base.filter(x=>x&&x.id&&!savedBy.has(String(x.id))).map(x=>String(x.id)));
    const out=[];
    saved.forEach(function(si){
      if(!si||!si.id){out.push(clone(si));return;}
      const id=String(si.id),bi=baseBy.get(id),ci=currentBy.get(id);
      if(!bi){out.push(clone(si));return;} // user-added item
      if(!ci){if(!same(si,bi))out.push(clone(si));return;} // retain only genuinely edited retired cards
      const merged=clone(ci);
      USER_EDITABLE_FIELDS.forEach(function(field){
        const sHas=Object.prototype.hasOwnProperty.call(si,field),bHas=Object.prototype.hasOwnProperty.call(bi,field);
        if(sHas!==bHas || (sHas&&!same(si[field],bi[field]))){
          if(sHas)merged[field]=clone(si[field]); else delete merged[field];
        }
      });
      out.push(merged);
    });
    /* Insert genuinely new master items without disturbing the user's saved order. */
    current.forEach(function(ci,idx){
      if(!ci||!ci.id)return;const id=String(ci.id);
      if(baseBy.has(id)||savedBy.has(id)||deleted.has(id)||out.some(x=>x&&String(x.id)===id))return;
      let at=out.length,placed=false;
      for(let n=idx+1;n<current.length;n++){const next=current[n];if(next&&next.id){const found=out.findIndex(x=>x&&String(x.id)===String(next.id));if(found>=0){at=found;placed=true;break;}}}
      if(!placed)for(let p=idx-1;p>=0;p--){const prev=current[p];if(prev&&prev.id){const found=out.findIndex(x=>x&&String(x.id)===String(prev.id));if(found>=0){at=found+1;break;}}}
      out.splice(at,0,clone(ci));
    });
    return normalizeItems(out);
  }
  /* Day 5 structural migration: preserve user-authored notes verbatim.
     An absent destination is never recreated after a deliberate user deletion;
     retain the source instead so content cannot be silently lost. */
  function migrateDay5Presentation(items){
    const out=normalizeItems(items);
    const transfer={'hotel-luggage':'hotel-checkout','grab-ha-spa':'ha-spa'};
    const byId=new Map(out.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    Object.keys(transfer).forEach(function(sourceId){
      const source=byId.get(sourceId),dest=byId.get(transfer[sourceId]);
      if(!source||!dest)return;
      const content=[...(Array.isArray(source.details)?source.details:source.details?[String(source.details)]:[])];
      if(source.route)content.push(String(source.route));
      if(source.time&&source.time!==dest.time&&!(sourceId==='grab-ha-spa'&&String(source.time).trim()==='PM'))content.push('Previous '+sourceId+' time: '+String(source.time));
      if(content.length){
        const existing=Array.isArray(dest.details)?dest.details.slice():dest.details?[String(dest.details)]:[];
        content.forEach(function(line){if(!existing.includes(line))existing.push(line);});
        dest.details=existing;
      }
      const idx=out.indexOf(source);if(idx>=0)out.splice(idx,1);
    });
    out.forEach(function(item){if(item&&item.id==='ha-spa'&&Array.isArray(item.details))item.details=item.details.filter(line=>!/^Previous grab-ha-spa time: PM$/.test(String(line).trim()));});
    const bean=byId.get('running-bean');
    if(bean){const idx=out.indexOf(bean);if(idx>=0)out.splice(idx,1);}
    return normalizeItems(out);
  }
  /* Day 2/4 migration: retire unchanged obsolete master cards, but NEVER
     discard a user-edited orphan. Respect user order if it differs from baseline. */
  function rebaseApprovedDay(day,saved,base,current){
    const d=String(day), result=rebaseDay(saved,base,current);
    if(d!=='2'&&d!=='4')return result;
    const baseline=normalizeItems(base), savedList=normalizeItems(saved), master=normalizeItems(current);
    const oldBy=new Map(baseline.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const masterIds=new Set(master.filter(x=>x&&x.id).map(x=>String(x.id)));
    const retired=d==='2'?new Set(['com-tam-moc','garmentory','pizza4ps']):new Set();
    const keep=result.filter(function(item){
      if(!item||!retired.has(String(item.id))||masterIds.has(String(item.id)))return true;
      const original=oldBy.get(String(item.id));
      if(!original)return true; // never remove user-added cards
      const savedItem=savedList.find(x=>x&&String(x.id)===String(item.id));
      return USER_EDITABLE_FIELDS.some(f=>!same(savedItem&&savedItem[f],original[f]));
    });
    const baseOrder=baseline.filter(x=>x&&x.id).map(x=>String(x.id));
    const savedOrder=savedList.filter(x=>x&&x.id&&oldBy.has(String(x.id))).map(x=>String(x.id));
    const baseSurvivors=baseOrder.filter(id=>savedOrder.includes(id));
    const userReordered=!same(savedOrder,baseSurvivors);
    if(userReordered)return normalizeItems(d==='2'?reconcileDay2Breakfast(keep,savedList,baseline):keep);
    const masterRank=new Map(master.map((x,i)=>[String(x.id),i]));
    // Sort only master-owned cards. User-added or user-edited orphan cards retain
    // their relative placement; don't silently reorder custom activities.
    const slots=keep.map((x,i)=>masterRank.has(String(x&&x.id))?i:-1).filter(i=>i>=0);
    const sorted=slots.map(i=>keep[i]).sort((a,b)=>masterRank.get(String(a.id))-masterRank.get(String(b.id)));
    slots.forEach((index,i)=>{keep[index]=sorted[i];});
    return normalizeItems(d==='2'?reconcileDay2Breakfast(keep,savedList,baseline):keep);
  }
  function rebaseDayForKey(day,saved,base,current){
    const migrated=rebaseApprovedDay(day,saved,base,current);
    return String(day)==='5'?migrateDay5Presentation(migrated):migrated;
  }
  function legacyRebaseDay(savedItems,currentItems){
    /* One-time bridge for pre-RC29.131 stores, which did not save a baseline.
       Preserve the four fields Studio could actually edit plus user add/delete/order.
       Relationship metadata still comes from current master via hydrateRelationships(). */
    const saved=normalizeItems(savedItems),current=normalizeItems(currentItems);
    const currentBy=new Map(current.filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const out=[];
    saved.forEach(function(si){
      if(!si||!si.id){out.push(clone(si));return;}const ci=currentBy.get(String(si.id));
      if(!ci){out.push(clone(si));return;}
      const merged=Object.assign({},clone(ci),clone(si));out.push(merged);
    });
    current.forEach(function(ci,idx){
      if(!ci||!ci.id||out.some(x=>x&&String(x.id)===String(ci.id)))return;
      let at=out.length,placed=false;
      for(let n=idx+1;n<current.length;n++){const next=current[n];if(next&&next.id){const found=out.findIndex(x=>x&&String(x.id)===String(next.id));if(found>=0){at=found;placed=true;break;}}}
      if(!placed)for(let p=idx-1;p>=0;p--){const prev=current[p];if(prev&&prev.id){const found=out.findIndex(x=>x&&String(x.id)===String(prev.id));if(found>=0){at=found+1;break;}}}
      out.splice(at,0,clone(ci));
    });
    return normalizeItems(out);
  }

  /* Accepts any previously-saved shape and returns a store that is guaranteed
     to be {masterRevision, dayChanges:{day:{items:[...]}}} and bound to the
     CURRENT master. Three input shapes are handled:
       1. Missing / null              -> fresh empty store.
       2. Legacy flat {"2":[...]}     -> revision is unknown, so the whole
                                          store is treated as belonging to an
                                          unrecoverable previous master and is
                                          dropped (Test A: legacy override must
                                          never mask the current master).
       3. Current {masterRevision,dayChanges} -> kept only if masterRevision
          matches; otherwise dropped (Test C: new Master File invalidates the
          previous master's saved overrides). */
  function normalizeStore(raw){
    const current=getMasterRevision();
    if(!raw||typeof raw!=='object'||Array.isArray(raw)) return emptyStore();
    const hasRevisionShape=typeof raw.masterRevision==='string'&&raw.dayChanges&&typeof raw.dayChanges==='object'&&!Array.isArray(raw.dayChanges);
    if(!hasRevisionShape){
      // Legacy flat saves are user edits, not disposable cache. Preserve every
      // day and migrate without losing blanked notes, custom cards or deletions.
      const dayChanges={},flatSrc={};
      Object.keys(raw).forEach(function(day){
        if(!/^\d+$/.test(day)||!Array.isArray(raw[day]))return;
        const masterItems=(((currentMaster())[String(day)]||{}).items)||[];
        dayChanges[String(day)]={items:legacyMigrateDay(day,raw[day],masterItems),baseItems:normalizeItems(masterItems)};
        flatSrc[String(day)]={items:raw[day],baseItems:null};
      });
      moveAcrossStoreDays(dayChanges,flatSrc);
      return {masterRevision:current,dayChanges:dayChanges};
    }
    if(raw.masterRevision!==current){
      const rebased={masterRevision:current,dayChanges:{}},rawSrc={};
      Object.keys(raw.dayChanges||{}).forEach(function(day){
        const entry=raw.dayChanges[day];if(!entry||!Array.isArray(entry.items))return;
        const masterItems=(((currentMaster())[String(day)]||{}).items)||[];
        const hasBase=Array.isArray(entry.baseItems);
        const items=hasBase?rebaseDayForKey(day,entry.items,entry.baseItems,masterItems):legacyMigrateDay(day,entry.items,masterItems);
        const migratedEntry={items:items,baseItems:normalizeItems(masterItems)};
        ['baseVersion','dirtySync','syncedVersion'].forEach(function(f){if(entry[f]!==undefined)migratedEntry[f]=entry[f];});
        rebased.dayChanges[String(day)]=migratedEntry;
        rawSrc[String(day)]={items:entry.items,baseItems:hasBase?entry.baseItems:null};
      });
      // Cross-day moves must survive local Saved Overrides exactly as they survive cloud publications.
      moveAcrossStoreDays(rebased.dayChanges,rawSrc);
      return rebased;
    }
    const cleanChanges={};
    Object.keys(raw.dayChanges).forEach(function(day){
      const entry=raw.dayChanges[day];
      if(entry&&Array.isArray(entry.items)){
        cleanChanges[String(day)]={items:normalizeItems(entry.items),baseItems:normalizeItems(Array.isArray(entry.baseItems)?entry.baseItems:((((currentMaster())[String(day)]||{}).items)||[]))};
        // RC29.137: keep Save & Sync bookkeeping across normalisation passes.
        ['baseVersion','dirtySync','syncedVersion'].forEach(function(f){if(entry[f]!==undefined)cleanChanges[String(day)][f]=entry[f];});
      }
    });
    return {masterRevision:current,dayChanges:cleanChanges};
  }

  /* Reads, migrates/validates and — only when the on-disk shape actually
     needed to change — persists the result once. Safe to call on every
     render; it only writes when normalization produced a different result. */
  function getValidatedStore(){
    const store=localStore();
    const raw=store?store.readJSON(storageKey(),null):null;
    const normalized=normalizeStore(raw);
    const rawJson=raw?JSON.stringify(raw):null;
    const normalizedJson=JSON.stringify(normalized);
    if(store&&rawJson!==normalizedJson){
      store.writeJSON(storageKey(),normalized);
    }
    return normalized;
  }

  function getDayOverrideItems(dayKey){
    const store=getValidatedStore();
    const entry=store.dayChanges[String(dayKey)];
    if(entry&&entry.dirtySync===false&&entry.syncedVersion!=null&&!(root.SAVE_SYNC&&root.SAVE_SYNC.hasPending('timeline','itinerary'))){
      // Our edit is already inside a published version that THIS device has hydrated: the cloud
      // snapshot is the authority again, so another device's later edits are not masked here.
      const st=root.TRIP_SYNC&&root.TRIP_SYNC.getState?root.TRIP_SYNC.getState():null;
      if(st&&st.hydrated&&Number(st.activeVersion)>Number(entry.syncedVersion))return null;
    }
    return entry&&Array.isArray(entry.items)?(String(dayKey)==='5'?migrateDay5Presentation(entry.items):clone(entry.items)):null;
  }

  /* Commits a batch of admin-draft changes (as produced by admin.js's
     'itineraryDay<N>' keys) into the saved-override store, stamped with the
     CURRENT master revision. This is the only path that writes saved
     overrides — day.html's 'travelengine:adminsave' handler calls this
     instead of touching localStorage directly. */
  function syncActiveVersion(){
    try{const st=root.TRIP_SYNC&&root.TRIP_SYNC.getState?root.TRIP_SYNC.getState():null;const v=Number(st&&st.activeVersion);return Number.isFinite(v)?v:null;}catch(_){return null;}
  }
  /* RC29.137: checked commit. Returns {ok,store,days}. ok is true only if the saved store was
     written AND read back identical, so callers never discard a draft that did not persist. */
  function commitDayChangesChecked(changes){
    const store=getValidatedStore();const days=[];
    Object.keys(changes||{}).forEach(function(key){
      if(!key.startsWith('itineraryDay')) return;
      const change=changes[key];
      if(change&&Array.isArray(change.items)){
        const d=String(change.day),prev=store.dayChanges[d];
        store.dayChanges[d]={items:normalizeItems(change.items),baseItems:normalizeItems(((((currentMaster())[d]||{}).items)||[])),
          baseVersion:(prev&&prev.baseVersion!=null&&prev.dirtySync)?prev.baseVersion:syncActiveVersion(),dirtySync:true};
        days.push(d);
      }
    });
    store.masterRevision=getMasterRevision();
    const backing=localStore();
    if(!backing) return {ok:false,store:store,days:days,reason:'no-storage'};
    let ok=false;try{ok=!!backing.writeJSON(storageKey(),store)&&JSON.stringify(backing.readJSON(storageKey(),null))===JSON.stringify(store);}catch(_){ok=false;}
    return {ok:ok,store:store,days:days,reason:ok?'':'storage-failed'};
  }
  function commitDayChanges(changes){ return commitDayChangesChecked(changes).store; }
  /* Called after a cloud write was verified: remember which published version contains the edit. */
  function markSynced(days,version){
    const store=getValidatedStore();let changed=false;
    (days||Object.keys(store.dayChanges)).forEach(function(d){const e=store.dayChanges[String(d)];if(e){e.syncedVersion=version;e.dirtySync=false;changed=true;}});
    const backing=localStore();if(changed&&backing)backing.writeJSON(storageKey(),store);
    return changed;
  }
  /* Three-way merge of a remote itinerary (current) with our saved day (saved/base). Reports
     fields edited on BOTH sides so the caller can surface them rather than overwrite silently. */
  function mergeRemoteDay(savedItems,baseItems,remoteItems){
    const merged=rebaseDay(savedItems,baseItems,remoteItems);
    const baseBy=new Map(normalizeItems(baseItems).filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const remBy=new Map(normalizeItems(remoteItems).filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const savedBy=new Map(normalizeItems(savedItems).filter(x=>x&&x.id).map(x=>[String(x.id),x]));
    const conflicts=[];
    savedBy.forEach(function(si,id){const bi=baseBy.get(id),ri=remBy.get(id);if(!bi||!ri)return;
      USER_EDITABLE_FIELDS.forEach(function(f){if(!same(si[f],bi[f])&&!same(ri[f],bi[f])&&!same(ri[f],si[f]))conflicts.push({id:id,field:f,remote:clone(ri[f]),local:clone(si[f])});});});
    return {items:merged,conflicts:conflicts};
  }
  /* A snapshot published from an OLDER master is rebased onto the current master using the
     itineraryBase it carries (the master items it was edited from). Snapshots with no base are
     not rebased (they cannot be separated from stale master content) and stay incompatible. */
  // Explicit Oct 22 approvals. Only these named activities are normalised;
  // other user-edited cards, notes and ordering remain untouched.
  function applyOct22Approvals(day,items){
    const list=normalizeItems(items), d=String(day);
    if(d==='2'){
      const bean=list.find(x=>x&&x.id==='running-bean');
      const garment=list.find(x=>x&&x.id==='garmentory');
      const shopping=list.find(x=>x&&x.id==='shopping-tqd');
      if(garment&&shopping){
        const noteLines=(garment.details||[]).filter(t=>!/(?:11 Garmentory|Trần Quang Diệu|shopping)/i.test(String(t)));
        if(noteLines.length)appendLines(shopping,noteLines);
        removeById(list,'garmentory');
      }
      // The live cloud publication can carry the breakfast at the end after
      // manual Add/Delete. Anchor only the two approved morning activities;
      // preserve every other card's relative order and edited fields.
      if(bean&&shopping){
        const breakfastIndex=list.indexOf(bean);
        const shoppingIndex=list.indexOf(shopping);
        if(breakfastIndex>shoppingIndex){
          list.splice(breakfastIndex,1);
          list.splice(list.indexOf(shopping),0,bean);
        }
      }
      // A legacy standalone Garmentory may be present without shopping; do
      // not discard it or rewrite user-authored content in that case.

    }
    if(d==='4'){
      const crab=list.find(x=>x&&x.id==='quan-thuy');
      const church=list.find(x=>x&&x.id==='pink-church');
      if(crab&&church){
        const meaningful=(crab.details||[]).filter(t=>!/蟹肉粉絲|蟹料理|早餐後 Grab/i.test(String(t)));
        if(meaningful.length)appendLines(church,meaningful.map(t=>'Former Quán Thuý note: '+t));
        removeById(list,'quan-thuy');
      }
      if(church)church.time='09:00–09:40';
      const pizza=list.find(x=>x&&x.id==='pizza4ps');
      if(pizza)pizza.time='11:00';
      const push=list.find(x=>x&&x.id==='push-push-d4');
      if(push&&typeof push.route==='string')push.route=push.route.replace(/11:30/g,'11:00');
    }
    return list;
  }
  function rebasePublishedItinerary(data){
    if(!data||!data.itineraryData||!data.itineraryBase||!Object.keys(data.itineraryBase).length)return null;
    if(Object.keys(data.itineraryData).some(day=>!Array.isArray(data.itineraryBase[day])))return null;
    const out={};
    Object.keys(data.itineraryData).forEach(function(day){
      const entry=data.itineraryData[day]||{},cur=((currentMaster())[day])||{};
      const baseDay=data.itineraryBase[day];
      out[day]=Object.assign({},clone(cur),{items:Array.isArray(baseDay)?rebaseDayForKey(day,entry.items||[],baseDay,cur.items||[]):normalizeItems(cur.items||[])});
    });
    Object.keys(currentMaster()).forEach(function(day){if(!out[day])out[day]=clone(currentMaster()[day]);});
    /* Cross-day moves (Pizza Day 2 -> Day 4, Running Bean Day 5 -> Day 2) use the same helper as the
       Saved Override and Pending Draft paths so all three behave identically. */
    const pubDays={},pubSrc={};
    Object.keys(out).forEach(function(d){pubDays[d]=out[d].items;});
    Object.keys(data.itineraryData).forEach(function(d){
      pubSrc[d]={items:(data.itineraryData[d]&&data.itineraryData[d].items)||[],baseItems:Array.isArray(data.itineraryBase[d])?data.itineraryBase[d]:null};
    });
    applyCrossDayMoves(pubDays,pubSrc,null);
    if(pubDays['2'])pubDays['2']=reconcileDay2Breakfast(pubDays['2'],pubSrc['2']&&pubSrc['2'].items,pubSrc['2']&&pubSrc['2'].baseItems);
    // Approved Day 4 spa time: replace only the retired 15:00 default; keep other user-entered times.
    if(pubDays['4'])pubDays['4'].forEach(function(item){
      if(item&&item.id==='moc-huong-d4'&&String(item.time||'').trim()==='15:00')item.time='15:45–17:45';
    });
    if(out['2'])out['2'].items=pubDays['2'];
    if(out['4'])out['4'].items=applyOct22Approvals('4',pubDays['4']);
    if(out['2'])out['2'].items=applyOct22Approvals('2',out['2'].items);
    return out;
  }

  function clearDayOverride(dayKey){
    const store=getValidatedStore();
    delete store.dayChanges[String(dayKey)];
    const backing=localStore();
    if(backing) backing.writeJSON(storageKey(),store);
    return store;
  }

  /* Pending (unsaved) Admin Mode edits live in the admin draft, keyed
     'itineraryDay<N>' -> {day, items, masterRevision}. day.html stamps
     masterRevision when it marks a day dirty; this validates that stamp
     against the current master before ever trusting a pending edit. */
  /* ---- Pending Draft lifecycle (RC29.138) ----------------------------------------------------------
     A draft entry is {day, items, masterRevision, baseItems, basedOnItems}:
       baseItems    = the MASTER items of masterRevision (what a future deploy is diffed against)
       basedOnItems = the committed list (Saved Override or Master) the user started editing from.
     Existing drafts without a baseline are migrated ONCE (and written back); ambiguity is documented in
     CLAUDE_OUTSTANDING_ISSUES.md: without a baseline a deletion cannot be told from an omitted default. */
  function readDraft(){
    try{if(typeof root.getAdminDraft==='function'){const d=root.getAdminDraft();if(d)return d;}}catch(_){}
    const backing=localStore();
    try{return backing?backing.readJSON(draftKey(),null):null;}catch(_){return null;}
  }
  function persistDraft(draft){
    try{if(typeof root.replaceAdminDraft==='function'){root.replaceAdminDraft(draft);return true;}}catch(_){}
    const backing=localStore();
    try{return !!(backing&&backing.writeJSON(draftKey(),draft));}catch(_){return false;}
  }
  function committedDayItems(dayKey){
    const d=String(dayKey),saved=getDayOverrideItems(d);
    return normalizeItems(saved||(((currentMaster()[d]||{}).items)||[]));
  }
  function migrateDraftObject(draft){
    if(!draft||typeof draft!=='object'||!draft.changes||typeof draft.changes!=='object')return {draft:draft,changed:false};
    const current=getMasterRevision(),stale=[],upgrade=[];
    Object.keys(draft.changes).forEach(function(key){
      const m=/^itineraryDay(\d+)$/.exec(key),c=draft.changes[key];
      if(!m||!c||!Array.isArray(c.items))return;
      if(String(c.masterRevision||'')!==String(current))stale.push(m[1]);
      else if(!Array.isArray(c.baseItems)||!Array.isArray(c.basedOnItems))upgrade.push(m[1]);
    });
    if(!stale.length&&!upgrade.length)return {draft:draft,changed:false};
    const out=clone(draft),days={},src={},created=new Set(),before={};
    stale.forEach(function(d){
      const c=draft.changes['itineraryDay'+d],master=((currentMaster()[d]||{}).items)||[];
      const hasBase=Array.isArray(c.baseItems);
      days[d]=hasBase?rebaseDayForKey(d,c.items,c.baseItems,master):legacyMigrateDay(d,c.items,committedDayItems(d));
      src[d]={items:c.items,baseItems:hasBase?c.baseItems:null};
    });
    applyCrossDayMoves(days,src,function(d){
      if(!days[d]){
        const existing=draft.changes['itineraryDay'+d];
        if(existing&&Array.isArray(existing.items)){days[d]=normalizeItems(existing.items);before[d]=JSON.stringify(days[d]);}
        else{days[d]=committedDayItems(d);created.add(d);}
      }
      return days[d];
    });
    upgrade.forEach(function(d){
      /* Current-revision draft written before baselines existed: nothing to rebase, but record the
         baseline now so later deploys and saved edits can be layered correctly. */
      if(days[d])return;
      days[d]=normalizeItems(draft.changes['itineraryDay'+d].items);before[d]=JSON.stringify(days[d]);
    });
    Object.keys(days).forEach(function(d){
      const isStale=stale.includes(d),isUpgrade=upgrade.includes(d);
      if(!isStale&&!isUpgrade&&!created.has(d)&&before[d]===JSON.stringify(days[d]))return; // untouched current draft
      const prev=draft.changes['itineraryDay'+d]||{};
      out.changes['itineraryDay'+d]=Object.assign({},clone(prev),{
        day:String(d),items:normalizeItems(days[d]),masterRevision:current,
        baseItems:normalizeItems(((currentMaster()[d]||{}).items)||[]),
        basedOnItems:committedDayItems(d)
      });
    });
    out.updatedAt=out.updatedAt||new Date().toISOString();
    return {draft:out,changed:true};
  }
  function getDraftMigrated(){
    const raw=readDraft(),result=migrateDraftObject(raw);
    if(result.changed)persistDraft(result.draft);
    return result.draft;
  }
  /* Builds the payload day.html stores in the admin draft (baseline + revision included). */
  function makeDraftPayload(dayKey,items){
    const d=String(dayKey),current=getMasterRevision(),draft=readDraft();
    const prev=draft&&draft.changes?draft.changes['itineraryDay'+d]:null;
    const keep=prev&&String(prev.masterRevision||'')===String(current)&&Array.isArray(prev.basedOnItems);
    return {
      day:d,items:clone(items),masterRevision:current,
      baseItems:normalizeItems(((currentMaster()[d]||{}).items)||[]),
      basedOnItems:keep?clone(prev.basedOnItems):committedDayItems(d)
    };
  }
  function getPendingDayItems(dayKey){
    const d=String(dayKey),draft=getDraftMigrated();
    const pending=draft&&draft.changes?draft.changes['itineraryDay'+d]:null;
    if(!pending||!Array.isArray(pending.items)) return null;
    let items=normalizeItems(pending.items);
    if(d==='5')items=migrateDay5Presentation(items);
    /* Saved Override and Pending Draft are both user edits. The draft is a layer over the committed
       list it was started from: replay only what the draft changed on top of the CURRENT saved list so a
       newer saved edit is never silently masked, while the draft's own edits/deletions still win. */
    const saved=getDayOverrideItems(d);
    const base=Array.isArray(pending.basedOnItems)?pending.basedOnItems:(Array.isArray(pending.baseItems)?pending.baseItems:null);
    if(saved){
      const merged=base?rebaseDay(items,base,saved):legacyRebaseDay(items,saved);
      return d==='5'?migrateDay5Presentation(merged):merged;
    }
    return items;
  }

  /* Removes only the itinerary-related entries of the persisted admin draft
     that belong to a previous master, leaving every other pending change
     (and the draft itself) intact. Call once per page load — not on every
     render — since it performs a write. (Test D) */
  function pruneStaleDraftItineraryChanges(){ getDraftMigrated(); }

  /* Single resolver used by every itinerary consumer:
     pending (validated) -> saved override (validated) -> master. */
  /* Timeline edits own presentation/order content, not cross-surface relationship
     metadata. When an override was saved before Guide/Booking relationship metadata was
     added to the current master, hydrate those relationship fields from the current
     master by stable item id. This prevents an otherwise-valid saved timeline override
     from masking Guide/Booking actions introduced by a newer relationship model. */
  const RELATIONSHIP_FIELDS=['placeId','bookingId','guideIds','alternativeGuideIds','guideGroups','parkingGuideId','currencyGuide','showShoppingDirectory'];
  function hydrateRelationships(items,masterItems){
    const masters=new Map((masterItems||[]).filter(item=>item&&item.id).map(item=>[String(item.id),item]));
    return (items||[]).map(function(item){
      const copy=clone(item),master=copy&&copy.id?masters.get(String(copy.id)):null;
      if(!master)return copy;
      RELATIONSHIP_FIELDS.forEach(function(field){
        if(Object.prototype.hasOwnProperty.call(master,field)) copy[field]=clone(master[field]);
        else delete copy[field];
      });
      return copy;
    });
  }
  function resolveDayItems(dayKey,masterItems){
    const pending=getPendingDayItems(dayKey);
    if(pending) return hydrateRelationships(applyOct22Approvals(dayKey,pending),masterItems);
    const saved=getDayOverrideItems(dayKey);
    if(saved) return hydrateRelationships(applyOct22Approvals(dayKey,String(dayKey)==='2'?reconcileDay2Breakfast(saved,saved,null):saved),masterItems);
    return normalizeItems(masterItems||[]);
  }

  /* Used by sync-runtime.js to decide whether a cached/fetched Supabase
     publication is compatible with the master file that is CURRENTLY
     deployed on this device. A publication built from an older/different
     master must never be allowed to mask a newer one. */
  function isCompatibleSnapshotPayload(payload){
    const current=getMasterRevision();
    return !!(current&&payload&&typeof payload==='object'&&payload.masterRevision===current);
  }

  root.ITINERARY_AUTHORITY=Object.freeze({
    getMasterRevision,
    commitDayChangesChecked,markSynced,getPristineMaster,getDayEntry,mergeRemoteDay,rebaseDay,rebasePublishedItinerary,
    resolveDayItems,
    getDayOverrideItems,
    getPendingDayItems,makeDraftPayload,migrateDraftObject,applyCrossDayMoves,
    commitDayChanges,
    clearDayOverride,
    pruneStaleDraftItineraryChanges,
    isCompatibleSnapshotPayload,
    normalizeItems,normalizeItineraryData
  });
  /* RC29.138 lifecycle: hydration must run after this authority exists (so an older publication can be
     rebased) AND the production projection must be rebuilt afterwards. GenerationSelectionAdapter builds
     PRODUCTION_PROJECTION when it loads, which is before this file; without the rebuild every page renders
     the pre-hydration Master and cloud Timeline edits are invisible. */
  (function hydrateThenRebuildProjection(){
    if(!(root.TRIP_SYNC&&typeof root.TRIP_SYNC.hydrateStaticData==='function'&&root.TRAVEL_DATASETS))return;
    let result=null;
    try{result=root.TRIP_SYNC.hydrateStaticData(root.TRAVEL_DATASETS);}catch(error){result=null;}
    const adapter=root.GenerationSelectionAdapter;
    if(result&&result.ok&&result.applied&&result.applied.length&&adapter&&typeof adapter.rebuild==='function'&&root.TRIP_CONFIG){
      try{adapter.rebuild(root.TRAVEL_DATASETS,root.TRIP_CONFIG);}
      catch(error){try{console.warn('Production projection rebuild after hydration failed',error&&error.message,(error&&(error.validation||error.result||error.report))&&JSON.stringify(error.validation||error.result||error.report).slice(0,1200));}catch(_){}}
    }
  })();
  /* Persist saved-store and draft migrations once, before admin.js caches the draft. */
  try{getValidatedStore();getDraftMigrated();}catch(error){try{console.warn('Itinerary migration deferred',error);}catch(_){}}
})(globalThis);
