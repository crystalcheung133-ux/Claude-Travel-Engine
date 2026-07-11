

/* ============================================================================
   TRAVEL ENGINE ACTIVE-SOURCE NOTE — Stage 4F-S4
   ----------------------------------------------------------------------------
   data.js is the canonical source for trip, place, itinerary, guide, friend
   and booking content. Shared behavior lives in this file; page-specific Day
   and Place render bootstraps remain documented inline in day.html/place.html.

   Expenses use one canonical module for open/save/reset/render/edit/delete/
   history. Moments use one canonical append/edit/delete implementation with
   retained legacy localStorage compatibility reads. See ENGINE_FILE_MAP.md,
   HOW_TO_UPDATE_TRIP.md and ENGINE_CHANGE_PROTOCOL.md.
   ============================================================================ */

function visitDayHTML(key){
  const days=DAY_LINKS[key]||[];
  if(!days.length) return '';
  const buttons=days.map(([label,href])=>`<a class="day-jump-button" href="${href}">${label} →</a>`).join('');
  return `<div class="quick-info-row visit-row"><span class="quick-info-icon">📅</span><span><span class="quick-info-label">Visit Day</span><span class="quick-info-value day-link-row">${buttons}</span></span></div>`;
}


function placeHref(key){
  return `place.html?id=${encodeURIComponent(key)}`;
}
function goPlace(key){
  window.location.href = placeHref(key);
}

function $(id){return document.getElementById(id);}
function closeMiniMenus(){document.querySelectorAll('.mini-menu').forEach(m=>m.classList.remove('show'));}
function clampMenuPosition(n,min,max){return Math.max(min,Math.min(max,n));}
function positionMiniMenu(menu,trigger){
  if(!menu||!trigger)return;
  const rect=trigger.getBoundingClientRect();
  const menuWidth=Math.min(230,window.innerWidth-24);
  const center=rect.left+rect.width/2;
  const left=clampMenuPosition(center,12+menuWidth/2,window.innerWidth-12-menuWidth/2);
  menu.style.left=left+'px';
  menu.style.right='auto';
  menu.style.width=menuWidth+'px';
}
function toggleMenu(id,trigger){
  const m=$(id);
  const open=m&&m.classList.contains('show');
  closeMiniMenus();
  if(m&&!open){positionMiniMenu(m,trigger||document.activeElement);m.classList.add('show');}
}
function toggleTripMenu(){toggleMenu('tripMenu',document.querySelector('.trip-trigger'));}
function toggleGuideMenu(){toggleMenu('guideMenu',document.querySelector('.guide-trigger'));}
function toggleDays(){toggleMenu('daysMenu',document.querySelector('.days-trigger'));}
window.addEventListener('resize',closeMiniMenus);
document.addEventListener('click',e=>{if(!e.target.closest('.mini-menu')&&!e.target.closest('.trip-trigger')&&!e.target.closest('.guide-trigger')&&!e.target.closest('.days-trigger')) closeMiniMenus();});

function getFriend(){return localStorage.getItem('saigon_friend')||'crystal';}
function setFriend(k){
  localStorage.setItem('saigon_friend',k);
  closeFriendModal();
  updateFriendLabels();
  if(document.getElementById('expenseModal')?.classList.contains('show')&&typeof window.resetExpenseForm==='function')window.resetExpenseForm();
  if(document.getElementById('momentsModal')?.classList.contains('show')&&typeof window.simplifyMomentsAuthor==='function')window.simplifyMomentsAuthor();
}
function updateFriendLabels(){const label=FRIENDS[getFriend()]||'👓 Crystal';document.querySelectorAll('[data-friend-label]').forEach(e=>e.textContent=label);}
function openFriendModal(){$('mamaModal').classList.add('show')} function closeFriendModal(){$('mamaModal').classList.remove('show')}


function applyGuideHashView(){
 const directory=document.getElementById('shopping-directory');
 const main=directory?.closest('main');
 if(!directory||!main)return;
 const directoryOnly=location.hash==='#shopping-directory';
 Array.from(main.children).forEach(el=>{el.hidden=directoryOnly&&el!==directory;});
 document.body.classList.toggle('shopping-directory-view',directoryOnly);
 if(directoryOnly)requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
}
function openShoppingDirectoryView(){
 closeGuideModal();closeMiniMenus();
 const onGuide=/guide\.html$/.test(location.pathname)||location.pathname.endsWith('/guide.html');
 if(!onGuide){location.href='guide.html#shopping-directory';return;}
 if(location.hash==='#shopping-directory')applyGuideHashView();
 else location.hash='shopping-directory';
}
window.addEventListener('hashchange',applyGuideHashView);
document.addEventListener('DOMContentLoaded',applyGuideHashView);

