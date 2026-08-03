/* storage-migration-runtime.js — Stage E2B one-time NZ legacy migration.
   The old global keys belonged to the production NZ trip. They are migrated
   only when that same tripId is active; another Trip can never claim them. */
(function(root){
  'use strict';
  const cfg=root.STORAGE_CONFIG;
  const store=root.STORAGE&&root.STORAGE.local;
  if(!cfg||!store)return;

  const LEGACY_OWNER=cfg.legacyOwner;
  const markerKey=cfg.keys.migrationMarker;
  const now=()=>new Date().toISOString();
  function exists(key){return key&&store.get(key,null)!==null;}
  function copy(oldKey,newKey,transform){
    if(!oldKey||!newKey||!exists(oldKey)||exists(newKey))return false;
    const raw=store.get(oldKey,null);
    let value=raw;
    try{value=JSON.parse(raw);}catch(e){}
    if(transform)value=transform(value,raw);
    if(typeof value==='string')store.set(newKey,value);else store.writeJSON(newKey,value);
    return true;
  }
  function remove(key){if(key)store.remove(key);}
  function quarantine(oldKey,newKey){
    if(!exists(oldKey))return false;
    if(!exists(newKey)){
      const raw=store.get(oldKey,null);
      store.writeJSON(newKey,{legacyKey:oldKey,quarantinedAt:now(),rawValue:raw});
    }
    remove(oldKey);return true;
  }
  function migrateMomentEntries(){
    const legacy=cfg.legacyKeys;
    for(const oldKey of store.keys()){
      if(oldKey.startsWith(legacy.latestMomentPrefix)){
        const id=oldKey.slice(legacy.latestMomentPrefix.length);
        copy(oldKey,cfg.latestMomentKey(id));remove(oldKey);
      }else if(oldKey.startsWith(legacy.momentPrefix)){
        const id=oldKey.slice(legacy.momentPrefix.length);
        copy(oldKey,cfg.momentKey(id));remove(oldKey);
      }
    }
  }
  function run(){
    if(exists(markerKey))return;
    if(!LEGACY_OWNER||cfg.tripId!==LEGACY_OWNER){
      store.writeJSON(markerKey,{version:1,status:'not-legacy-owner',completedAt:now()});
      return;
    }
    const L=cfg.legacyKeys,K=cfg.keys,migrated=[];
    const pairs=[
      [L.expenses,K.expenses],[L.expenseSyncTombstones,K.expenseSyncTombstones],[L.expenseSyncMeta,K.expenseSyncMeta],
      [L.momentsList,K.momentsList],[L.momentsFreeform,K.momentsFreeform],[L.momentSyncTombstones,K.momentSyncTombstones],[L.momentSyncMeta,K.momentSyncMeta],
      [L.checklist,K.checklist],[L.friend,K.friend],[L.itineraryOverrides,K.itineraryOverrides],
      [L.itineraryMasterSignature,K.itineraryMasterSignature],[L.changedPlans,K.changedPlans],
      [L.canonicalExpenseState,K.canonicalExpenseState],[L.expenseReadShadowState,K.expenseReadShadowState],
      [L.tripGeneration,K.tripGeneration]
    ];
    pairs.forEach(([oldKey,newKey])=>{if(copy(oldKey,newKey)){migrated.push(oldKey);remove(oldKey);}});
    migrateMomentEntries();

    /* Unsafe/transient state is intentionally not trusted after migration. */
    [L.adminMode,L.adminDraft,L.guideNavContext,L.guideNavReopen,L.cloudSnapshot,L.cloudSyncMeta,L.cloudReloadMarker].forEach(remove);

    /* No booking master signature exists. Preserve the bytes for recovery,
       but never apply them automatically against a possibly different master. */
    if(quarantine(L.bookingOverrides,K.bookingMigrationQuarantine))migrated.push(L.bookingOverrides+' (quarantined)');
    /* Completion changes lifecycle presentation, so preserve for explicit
       recovery instead of silently applying or destroying it. */
    if(quarantine(L.tripCompletion,K.completionMigrationQuarantine))migrated.push(L.tripCompletion+' (quarantined)');
    remove(L.tripCompletion+':notice');

    store.writeJSON(markerKey,{version:1,status:'completed',legacyOwner:LEGACY_OWNER,migrated,completedAt:now()});
  }
  try{run();}catch(error){console.error('[StorageMigration E2B]',error);}
})(globalThis);
