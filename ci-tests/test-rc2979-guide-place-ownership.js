const fs=require('fs'),assert=require('assert');
const guide=fs.readFileSync('guide-runtime.js','utf8');
const trip=fs.readFileSync('trip-runtime.js','utf8');
const day=fs.readFileSync('day.html','utf8');
assert(guide.includes("f('Description / About','description'"),'Guide editor needs one Description field');
assert(guide.includes("f('Useful info — one item per line','usefulInfo'"),'Guide editor needs one Useful info field');
for(const old of ["f('Subtitle','sub'","f('Price','price'","f('Booking note','bookingNote'","f('Signature / highlights","f('Practical notes"]){assert(!guide.includes(old),`legacy Guide editor field remains: ${old}`)}
assert(guide.includes("Object.assign(patch,{desc:'',sub:'',price:'',bookingNote:'',signature:[],highlights:[],worth:[],tips:[],notes:[],practical:[]})"),'Guide save must retire legacy duplicate fields');
assert(guide.includes("Object.prototype.hasOwnProperty.call(g,'usefulInfo')"),'Explicit empty Useful info must not resurrect legacy content');
assert(guide.includes("Object.prototype.hasOwnProperty.call(g,'description')"),'Explicit empty Description must not resurrect legacy content');
assert(day.includes('new Proxy(DAY_PLACE_BASE')&&day.includes('GUIDE_AUTHORITY.resolve(String(key),base)'),'Timeline must resolve current shared Place authority');
assert(day.includes("(place&&place.address)||(item&&item.address)"),'Timeline canonical Place address must win over item snapshot');
assert(trip.includes("return (place&&place.address)||(booking&&booking.address)"),'Booking display must prefer shared Place address');
assert(trip.includes("GUIDE_AUTHORITY.save(current.placeId,placePatch)"),'Booking edits must sync shared Place contact facts');
assert(trip.includes("booking.checkInInstructions||'',booking.lunchStatus||'',booking.notes"),'near-duplicate operational notes must merge into Important information');
console.log('RC29.79 GUIDE / SHARED PLACE OWNERSHIP: PASS');
