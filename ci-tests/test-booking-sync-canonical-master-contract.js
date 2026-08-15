const fs=require('fs'),assert=require('assert');
const sync=fs.readFileSync('booking-sync-runtime.js','utf8');
assert(sync.includes('CANONICAL_MASTER_FIELDS'),'canonical field list missing');
for(const f of ['title','day','dayId','date','time','emoji','placeId','timelineItemId','bookingUrl'])
  assert(sync.includes("'"+f+"'"),'canonical booking field missing: '+f);
assert(sync.includes('mergeRemoteWithDeployMaster(record,target)'),'remote/master merge missing');
const trip=fs.readFileSync('trip-runtime.js','utf8');
assert(trip.includes("if(booking&&booking.emoji)return String(booking.emoji)"),'Trip Booking must respect booking emoji');
const data=fs.readFileSync('data.js','utf8');
for(const x of [
 '"title": "Pizza 4P’s Bến Thành"',
 '"day": 4',
 '"time": "13:00"',
 '"emoji": "🥂"',
 '"emoji": "🍲"'
]) assert(data.includes(x),'master booking correction missing: '+x);
console.log('BOOKING SYNC CANONICAL MASTER CONTRACT: PASS');
