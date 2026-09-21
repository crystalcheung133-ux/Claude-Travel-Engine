const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=fs.readFileSync('data.js','utf8');
const ctx={console,globalThis:null};ctx.globalThis=ctx;vm.runInNewContext(data,ctx);
const d4=ctx.TRAVEL_DATASETS.ITINERARY_DATA['4'].items;
assert.deepStrictEqual(Array.from(d4,x=>x.id),['running-bean','pink-church','push-push','quan-thuy','thao-dien-open-list']);
const qt=d4.find(x=>x.id==='quan-thuy');assert(qt&&qt.placeId==='quan-thuy'&&qt.guideIds.includes('quan-thuy'));
assert(ctx.TRAVEL_DATASETS.CATEGORIES.RESTAURANTS.some(x=>x.key==='quan-thuy'));
assert(ctx.TRAVEL_DATASETS.GUIDE_ORDER.includes('quan-thuy'));
assert(ctx.TRAVEL_DATASETS.DAY_LINKS['quan-thuy'][0][1].includes('day=4#quan-thuy'));
// Upgrade simulation: preserve user Timeline edits byte-for-byte except additive QT item.
const disk={it:{masterRevision:'10ff1de238eb9',dayChanges:{'4':{items:[
{id:'running-bean',title:'USER CUSTOM RUNNING BEAN',custom:'KEEP-ME'},
{id:'pink-church',title:'USER PINK'},
{id:'push-push',title:'USER PUSH'},
{id:'thao-dien-open-list',title:'USER OPEN',details:['CUSTOM DETAIL']}
]}}}};
const context={console,globalThis:null,MASTER_ITINERARY_REVISION:ctx.MASTER_ITINERARY_REVISION,ITINERARY_DATA:ctx.TRAVEL_DATASETS.ITINERARY_DATA,STORAGE_CONFIG:{keys:{itineraryOverrides:'it',adminDraft:'draft'}},STORAGE:{local:{readJSON:(k,d)=>disk[k]===undefined?d:JSON.parse(JSON.stringify(disk[k])),writeJSON:(k,v)=>disk[k]=JSON.parse(JSON.stringify(v))}},getAdminDraft:()=>null};context.globalThis=context;
vm.runInNewContext(fs.readFileSync('itinerary-authority.js','utf8'),context);
const items=context.ITINERARY_AUTHORITY.getDayOverrideItems('4');
assert.deepStrictEqual(Array.from(items,x=>x.id),['running-bean','pink-church','push-push','quan-thuy','thao-dien-open-list']);
assert.strictEqual(items[0].title,'USER CUSTOM RUNNING BEAN');assert.strictEqual(items[0].custom,'KEEP-ME');assert.deepStrictEqual(Array.from(items[4].details),['CUSTOM DETAIL']);
// Guide authority remains independent: release does not revise/reset user Guide patches.
const ga=fs.readFileSync('guide-authority.js','utf8');assert(!/MASTER_GUIDE_REVISION|masterGuideRevision/.test(ga));
console.log('RC29.88 Day 4 Quán Thuý additive non-destructive upgrade PASS');
