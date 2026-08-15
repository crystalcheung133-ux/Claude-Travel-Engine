const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=fs.readFileSync('data.js','utf8')+'\n;globalThis.__I=ITINERARY_DATA;';
const c={};vm.createContext(c);vm.runInContext(data,c);
const I=c.__I;
const d4=Array.from(I['4'].items,x=>x.id);
assert.deepEqual(d4,['running-bean','pink-church','push-push','thao-dien-open-list'],
  'Moments Plan Activity source must expose only D4 morning anchors + one Open List');
assert.equal(I['4'].items.find(x=>x.id==='thao-dien-open-list').type,'openList');
const moments=fs.readFileSync('moments.js','utf8');
assert(moments.includes("const master=((typeof ITINERARY_DATA!=='undefined'&&ITINERARY_DATA)||{})[key]"),
  'Moments must source planned activities from canonical ITINERARY_DATA');
assert(moments.includes('currentDayItems(momentSelectorDay).map'),
  'Plan Activity picker must render canonical day items dynamically');
for(const stale of ['thao-dien-walk-1','bakes','moc-huong','thao-dien-walk-2','farewell-walkin'])
  assert(!d4.includes(stale),'stale D4 planned activity survived: '+stale);
console.log('MOMENTS PLAN ACTIVITY CANONICAL: PASS');
