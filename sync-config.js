/* sync-config.js — Stage 9A-2 Supabase read-sync configuration.
   Browser-safe publishable/anon key only. Never place a secret/service-role key here. */
(function(root){
  'use strict';

  /* Fill these three browser-safe values once, or supply window.TRAVEL_ENGINE_SUPABASE before this file loads. */
  const project=Object.freeze({
    enabled:true,
    url:'https://dafgbqygccvctifrevpa.supabase.co',
    publishableKey:'sb_publishable_gjObd52pFWZh5VDWD5wKZw_jHxzV7yP'
  });
  const runtimeOverride=root.TRAVEL_ENGINE_SUPABASE||{};
  /* Stage E2A-5: tripId used to silently fall back to the literal
     'nz-family-2026' whenever TRIP_CONFIG hadn't loaded yet or was missing —
     a second Trip Package deployed without a valid config would have synced
     straight into the NZ trip's cloud rows. It now resolves through the one
     shared TRIP_FAILURE.tripId() surface (see trip-failure-runtime.js),
     which returns null rather than fabricating an identifier; every reader
     of config.tripId already treats a falsy tripId as "not configured" and
     refuses to sync (see expense-sync-runtime.js/moment-sync-runtime.js/
     generation-runtime.js's own configured() guards). This module loads
     before trip-config.js, so tripId is still resolved lazily via a getter
     — by the time any sync call actually fires, TRIP_CONFIG has always
     loaded if it's going to. */
  function resolveTripId(){
    if(root.TRIP_FAILURE) return root.TRIP_FAILURE.tripId();
    /* trip-failure-runtime.js not loaded on this page for some reason —
       fail the same way (no identity), never fabricate one. */
    return (root.TRIP_CONFIG&&typeof root.TRIP_CONFIG.storageNamespace==='string'&&root.TRIP_CONFIG.storageNamespace)||null;
  }
  const config=Object.freeze({
    provider:'supabase',
    enabled:runtimeOverride.enabled===true||project.enabled===true,
    url:String(runtimeOverride.url||project.url||''),
    anonKey:String(runtimeOverride.anonKey||runtimeOverride.publishableKey||project.publishableKey||''),
    get tripId(){
      const id=resolveTripId();
      if(!id&&root.TRIP_FAILURE) root.TRIP_FAILURE.reportTripLoadFailure('sync-config.js tripId');
      return id;
    },
    schemaVersion:1,
    tables:Object.freeze({publications:'trip_publications',expenses:'trip_expenses',moments:'trip_moments',generation:'trip_generation'}),
    storage:Object.freeze({momentsBucket:'trip-moments'}),
    rpc:Object.freeze({resetTrip:'reset_trip',publishTrip:'publish_trip_snapshot'}),
    requestTimeoutMs:8000,
    cacheKey:(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys.cloudSnapshot)||'travel_engine_cloud_snapshot_v1',
    metadataKey:(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys.cloudSyncMeta)||'travel_engine_cloud_sync_meta_v1',
    reloadMarkerKey:(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys.cloudReloadMarker)||'travel_engine_cloud_reload_version_v1',
    autoRead:true
  });

  function hasCredentials(){
    return config.enabled===true &&
      /^https:\/\/.+\.supabase\.co\/?$/i.test(config.url) &&
      /^(?:eyJ|sb_publishable_)/.test(config.anonKey) &&
      config.anonKey.length>20;
  }

  const exported=Object.assign({},config,{hasCredentials});
  /* Object.assign above would flatten the tripId getter into whatever value
     TRIP_CONFIG has (or hasn't) loaded at this exact instant — redefine it
     as a live getter on the exported object so it still resolves lazily. */
  Object.defineProperty(exported,'tripId',{
    enumerable:true,
    get:function(){
      const id=resolveTripId();
      if(!id&&root.TRIP_FAILURE) root.TRIP_FAILURE.reportTripLoadFailure('sync-config.js tripId');
      return id;
    }
  });
  root.SYNC_CONFIG=Object.freeze(exported);
})(globalThis);
