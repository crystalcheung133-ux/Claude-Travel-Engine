/* E2C.2 — shared Trip identity binding. Build/runtime identity only; no navigation ownership. */
(function(root){
  'use strict';
  function value(path){
    var cur=root.TRIP_CONFIG||{};
    String(path||'').split('.').filter(Boolean).forEach(function(key){cur=cur==null?undefined:cur[key];});
    return cur;
  }
  function assetFor(role){
    var cfg=root.TRIP_CONFIG||{};
    var logo=cfg.logo||{};
    if(role==='header') return logo.header||logo.splash||'';
    if(role==='splash') return logo.splash||logo.header||'';
    return logo[role]||'';
  }
  function apply(){
    var cfg=root.TRIP_CONFIG;
    if(!cfg) return;
    document.querySelectorAll('[data-brand-text]').forEach(function(el){
      var key=el.getAttribute('data-brand-text');
      var v=value(key);
      if(v!=null) el.textContent=String(v);
    });
    document.querySelectorAll('[data-brand-logo]').forEach(function(img){
      var src=assetFor(img.getAttribute('data-brand-logo'));
      if(src){img.src=src;img.alt=cfg.tripName||cfg.navLabel||'';}
      else img.removeAttribute('src');
    });
    document.querySelectorAll('[data-trip-page-title]').forEach(function(el){
      var suffix=el.getAttribute('data-trip-page-title');
      el.textContent=(cfg.tripName||cfg.navLabel||'Travel Engine')+(suffix?' · '+suffix:'');
    });
    document.querySelectorAll('[data-trip-theme-color]').forEach(function(el){
      var colour=(cfg.theme&&cfg.theme.primary)||'#2F574C';
      el.setAttribute('content',colour);
    });
    document.querySelectorAll('[data-trip-apple-title]').forEach(function(el){el.setAttribute('content',cfg.shortName||cfg.tripName||'Travel Engine');});
    document.querySelectorAll('[data-trip-icon]').forEach(function(el){
      var role=el.getAttribute('data-trip-icon');
      var src=assetFor(role)||assetFor('header');
      if(src) el.setAttribute('href',src);
    });
    var geo=root.GEO_CONFIG||{};
    document.querySelectorAll('[data-geo-label]').forEach(function(el){var k=el.getAttribute('data-geo-label');if(geo[k]!=null)el.textContent=String(geo[k]);});
    document.querySelectorAll('[data-geo-flag]').forEach(function(el){var k=el.getAttribute('data-geo-flag');if(geo[k]!=null)el.textContent=String(geo[k]);});
  }
  root.applyTripIdentity=apply;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
})(globalThis);
