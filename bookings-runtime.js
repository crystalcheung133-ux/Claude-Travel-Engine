/* Travel Engine — generic Booking Centre. */
(function(root){
  'use strict';
  const CATEGORY_ORDER=['Accommodation','Restaurants','Spa','Activities','Transport'];
  const CATEGORY_META={
    Accommodation:{icon:'🏨',label:'Accommodation'},
    Restaurants:{icon:'🍽️',label:'Restaurants'},
    Spa:{icon:'💆',label:'Spa'},
    Activities:{icon:'🎟️',label:'Activities'},
    Transport:{icon:'🚐',label:'Transport'}
  };
  let activeCategory='';
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function source(){
    const view=(root.GenerationSelectionAdapter&&GenerationSelectionAdapter.view)?GenerationSelectionAdapter.view('bookings'):null;
    const byId=view&&view.byId?view.byId:(root.BOOKINGS_DATA||{});
    return root.BOOKING_AUTHORITY?BOOKING_AUTHORITY.all(byId):Object.values(byId||{});
  }
  function status(booking){return String(booking&&booking.status||'pending').toLowerCase()==='confirmed'?'confirmed':'pending';}
  function category(booking){
    const explicit=String((booking&&booking.bookingCategory)||(booking&&booking.category)||'').trim().toLowerCase();
    if(explicit==='restaurant'||explicit==='restaurants')return 'Restaurants';
    if(explicit==='spa')return 'Spa';
    if(explicit==='activity'||explicit==='activities'||explicit==='experience')return 'Activities';
    if(explicit==='transport'||explicit==='transfer')return 'Transport';
    if(explicit==='accommodation'||explicit==='stay'||explicit==='hotel')return 'Accommodation';
    const type=String(booking&&booking.type||'').toLowerCase();
    if(type==='accommodation')return 'Accommodation';
    if(type==='restaurant')return 'Restaurants';
    if(type==='spa')return 'Spa';
    if(type==='transport'||type==='rentalcar')return 'Transport';
    return 'Activities';
  }
  function rows(){
    return source().filter(Boolean).map(b=>Object.assign({},b,{_category:category(b),_status:status(b)})).sort((a,b)=>{
      const d=String(a.date||'').localeCompare(String(b.date||''));if(d)return d;
      return String(a.time||'').localeCompare(String(b.time||''));
    });
  }
  function summary(all){
    const confirmed=all.filter(x=>x._status==='confirmed').length;
    const pending=all.length-confirmed;
    return `${confirmed} confirmed · ${pending} pending`;
  }
  function categoryTabs(all,cats){
    return `<div class="booking-tabs" role="tablist">${cats.map(key=>{
      const meta=CATEGORY_META[key];const count=all.filter(x=>x._category===key).length;
      return `<button type="button" class="booking-tab ${activeCategory===key?'active':''}" data-booking-category="${esc(key)}"><span>${meta.icon} ${esc(meta.label)}</span><small>${count}</small></button>`;
    }).join('')}</div>`;
  }
  function dayNumber(booking){return String(booking.dayId||booking.day||'').replace('day','').replace(/\D/g,'');}
  function metaText(booking){
    const parts=[];
    if(booking.date)parts.push(booking.date);
    if(booking.time)parts.push(booking.time);
    return parts.join(' · ');
  }
  function card(booking){
    const day=dayNumber(booking);
    const dayBadge=day?`<span class="booking-day-button">DAY ${esc(day)}</span>`:'';
    const deep=`trip.html?bookingId=${encodeURIComponent(booking.id)}`;
    return `<article class="booking-card ${booking._status}"><div class="booking-card-row"><a class="booking-card-main" href="${esc(deep)}"><span>${day?`<small class="booking-day-label">DAY ${esc(day)}</small>`:''}<strong>${esc(booking.title||'Booking')}</strong><small>${esc(metaText(booking))}</small></span><span class="booking-status ${booking._status}">${booking._status==='confirmed'?'✓ Confirmed':'• Pending'}</span></a>${dayBadge}</div></article>`;
  }
  function render(){
    const all=rows();
    const cats=CATEGORY_ORDER.filter(key=>all.some(x=>x._category===key));
    if(!cats.length){document.getElementById('bookingList').innerHTML='<p class="timestamp">No bookings have been added yet.</p>';return;}
    if(!activeCategory||!cats.includes(activeCategory))activeCategory=cats[0];
    const sum=document.getElementById('bookingSummary');if(sum)sum.textContent=summary(all);
    const host=document.getElementById('bookingList');
    host.innerHTML=categoryTabs(all,cats)+`<section class="booking-group booking-group-active">${all.filter(x=>x._category===activeCategory).map(card).join('')}</section>`;
    host.querySelectorAll('[data-booking-category]').forEach(btn=>btn.addEventListener('click',()=>{activeCategory=btn.dataset.bookingCategory;render();}));
  }
  root.addEventListener('DOMContentLoaded',render);
  root.addEventListener('travelengine:bookingchange',render);
})(globalThis);
