

/* ============================================================================
   STAGE 1 CLEANUP NOTE (see CHANGELOG.md / DEFERRED_CLEANUP.md for full detail)
   ----------------------------------------------------------------------------
   data.js is the canonical source for PLACES, CATEGORIES, DAY_LINKS,
   GUIDE_ORDER, FRIENDS, TRIP_DATA and TRIP_ORDER. This file should render from
   that data, not silently replace it. As of this cleanup pass there are no
   remaining canonical-data mutations in this file.

   This file still contains several later-version function wrappers/overrides,
   especially around Moments and Expenses (e.g. openMomentsModal, saveMoments,
   renderMoments, saveExpense, renderExpenses, openExpenseModal,
   resetExpenseForm, editExpense, setFriend). Each later reassignment wraps and
   calls the previous version, so the FINAL assignment in file order is what
   actually runs. These were deliberately left untouched in Stage 1 because
   they carry legacy localStorage-format compatibility and have not been
   individually regression-tested — see DEFERRED_CLEANUP.md before touching them.
   ============================================================================ */

function visitDayHTML(key){
  const days=DAY_LINKS[key]||[];
  if(!days.length) return '';
  const buttons=days.map(([label,href])=>`<a class="day-jump-button" href="${href}">${label} →</a>`).join('');
  return `<div class="quick-info-row visit-row"><span class="quick-info-icon">📅</span><span><span class="quick-info-label">Visit Day</span><span class="quick-info-value day-link-row">${buttons}</span></span></div>`;
}

function $(id){return document.getElementById(id);}
function closeMiniMenus(){document.querySelectorAll('.mini-menu').forEach(m=>m.classList.remove('show'));}
function toggleMenu(id){const m=$(id);const open=m&&m.classList.contains('show');closeMiniMenus();if(m&&!open)m.classList.add('show');}
function toggleTripMenu(){toggleMenu('tripMenu')} function toggleGuideMenu(){toggleMenu('guideMenu')} function toggleDays(){toggleMenu('daysMenu')}
document.addEventListener('click',e=>{if(!e.target.closest('.mini-menu')&&!e.target.closest('.trip-trigger')&&!e.target.closest('.guide-trigger')&&!e.target.closest('.days-trigger')) closeMiniMenus();});

function getFriend(){return localStorage.getItem('saigon_friend')||'crystal';}
function setFriend(k){localStorage.setItem('saigon_friend',k);closeFriendModal();updateFriendLabels();}
function updateFriendLabels(){const label=FRIENDS[getFriend()]||'👓 Crystal';document.querySelectorAll('[data-friend-label]').forEach(e=>e.textContent=label);}
function openFriendModal(){$('mamaModal').classList.add('show')} function closeFriendModal(){$('mamaModal').classList.remove('show')}