function openGuideCategory(cat){
 const list=(CATEGORIES[cat]||[]).slice().sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
 if(cat==='SHOP'){
  const directoryRow=`<button onclick="openShoppingDirectoryView()"><span><span class="guide-list-title">🛍 Shopping Directory</span><span class="guide-list-sub">Optional shops · Near · Best with Day</span></span><span>↓</span></button>`;
  const rows=directoryRow+list.map(i=>`<button onclick="goPlace('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span>›</span></button>`).join('');
  $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>SHOP</h2><div class="category-pop-list">${rows}</div>`;
  closeMiniMenus();$('guideModal').classList.add('show');return;
 }
 if(list.length===1){closeMiniMenus();openGuideModal(list[0].key);return;}
 const rows=list.map(i=>`<button onclick="goPlace('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span>›</span></button>`).join('');
 $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>${cat}</h2><div class="category-pop-list">${rows}</div>`;
 closeMiniMenus();$('guideModal').classList.add('show');
}

function quickInfoInnerHTML(g,key){
 return `<div class="quick-info-top"><span class="category-tag">${g.categoryLabel||g.cat||'Guide'}</span></div><div class="quick-info-grid"><div class="quick-info-row"><span class="quick-info-icon">📍</span><span><span class="quick-info-label">Address</span><span class="quick-info-value">${g.address||'Check before visit'}</span></span></div><div class="quick-info-row"><span class="quick-info-icon">🕘</span><span><span class="quick-info-label">Hours</span><span class="quick-info-value">${g.hours||'Check before visit'}</span></span></div><div class="quick-info-row"><span class="quick-info-icon">💰</span><span><span class="quick-info-label">Price</span><span class="quick-info-value">${g.price||'Varies'}</span></span></div>${visitDayHTML(key)}</div><div class="quick-info-actions"><a class="map-button" href="${g.maps}" target="_blank" rel="noopener">🗺 Open Google Maps</a><button class="moment-button" aria-label="Add Moment" onclick="openMomentsModal('${key}')">✨</button></div>`;
}
function quickInfoHTML(g,key){
 return `<div class="quick-info-card">${quickInfoInnerHTML(g,key)}</div>`;
}

function guideNavButtons(key){const idx=GUIDE_ORDER.indexOf(key); if(idx<0)return ''; const prev=GUIDE_ORDER[(idx-1+GUIDE_ORDER.length)%GUIDE_ORDER.length]; const next=GUIDE_ORDER[(idx+1)%GUIDE_ORDER.length]; return `<div class="guide-next-row"><button class="pill" onclick="openGuideModal('${prev}')">‹ Previous</button><button class="pill" onclick="openGuideModal('${next}')">Next ›</button></div>`;}
function openGuideModal(key){
 const g=PLACES[key]; if(!g)return;
 const sig=(g.signature||[]).map(x=>`<li>${x}</li>`).join('');
 const worth=(g.worth||[]).map(x=>`<li>${x}</li>`).join('');
 $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>${g.emoji} ${g.title}</h2><p><strong>${g.sub}</strong></p>${quickInfoHTML(g,key)}<p>${g.desc}</p>${sig?`<h3>Highlights</h3><ul>${sig}</ul>`:''}${worth?`<h3>Good to Know</h3><ul>${worth}</ul>`:''}${guideNavButtons(key)}`;
 $('guideModal').classList.add('show');
 const sheet=document.querySelector('#guideModal .guide-sheet');
 if(sheet) sheet.scrollTop=0;
}
function closeGuideModal(){$('guideModal').classList.remove('show')}

let currentMomentKey='';
function closeMomentsModal(){$('momentsModal').classList.remove('show')}
function setStars(n){document.querySelectorAll('.star').forEach((el,i)=>el.classList.toggle('active',i<n));$('momentsRating').value=n;}

/* Stage 4C-4: legacy one-per-place Moments functions were removed.
   The active Moments API is the append/edit/delete implementation below
   (moments_list + legacy localStorage compatibility inside renderMoments).
   These vars keep global onclick/bare calls stable until the canonical API assigns
   window.openMomentsModal / window.saveMoments / window.editMoment /
   window.deleteMoment / window.renderMoments later in this file. */
var openMomentsModal, saveMoments, editMoment, deleteMoment, renderMoments;

function openUnexpectedModal(){$('unexpectedFriend').textContent=FRIENDS[getFriend()];$('unexpectedText').value='';$('unexpectedModal').classList.add('show')}
function closeUnexpectedModal(){$('unexpectedModal').classList.remove('show')}
function saveUnexpected(){const arr=JSON.parse(localStorage.getItem('moments_freeform')||'[]');arr.push({page:document.title.replace(' · Saigon Companion',''),friendLabel:FRIENDS[getFriend()],text:$('unexpectedText').value,savedAt:new Date().toISOString()});localStorage.setItem('moments_freeform',JSON.stringify(arr));closeUnexpectedModal();renderUnexpected();}
function renderUnexpected(){const box=$('unexpectedTimeline');if(!box)return;const arr=JSON.parse(localStorage.getItem('moments_freeform')||'[]');box.innerHTML=arr.length?arr.map(e=>`<div class="moments-entry"><strong>✨ ${e.page}</strong><p>${e.friendLabel}</p><p>${e.text}</p></div>`).join(''):'<p>暫時未有 Moments。</p>'}

function updateExpenseMode(){
  const personal = document.getElementById('expensePersonal')?.checked;
  const splitBlock = document.getElementById('splitBetweenBlock');
  const consumedBlock = document.getElementById('consumedByBlock');
  if(splitBlock) splitBlock.style.display = personal ? 'none' : 'block';
  if(consumedBlock) consumedBlock.style.display = personal ? 'block' : 'none';
  if(personal) syncConsumedIfAuto();
}
function syncConsumedIfAuto(){
  const paid = document.getElementById('expensePaidBy');
  const consumed = document.getElementById('expenseConsumedBy');
  if(!paid || !consumed) return;
  if(consumed.dataset.manual !== 'true') consumed.value = paid.value;
}
function markConsumedManual(){
  const consumed = document.getElementById('expenseConsumedBy');
  if(consumed) consumed.dataset.manual = 'true';
}

/* Stage 4C-6: legacy top-level Expenses handlers were removed.
   Active Expenses API lives in the Stage 4F-Q single canonical module
   near the end of this file. Keep closeExpenseModal as a simple modal
   utility because HTML buttons call it directly. */
function closeExpenseModal(){const m=$('expenseModal'); if(m) m.classList.remove('show')}

function saveChecklist(){const checks=[...document.querySelectorAll('[data-check]')].map(c=>c.checked);localStorage.setItem('checklist',JSON.stringify(checks));const ready=$('readyBox');if(ready)ready.classList.toggle('show',checks.length>0&&checks.every(Boolean)); renderDashboard();}
function loadChecklist(){const stored=JSON.parse(localStorage.getItem('checklist')||'[]');document.querySelectorAll('[data-check]').forEach((c,i)=>c.checked=!!stored[i]);saveChecklist();}
document.addEventListener('DOMContentLoaded',()=>{updateFriendLabels();renderMoments();renderUnexpected();renderExpenses();loadChecklist();renderDashboard();});

function openTripCard(key) {
  closeMiniMenus();
  const t = TRIP_DATA[key];
  if (!t) return;
  const idx = TRIP_ORDER.indexOf(key);
  const prev = TRIP_ORDER[(idx - 1 + TRIP_ORDER.length) % TRIP_ORDER.length];
  const next = TRIP_ORDER[(idx + 1) % TRIP_ORDER.length];
  const content = document.getElementById('tripModalContent');
  const modal = document.getElementById('tripModal');
  if (!content || !modal) return;
  content.innerHTML = `<div class="trip-onepage"><p class="kicker">Trip</p><h2>${t.title}</h2>${t.body}<div class="guide-next-row"><button class="pill" onclick="openTripCard('${prev}')">‹ Previous</button><button class="pill" onclick="openTripCard('${next}')">Next ›</button></div><p class="timestamp">Build · Stage 4E-7 · HERO + LOGO SOURCE</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');
  if(sheet) sheet.scrollTop=0;
  if (key === 'checklist') setTimeout(loadChecklist, 0);
}

function closeTripModal() {
  const modal = document.getElementById('tripModal');
  if (modal) modal.classList.remove('show');
}

function splitAll() {
  document.querySelectorAll('#expenseModal input[data-split]').forEach(x => x.checked = true);
}

function clearAllSplit() {
  document.querySelectorAll('#expenseModal input[data-split]').forEach(x => x.checked = false);
}

const MOODS=[
  ["🤩","Wow"],["😋","Delicious"],["😵","Exhausted"],["🔥","正到爆"],
  ["🤯","估你唔到"],["😶","Speechless"],["🥲","仆街了"],["🤬","Damn"]
];
let currentMood=[];
let editingExpenseIndex=null;

function renderMoodButtons(selected=[]){
  currentMood = selected || [];
  const box=document.getElementById('moodGrid');
  if(!box) return;
  box.innerHTML=MOODS.map(([emoji,label])=>{
    const on=currentMood.includes(label);
    return `<button type="button" class="mood-btn ${on?'active':''}" onclick="toggleMood('${label}')">${emoji} ${label}</button>`;
  }).join('');
}
function toggleMood(label){
  if(currentMood.includes(label)){
    currentMood=currentMood.filter(x=>x!==label);
  }else{
    if(currentMood.length>=2) currentMood.shift();
    currentMood.push(label);
  }
  renderMoodButtons(currentMood);
}
function moodLabel(labels=[]){
  return labels.map(l=>{
    const m=MOODS.find(x=>x[1]===l);
    return m?m[0]+' '+m[1]:l;
  }).join(' · ');
}
function formatTime(iso){
  if(!iso) return '';
  try{
    return new Date(iso).toLocaleString([], {dateStyle:'medium', timeStyle:'short'});
  }catch(e){return iso}
}

function renderDashboard(){
  const checks=[...document.querySelectorAll('[data-dashboard-check]')];
  if(!checks.length) return;
  const stored=JSON.parse(localStorage.getItem('checklist')||'[]');
  const done=stored.filter(Boolean).length;
  const total=10;
  const percent=Math.round((done/total)*100);
  const pct=document.getElementById('dashReadyPercent');
  const bar=document.getElementById('dashReadyBar');
  const count=document.getElementById('dashChecklistCount');
  if(pct) pct.textContent=percent+'%';
  if(bar) bar.style.width=percent+'%';
  if(count) count.textContent=`${done} / ${total} Checklist Completed`;
}

/* v2.1.11 safe modal close fallback */
document.addEventListener('click', function(e){
  const modal = e.target.closest('.guide-modal,.moments-modal,.unexpected-modal,.tools-modal,.mama-modal,.trip-modal');
  if(modal && e.target === modal){
    modal.classList.remove('show');
  }
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    document.querySelectorAll('.guide-modal,.moments-modal,.unexpected-modal,.tools-modal,.mama-modal,.trip-modal').forEach(m=>m.classList.remove('show'));
  }
});

/* Stage 1 cleanup note: PLACES.general (the fallback "Moments" place card) used to be
   injected here at runtime. It is now defined canonically in data.js, so nothing to do here. */
// Renders a full place detail page (page-hero + quick-info-card + prose blocks)
// from PLACES data. Used by the shared place.html?id=... renderer and legacy standalone place pages
// so page content lives in ONE place (data.js) instead of being duplicated per file.
function renderPlacePage(key){
  const g = PLACES[key];
  const mount = document.getElementById('placeMain');
  if(!g || !mount) return;
  const sig = (g.signature||g.highlights||[]).map(x=>`<li>${x}</li>`).join('');
  const worth = (g.worth||g.tips||[]).map(x=>`<li>${x}</li>`).join('');
  mount.innerHTML = `
<div class="page-hero"><p class="kicker">Guide</p><h1>${g.emoji} ${g.title}</h1><p class="lead">${g.sub||''}</p></div>
<section aria-label="Quick Info" class="quick-info-card">${quickInfoInnerHTML(g,key)}</section>
<section class="prose-block guide-overview"><h2>Overview</h2><p>${g.desc||''}</p></section>
<section class="prose-block"><h2>Highlights</h2><ul>${sig}</ul></section>
<section class="prose-block"><h2>Good to Know</h2><ul>${worth}</ul></section>`;
  document.title = `${g.title} · Saigon Companion`;
}

function copyText(text){
  if(navigator.clipboard){navigator.clipboard.writeText(text).then(()=>alert('Address copied')).catch(()=>alert(text));}
  else alert(text);
}

/* v3.2 P0 workflow fixes: append Moments, latest-first Expenses, save-and-stay expense tool */
(function(){
  let editingMomentId = null;
  function readJson(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;}}
  function writeJson(key, value){localStorage.setItem(key, JSON.stringify(value));}
  window.openMomentsModal = function(key){
    editingMomentId = null;
    currentMomentKey = key || 'general';
    const g = PLACES[currentMomentKey] || PLACES.general || {title:'Moment'};
    const title = document.getElementById('momentsTitle');
    const friend = document.getElementById('momentsFriend');
    const text = document.getElementById('momentsText');
    if(title) title.textContent = g.title || 'Moment';
    if(friend) friend.textContent = FRIENDS[getFriend()];
    if(text) text.value = '';
    setStars(0);
    renderMoodButtons([]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save';
    const modal=document.getElementById('momentsModal');
    if(modal) modal.classList.add('show');
    try{ if(typeof window.simplifyMomentsAuthor === 'function') window.simplifyMomentsAuthor(); }catch(e){}
  };
  window.saveMoments = function(){
    const key = currentMomentKey || 'general';
    const g = PLACES[key] || PLACES.general || {title:'Moment'};
    const textEl=document.getElementById('momentsText');
    const ratingEl=document.getElementById('momentsRating');
    const now=new Date().toISOString();
    let arr=readJson('moments_list',[]);
    let entry={
      id:editingMomentId || ('m_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
      itemKey:key,
      itemTitle:g.title || 'Moment',
      friendLabel:FRIENDS[getFriend()],
      rating:Number(ratingEl?.value||0),
      moods:(currentMood||[]).slice(),
      text:textEl?.value||'',
      createdAt:now
    };
    if(editingMomentId){
      arr=arr.map(e=> e.id===editingMomentId ? {...e,...entry,createdAt:e.createdAt||now,editedAt:now} : e);
    }else{
      arr.push(entry);
    }
    writeJson('moments_list',arr);
    localStorage.setItem('moment_latest_'+key, JSON.stringify(entry));
    editingMomentId=null;
    if(textEl) textEl.value='';
    setStars(0); renderMoodButtons([]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save';
    closeMomentsModal(); renderMoments();
  };
  window.editMoment = function(id){
    const arr=readJson('moments_list',[]);
    const e=arr.find(x=>x.id===id);
    if(!e) return;
    editingMomentId=id;
    currentMomentKey=e.itemKey || 'general';
    const title=document.getElementById('momentsTitle');
    const friend=document.getElementById('momentsFriend');
    const text=document.getElementById('momentsText');
    if(title) title.textContent=e.itemTitle || 'Moment';
    if(friend) friend.textContent=e.friendLabel || FRIENDS[getFriend()];
    if(text) text.value=e.text || '';
    setStars(e.rating||0);
    renderMoodButtons(e.moods||[]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save Changes';
    const modal=document.getElementById('momentsModal');
    if(modal) modal.classList.add('show');
    try{ if(typeof window.simplifyMomentsAuthor === 'function') window.simplifyMomentsAuthor(); }catch(e){}
  };
  window.deleteMoment = function(idOrKey){
    let arr=readJson('moments_list',[]);
    const before=arr.length;
    arr=arr.filter(e=>e.id!==idOrKey);
    writeJson('moments_list',arr);
    if(before===arr.length && idOrKey && !idOrKey.startsWith('m_')) localStorage.removeItem('moment_'+idOrKey);
    renderMoments();
  };
  window.renderMoments = function(){
    const box=document.getElementById('momentsTimeline'); if(!box) return;
    let arr=readJson('moments_list',[]);
    // Include legacy one-per-place moments once so older saved data still appears.
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k && k.startsWith('moment_') && !k.startsWith('moment_latest_')){
        try{
          const e=JSON.parse(localStorage.getItem(k));
          if(e && !arr.some(x=>x.id===e.id || (x.createdAt===e.createdAt && x.itemKey===e.itemKey && x.text===e.text))){
            arr.push({...e,id:e.id||('legacy_'+k.replace('moment_',''))});
          }
        }catch(err){}
      }
    }
    arr.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    if(!arr.length){box.innerHTML='<p>暫時未有 Moments。</p>';return;}
    box.innerHTML=arr.map(e=>`<div class="moments-entry">
      <strong>${e.itemTitle||'Moment'}</strong>
      <p class="timestamp">${e.friendLabel||''} · ${formatTime(e.createdAt)}${e.editedAt?` · Edited ${formatTime(e.editedAt)}`:''}</p>
      <p class="moment-mood">${moodLabel(e.moods||[])}</p>
      <p class="moment-stars">${'⭐'.repeat(e.rating||0)}</p>
      <p class="moment-copy">${e.text||''}</p>
      <div class="entry-actions"><button class="mini-btn" onclick="editMoment('${e.id||e.itemKey}')">✏️ Edit</button><button class="mini-btn" onclick="deleteMoment('${e.id||e.itemKey}')">🗑 Delete</button></div>
    </div>`).join('');
  };
  /* Stage 4C-6: removed legacy v3.2 window.saveExpense; canonical handler is later in this file. */

  window.renderLatestExpenseMini = function(){
    const box=document.getElementById('latestExpenseMini'); if(!box) return;
    const arr=readJson('expenses',[]);
    const latest=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,3);
    if(!latest.length){box.innerHTML='<p class="timestamp">No transactions yet.</p>';return;}
    box.innerHTML=latest.map(e=>`<div class="expense-card">
      <strong>${e.item}</strong>
      <p class="timestamp">${formatTime(e.createdAt)}</p>
      <p>${Number(e.total).toLocaleString()} VND · Paid by ${FRIENDS[e.paidBy]}</p>
      <div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div>
    </div>`).join('');
  };
  /* Stage 4C-6: removed legacy v3.2 window.renderExpenses; canonical handler is later in this file. */

  document.addEventListener('DOMContentLoaded',()=>{renderMoodButtons([]);renderMoments();renderExpenses();});
})();

/* Stage 4C-6: legacy v3.4 Expenses wrappers removed; Stage 4F-Q owns the single canonical Expenses module. */

/* v3.5 guard: bottom bar is summary navigation; buttons on summary pages open tools */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.summary-link-row').forEach(x=>x.remove());
  try{ renderExpenses(); renderMoments(); }catch(e){}
});

/* v3.6 production polish: non-overriding expense copy polish only.
   Stage 4C-6 removed the old open/save wrappers from this block. */
(function(){
  function polishExpenseCopy(){
    document.querySelectorAll('button,a').forEach(el=>{
      if((el.textContent||'').includes('Add Expense') || (el.textContent||'').includes('Split Bill')){
        el.textContent='💰 What did we spend?';
      }
    });
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='💰 What did we spend?';
    const intro=document.getElementById('expenseIntro'); if(intro) intro.textContent='記低每一筆公數或個人消費，系統會自動計 Personal Spend 同 Settlement。';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
  }
  document.addEventListener('DOMContentLoaded',polishExpenseCopy);
  window.polishExpenseCopy = polishExpenseCopy;
})();

/* Stage 4C-6: removed legacy v3.7 Expenses save/open wrappers. */

/* Stage 4F-A: removed stale legacy dayN.html swipe handler. Active day route is day.html?day=N. */

/* v3.9.6c Final UX Hotfix: current-user Moments author label.
   Stage 4C-6 removed the expense open/save/edit wrappers from this block;
   Expense current-user defaults are handled by the Stage 4F-Q module. */
(function(){
  const DEFAULT_FRIEND = 'crystal';
  function currentUser(){
    try { return (typeof getFriend === 'function' ? getFriend() : localStorage.getItem('saigon_friend')) || DEFAULT_FRIEND; }
    catch(e){ return DEFAULT_FRIEND; }
  }
  function friendLabel(k){
    try { return (typeof FRIENDS !== 'undefined' && FRIENDS[k]) ? FRIENDS[k] : (FRIENDS?.[DEFAULT_FRIEND] || '👓 Crystal'); }
    catch(e){ return '👓 Crystal'; }
  }
  function simplifyMomentsAuthor(){
    const row=document.querySelector('#momentsModal p:has(#momentsFriend)');
    const badge=document.getElementById('momentsFriend');
    if(badge) badge.textContent='By ' + friendLabel(currentUser());
    if(row){
      row.classList.add('moments-author-row');
      row.querySelectorAll('button').forEach(btn=>btn.remove());
    }
  }
  window.simplifyMomentsAuthor = simplifyMomentsAuthor;


  document.addEventListener('DOMContentLoaded',()=>{
    simplifyMomentsAuthor();
  });
})();

/* Stage 4C-6: removed legacy v3.9.6d paid-by wrapper chain. Paid-by UI is owned by the Stage 4F-Q canonical Expenses module. */

/* ============================================================================
   STAGE 1.5 — INFORMATION MIGRATION TEMPLATE: optional read-only helpers
   ----------------------------------------------------------------------------
   Added: 2026-07-09. See STAGE_1_5_INFORMATION_MIGRATION.md.

   These read BOOKINGS_DATA (data.js) and return plain data/strings. None of
   them are called anywhere else in this file, none are attached to any
   button/onclick, and none write to the DOM or localStorage. They exist so a
   future stage can wire a real booking-status UI without first inventing
   this lookup logic. Safe to delete if a future stage designs different
   helpers instead — nothing else in the app depends on these.
   ============================================================================ */

/** Returns an array of BOOKINGS_DATA entries whose dayId matches the given
 *  day id (e.g. 'day1'). Returns [] if BOOKINGS_DATA is missing/empty or
 *  no bookings match — never throws. */
function getBookingsForDay(dayId){
  try{
    if (typeof BOOKINGS_DATA === 'undefined' || !BOOKINGS_DATA) return [];
    return Object.values(BOOKINGS_DATA).filter(b => b && b.dayId === dayId);
  }catch(e){ return []; }
}

/** Returns an array of BOOKINGS_DATA entries whose placeId matches the given
 *  PLACES key. Returns [] if none match or BOOKINGS_DATA is missing. */
function getBookingsForPlace(placeId){
  try{
    if (typeof BOOKINGS_DATA === 'undefined' || !BOOKINGS_DATA) return [];
    return Object.values(BOOKINGS_DATA).filter(b => b && b.placeId === placeId);
  }catch(e){ return []; }
}

/** Maps a booking status code to a short display label + emoji. Falls back
 *  to the raw status string (or 'Unknown') for any value not in the map,
 *  so this never throws on unexpected data. Not currently rendered anywhere. */
function getBookingStatusLabel(status){
  const map = {
    confirmed: '✅ Confirmed',
    pending:   '🕒 Pending',
    toBook:    '📌 To Book',
    cancelled: '✖️ Cancelled'
  };
  return map[status] || (status || 'Unknown');
}

/* ============================================================================
   STAGE 4F-Q — EXPENSES SINGLE CANONICAL MODULE
   ----------------------------------------------------------------------------
   One active implementation owns the Expenses open/save/reset/render/edit/
   delete/history flow. Storage schema, UI copy, modal behaviour and calculations
   are unchanged from the deploy-tested Stage 4F-P baseline.
   ============================================================================ */
(function(){
  const FRIEND_ORDER=['christal','crystal','mero','vivian'];
  const FRIEND_FALLBACK={christal:'🧸 Christal',crystal:'👓 Crystal',mero:'✝️ Mero',vivian:'👟 Vivian'};

  function currentUser(){
    try{return (typeof getFriend==='function' ? getFriend() : localStorage.getItem('saigon_friend')) || 'crystal';}
    catch(e){return 'crystal';}
  }
  function labelFor(k){
    try{return (typeof FRIENDS!=='undefined' && FRIENDS[k]) ? FRIENDS[k] : (FRIEND_FALLBACK[k]||k||'');}
    catch(e){return FRIEND_FALLBACK[k]||k||'';}
  }
  function readExpenses(){
    try{return JSON.parse(localStorage.getItem('expenses')||'[]');}
    catch(e){return [];}
  }
  function writeExpenses(arr){
    localStorage.setItem('expenses',JSON.stringify(Array.isArray(arr)?arr:[]));
  }
  function timeLabel(iso){
    try{return (typeof formatTime==='function') ? formatTime(iso) : (iso?new Date(iso).toLocaleString():'');}
    catch(e){return iso||'';}
  }
  function setSelectValue(id,value){
    const el=document.getElementById(id); if(!el) return;
    el.value=value;
    Array.from(el.options||[]).forEach(opt=>{opt.selected=(opt.value===value);});
    try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
  }
  function updatePaidByDisplay(){
    const hidden=document.getElementById('expensePaidBy');
    const paid=hidden?.value || currentUser();
    const display=document.getElementById('paidByDisplayName');
    if(display) display.textContent=labelFor(paid);
    document.querySelectorAll('#paidByChoices button').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.friend===paid);
    });
  }
  function ensurePaidByUI(){
    const select=document.getElementById('expensePaidBy');
    if(!select) return;
    if(!document.getElementById('paidByDisplay')){
      select.classList.add('paid-by-hidden-select');
      select.setAttribute('aria-hidden','true');
      select.tabIndex=-1;
      const panel=document.createElement('div');
      panel.className='paid-by-panel';
      panel.innerHTML=`<div class="paid-by-display" id="paidByDisplay"><span class="paid-by-current" id="paidByDisplayName">${labelFor(select.value||currentUser())}</span><button type="button" class="paid-by-change" id="paidByChangeButton">Change</button></div><div class="paid-by-choices" id="paidByChoices" hidden>${FRIEND_ORDER.map(k=>`<button type="button" data-friend="${k}">${labelFor(k)}</button>`).join('')}</div>`;
      select.insertAdjacentElement('afterend',panel);
      panel.querySelector('#paidByChangeButton')?.addEventListener('click',()=>{
        const choices=panel.querySelector('#paidByChoices'); if(choices) choices.hidden=!choices.hidden;
        updatePaidByDisplay();
      });
      panel.querySelectorAll('#paidByChoices button').forEach(btn=>{
        btn.addEventListener('click',()=>{
          setSelectValue('expensePaidBy',btn.dataset.friend);
          try{if(typeof syncConsumedIfAuto==='function') syncConsumedIfAuto();}catch(e){}
          const choices=panel.querySelector('#paidByChoices'); if(choices) choices.hidden=true;
          updatePaidByDisplay();
        });
      });
      select.addEventListener('change',updatePaidByDisplay);
    }
    updatePaidByDisplay();
  }
  function showExpenseSavedNote(){
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(!sheet) return;
    let note=document.getElementById('expenseSavedNote');
    if(!note){
      note=document.createElement('div');
      note.id='expenseSavedNote';
      note.className='expense-saved-note';
      note.textContent='✓ Expense saved. Ready for the next one.';
      const form=sheet.querySelector('.expense-form');
      sheet.insertBefore(note,form||sheet.firstChild);
    }
    note.classList.add('show');
    setTimeout(()=>note.classList.remove('show'),1400);
  }
  function resetExpenseForm(){
    editingExpenseIndex=null;
    const user=currentUser();
    const item=document.getElementById('expenseItem'); if(item) item.value='';
    const total=document.getElementById('expenseTotal'); if(total) total.value='';
    setSelectValue('expensePaidBy',user);
    const personal=document.getElementById('expensePersonal'); if(personal) personal.checked=false;
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){consumed.dataset.manual='false';setSelectValue('expenseConsumedBy',user);}
    try{splitAll();}
    catch(e){document.querySelectorAll('#expenseModal input[data-split]').forEach(x=>x.checked=true);}
    try{updateExpenseMode();}catch(e){}
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='💰 What did we spend?';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
    ensurePaidByUI();
    updatePaidByDisplay();
  }
  function expenseCard(e){
    const personal=e.type==='personal';
    const split=e.split||[];
    const consumer=e.consumedBy || split[0] || e.paidBy;
    const who=personal ? `Consumed by ${labelFor(consumer)}` : `Split: ${split.map(labelFor).join(' · ')}`;
    return `<div class="expense-card"><strong>${e.item||''}</strong><p class="timestamp">${timeLabel(e.createdAt)}${e.editedAt?` · Edited ${timeLabel(e.editedAt)}`:''}</p><p>${Number(e.total||0).toLocaleString()} VND · Paid by ${labelFor(e.paidBy)}</p><p>${personal?'Personal Expense':'Shared Expense'} · ${who}</p><div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div></div>`;
  }
  function ensureToolHistory(){
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(!sheet || document.getElementById('toolTransactionHistory')) return;
    const form=sheet.querySelector('.expense-form');
    const holder=document.createElement('div');
    holder.className='tool-transaction-history';
    holder.id='toolTransactionHistory';
    if(form && form.parentNode) form.parentNode.insertBefore(holder,form.nextSibling);
    else sheet.appendChild(holder);
  }

  window.openExpenseModal=function(){
    ensurePaidByUI();
    resetExpenseForm();
    const modal=document.getElementById('expenseModal');
    if(modal) modal.classList.add('show');
    try{if(typeof renderLatestExpenseMini==='function') renderLatestExpenseMini();}catch(e){}
    const first=document.getElementById('expenseItem'); if(first) setTimeout(()=>first.focus(),60);
  };

  window.saveExpense=function(){
    ensurePaidByUI();
    const item=(document.getElementById('expenseItem')?.value||'').trim();
    const total=Number(String(document.getElementById('expenseTotal')?.value||'').replace(/[^0-9.]/g,''));
    const paidBy=document.getElementById('expensePaidBy')?.value || currentUser();
    const personal=!!document.getElementById('expensePersonal')?.checked;
    const split=[...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(x=>x.value);
    const consumedBy=document.getElementById('expenseConsumedBy')?.value || paidBy;
    if(!item || !total) return alert('Please complete item and total.');
    if(!personal && !split.length) return alert('Please choose who to split between.');

    const arr=readExpenses();
    const now=new Date().toISOString();
    const data={item,total,paidBy,type:personal?'personal':'shared',split:personal?[consumedBy]:split,consumedBy:personal?consumedBy:null,createdAt:now};
    if(editingExpenseIndex!==null && arr[editingExpenseIndex]){
      data.createdAt=arr[editingExpenseIndex].createdAt || now;
      data.editedAt=now;
      arr[editingExpenseIndex]=data;
      editingExpenseIndex=null;
    }else{
      arr.push(data);
    }
    writeExpenses(arr);
    window.renderExpenses();
    resetExpenseForm();
    showExpenseSavedNote();
    const first=document.getElementById('expenseItem'); if(first) setTimeout(()=>first.focus(),60);
    // Intentional: keep modal open for quick multiple expense entry.
  };

  window.renderToolTransactionHistory=function(){
    const box=document.getElementById('toolTransactionHistory');
    if(!box) return;
    const latest=readExpenses().map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,5);
    box.innerHTML=`<h3>Transaction History</h3>${latest.length?latest.map(expenseCard).join(''):'<p class="timestamp">No transactions yet.</p>'}`;
  };

  window.renderExpenses=function(){
    const pageBox=document.getElementById('expensePageList');
    const arr=readExpenses();
    const sorted=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    if(pageBox){
      const total=arr.reduce((sum,e)=>sum+Number(e.total||0),0);
      const personalSpend={christal:0,crystal:0,mero:0,vivian:0};
      const balance={christal:0,crystal:0,mero:0,vivian:0};
      arr.forEach(e=>{
        const amount=Number(e.total||0);
        if(!balance[e.paidBy]) balance[e.paidBy]=0;
        balance[e.paidBy]+=amount;
        if(e.type==='personal'){
          const consumer=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
          if(!personalSpend[consumer]) personalSpend[consumer]=0;
          if(!balance[consumer]) balance[consumer]=0;
          personalSpend[consumer]+=amount;
          balance[consumer]-=amount;
        }else{
          const split=(e.split&&e.split.length)?e.split:[e.paidBy];
          const share=amount/split.length;
          split.forEach(k=>{if(!personalSpend[k]) personalSpend[k]=0;if(!balance[k]) balance[k]=0;personalSpend[k]+=share;balance[k]-=share;});
        }
      });
      const spendHtml=FRIEND_ORDER.map(k=>`<p>${labelFor(k)}<br><strong>${Math.round(personalSpend[k]||0).toLocaleString()} VND</strong></p>`).join('');
      const balanceHtml=FRIEND_ORDER.map(k=>{const v=balance[k]||0;return `<p>${labelFor(k)}<br><strong>${v>=0?'Receive':'Owes'} ${Math.abs(Math.round(v)).toLocaleString()} VND</strong></p>`;}).join('');
      pageBox.innerHTML=`<div class="expense-dashboard-v33"><div class="expense-total-card"><span>Trip Total</span><strong>${total.toLocaleString()} VND</strong><small>Shared + personal expenses</small></div><div class="expense-focus-grid"><div class="expense-focus-card"><h3>Personal Spend</h3>${spendHtml}</div><div class="expense-focus-card"><h3>Settlement</h3>${balanceHtml}</div></div></div><div class="expense-history-block"><h3>Transaction History</h3><p class="timestamp">最新交易會顯示喺最上面。</p><div class="transaction-scroll">${sorted.length?sorted.map(expenseCard).join(''):'<p>No transactions yet.</p>'}</div></div>`;
    }
    ensureToolHistory();
    window.renderToolTransactionHistory();
  };

  window.exportExpenseData=function(){
    const arr=readExpenses();
    if(!arr.length) return alert('No expense data to export yet.');
    const quote=value=>`"${String(value??'').replace(/"/g,'""')}"`;
    const total=arr.reduce((sum,e)=>sum+Number(e.total||0),0);
    const personalSpend={christal:0,crystal:0,mero:0,vivian:0};
    const balance={christal:0,crystal:0,mero:0,vivian:0};
    arr.forEach(e=>{
      const amount=Number(e.total||0);
      if(!(e.paidBy in balance)) balance[e.paidBy]=0;
      balance[e.paidBy]+=amount;
      if(e.type==='personal'){
        const consumer=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
        if(!(consumer in personalSpend)) personalSpend[consumer]=0;
        if(!(consumer in balance)) balance[consumer]=0;
        personalSpend[consumer]+=amount;
        balance[consumer]-=amount;
      }else{
        const split=(e.split&&e.split.length)?e.split:[e.paidBy];
        const share=amount/split.length;
        split.forEach(k=>{
          if(!(k in personalSpend)) personalSpend[k]=0;
          if(!(k in balance)) balance[k]=0;
          personalSpend[k]+=share;
          balance[k]-=share;
        });
      }
    });
    const rows=[
      ['CCMV SAIGON EXPENSE SUMMARY'],
      ['Trip Total VND',Math.round(total)],
      [],
      ['Personal Spend','Amount VND'],
      ...FRIEND_ORDER.map(k=>[labelFor(k),Math.round(personalSpend[k]||0)]),
      [],
      ['Settlement','Position','Amount VND'],
      ...FRIEND_ORDER.map(k=>{
        const v=balance[k]||0;
        return [labelFor(k),v>=0?'Receive':'Owes',Math.abs(Math.round(v))];
      }),
      [],
      ['TRANSACTION HISTORY'],
      ['Created At','Item','Total VND','Paid By','Type','Split Between','Consumed By','Edited At'],
      ...arr.map(e=>[
        e.createdAt||'',
        e.item||'',
        Number(e.total||0),
        labelFor(e.paidBy),
        e.type==='personal'?'Personal':'Shared',
        (e.split||[]).map(labelFor).join(' | '),
        e.consumedBy?labelFor(e.consumedBy):'',
        e.editedAt||''
      ])
    ];
    const csv='\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const date=new Date().toISOString().slice(0,10);
    a.href=url;
    a.download=`CCMV-Saigon-Expenses-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  window.editExpense=function(i){
    const arr=readExpenses();
    const e=arr[i]; if(!e) return;
    editingExpenseIndex=i;
    ensurePaidByUI();
    const item=document.getElementById('expenseItem'); if(item) item.value=e.item||'';
    const total=document.getElementById('expenseTotal'); if(total) total.value=e.total||'';
    setSelectValue('expensePaidBy',e.paidBy||'crystal');
    const personal=(e.type==='personal');
    const personalBox=document.getElementById('expensePersonal'); if(personalBox) personalBox.checked=personal;
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){
      consumed.value=e.consumedBy || ((e.split||[])[0]) || e.paidBy || 'crystal';
      consumed.dataset.manual=personal && consumed.value!==e.paidBy ? 'true':'false';
    }
    document.querySelectorAll('#expenseModal input[data-split]').forEach(x=>x.checked=(e.split||[]).includes(x.value));
    try{updateExpenseMode();}catch(e){}
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='✏️ Edit Expense';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Update Expense';
    const modal=document.getElementById('expenseModal'); if(modal) modal.classList.add('show');
    updatePaidByDisplay();
  };

  window.deleteExpense=function(i){
    const arr=readExpenses();
    if(!arr[i]) return;
    arr.splice(i,1);
    writeExpenses(arr);
    if(editingExpenseIndex===i) editingExpenseIndex=null;
    window.renderExpenses();
  };

  window.resetExpenseForm=resetExpenseForm;
  document.addEventListener('DOMContentLoaded',()=>{
    ensurePaidByUI();
    updatePaidByDisplay();
    window.renderExpenses();
  });
})();
