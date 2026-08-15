const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('data.js','utf8')+'\n;globalThis.__B=BOOKINGS_DATA;globalThis.__I=ITINERARY_DATA;';
const c={console};vm.createContext(c);vm.runInContext(src,c);
const B=c.__B,I=c.__I;
const ids=Object.keys(B);
assert(ids.length>=11,'booking inventory unexpectedly small');

for(const id of ids){
  const b=B[id];
  assert(String(b.bookingMethod||'').trim(),id+': bookingMethod missing');
  assert(String(b.bookingHandoff||'').trim(),id+': friend handoff instructions missing');

  // User contract: website OR email OR confirmed WhatsApp. Phone/Zalo alone do not count.
  const usable=String(b.bookingUrl||'').trim()||String(b.email||'').trim()||String(b.whatsapp||'').trim();
  assert(usable,id+': no usable booking channel (website/email/WhatsApp)');
  assert(!/\bzalo\b/i.test(String(b.bookingMethod||'')) || usable,id+': Zalo must never be the only usable channel');

  if(/\bonline\b|website|klook/i.test(String(b.bookingMethod||'')))
    assert(String(b.bookingUrl||'').trim(),id+': method says online/website but bookingUrl is missing');

  if(/whatsapp/i.test(String(b.bookingMethod||'')))
    assert(String(b.whatsapp||'').trim(),id+': method says WhatsApp but explicit verified whatsapp field is missing');

  if(b.timelineItemId){
    const day=String(b.day||String(b.dayId||'').replace(/\D/g,''));
    const items=I[day]&&I[day].items||[];
    assert(items.some(x=>x.id===b.timelineItemId),id+': timelineItemId does not resolve to own Timeline card');
  }
}

assert(B['bk-pizza4ps'].bookingUrl.includes('ben-thanh'),'Pizza Bến Thành online booking missing');
assert(!B['bk-pizza4ps'].bookingContact,'Pizza phone-only contact should not be surfaced');
assert(!B['bk-moc-huong'],'Mộc Hương is an open-list option, not a booking');
assert.equal(B['bk-ha-spa'].whatsapp,'+84 908 661 683');
assert.equal(B['bk-nara'].whatsapp,'+84 903 877 906');
assert(!B['bk-moc-healing'].whatsapp,'Mộc Healing must not be labelled WhatsApp without verified support');
assert(B['bk-moc-healing'].bookingUrl && B['bk-moc-healing'].email,'Mộc Healing should use website/email');

const trip=fs.readFileSync('trip-runtime.js','utf8');
for(const token of ['Book Online','WhatsApp','Email','booking.whatsapp'])
  assert(trip.includes(token),'Booking detail runtime missing usability UI token: '+token);
assert(!trip.includes('trip-action-btn--call'),'Phone-only Call action must not be rendered');
assert(!trip.includes("bookingSectionHTML('How to book / handoff'"),'Handoff paragraph must not render in compact Booking detail');
const action=(trip.match(/function bookingActionButtonsHTML\(booking,place,options=\{\}\)\{[\s\S]*?\n\}/)||[''])[0];
assert(action&&!action.includes('bookingEditButtonHTML'),'Edit Booking must not render in detail actions');

console.log('BOOKING CONTACT USABILITY: PASS — every booking has website/email/verified WhatsApp; phone/Zalo alone never count.');
