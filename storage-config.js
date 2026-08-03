/* storage-config.js — Stage E2B trip-scoped browser-storage ownership.
   Every Engine-owned persistent key is isolated by TRIP_CONFIG.storageNamespace.
   Legacy unscoped keys are exposed only to the one-time NZ migration runtime. */
(function(root){
  'use strict';

  const tripId=String(root.TRIP_CONFIG&&root.TRIP_CONFIG.storageNamespace||'').trim();
  if(!tripId) throw new Error('TRIP_CONFIG.storageNamespace is required before storage-config.js');

  const legacyOwner=String(root.TRIP_CONFIG&&root.TRIP_CONFIG.legacyStorageNamespace||'').trim()||null;
  const schemaVersion=1;
  const prefix=`travel-engine.${tripId}.`;
  const key=(module)=>`${prefix}${module}.v${schemaVersion}`;

  const keys=Object.freeze({
    checklist:key('checklist'),
    expenses:key('expenses'),
    momentsFreeform:key('moments-freeform'),
    momentsList:key('moments-list'),
    friend:key('party'),
    adminMode:key('admin-mode'),
    adminDraft:key('admin-draft'),
    guideNavContext:key('guide-nav-context'),
    guideNavReopen:key('guide-nav-reopen'),
    itineraryOverrides:key('itinerary-overrides'),
    itineraryMasterSignature:key('itinerary-master-signature'),
    tripCompletion:key('trip-completion'),
    changedPlans:key('changed-plans'),
    cloudSnapshot:key('cloud-snapshot'),
    cloudSyncMeta:key('cloud-sync-meta'),
    cloudReloadMarker:key('cloud-reload-version'),
    expenseSyncTombstones:key('expense-tombstones'),
    expenseSyncMeta:key('expense-sync-meta'),
    momentSyncTombstones:key('moment-tombstones'),
    momentSyncMeta:key('moment-sync-meta'),
    canonicalExpenseState:key('canonical-expenses'),
    expenseReadShadowState:key('expense-read-shadow'),
    tripGeneration:key('trip-generation'),
    bookingOverrides:key('booking-overrides'),
    migrationMarker:key('migration-e2b'),
    bookingMigrationQuarantine:key('legacy-booking-overrides-quarantine'),
    completionMigrationQuarantine:key('legacy-trip-completion-quarantine'),
    indexedDbMigrationMarker:key('indexeddb-migration-e2b')
  });

  const sessionKeys=Object.freeze({
    adminUnlocked:key('admin-unlocked-session'),
    bookingReopen:key('booking-reopen-session')
  });

  const legacyKeys=Object.freeze({
    checklist:'checklist',
    expenses:'expenses',
    momentPrefix:'moment_',
    latestMomentPrefix:'moment_latest_',
    momentsFreeform:'moments_freeform',
    momentsList:'moments_list',
    friend:'nz_friend',
    adminMode:'travel_engine_admin_mode_v1',
    adminDraft:'travel_engine_admin_draft_v1',
    guideNavContext:'ccmv_guide_nav_context',
    guideNavReopen:'ccmv_guide_nav_reopen',
    itineraryOverrides:'travel_engine_itinerary_overrides_v1',
    itineraryMasterSignature:'travel_engine_itinerary_master_signature_v1',
    tripCompletion:'travel_engine_trip_completion_v1',
    changedPlans:'travel_engine_changed_plans_v1',
    cloudSnapshot:'travel_engine_cloud_snapshot_v1',
    cloudSyncMeta:'travel_engine_cloud_sync_meta_v1',
    cloudReloadMarker:'travel_engine_cloud_reload_version_v1',
    expenseSyncTombstones:'travel_engine_expense_tombstones_v1',
    expenseSyncMeta:'travel_engine_expense_sync_meta_v1',
    momentSyncTombstones:'travel_engine_moment_tombstones_v1',
    momentSyncMeta:'travel_engine_moment_sync_meta_v1',
    canonicalExpenseState:`${tripId}:canonical_expenses:stage_3_2d:v1`,
    expenseReadShadowState:`${tripId}:canonical_expense_read_shadow:stage_3_2e:v1`,
    tripGeneration:'travel_engine_trip_generation_v1',
    bookingOverrides:'travel_engine_booking_overrides_v1'
  });

  const domains=Object.freeze({
    identity:Object.freeze({friend:keys.friend}),
    checklist:Object.freeze({state:keys.checklist}),
    expenses:Object.freeze({records:keys.expenses,tombstones:keys.expenseSyncTombstones,syncMetadata:keys.expenseSyncMeta}),
    canonicalExpenses:Object.freeze({state:keys.canonicalExpenseState}),
    expenseReadShadow:Object.freeze({state:keys.expenseReadShadowState}),
    moments:Object.freeze({records:keys.momentsList,freeform:keys.momentsFreeform,tombstones:keys.momentSyncTombstones,syncMetadata:keys.momentSyncMeta}),
    admin:Object.freeze({mode:keys.adminMode,draft:keys.adminDraft,unlockedSession:sessionKeys.adminUnlocked}),
    guide:Object.freeze({context:keys.guideNavContext,reopen:keys.guideNavReopen}),
    itinerary:Object.freeze({overrides:keys.itineraryOverrides,masterSignature:keys.itineraryMasterSignature}),
    bookings:Object.freeze({overrides:keys.bookingOverrides}),
    completion:Object.freeze({state:keys.tripCompletion}),
    journey:Object.freeze({changedPlans:keys.changedPlans}),
    sync:Object.freeze({snapshot:keys.cloudSnapshot,metadata:keys.cloudSyncMeta,reloadMarker:keys.cloudReloadMarker})
  });

  function safeId(value){return encodeURIComponent(String(value==null?'':value));}
  function momentKey(id){return `${prefix}moment.${safeId(id)}.v${schemaVersion}`;}
  function latestMomentKey(id){return `${prefix}moment-latest.${safeId(id)}.v${schemaVersion}`;}
  function fxKey(base,quote,version){return `${prefix}fx.${String(base||'').toLowerCase()}-${String(quote||'').toLowerCase()}.v${Number(version||1)}`;}

  root.STORAGE_CONFIG=Object.freeze({
    appPrefix:'travel-engine',tripId,legacyOwner,prefix,version:schemaVersion,
    indexedDbName:`travel-engine-${tripId}`,
    keys,sessionKeys,legacyKeys,domains,momentKey,latestMomentKey,fxKey
  });
})(globalThis);