function openGuideCategory(cat){
 const list=(CATEGORIES[cat]||[]).slice().sort((a,b)=>a.title.localeCompare(b.title));
 if(list.length===1){closeMiniMenus();openGuideModal(list[0].key);return;}
 const rows=list.map(i=>`<button onclick="openGuideModal('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span>›</span></button>`).join('');
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
function openMomentsModal(key){
  currentMomentKey=key;
  const g=PLACES[key]||{title:key};
  const saved=JSON.parse(localStorage.getItem('moment_'+key)||'{}');
  document.getElementById('momentsTitle').textContent=g.title;
  document.getElementById('momentsFriend').textContent=FRIENDS[getFriend()];
  document.getElementById('momentsText').value=saved.text||'';
  setStars(saved.rating||0);
  renderMoodButtons(saved.moods||[]);
  document.getElementById('momentsModal').classList.add('show');
}
function closeMomentsModal(){$('momentsModal').classList.remove('show')}
function setStars(n){document.querySelectorAll('.star').forEach((el,i)=>el.classList.toggle('active',i<n));$('momentsRating').value=n;}
function saveMoments(){
  const key=currentMomentKey;if(!key)return;
  const g=PLACES[key]||{title:key};
  const existing=JSON.parse(localStorage.getItem('moment_'+key)||'{}');
  const now=new Date().toISOString();
  const data={
    itemKey:key,itemTitle:g.title,friendLabel:FRIENDS[getFriend()],
    rating:Number(document.getElementById('momentsRating').value||0),
    moods:currentMood||[],
    text:document.getElementById('momentsText').value,
    createdAt:existing.createdAt||now,
    editedAt:existing.createdAt?now:null
  };
  localStorage.setItem('moment_'+key,JSON.stringify(data));
  closeMomentsModal();renderMoments();
}
function deleteMoment(key){localStorage.removeItem('moment_'+key);renderMoments();}
function renderMoments(){
  const box=document.getElementById('momentsTimeline');if(!box)return;
  let arr=[];
  for(let i=0;i<localStorage.length;i++){
    let k=localStorage.key(i);
    if(k&&k.startsWith('moment_')){
      try{arr.push(JSON.parse(localStorage.getItem(k)))}catch(e){}
    }
  }
  arr.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  if(!arr.length){box.innerHTML='<p>暫時未有 Moments。</p>';return}
  box.innerHTML=arr.map(e=>`<div class="moments-entry">
    <strong>${e.itemTitle}</strong>
    <p class="timestamp">${e.friendLabel||''} · ${formatTime(e.createdAt)}${e.editedAt?` · Edited ${formatTime(e.editedAt)}`:''}</p>
    <p>${moodLabel(e.moods||[])}</p>
    <p>${'⭐'.repeat(e.rating||0)}</p>
    <p>${e.text||''}</p>
    <div class="entry-actions"><button class="mini-btn" onclick="openMomentsModal('${e.itemKey}')">✏️ Edit</button><button class="mini-btn" onclick="deleteMoment('${e.itemKey}')">🗑 Delete</button></div>
  </div>`).join('');
}

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
function resetExpenseForm(){
  editingExpenseIndex=null;
  document.getElementById('expenseItem').value='';
  document.getElementById('expenseTotal').value='';
  document.getElementById('expensePaidBy').value='crystal';
  const personal=document.getElementById('expensePersonal');
  if(personal) personal.checked=false;
  const consumed=document.getElementById('expenseConsumedBy');
  if(consumed){ consumed.value='crystal'; consumed.dataset.manual='false'; }
  splitAll();
  updateExpenseMode();
}

function openExpenseModal(){
  resetExpenseForm();
  const modal=document.getElementById('expenseModal');
  if(modal){
    const title=document.getElementById('expenseModalTitle');
    if(title) title.textContent='💸 Split Bill';
    const save=document.getElementById('expenseSaveButton');
    if(save) save.textContent='Save Expense';
    modal.classList.add('show');
    renderLatestExpenseMini();
  }
}
function closeExpenseModal(){$('expenseModal').classList.remove('show')}
function saveExpense(){
  const item=document.getElementById('expenseItem').value;
  const total=Number(String(document.getElementById('expenseTotal').value||'').replace(/[^0-9.]/g,''));
  const paidBy=document.getElementById('expensePaidBy').value;
  const personal=!!document.getElementById('expensePersonal')?.checked;
  let split=[...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(x=>x.value);
  const consumedBy=document.getElementById('expenseConsumedBy')?.value || paidBy;
  if(!item||!total)return alert('Please complete item and total.');
  if(!personal && !split.length)return alert('Please choose who to split between.');
  const arr=JSON.parse(localStorage.getItem('expenses')||'[]');
  const now=new Date().toISOString();
  const data={item,total,paidBy,type:personal?'personal':'shared',split:personal?[consumedBy]:split,consumedBy:personal?consumedBy:null,createdAt:now};
  if(editingExpenseIndex!==null && arr[editingExpenseIndex]){
    data.createdAt=arr[editingExpenseIndex].createdAt||now;
    data.editedAt=now;
    arr[editingExpenseIndex]=data;
    editingExpenseIndex=null;
  }else{
    arr.push(data);
  }
  localStorage.setItem('expenses',JSON.stringify(arr));
  renderExpenses();
  closeExpenseModal();
}
function editExpense(i){
  const arr=JSON.parse(localStorage.getItem('expenses')||'[]');
  const e=arr[i]; if(!e)return;
  editingExpenseIndex=i;
  document.getElementById('expenseItem').value=e.item||'';
  document.getElementById('expenseTotal').value=e.total||'';
  document.getElementById('expensePaidBy').value=e.paidBy||'crystal';
  const personal=(e.type==='personal');
  const personalBox=document.getElementById('expensePersonal');
  if(personalBox) personalBox.checked=personal;
  const consumed=document.getElementById('expenseConsumedBy');
  if(consumed){
    consumed.value=e.consumedBy || (e.split&&e.split[0]) || e.paidBy || 'crystal';
    consumed.dataset.manual = personal && consumed.value !== e.paidBy ? 'true':'false';
  }
  document.querySelectorAll('#expenseModal input[data-split]').forEach(x=>x.checked=(e.split||[]).includes(x.value));
  updateExpenseMode();
  const title=document.getElementById('expenseModalTitle');
  if(title) title.textContent='✏️ Edit Expense';
  const save=document.getElementById('expenseSaveButton');
  if(save) save.textContent='Update Expense';
  document.getElementById('expenseModal').classList.add('show');
}
function deleteExpense(i){
  const arr=JSON.parse(localStorage.getItem('expenses')||'[]');
  arr.splice(i,1);
  localStorage.setItem('expenses',JSON.stringify(arr));
  renderExpenses();
  if(typeof renderLatestExpenseMini==='function') renderLatestExpenseMini();
}
function renderExpenses(){
  const pageBox=document.getElementById('expensePageList');
  if(!pageBox) return;
  const arr=JSON.parse(localStorage.getItem('expenses')||'[]');
  let total=arr.reduce((sum,e)=>sum+Number(e.total||0),0);
  let personalSpend={christal:0,crystal:0,mero:0,vivian:0};
  let balance={christal:0,crystal:0,mero:0,vivian:0};

  arr.forEach(e=>{
    const amount=Number(e.total||0);
    balance[e.paidBy]+=amount;
    if(e.type==='personal'){
      const consumer=e.consumedBy || (e.split&&e.split[0]) || e.paidBy;
      personalSpend[consumer]+=amount;
      balance[consumer]-=amount;
    }else{
      const split=(e.split&&e.split.length)?e.split:[e.paidBy];
      const share=amount/split.length;
      split.forEach(k=>{
        personalSpend[k]+=share;
        balance[k]-=share;
      });
    }
  });

  const spendHtml=Object.entries(personalSpend).map(([k,v])=>`<p>${FRIENDS[k]}: ${Math.round(v).toLocaleString()} VND</p>`).join('');
  const balanceHtml=Object.entries(balance).map(([k,v])=>`<p>${FRIENDS[k]}: ${v>=0?'receive':'owes'} ${Math.abs(Math.round(v)).toLocaleString()} VND</p>`).join('');
  const cards=arr.map((e,i)=>{
    const personal=e.type==='personal';
    const who=personal ? `Consumed by ${FRIENDS[e.consumedBy||e.split?.[0]||e.paidBy]}` : `Split: ${(e.split||[]).map(k=>FRIENDS[k]).join(' · ')}`;
    return `<div class="expense-card">
      <strong>${e.item}</strong>
      <p class="timestamp">${formatTime(e.createdAt)}${e.editedAt?` · Edited ${formatTime(e.editedAt)}`:''}</p>
      <p>${Number(e.total).toLocaleString()} VND · Paid by ${FRIENDS[e.paidBy]}</p>
      <p>${personal?'Personal Expense':'Shared Expense'} · ${who}</p>
      <div class="entry-actions"><button class="mini-btn" onclick="editExpense(${i})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${i})">🗑 Delete</button></div>
    </div>`;
  }).join('');
  if(typeof renderLatestExpenseMini==='function') renderLatestExpenseMini();
  pageBox.innerHTML=`<div class="expense-dashboard-v31"><div class="expense-total-card"><span>Trip Total</span><strong>${total.toLocaleString()} VND</strong><small>Shared + personal expenses</small></div><div class="expense-focus-grid"><div class="expense-focus-card"><h3>Personal Spend</h3>${spendHtml}</div><div class="expense-focus-card"><h3>Settlement</h3>${balanceHtml}</div></div></div><div class="expense-history-block"><h3>Transaction History</h3><div class="transaction-scroll">${cards||'<p>No transactions yet.</p>'}</div></div>`;
}

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
  content.innerHTML = `<div class="trip-onepage"><p class="kicker">Trip</p><h2>${t.title}</h2>${t.body}<div class="guide-next-row"><button class="pill" onclick="openTripCard('${prev}')">‹ Previous</button><button class="pill" onclick="openTripCard('${next}')">Next ›</button></div></div>`;
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

function renderLatestExpenseMini(){
  const box=document.getElementById('latestExpenseMini');
  if(!box) return;
  const arr=JSON.parse(localStorage.getItem('expenses')||'[]');
  const latest=arr.map((e,i)=>({...e,_idx:i})).slice(-3).reverse();
  if(!latest.length){
    box.innerHTML='<p class="timestamp">No transactions yet.</p>';
    return;
  }
  box.innerHTML=latest.map(e=>`<div class="expense-card">
    <strong>${e.item}</strong>
    <p class="timestamp">${formatTime(e.createdAt)}</p>
    <p>${Number(e.total).toLocaleString()} VND · Paid by ${FRIENDS[e.paidBy]}</p>
    <div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div>
  </div>`).join('');
}

/* v2.1.9 alphabetical guide wrapper */
const _originalOpenGuideCategory = openGuideCategory;
openGuideCategory = function(cat){
  /* Stage 1 cleanup note: this used to reassign CATEGORIES[cat] to a sorted copy,
     permanently mutating canonical data on every call. Removed — _originalOpenGuideCategory()
     already sorts a copy internally (see line ~19), so behaviour is unchanged. */
  return _originalOpenGuideCategory(cat);
};

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

/* v3.1 Shopping Directory shortcut in Guide toolbar */
const _shopDirectoryOpenGuideCategory = openGuideCategory;
openGuideCategory = function(cat){
  if(cat === 'SHOP'){
    const list=(CATEGORIES[cat]||[]).slice().sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
    const rows=`<button onclick="location.href='guide.html#shopping-directory'"><span><span class="guide-list-title">🛍 Shopping Directory</span><span class="guide-list-sub">Optional shops · Near · Best with Day</span></span><span>↓</span></button>` + list.map(i=>`<button onclick="openGuideModal('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span>›</span></button>`).join('');
    document.getElementById('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>SHOP</h2><div class="category-pop-list">${rows}</div>`;
    closeMiniMenus();document.getElementById('guideModal').classList.add('show');return;
  }
  return _shopDirectoryOpenGuideCategory(cat);
};

/* Stage 1 cleanup note: PLACES.general (the fallback "Moments" place card) used to be
   injected here at runtime. It is now defined canonically in data.js, so nothing to do here. */
// Renders a full place detail page (page-hero + quick-info-card + prose blocks)
// from PLACES data. Used by every standalone place page (bakes.html, lune.html, etc.)
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
  window.saveExpense = function(){
    const item=document.getElementById('expenseItem')?.value || '';
    const total=Number(String(document.getElementById('expenseTotal')?.value||'').replace(/[^0-9.]/g,''));
    const paidBy=document.getElementById('expensePaidBy')?.value || 'crystal';
    const personal=!!document.getElementById('expensePersonal')?.checked;
    let split=[...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(x=>x.value);
    const consumedBy=document.getElementById('expenseConsumedBy')?.value || paidBy;
    if(!item||!total) return alert('Please complete item and total.');
    if(!personal && !split.length) return alert('Please choose who to split between.');
    const arr=readJson('expenses',[]);
    const now=new Date().toISOString();
    const data={item,total,paidBy,type:personal?'personal':'shared',split:personal?[consumedBy]:split,consumedBy:personal?consumedBy:null,createdAt:now};
    if(editingExpenseIndex!==null && arr[editingExpenseIndex]){
      data.createdAt=arr[editingExpenseIndex].createdAt||now;
      data.editedAt=now;
      arr[editingExpenseIndex]=data;
      editingExpenseIndex=null;
    }else arr.push(data);
    writeJson('expenses',arr);
    renderExpenses();
    resetExpenseForm();
    const save=document.getElementById('expenseSaveButton');
    if(save){
      const old=save.textContent;
      save.textContent='✓ Saved — Add Another';
      setTimeout(()=>{save.textContent='Save Expense';},1400);
    }
    const title=document.getElementById('expenseModalTitle');
    if(title) title.textContent='💸 Split Bill';
    // Intentionally stay in the tool so multiple transactions can be entered quickly.
  };
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
  window.renderExpenses = function(){
    const pageBox=document.getElementById('expensePageList'); if(!pageBox) return;
    const arr=readJson('expenses',[]);
    const sorted=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    let total=arr.reduce((sum,e)=>sum+Number(e.total||0),0);
    let personalSpend={christal:0,crystal:0,mero:0,vivian:0};
    let balance={christal:0,crystal:0,mero:0,vivian:0};
    arr.forEach(e=>{
      const amount=Number(e.total||0);
      balance[e.paidBy]+=amount;
      if(e.type==='personal'){
        const consumer=e.consumedBy || (e.split&&e.split[0]) || e.paidBy;
        personalSpend[consumer]+=amount; balance[consumer]-=amount;
      }else{
        const split=(e.split&&e.split.length)?e.split:[e.paidBy];
        const share=amount/split.length;
        split.forEach(k=>{personalSpend[k]+=share; balance[k]-=share;});
      }
    });
    const spendHtml=Object.entries(personalSpend).map(([k,v])=>`<p>${FRIENDS[k]}<br><strong>${Math.round(v).toLocaleString()} VND</strong></p>`).join('');
    const balanceHtml=Object.entries(balance).map(([k,v])=>`<p>${FRIENDS[k]}<br><strong>${v>=0?'Receive':'Owes'} ${Math.abs(Math.round(v)).toLocaleString()} VND</strong></p>`).join('');
    const cardHtml=(e)=>{
      const personal=e.type==='personal';
      const who=personal ? `Consumed by ${FRIENDS[e.consumedBy||e.split?.[0]||e.paidBy]}` : `Split: ${(e.split||[]).map(k=>FRIENDS[k]).join(' · ')}`;
      return `<div class="expense-card"><strong>${e.item}</strong><p class="timestamp">${formatTime(e.createdAt)}${e.editedAt?` · Edited ${formatTime(e.editedAt)}`:''}</p><p>${Number(e.total).toLocaleString()} VND · Paid by ${FRIENDS[e.paidBy]}</p><p>${personal?'Personal Expense':'Shared Expense'} · ${who}</p><div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div></div>`;
    };
    const history=sorted.map(cardHtml).join('');
    pageBox.innerHTML=`<div class="expense-dashboard-v33"><div class="expense-total-card"><span>Trip Total</span><strong>${total.toLocaleString()} VND</strong><small>Shared + personal expenses</small></div><div class="expense-focus-grid"><div class="expense-focus-card"><h3>Personal Spend</h3>${spendHtml}</div><div class="expense-focus-card"><h3>Settlement</h3>${balanceHtml}</div></div></div><div class="expense-history-block"><h3>Transaction History</h3><p class="timestamp">最新交易會顯示喺最上面。</p><div class="transaction-scroll">${history||'<p>No transactions yet.</p>'}</div></div>`;
  };
  document.addEventListener('DOMContentLoaded',()=>{renderMoodButtons([]);renderMoments();renderExpenses();});
})();

/* v3.4 P0 bug fix overrides: expense summary page, tool history, latest-first */
(function(){
  function v34ReadJson(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;}}
  function v34Friends(){return (typeof FRIENDS !== 'undefined') ? FRIENDS : {christal:'Christal',crystal:'Crystal',mero:'Mero',vivian:'Vivian'};}
  function v34FormatTime(iso){
    if(!iso) return '';
    try{return new Date(iso).toLocaleString([], {dateStyle:'medium', timeStyle:'short'});}catch(e){return iso;}
  }
  function v34ExpenseCard(e){
    const F=v34Friends();
    const personal=e.type==='personal';
    const who=personal ? `Consumed by ${F[e.consumedBy||((e.split||[])[0])||e.paidBy]||''}` : `Split: ${(e.split||[]).map(k=>F[k]||k).join(' · ')}`;
    return `<div class="expense-card"><strong>${e.item||''}</strong><p class="timestamp">${v34FormatTime(e.createdAt)}${e.editedAt?` · Edited ${v34FormatTime(e.editedAt)}`:''}</p><p>${Number(e.total||0).toLocaleString()} VND · Paid by ${F[e.paidBy]||e.paidBy}</p><p>${personal?'Personal Expense':'Shared Expense'} · ${who}</p><div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div></div>`;
  }
  window.renderExpenses = function(){
    const pageBox=document.getElementById('expensePageList');
    const arr=v34ReadJson('expenses',[]);
    const sorted=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    if(pageBox){
      const F=v34Friends();
      let total=arr.reduce((sum,e)=>sum+Number(e.total||0),0);
      let personalSpend={christal:0,crystal:0,mero:0,vivian:0};
      let balance={christal:0,crystal:0,mero:0,vivian:0};
      arr.forEach(e=>{
        const amount=Number(e.total||0);
        if(!balance[e.paidBy]) balance[e.paidBy]=0;
        balance[e.paidBy]+=amount;
        if(e.type==='personal'){
          const consumer=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
          if(!personalSpend[consumer]) personalSpend[consumer]=0;
          if(!balance[consumer]) balance[consumer]=0;
          personalSpend[consumer]+=amount; balance[consumer]-=amount;
        }else{
          const split=(e.split&&e.split.length)?e.split:[e.paidBy];
          const share=amount/split.length;
          split.forEach(k=>{ if(!personalSpend[k]) personalSpend[k]=0; if(!balance[k]) balance[k]=0; personalSpend[k]+=share; balance[k]-=share; });
        }
      });
      const order=['christal','crystal','mero','vivian'];
      const spendHtml=order.map(k=>`<p>${F[k]}<br><strong>${Math.round(personalSpend[k]||0).toLocaleString()} VND</strong></p>`).join('');
      const balanceHtml=order.map(k=>{const v=balance[k]||0;return `<p>${F[k]}<br><strong>${v>=0?'Receive':'Owes'} ${Math.abs(Math.round(v)).toLocaleString()} VND</strong></p>`}).join('');
      const history=sorted.map(v34ExpenseCard).join('');
      pageBox.innerHTML=`<div class="expense-dashboard-v33"><div class="expense-total-card"><span>Trip Total</span><strong>${total.toLocaleString()} VND</strong><small>Shared + personal expenses</small></div><div class="expense-focus-grid"><div class="expense-focus-card"><h3>Personal Spend</h3>${spendHtml}</div><div class="expense-focus-card"><h3>Settlement</h3>${balanceHtml}</div></div></div><div class="expense-history-block"><h3>Transaction History</h3><p class="timestamp">最新交易會顯示喺最上面。</p><div class="transaction-scroll">${history||'<p>No transactions yet.</p>'}</div></div>`;
    }
    renderToolTransactionHistory();
  };
  window.renderToolTransactionHistory = function(){
    const box=document.getElementById('toolTransactionHistory');
    if(!box) return;
    const arr=v34ReadJson('expenses',[]);
    const sorted=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,5);
    box.innerHTML=`<h3>Transaction History</h3>${sorted.length?sorted.map(v34ExpenseCard).join(''):'<p class="timestamp">No transactions yet.</p>'}`;
  };
  const oldOpen=window.openExpenseModal;
  window.openExpenseModal=function(){
    if(typeof oldOpen === 'function') oldOpen();
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(sheet && !document.getElementById('toolTransactionHistory')){
      const form=sheet.querySelector('.expense-form');
      const holder=document.createElement('div');
      holder.className='tool-transaction-history';
      holder.id='toolTransactionHistory';
      if(form && form.parentNode){ form.parentNode.insertBefore(holder, form.nextSibling); }
      else sheet.appendChild(holder);
    }
    // v3.5: Bottom bar already opens the summary page, so no extra summary link inside the tool.
    sheet?.querySelectorAll('.summary-link-row').forEach(x=>x.remove());
    renderToolTransactionHistory();
  };
  const oldSave=window.saveExpense;
  window.saveExpense=function(){
    if(typeof oldSave === 'function') oldSave();
    try{renderExpenses();renderToolTransactionHistory();}catch(e){}
  };
  document.addEventListener('DOMContentLoaded',()=>{try{renderExpenses();renderToolTransactionHistory();}catch(e){}});
})();

