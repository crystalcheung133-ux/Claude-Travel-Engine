const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('booking-authority.js','utf8');
let stored=null;
const base={spa:{id:'spa',bookingId:'spa',title:'SPA',time:'15:30',date:'2026-11-02',status:'pending',address:'Old address'}};
function runtime(revision,deploy){
 const ctx={BOOKINGS_DATA:JSON.parse(JSON.stringify(deploy)),TRIP_CONFIG:{bookingMasterRevision:revision},STORAGE_CONFIG:{keys:{bookingOverrides:'test'}},STORAGE:{local:{readJSON:()=>stored?JSON.parse(JSON.stringify(stored)):null,writeJSON:(k,v)=>{stored=JSON.parse(JSON.stringify(v));return true},remove:()=>{stored=null;return true}}},console};
 vm.createContext(ctx);vm.runInContext(source,ctx);return ctx;
}
let a=runtime(13,base);let edited=a.BOOKING_AUTHORITY.get('spa');edited.time='16:00';
assert(a.BOOKING_AUTHORITY.save('spa',edited).ok);assert.equal(a.BOOKING_AUTHORITY.get('spa').time,'16:00');
// An unrelated deployment can update the address, but must not reset the saved time.
let b=runtime(14,{spa:{...base.spa,address:'New address',time:'15:30'}});
assert.equal(b.BOOKING_AUTHORITY.get('spa').time,'16:00');
assert.equal(b.BOOKING_AUTHORITY.get('spa').address,'New address');
let again=b.BOOKING_AUTHORITY.get('spa');again.time='16:45';assert(b.BOOKING_AUTHORITY.save('spa',again).ok);
let c=runtime(15,{spa:{...base.spa,address:'Newer address',time:'15:30'}});
assert.equal(c.BOOKING_AUTHORITY.get('spa').time,'16:45');
assert.equal(c.BOOKING_AUTHORITY.get('spa').address,'Newer address');
// Legacy stale records with no explicit user edit provenance are not trusted.
stored={version:1,overrides:{spa:{...base.spa,time:'23:59',status:'pending',_masterRevision:1}},deletedIds:[],updatedAt:'2026-08-01T00:00:00Z'};
assert.equal(runtime(15,base).BOOKING_AUTHORITY.get('spa').time,'15:30');
console.log('USER BOOKING EDIT SURVIVES DEPLOY: PASS');
