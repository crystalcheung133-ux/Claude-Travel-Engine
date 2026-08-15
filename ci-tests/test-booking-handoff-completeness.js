const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('data.js','utf8')+'\n;globalThis.__B=BOOKINGS_DATA;globalThis.__I=ITINERARY_DATA;';
const c={console};vm.createContext(c);vm.runInContext(src,c);
const B=c.__B,I=c.__I;
const ids=Object.keys(B);
assert(ids.length>=13,'booking inventory unexpectedly small');

for(const id of ids){
  const b=B[id];
  assert(String(b.bookingMethod||'').trim(),id+': bookingMethod missing');
  assert(String(b.bookingHandoff||'').trim(),id+': friend handoff instructions missing');
  const actionable=String(b.bookingUrl||'').trim()||String(b.bookingContact||'').trim()||String(b.email||'').trim();
  assert(actionable,id+': no actionable booking channel (URL/contact/email)');
  if(b.timelineItemId){
    const day=String(b.day||String(b.dayId||'').replace(/\D/g,''));
    const items=I[day]&&I[day].items||[];
    assert(items.some(x=>x.id===b.timelineItemId),id+': timelineItemId does not resolve to own Timeline card');
  }
}

// Branch / channel truth that must not drift.
assert.equal(B['bk-pizza4ps'].title,'Pizza 4P’s Bến Thành');
assert.equal(B['bk-pizza4ps'].bookingContact,'19006043');
assert(B['bk-pizza4ps'].bookingUrl.includes('ben-thanh'));
assert.equal(B['bk-man-moi'].bookingContact,'+84 899 189 218');
assert(B['bk-man-moi'].bookingUrl.includes('manmoi.vn'));
assert.equal(B['bk-moc-huong'].bookingContact,'+84 90 975 5877');
assert(B['bk-moc-huong'].bookingUrl.includes('mochuongwellness.vn'));
assert.equal(B['bk-nara'].bookingContact,'+84 903 877 906');
assert.equal(B['bk-ha-spa'].bookingContact,'+84 908 661 683');
assert.equal(B['bk-moc-healing'].bookingContact,'+84 28 3535 4436');

const trip=fs.readFileSync('trip-runtime.js','utf8');
for(const token of ['Book Online','WhatsApp','How to book / handoff','booking.secondaryContact'])
  assert(trip.includes(token),'Booking detail runtime missing handoff UI token: '+token);

console.log('BOOKING HANDOFF COMPLETENESS: PASS — every booking has actionable channel + friend-ready instructions + timeline linkage.');
