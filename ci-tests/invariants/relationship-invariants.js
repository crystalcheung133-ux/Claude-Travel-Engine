/* Relationship invariants over ANY dataset {PLACES, ITINERARY_DATA, DAY_LINKS, BOOKINGS_DATA}.
   They encode relationships, never content: no names, times, counts or day allocations.

   GUIDE ELIGIBILITY RULE (documented):
     A Guide Card is ELIGIBLE for the "must be reachable from Timeline" rule when it is associated with an
     itinerary activity (it has a DAY_LINKS entry) AND it is active/user-facing:
       - place.archived !== true, place.hidden !== true, place.reference !== true
       - place.status not in {'archived','hidden','reference','removed'}
     Reference-only Guides (no DAY_LINKS entry) are out of scope.
   A place is REACHABLE from Timeline through any of these explicit relationships:
       item.placeId · item.guideIds · item.alternativeGuideIds · item.guideGroups[].guideIds · item.parkingGuideId
       · the Shopping Directory of an item with showShoppingDirectory/type 'shoppingWindow' (all SHOP guides whose
         DAY_LINKS point at that same day). */
const DAY_URL=/day\.html\?day=(\d+)(?:#(.+))?/;
const INACTIVE=new Set(['archived','hidden','reference','removed']);
function items(data){const out=[];Object.keys(data.ITINERARY_DATA||{}).forEach(d=>((data.ITINERARY_DATA[d]||{}).items||[]).forEach((it,i)=>out.push({day:d,index:i,item:it})));return out}
function check(data){
  const P=data.PLACES||{},L=data.DAY_LINKS||{},B=data.BOOKINGS_DATA||{},I=data.ITINERARY_DATA||{};const f=[];
  const all=items(data);const seen=new Map();
  all.forEach(({day,item})=>{if(!item||!item.id){f.push(['timeline-item-id',`day ${day}: item without stable id`]);return}
    if(seen.has(item.id))f.push(['timeline-duplicate-id',`${item.id} appears on day ${seen.get(item.id)} and day ${day}`]);seen.set(item.id,day)});
  // Timeline → Guide references resolve
  all.forEach(({day,item})=>{
    const refs=[item.placeId,...(item.guideIds||[]),...(item.alternativeGuideIds||[]),item.parkingGuideId,...((item.guideGroups||[]).flatMap(g=>g.guideIds||[]))].filter(Boolean);
    refs.forEach(r=>{if(!P[r])f.push(['timeline-guide-link-broken',`day ${day} item ${item.id} → unknown guide ${r}`])});
    if(item.bookingId&&!B[item.bookingId])f.push(['timeline-booking-link-broken',`day ${day} item ${item.id} → unknown booking ${item.bookingId}`]);
  });
  // Booking → Timeline anchor
  Object.values(B).forEach(b=>{if(!b||!b.timelineItemId)return;
    const day=String(b.day||'').replace(/\D/g,'')||String(b.dayId||'').replace(/\D/g,'');
    const multi=Array.isArray(b.plannedVisits)&&b.plannedVisits.length>1;
    const hit=all.filter(x=>x.item&&x.item.id===b.timelineItemId);
    if(!hit.length&&!multi)f.push(['booking-anchor-missing',`booking ${b.id} → timeline item ${b.timelineItemId} not found`]);
    else if(hit.length&&day&&!multi&&hit[0].day!==day)f.push(['booking-day-mismatch',`booking ${b.id} says day ${day}, timeline item is on day ${hit[0].day}`]);
  });
  // No duplicated booking activities (same booking on >1 item of one day unless multi-visit)
  const perBooking={};all.forEach(({day,item})=>{if(item&&item.bookingId){const k=item.bookingId+'@'+day;perBooking[k]=(perBooking[k]||0)+1}});
  Object.keys(perBooking).forEach(k=>{const id=k.split('@')[0];const b=B[id];if(perBooking[k]>1&&!(b&&Array.isArray(b.plannedVisits)&&b.plannedVisits.length>1))f.push(['booking-duplicated-activity',`${k} has ${perBooking[k]} timeline cards`])});
  // Guide → Timeline return links resolve
  Object.keys(L).forEach(g=>(L[g]||[]).forEach(([label,href])=>{const m=String(href).match(DAY_URL);
    if(!m){f.push(['guide-return-link-malformed',`${g}: ${href}`]);return}
    const d=I[m[1]];if(!d){f.push(['guide-return-day-missing',`${g} → day ${m[1]}`]);return}
    if(m[2]&&!(d.items||[]).some(x=>x.id===m[2]))f.push(['guide-return-anchor-missing',`${g} → ${href}`]);}));
  // Coverage: every eligible Guide is reachable
  const reach=new Set(),dirDays=new Set();
  all.forEach(({day,item})=>{[item.placeId,...(item.guideIds||[]),...(item.alternativeGuideIds||[]),item.parkingGuideId,...((item.guideGroups||[]).flatMap(g=>g.guideIds||[]))].filter(Boolean).forEach(x=>reach.add(x));
    if(item.showShoppingDirectory||item.type==='shoppingWindow')dirDays.add(day)});
  Object.keys(L).forEach(g=>{const p=P[g];if(!p)return;
    if(p.archived===true||p.hidden===true||p.reference===true||INACTIVE.has(String(p.status||'').toLowerCase()))return;
    if(reach.has(g))return;
    const viaDirectory=p.cat==='SHOP'&&(L[g]||[]).some(([,href])=>{const m=String(href).match(DAY_URL);return m&&dirDays.has(m[1])});
    if(!viaDirectory)f.push(['guide-orphaned',`${g} (${p.cat||'?'}, status ${p.status||'-'}) has no Timeline entry point`])});
  return f;
}
module.exports={check,items};
