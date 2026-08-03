/* trip-failure-runtime.js — Stage E2A-5 single Engine-owned failure state.
   Any Engine module that needs to know whether TRIP_CONFIG is present and
   usable, or needs to visibly report a missing/invalid Trip config, goes
   through this one shared surface instead of each module keeping its own
   NZ-specific fallback literal ('nz-family-2026' / 'lee' / 'fowlers' / 'yau').
   Loads before trip-config.js and must never throw, regardless of whether
   TRIP_CONFIG exists yet. */
(function(root){
  'use strict';

  var NO_TRIP_LOADED_TEXT = 'No Trip Loaded';
  var warned = false;

  function cfg(){
    try{ return root.TRIP_CONFIG || null; }catch(e){ return null; }
  }

  /* True only when there is a real, non-empty trip identity to key sync/
     storage/export operations on. Deliberately does not fall back to any
     hardcoded tripId — callers must treat a false result as "do not sync,
     do not export, do not assume a party" rather than substituting one. */
  function hasTripConfig(){
    var c = cfg();
    return !!(c && typeof c.storageNamespace === 'string' && c.storageNamespace.length > 0);
  }

  function tripId(){
    return hasTripConfig() ? cfg().storageNamespace : null;
  }

  /* Logs once per page load (not once per call site) so a missing config
     produces one clear, controlled console entry instead of a flood. */
  function reportTripLoadFailure(context){
    if(warned) return;
    warned = true;
    if(typeof console !== 'undefined' && console.error){
      console.error('[Engine] TRIP_CONFIG is missing or invalid'+(context?(' ('+context+')'):'')+
        '. Refusing to fabricate a default trip identity or party — sync, export and identity ' +
        'surfaces will show "'+NO_TRIP_LOADED_TEXT+'" until a valid Trip Package loads.');
    }
  }

  /* Sets every matched visible-identity element to the shared failure text.
     Defaults to [data-friend-label], the one hook used for visible party
     identity across the Engine today. */
  function showNoTripLoaded(selector){
    if(typeof document === 'undefined') return;
    document.querySelectorAll(selector || '[data-friend-label]').forEach(function(el){
      el.textContent = NO_TRIP_LOADED_TEXT;
      if(el.dataset && 'family' in el.dataset) el.dataset.family = '';
    });
  }

  root.TRIP_FAILURE = Object.freeze({
    NO_TRIP_LOADED_TEXT: NO_TRIP_LOADED_TEXT,
    hasTripConfig: hasTripConfig,
    tripId: tripId,
    reportTripLoadFailure: reportTripLoadFailure,
    showNoTripLoaded: showNoTripLoaded
  });
})(globalThis);
