(function(global){
  'use strict';

  const config=global.NAVIGATION_CONFIG;
  if(!config) throw new Error('NAVIGATION_CONFIG must load before navigation.js');

  function page(name){
    return config.pages[name] || config.pages[config.fallback.unknown] || config.pages.home;
  }

  function queryName(name){
    return config.query[name] || name;
  }

  function hashName(name){
    return config.hash[name] || name;
  }

  function params(search){
    return new URLSearchParams(search == null ? global.location.search : search);
  }

  function getQuery(name, fallback, search){
    const value=params(search).get(queryName(name));
    return value == null || value === '' ? fallback : value;
  }

  function getQueryList(name, search){
    const value=getQuery(name,'',search);
    return String(value).split(',').map(item=>item.trim()).filter(Boolean);
  }

  function build(pageName, options){
    const opts=options || {};
    const target=page(pageName);
    const search=new URLSearchParams();
    Object.entries(opts.query || {}).forEach(([name,value])=>{
      if(value == null || value === '') return;
      search.set(queryName(name),String(value));
    });
    const queryString=search.toString();
    const hash=opts.hash ? '#'+encodeURIComponent(hashName(opts.hash)) : '';
    return target+(queryString?'?'+queryString:'')+hash;
  }

  function currentPage(){
    const path=(global.location.pathname || '').split('/').pop();
    return path || config.pages.home;
  }

  function currentRelativeUrl(options){
    const opts=options || {};
    const pathname=global.location.pathname || page('home');
    const search=opts.includeSearch === false ? '' : (global.location.search || '');
    let hash=opts.includeHash === false ? '' : (global.location.hash || '');
    if(Object.prototype.hasOwnProperty.call(opts,'hash')){
      hash=opts.hash == null || opts.hash === '' ? '' : '#'+encodeURIComponent(String(opts.hash));
    }
    return pathname+search+hash;
  }

  function currentAbsoluteUrl(){
    return global.location.href;
  }

  function getHash(fallback){
    const raw=(global.location.hash || '').replace(/^#/,'');
    if(!raw) return fallback;
    try{return decodeURIComponent(raw);}catch(e){return raw;}
  }

  function hasSameOriginReferrer(){
    if(!global.document || !global.document.referrer) return false;
    try{return new URL(global.document.referrer,global.location.href).origin === global.location.origin;}
    catch(e){return false;}
  }

  function isPage(name){
    return currentPage() === page(name);
  }

  function hasHash(name){
    return global.location.hash === '#'+hashName(name);
  }

  function setHash(name){
    global.location.hash=hashName(name);
  }

  function go(target){
    global.location.href=target;
  }

  function goPage(name, options){
    go(build(name,options));
  }

  function permittedReturnTarget(target, fallbackPage){
    const fallback=page(fallbackPage || config.fallback.unknown);
    if(!target) return fallback;
    try{
      const resolved=new URL(target,global.location.href);
      if(resolved.origin !== global.location.origin) return fallback;
      const filename=resolved.pathname.split('/').pop() || config.pages.home;
      if(!config.permittedReturnPages.includes(filename)) return fallback;
      return resolved.pathname+resolved.search+resolved.hash;
    }catch(e){
      return fallback;
    }
  }

  /* RC4.6 — PWA cold-launch canonical entry enforcement.
     This module loads before storage-config.js/storage.js in every page's
     required script order, so it uses sessionStorage directly rather than
     the shared STORAGE helper. The key name follows the same
     travel_engine_..._v1 convention as STORAGE_CONFIG keys. */
  const PWA_SESSION_KEY='travel_engine_pwa_session_active_v1';

  function isStandaloneDisplay(){
    try{
      if(global.navigator && global.navigator.standalone===true) return true;
      return !!(global.matchMedia && global.matchMedia('(display-mode: standalone)').matches);
    }catch(e){return false;}
  }

  function hasActiveSession(){
    try{return global.sessionStorage.getItem(PWA_SESSION_KEY)==='1';}
    catch(e){return true;} // fail open: never force a redirect loop if storage is unavailable
  }

  function markSessionActive(){
    try{global.sessionStorage.setItem(PWA_SESSION_KEY,'1');}catch(e){}
  }

  /* True only for a genuine cold start of the installed standalone app:
     display-mode is standalone AND no flag survived from a prior page in
     this process. A background/resume (no force-close) never re-runs this
     script, so the flag set on first load is still present when the user
     returns. A true force-close discards the process and its
     sessionStorage, so the next launch reads as a fresh session again,
     regardless of which page the OS happens to reopen. */
  function isColdLaunch(){
    return isStandaloneDisplay() && !hasActiveSession();
  }

  function enforceCanonicalEntry(){
    if(isPage('offline')) return; // never redirect the offline fallback; avoid loops with no network
    const cold=isColdLaunch();
    if(cold && !isPage('home')){
      markSessionActive();
      go(build('home',{query:{source:'pwa',coldLaunch:'1'}}));
      return;
    }
    markSessionActive();
  }



  /* E2C.1 — preserve the original Trip popup selector while keeping
     full-page ownership for Trip detail content. The popup is Engine-owned;
     Trip data supplies semantic tripInfo IDs and labels only. */
  function tripMenuData(){
    const sets=global.TRAVEL_DATASETS || {};
    const data=sets.TRIP_DATA || {};
    const order=Array.isArray(sets.TRIP_ORDER) ? sets.TRIP_ORDER : Object.keys(data);
    return order.filter(key=>data[key]).map(key=>({key:String(key),card:data[key]}));
  }

  function stripMarkup(value){
    const text=String(value == null ? '' : value);
    if(!global.document) return text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    const node=global.document.createElement('div');
    node.innerHTML=text;
    return (node.textContent || '').replace(/\s+/g,' ').trim();
  }

  function tripMenuSubtitle(key,card){
    const configured=global.TRIP_CONFIG && global.TRIP_CONFIG.tripMenu && global.TRIP_CONFIG.tripMenu[key];
    if(configured) return String(configured);
    const defaults={
      flights:'Outbound & return',vehicle:'Pickup & return',stay:'Bookings & addresses',
      activities:'Confirmed tours & experiences',checklist:'Before the Trip',emergency:'Contacts & medical care'
    };
    if(defaults[key]) return defaults[key];
    const body=stripMarkup(card && card.body);
    return body.length>72 ? body.slice(0,69)+'…' : body;
  }

  function ensureTripMenu(){
    if(!global.document || !global.document.body || typeof global.document.createElement!=='function') return null;
    let menu=global.document.getElementById('tripMenu');
    if(!menu){
      menu=global.document.createElement('div');
      menu.id='tripMenu';
      menu.className='mini-menu';
      menu.setAttribute('aria-label','Trip information');
      global.document.body.appendChild(menu);
    }
    const entries=tripMenuData();
    menu.innerHTML=entries.map(({key,card})=>{
      const title=stripMarkup(card.title || key);
      const subtitle=tripMenuSubtitle(key,card);
      const href=build('trip',{query:{tripInfoId:key}});
      return '<a href="'+href+'" data-trip-info-ref="'+key+'"><span><span class="menu-title">'+title+'</span><span class="menu-sub">'+subtitle+'</span></span><span>›</span></a>';
    }).join('');
    return menu;
  }

  function closeTripMenu(){
    const menu=global.document && global.document.getElementById('tripMenu');
    if(menu) menu.classList.remove('show');
  }

  function toggleTripMenu(event){
    if(event){event.preventDefault();event.stopPropagation();}
    const menu=ensureTripMenu();
    if(!menu) return false;
    const opening=!menu.classList.contains('show');
    global.document.querySelectorAll('.mini-menu.show').forEach(item=>item.classList.remove('show'));
    if(opening) menu.classList.add('show');
    return false;
  }

  function installTripMenu(){
    if(!global.document || typeof global.document.querySelectorAll!=='function') return;
    ensureTripMenu();
    global.document.querySelectorAll('.trip-trigger').forEach(trigger=>{
      if(trigger.dataset.tripPopupBound==='1') return;
      trigger.dataset.tripPopupBound='1';
      trigger.addEventListener('click',toggleTripMenu);
      trigger.setAttribute('aria-haspopup','menu');
    });
    global.document.addEventListener('click',event=>{
      const menu=global.document.getElementById('tripMenu');
      if(!menu || !menu.classList.contains('show')) return;
      if(menu.contains(event.target) || event.target.closest('.trip-trigger')) return;
      closeTripMenu();
    });
    global.document.addEventListener('keydown',event=>{if(event.key==='Escape') closeTripMenu();});
  }

  const NAVIGATION=Object.freeze({
    page,
    queryName,
    hashName,
    params,
    getQuery,
    getQueryList,
    build,
    currentPage,
    currentRelativeUrl,
    currentAbsoluteUrl,
    getHash,
    hasSameOriginReferrer,
    isPage,
    hasHash,
    setHash,
    go,
    goPage,
    permittedReturnTarget,
    isStandaloneDisplay,
    isColdLaunch,
    enforceCanonicalEntry,
    ensureTripMenu,
    toggleTripMenu,
    closeTripMenu
  });

  global.NAVIGATION=NAVIGATION;
  enforceCanonicalEntry();
  if(global.document){
    if(global.document.readyState==='loading') global.document.addEventListener('DOMContentLoaded',installTripMenu,{once:true});
    else installTripMenu();
  }
})(typeof self !== 'undefined' ? self : window);
