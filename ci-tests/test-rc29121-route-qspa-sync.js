const fs=require('fs'),assert=require('assert');
const day=fs.readFileSync('day.html','utf8');
const sync=fs.readFileSync('booking-sync-runtime.js','utf8');
const trip=fs.readFileSync('trip-runtime.js','utf8');
const d1=["Dauple by Ka's","Clothes Bar","Dot Dot Gem · JEWELLERY","Bubbli.wear","LIBÉ","Dear José","KIDO Studiowear","LÀMIN APPAREL"];
let pos=-1; for(const x of d1){const n=day.indexOf("['"+x, pos+1)>=0?day.indexOf("['"+x,pos+1):day.indexOf('["'+x,pos+1);assert(n>pos,'Day 1 order wrong at '+x);pos=n;}
const d4start=day.indexOf("'4':{title:"); const d4end=day.indexOf("  };",d4start); const d4=day.slice(d4start,d4end);
assert.equal((d4.match(/label:/g)||[]).length,1,'Day 4 must render as one Shopping Route section');
for(const x of ['🚕 Grab into Thảo Điền','🚕 short Grab','🚶 walk','Wicky Candle · SAME ADDRESS'])assert(d4.includes(x),'Day 4 transport/stop missing: '+x);
assert(sync.includes('BOOKING_REMOTE_VERIFY_FAILED'),'nested booking remote verification missing');
assert(sync.includes('JSON.stringify(verified.plannedVisits)!==expected'),'Qspa plannedVisits remote readback verification missing');
assert(trip.includes('remoteResult=await Promise.resolve(deps.syncPush(booking))'),'Booking save must await remote sync before reporting cross-device success');
assert(trip.includes('first remote sync attempt failed; retrying once'),'Booking sync retry guard missing');
console.log('RC29.121 ROUTE + QSPA SYNC: PASS');
