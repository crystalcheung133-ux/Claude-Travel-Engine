const fs=require('fs'),assert=require('assert');
const data=fs.readFileSync('data.js','utf8'),trip=fs.readFileSync('trip-runtime.js','utf8');
// Verify capabilities and relationships, not hard-coded venues or hours.
const vm=require('vm'); const sandbox={}; vm.runInNewContext(data+';globalThis.__PLACES=PLACES;',sandbox);
for(const [id,place] of Object.entries(sandbox.__PLACES)) {
 assert(place && typeof place==='object',`Guide ${id} must be an object`);
 if(Object.prototype.hasOwnProperty.call(place,'hours')) assert(typeof place.hours==='string',`Guide ${id} hours must be text`);
}
assert(trip.includes('function genericBookingDetailNavigationHTML'),'Generic booking Previous/Next helper missing');
assert(trip.includes('${genericBookingDetailNavigationHTML(booking)}'),'Generic booking detail does not render navigation');
assert(trip.includes('disabled aria-disabled="true"'),'Edge navigation must disable, not wrap');
assert(!trip.includes("if(index<0||bookings.length<2)return ''"),'Single-card booking categories must still render disabled Previous/Next controls');
console.log('GUIDE FACTS + BOOKING NAVIGATION CAPABILITY: PASS');