/* v3.5 guard: bottom bar is summary navigation; buttons on summary pages open tools */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.summary-link-row').forEach(x=>x.remove());
  try{ renderExpenses(); renderMoments(); }catch(e){}
});

/* v3.6 production polish: stay details, checklist sizing hooks, expense CTA wording, save returns to summary */
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
  const oldOpenExpense = window.openExpenseModal;
  window.openExpenseModal = function(){
    if(typeof oldOpenExpense === 'function') oldOpenExpense();
    setTimeout(polishExpenseCopy,0);
  };
  const oldSaveExpense = window.saveExpense;
  window.saveExpense = function(){
    if(typeof oldSaveExpense === 'function') oldSaveExpense();
    try{ renderExpenses(); }catch(e){}
    setTimeout(()=>{ try{ closeExpenseModal(); renderExpenses(); }catch(e){} },250);
  };
  document.addEventListener('DOMContentLoaded',polishExpenseCopy);
})();

/* v3.7 Design System: expense save stays in tool for multiple entries */
(function(){
  function readJsonV37(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;}}
  function writeJsonV37(key, value){localStorage.setItem(key, JSON.stringify(value));}
  function ensureSavedNote(){
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(!sheet) return null;
    let note=document.getElementById('expenseSavedNote');
    if(!note){
      note=document.createElement('div'); note.id='expenseSavedNote'; note.className='expense-saved-note'; note.textContent='✓ Expense saved. Ready for the next one.';
      const form=sheet.querySelector('.expense-form');
      if(form) sheet.insertBefore(note, form); else sheet.appendChild(note);
    }
    return note;
  }
  const openOld=window.openExpenseModal;
  window.openExpenseModal=function(){
    if(typeof openOld==='function') openOld();
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='💰 What did we spend?';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
    ensureSavedNote();
  };
  window.saveExpense=function(){
    const item=document.getElementById('expenseItem')?.value || '';
    const total=Number(String(document.getElementById('expenseTotal')?.value||'').replace(/[^0-9.]/g,''));
    const paidBy=document.getElementById('expensePaidBy')?.value || 'crystal';
    const personal=!!document.getElementById('expensePersonal')?.checked;
    let split=[...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(x=>x.value);
    const consumedBy=document.getElementById('expenseConsumedBy')?.value || paidBy;
    if(!item||!total) return alert('Please complete item and total.');
    if(!personal && !split.length) return alert('Please choose who to split between.');
    const arr=readJsonV37('expenses',[]);
    const now=new Date().toISOString();
    const data={item,total,paidBy,type:personal?'personal':'shared',split:personal?[consumedBy]:split,consumedBy:personal?consumedBy:null,createdAt:now};
    if(typeof editingExpenseIndex!=='undefined' && editingExpenseIndex!==null && arr[editingExpenseIndex]){
      data.createdAt=arr[editingExpenseIndex].createdAt||now;
      data.editedAt=now;
      arr[editingExpenseIndex]=data;
      editingExpenseIndex=null;
    }else{
      arr.push(data);
    }
    writeJsonV37('expenses',arr);
    try{renderExpenses();renderToolTransactionHistory();}catch(e){}
    try{resetExpenseForm();}catch(e){
      const itemEl=document.getElementById('expenseItem'); if(itemEl) itemEl.value='';
      const totalEl=document.getElementById('expenseTotal'); if(totalEl) totalEl.value='';
    }
    const note=ensureSavedNote();
    if(note){note.classList.add('show'); setTimeout(()=>note.classList.remove('show'),1600);}
    const first=document.getElementById('expenseItem'); if(first) setTimeout(()=>first.focus(),80);
    const save=document.getElementById('expenseSaveButton'); if(save){save.textContent='Save';}
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='💰 What did we spend?';
    // Stay inside the popup for fast multiple entries. Close button returns to summary.
  };
})();

