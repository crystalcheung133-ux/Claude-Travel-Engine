const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={console};c.globalThis=c;vm.createContext(c);
vm.runInContext(fs.readFileSync('data.js','utf8'),c);
c.ITINERARY_DATA=c.TRAVEL_DATASETS.ITINERARY_DATA;
const master=c.ITINERARY_DATA['5'].items;
const oldBase=[...master.filter(x=>x.id!=='day5-easy-morning'),
  {id:'hotel-luggage',details:['OLD LUGGAGE']},{id:'grab-ha-spa',details:['OLD GRAB']}];
const saved=oldBase.map(x=>JSON.parse(JSON.stringify(x)));
saved.find(x=>x.id==='hotel-luggage').details=['MANUAL LUGGAGE'];
saved.find(x=>x.id==='grab-ha-spa').details=['MANUAL TRANSPORT'];
const record={masterRevision:'old-master-revision',dayChanges:{'5':{
 items:saved,baseItems:oldBase,dirtySync:true,baseVersion:542,syncedVersion:541}}};
let writes=0;
c.STORAGE={local:{readJSON:()=>record,writeJSON:()=>{writes++;}}};
vm.runInContext(fs.readFileSync('itinerary-authority.js','utf8'),c);
const entry=c.ITINERARY_AUTHORITY.getDayEntry('5');
assert(entry.items.some(x=>x.id==='day5-easy-morning'));
assert(!entry.items.some(x=>['hotel-luggage','grab-ha-spa'].includes(x.id)));
assert(entry.items.find(x=>x.id==='hotel-checkout').details.includes('MANUAL LUGGAGE'));
assert(entry.items.find(x=>x.id==='ha-spa').details.includes('MANUAL TRANSPORT'));
assert.strictEqual(entry.dirtySync,true);
assert.strictEqual(entry.baseVersion,542);
assert.strictEqual(entry.syncedVersion,541);
assert(writes>=1);
console.log('DAY5 SAVED OVERRIDE REVISION MIGRATION: PASS');
