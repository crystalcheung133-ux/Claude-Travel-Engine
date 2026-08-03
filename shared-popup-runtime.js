/* Travel Engine E2C-Rebase — shared popup navigation authority. */
(function(global){
'use strict';
const doc=global.document;
if(!doc)return;
let lastGuideCategory='';

function esc(value){return String(value==null?'':value).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
function ensureHosts(){
  if(!doc.body)return;
  if(!doc.getElementById('tripModal')){
    const modal=doc.createElement('div');
    modal.id='tripModal';modal.className='modal';modal.setAttribute('aria-hidden','true');
    modal.innerHTML='<div class="trip-sheet" role="dialog" aria-modal="true" aria-label="Trip information"><button class="modal-close" type="button" aria-label="Close Trip information">×</button><div id="tripModalContent"></div></div>';
    doc.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click',()=>global.closeTripModal&&global.closeTripModal());
    modal.addEventListener('click',e=>{if(e.target===modal&&global.closeTripModal)global.closeTripModal();});
  }
  if(!doc.getElementById('guideModal')){
    const modal=doc.createElement('div');
    modal.id='guideModal';modal.className='modal';modal.setAttribute('aria-hidden','true');
    modal.innerHTML='<div class="guide-sheet" role="dialog" aria-modal="true" aria-label="Trip guide"><button class="modal-close" type="button" aria-label="Close Guide">×</button><div id="guideModalContent"></div></div>';
    doc.body.appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click',()=>global.closeGuideModal&&global.closeGuideModal());
    modal.addEventListener('click',e=>{if(e.target===modal&&global.closeGuideModal)global.closeGuideModal();});
  }
}
function showModal(id){
  ensureHosts();
  const modal=doc.getElementById(id);if(!modal)return;
  doc.querySelectorAll('#tripModal.show,#guideModal.show').forEach(x=>{if(x!==modal)x.classList.remove('show');});
  modal.classList.add('show');modal.setAttribute('aria-hidden','false');
  const sheet=modal.querySelector('.trip-sheet,.guide-sheet');if(sheet)sheet.scrollTop=0;
}
function hideModal(id){const modal=doc.getElementById(id);if(modal){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');}}
function closeMenus(){doc.querySelectorAll('.mini-menu.show').forEach(x=>x.classList.remove('show'));}

function tripBody(key,t){
  if(key==='emergency'&&typeof global.compactEmergencyHTML==='function')return global.compactEmergencyHTML(t.body);
  if(key==='stay'&&typeof global.buildAccommodationListHTML==='function')return global.buildAccommodationListHTML();
  if(key==='activities'&&typeof global.buildActivityBookingListHTML==='function')return global.buildActivityBookingListHTML();
  return t.body||'';
}
function renderTripCard(key){
  ensureHosts();closeMenus();
  const trip=global.PRODUCTION_TRIP;const t=trip&&trip.cards&&trip.cards[key];
  const content=doc.getElementById('tripModalContent');if(!content)return;
  if(!t){content.innerHTML='<div class="route-error-state"><h2>No Trip Info</h2><p>This Trip Info card is not available.</p></div>';showModal('tripModal');return;}
  const order=trip.order.filter(k=>trip.cards[k]);const idx=order.indexOf(key);const prev=order[(idx-1+order.length)%order.length],next=order[(idx+1)%order.length];
  const summary=typeof global.tripSyncSummary==='function'?global.tripSyncSummary():'';
  content.innerHTML='<div class="trip-onepage trip-onepage-'+esc(key)+'"><p class="kicker">Trip</p><h2>'+t.title+'</h2>'+tripBody(key,t)+'<div class="guide-next-row"><button class="pill" type="button" data-popup-trip="'+esc(prev)+'">‹ Previous</button><button class="pill" type="button" data-popup-trip="'+esc(next)+'">Next ›</button></div>'+(summary?'<p class="timestamp trip-build-summary">'+summary+'</p>':'')+'</div>';
  showModal('tripModal');
  if(key==='checklist'&&typeof global.loadChecklist==='function')setTimeout(global.loadChecklist,0);
}
function renderAccommodationDetail(id,override,saved){
  ensureHosts();closeMenus();
  const booking=override||(typeof global.getBookingById==='function'?global.getBookingById(id):null);
  const content=doc.getElementById('tripModalContent');if(!content)return;
  const detail=typeof global.buildAccommodationDetailHTML==='function'?global.buildAccommodationDetailHTML(booking):'<p>Booking unavailable.</p>';
  content.innerHTML='<div class="trip-onepage trip-onepage-stay accommodation-onepage-detail"><button class="accommodation-back" type="button" data-popup-trip="stay">‹ All accommodation</button><p class="kicker">Trip · Accommodation</p><h2>'+esc(booking?booking.title:'Accommodation')+'</h2>'+(saved?'<p class="timestamp booking-save-success" role="status">Saved ✓</p>':'')+detail+'</div>';
  showModal('tripModal');
}
function renderActivityDetail(id,override,saved){
  ensureHosts();closeMenus();
  const booking=override||(typeof global.getBookingById==='function'?global.getBookingById(id):null);
  const content=doc.getElementById('tripModalContent');if(!content)return;
  const detail=typeof global.buildActivityBookingDetailHTML==='function'?global.buildActivityBookingDetailHTML(booking):'<p>Booking unavailable.</p>';
  content.innerHTML='<div class="trip-onepage accommodation-onepage-detail"><button class="accommodation-back" type="button" data-popup-trip="activities">‹ All activities</button><p class="kicker">Trip · Activities</p><h2>'+esc(booking?booking.title:'Activity Booking')+'</h2>'+(saved?'<p class="timestamp booking-save-success" role="status">Saved ✓</p>':'')+detail+'</div>';
  showModal('tripModal');
}

function categoryKeys(){
  const cats=global.PRODUCTION_GUIDE&&global.PRODUCTION_GUIDE.categories||{};
  return Object.keys(cats).filter(k=>typeof global.guideCategoryItems!=='function'||global.guideCategoryItems(k).length);
}
function categoryTitle(key){return typeof global.guideCategoryHeading==='function'?global.guideCategoryHeading(key):key;}
function categoryIcon(key){return ({ATTRACTIONS:'🍃',ACTIVITIES:'🎟️',DINING:'🍽',STAY:'🏨',SHOP:'🛍'})[key]||'📖';}
function renderGuideRoot(){
  ensureHosts();closeMenus();
  const keys=categoryKeys(),content=doc.getElementById('guideModalContent');if(!content)return;
  content.innerHTML='<div class="guide-onepage"><p class="kicker">Guide</p><h2>Browse Guide</h2><div class="category-pop-list">'+keys.map(k=>'<button type="button" data-popup-guide-category="'+esc(k)+'"><span><span class="guide-list-title">'+categoryIcon(k)+' '+esc(categoryTitle(k))+'</span></span><span class="guide-list-chevron">›</span></button>').join('')+'</div></div>';
  showModal('guideModal');
}
function renderGuideCategory(cat){
  ensureHosts();closeMenus();lastGuideCategory=cat;
  const content=doc.getElementById('guideModalContent');if(!content)return;
  const list=typeof global.guideSortedCategoryItems==='function'?global.guideSortedCategoryItems(cat):(typeof global.guideCategoryItems==='function'?global.guideCategoryItems(cat):[]);
  const rows=list.map(i=>'<button type="button" data-popup-guide-place="'+esc(i.key)+'"><span><span class="guide-list-title">'+(i.emoji||'')+' '+esc(i.title||'')+'</span><span class="guide-list-sub">'+esc(i.sub||'')+'</span></span><span class="guide-list-chevron">›</span></button>').join('');
  content.innerHTML='<div class="guide-onepage"><button class="accommodation-back" type="button" data-popup-guide-root>‹ Guide categories</button><p class="kicker">Guide</p><h2>'+esc(categoryTitle(cat))+'</h2><div class="category-pop-list guide-category-grouped">'+(rows||'<p class="timestamp">No Guide items are available.</p>')+'</div></div>';
  showModal('guideModal');
}
function renderGuidePlace(key){
  ensureHosts();closeMenus();
  const g=global.PRODUCTION_GUIDE&&global.PRODUCTION_GUIDE.places&&global.PRODUCTION_GUIDE.places[key];const content=doc.getElementById('guideModalContent');if(!content)return;
  if(!g){content.innerHTML='<div class="route-error-state"><h2>Item Not Found</h2><p>This Guide place is not available.</p></div>';showModal('guideModal');return;}
  lastGuideCategory=g.cat||lastGuideCategory;
  const quick=typeof global.quickInfoHTML==='function'?global.quickInfoHTML(g,key):'';
  const route=typeof global.routeStopsHTML==='function'?global.routeStopsHTML(g):'';
  const sections=typeof global.compactGuideSections==='function'?global.compactGuideSections(g):'';
  const nav=typeof global.guideNavButtons==='function'?global.guideNavButtons(key):'';
  content.innerHTML='<div class="guide-onepage"><button class="accommodation-back" type="button" data-popup-guide-category="'+esc(lastGuideCategory)+'">‹ '+esc(categoryTitle(lastGuideCategory))+'</button><p class="kicker">Guide</p><h2>'+(g.emoji||'')+' '+esc(g.title||'')+'</h2><p class="guide-onepage-sub"><strong>'+esc(g.sub||'')+'</strong></p><p class="guide-onepage-desc">'+(g.desc||'')+'</p>'+quick+route+sections+nav+'</div>';
  showModal('guideModal');
}
function renderGuideGroup(keys){
  const clean=[...new Set((keys||[]).filter(k=>global.PRODUCTION_GUIDE&&global.PRODUCTION_GUIDE.places&&global.PRODUCTION_GUIDE.places[k]))];
  if(clean.length===1){renderGuidePlace(clean[0]);return;}
  ensureHosts();const content=doc.getElementById('guideModalContent');if(!content)return;
  content.innerHTML='<div class="guide-onepage"><p class="kicker">Guide</p><h2>Choose an option</h2><div class="category-pop-list">'+clean.map(k=>{const g=global.PRODUCTION_GUIDE.places[k];return '<button type="button" data-popup-guide-place="'+esc(k)+'"><span><span class="guide-list-title">'+(g.emoji||'')+' '+esc(g.title||'')+'</span><span class="guide-list-sub">'+esc(g.sub||'')+'</span></span><span class="guide-list-chevron">›</span></button>';}).join('')+'</div></div>';
  showModal('guideModal');
}

function bind(){
  ensureHosts();
  global.openTripCard=renderTripCard;
  global.openAccommodationList=()=>renderTripCard('stay');
  global.openAccommodationDetail=renderAccommodationDetail;
  global.openActivityBookingDetail=renderActivityDetail;
  global.closeTripModal=function(){hideModal('tripModal');closeMenus();return true;};
  global.openGuideModal=renderGuidePlace;
  global.openGuideCategory=renderGuideCategory;
  global.openGuideGroupFromDay=function(keys){renderGuideGroup(keys);};
  global.closeGuideModal=function(){hideModal('guideModal');closeMenus();return true;};
  doc.querySelectorAll('.guide-trigger').forEach(a=>{if(a.dataset.sharedPopupBound)return;a.dataset.sharedPopupBound='1';a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();renderGuideRoot();},true);});
  doc.addEventListener('click',e=>{
    const tripLink=e.target.closest('#tripMenu [data-trip-info-ref]');if(tripLink){e.preventDefault();e.stopPropagation();renderTripCard(tripLink.dataset.tripInfoRef);return;}
    const tripBtn=e.target.closest('[data-popup-trip]');if(tripBtn){e.preventDefault();renderTripCard(tripBtn.dataset.popupTrip);return;}
    const root=e.target.closest('[data-popup-guide-root]');if(root){e.preventDefault();renderGuideRoot();return;}
    const cat=e.target.closest('[data-popup-guide-category]');if(cat){e.preventDefault();renderGuideCategory(cat.dataset.popupGuideCategory);return;}
    const place=e.target.closest('[data-popup-guide-place]');if(place){e.preventDefault();renderGuidePlace(place.dataset.popupGuidePlace);return;}
    const guideRoute=e.target.closest('button[onclick*="goPage(\'place\'"]');if(guideRoute){const match=guideRoute.getAttribute('onclick').match(/placeId:\'([^\']+)/);if(match){e.preventDefault();e.stopImmediatePropagation();renderGuidePlace(match[1]);}}
  },true);
  doc.addEventListener('keydown',e=>{if(e.key==='Escape'){if(doc.getElementById('tripModal')?.classList.contains('show'))global.closeTripModal();else if(doc.getElementById('guideModal')?.classList.contains('show'))global.closeGuideModal();}});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})(window);