/* v3.9.3 Navigation & Branding Fix */
(function(){
  function clamp(n,min,max){return Math.max(min, Math.min(max,n));}
  function positionMiniMenu(menu, trigger){
    if(!menu || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.min(230, window.innerWidth - 24);
    const center = rect.left + rect.width/2;
    const left = clamp(center, 12 + menuWidth/2, window.innerWidth - 12 - menuWidth/2);
    menu.style.left = left + 'px';
    menu.style.right = 'auto';
    menu.style.width = menuWidth + 'px';
  }
  window.toggleMenu = function(id, trigger){
    const m = document.getElementById(id);
    const open = m && m.classList.contains('show');
    closeMiniMenus();
    if(m && !open){
      positionMiniMenu(m, trigger || document.activeElement);
      m.classList.add('show');
    }
  };
  window.toggleTripMenu = function(){ toggleMenu('tripMenu', document.querySelector('.trip-trigger')); };
  window.toggleGuideMenu = function(){ toggleMenu('guideMenu', document.querySelector('.guide-trigger')); };
  window.toggleDays = function(){ toggleMenu('daysMenu', document.querySelector('.days-trigger')); };
  window.addEventListener('resize', closeMiniMenus);
})();

(function(){
  const match = location.pathname.match(/day([1-5])\.html$/);
  if(!match) return;
  const current = Number(match[1]);
  let startX = 0, startY = 0, active = false, fired = false;
  function isInteractive(el){return !!el.closest('a,button,input,select,textarea,label,.mini-menu,.guide-modal,.trip-modal,.moments-modal,.tools-modal,.mama-modal');}
  function go(next){
    if(fired || next === current) return;
    fired = true;
    try{ sessionStorage.setItem('daySwipeTop','1'); }catch(e){}
    window.location.assign(`day${next}.html`);
  }
  document.addEventListener('touchstart', function(e){
    if(!e.touches || e.touches.length !== 1 || isInteractive(e.target)) { active=false; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    active = true;
    fired = false;
  }, {passive:true});
  document.addEventListener('touchmove', function(e){
    if(!active || fired || !e.touches || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    if(absX < 56 || absX < absY * 1.7) return;
    if(dx < 0 && current < 5) go(current + 1);
    if(dx > 0 && current > 1) go(current - 1);
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    if(!active || fired || !e.changedTouches || e.changedTouches.length !== 1) { active=false; return; }
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    active = false;
    if(absX < 56 || absX < absY * 1.7) return;
    if(dx < 0 && current < 5) go(current + 1);
    if(dx > 0 && current > 1) go(current - 1);
  }, {passive:true});
  window.addEventListener('pageshow', function(){
    try{ if(sessionStorage.getItem('daySwipeTop')==='1'){ sessionStorage.removeItem('daySwipeTop'); window.scrollTo(0,0); } }catch(e){}
  });
})();

/* v3.9.6c Final UX Hotfix: current-user defaults for Moments and Expenses */
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
  function setSelectValue(id, value){
    const el=document.getElementById(id);
    if(!el) return;
    el.value=value;
    // Force mobile Safari to repaint the selected label.
    Array.from(el.options || []).forEach(opt => { opt.selected = (opt.value === value); });
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }
  function resetExpenseFormToCurrentUser(){
    const user=currentUser();
    if(typeof editingExpenseIndex !== 'undefined') editingExpenseIndex=null;
    const item=document.getElementById('expenseItem'); if(item) item.value='';
    const total=document.getElementById('expenseTotal'); if(total) total.value='';
    setSelectValue('expensePaidBy', user);
    const personal=document.getElementById('expensePersonal'); if(personal) personal.checked=false;
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){ consumed.dataset.manual='false'; setSelectValue('expenseConsumedBy', user); }
    try{ splitAll(); }catch(e){ document.querySelectorAll('#expenseModal input[data-split]').forEach(x=>x.checked=true); }
    try{ updateExpenseMode(); }catch(e){}
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='💰 What did we spend?';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
  }
  window.resetExpenseForm = resetExpenseFormToCurrentUser;

  const previousOpenExpense = window.openExpenseModal;
  window.openExpenseModal = function(){
    if(typeof previousOpenExpense === 'function') previousOpenExpense();
    resetExpenseFormToCurrentUser();
    const modal=document.getElementById('expenseModal'); if(modal) modal.classList.add('show');
    setTimeout(()=>setSelectValue('expensePaidBy', currentUser()), 0);
  };

  window.saveExpense = function(){
    const item=(document.getElementById('expenseItem')?.value || '').trim();
    const total=Number(String(document.getElementById('expenseTotal')?.value||'').replace(/[^0-9.]/g,''));
    const paidBy=document.getElementById('expensePaidBy')?.value || currentUser();
    const personal=!!document.getElementById('expensePersonal')?.checked;
    const split=[...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(x=>x.value);
    const consumedBy=document.getElementById('expenseConsumedBy')?.value || paidBy;
    if(!item || !total) return alert('Please complete item and total.');
    if(!personal && !split.length) return alert('Please choose who to split between.');
    let arr=[];
    try{ arr=JSON.parse(localStorage.getItem('expenses')||'[]'); }catch(e){ arr=[]; }
    const now=new Date().toISOString();
    const data={item,total,paidBy,type:personal?'personal':'shared',split:personal?[consumedBy]:split,consumedBy:personal?consumedBy:null,createdAt:now};
    if(typeof editingExpenseIndex !== 'undefined' && editingExpenseIndex!==null && arr[editingExpenseIndex]){
      data.createdAt=arr[editingExpenseIndex].createdAt || now;
      data.editedAt=now;
      arr[editingExpenseIndex]=data;
      editingExpenseIndex=null;
    }else{
      arr.push(data);
    }
    localStorage.setItem('expenses', JSON.stringify(arr));
    try{ renderExpenses(); }catch(e){}
    try{ renderToolTransactionHistory(); }catch(e){}
    resetExpenseFormToCurrentUser();
    const note=document.getElementById('expenseSavedNote') || (function(){
      const sheet=document.querySelector('#expenseModal .tools-sheet');
      if(!sheet) return null;
      const n=document.createElement('div');
      n.id='expenseSavedNote';
      n.className='expense-saved-note';
      n.textContent='✓ Expense saved. Ready for the next one.';
      const form=sheet.querySelector('.expense-form');
      sheet.insertBefore(n, form || sheet.firstChild);
      return n;
    })();
    if(note){ note.classList.add('show'); setTimeout(()=>note.classList.remove('show'),1400); }
    const first=document.getElementById('expenseItem'); if(first) setTimeout(()=>first.focus(),60);
    // Stay inside the popup for fast multiple expense entries.
  };

  // Keep edit flow intact, but ensure the select visibly shows the stored payer.
  const previousEditExpense = window.editExpense;
  window.editExpense = function(i){
    if(typeof previousEditExpense === 'function') previousEditExpense(i);
    try{
      const arr=JSON.parse(localStorage.getItem('expenses')||'[]');
      const e=arr[i];
      if(e){ setSelectValue('expensePaidBy', e.paidBy || currentUser()); }
    }catch(e){}
  };

  function simplifyMomentsAuthor(){
    const row=document.querySelector('#momentsModal p:has(#momentsFriend)');
    const badge=document.getElementById('momentsFriend');
    if(badge) badge.textContent='By ' + friendLabel(currentUser());
    if(row){
      row.classList.add('moments-author-row');
      row.querySelectorAll('button').forEach(btn=>btn.remove());
    }
  }
  const previousOpenMoments = window.openMomentsModal;
  window.openMomentsModal = function(key){
    if(typeof previousOpenMoments === 'function') previousOpenMoments(key);
    simplifyMomentsAuthor();
  };
  const previousSaveMoments = window.saveMoments;
  window.saveMoments = function(){
    if(typeof previousSaveMoments === 'function') previousSaveMoments();
    // Moments are one-at-a-time: save, close, return to summary.
    try{ closeMomentsModal(); renderMoments(); }catch(e){}
  };

  const previousSetFriend = window.setFriend;
  window.setFriend = function(k){
    if(typeof previousSetFriend === 'function') previousSetFriend(k);
    if(document.getElementById('expenseModal')?.classList.contains('show')) resetExpenseFormToCurrentUser();
    if(document.getElementById('momentsModal')?.classList.contains('show')) simplifyMomentsAuthor();
  };

  document.addEventListener('DOMContentLoaded',()=>{
    setSelectValue('expensePaidBy', currentUser());
    setSelectValue('expenseConsumedBy', currentUser());
    simplifyMomentsAuthor();
  });
})();

/* v3.9.6d Final Paid-by UX Fix: replace blank select with clear current-user display + Change chips */
(function(){
  const DEFAULT_FRIEND='crystal';
  const FRIEND_ORDER=['christal','crystal','mero','vivian'];
  function currentUser(){
    try{return (typeof getFriend==='function' ? getFriend() : localStorage.getItem('saigon_friend')) || DEFAULT_FRIEND;}catch(e){return DEFAULT_FRIEND;}
  }
  function labelFor(k){
    try{return (typeof FRIENDS!=='undefined' && FRIENDS[k]) ? FRIENDS[k] : ({christal:'🧸 Christal',crystal:'👓 Crystal',mero:'✝️ Mero',vivian:'👟 Vivian'}[k]||'👓 Crystal');}
    catch(e){return '👓 Crystal';}
  }
  function setSelectValue(id,value){
    const el=document.getElementById(id); if(!el) return;
    el.value=value;
    Array.from(el.options||[]).forEach(opt=>{ opt.selected=(opt.value===value); });
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function getPaidBy(){return document.getElementById('expensePaidBy')?.value || currentUser();}
  function updatePaidByDisplay(){
    const display=document.getElementById('paidByDisplayName');
    const hidden=document.getElementById('expensePaidBy');
    const paid=hidden?.value || currentUser();
    if(display) display.textContent=labelFor(paid);
    document.querySelectorAll('#paidByChoices button').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.friend===paid);
    });
  }
  function ensurePaidByUI(){
    const select=document.getElementById('expensePaidBy');
    if(!select || document.getElementById('paidByDisplay')) { updatePaidByDisplay(); return; }
    select.classList.add('paid-by-hidden-select');
    select.setAttribute('aria-hidden','true');
    select.tabIndex=-1;
    const panel=document.createElement('div');
    panel.className='paid-by-panel';
    panel.innerHTML=`
      <div class="paid-by-display" id="paidByDisplay">
        <span class="paid-by-current" id="paidByDisplayName">${labelFor(select.value||currentUser())}</span>
        <button type="button" class="paid-by-change" id="paidByChangeButton">Change</button>
      </div>
      <div class="paid-by-choices" id="paidByChoices" hidden>
        ${FRIEND_ORDER.map(k=>`<button type="button" data-friend="${k}">${labelFor(k)}</button>`).join('')}
      </div>`;
    select.insertAdjacentElement('afterend', panel);
    const change=panel.querySelector('#paidByChangeButton');
    const choices=panel.querySelector('#paidByChoices');
    change?.addEventListener('click',()=>{
      choices.hidden=!choices.hidden;
      updatePaidByDisplay();
    });
    choices?.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>{
        setSelectValue('expensePaidBy', btn.dataset.friend);
        try{ if(typeof syncConsumedIfAuto==='function') syncConsumedIfAuto(); }catch(e){}
        choices.hidden=true;
        updatePaidByDisplay();
      });
    });
    select.addEventListener('change', updatePaidByDisplay);
    updatePaidByDisplay();
  }
  function resetPaidByToCurrentUser(){
    ensurePaidByUI();
    setSelectValue('expensePaidBy', currentUser());
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){ consumed.dataset.manual='false'; setSelectValue('expenseConsumedBy', currentUser()); }
    updatePaidByDisplay();
  }

  const prevOpen=window.openExpenseModal;
  window.openExpenseModal=function(){
    if(typeof prevOpen==='function') prevOpen.apply(this,arguments);
    ensurePaidByUI();
    resetPaidByToCurrentUser();
  };
  const prevReset=window.resetExpenseForm;
  window.resetExpenseForm=function(){
    if(typeof prevReset==='function') prevReset.apply(this,arguments);
    ensurePaidByUI();
    resetPaidByToCurrentUser();
  };
  const prevEdit=window.editExpense;
  window.editExpense=function(i){
    if(typeof prevEdit==='function') prevEdit.apply(this,arguments);
    ensurePaidByUI();
    try{
      const arr=JSON.parse(localStorage.getItem('expenses')||'[]');
      const e=arr[i];
      if(e && e.paidBy) setSelectValue('expensePaidBy', e.paidBy);
    }catch(e){}
    updatePaidByDisplay();
  };
  const prevSetFriend=window.setFriend;
  window.setFriend=function(k){
    if(typeof prevSetFriend==='function') prevSetFriend.apply(this,arguments);
    if(document.getElementById('expenseModal')?.classList.contains('show')) resetPaidByToCurrentUser();
  };
  const prevSave=window.saveExpense;
  window.saveExpense=function(){
    ensurePaidByUI();
    // Make sure hidden select always has a real payer before old save logic reads it.
    if(!getPaidBy()) setSelectValue('expensePaidBy', currentUser());
    const result = (typeof prevSave==='function') ? prevSave.apply(this,arguments) : undefined;
    // Old save keeps popup open in v3.9.6c; after save, restore current user for the next entry.
    setTimeout(()=>{ if(document.getElementById('expenseModal')?.classList.contains('show')) resetPaidByToCurrentUser(); },80);
    return result;
  };
  document.addEventListener('DOMContentLoaded',()=>{ ensurePaidByUI(); resetPaidByToCurrentUser(); });
})();

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
