#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const ctx={};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);
const d=JSON.parse(JSON.stringify(ctx.TRAVEL_DATASETS));
const items=d.ITINERARY_DATA['4'].items,oh=items.find(x=>x.id==='push-push-d4'),spa=items.find(x=>x.id==='moc-huong-d4');
assert(oh&&spa);assert.strictEqual(oh.time,'09:45–10:25');assert.strictEqual(oh.placeId,'ohquao-local-edit');
assert.deepStrictEqual(oh.guideIds,['ohquao-local-edit']);assert(oh.map.includes('Pham%20Ngoc%20Thach'));
assert(d.PLACES['ohquao-local-edit'].address.includes('58/12 Phạm Ngọc Thạch'));
assert.strictEqual(d.ITINERARY_DATA['4'].items[0].id,'pink-church');
assert(d.ITINERARY_DATA['4'].items[0].route.includes('OHQUAO'));
assert(d.PLACES.ohquao.address.includes('Đường Số 38'));
assert.strictEqual(spa.time,'15:45–17:45');
for(const [file,fragments] of Object.entries({
 'itinerary-authority.js':["item.id==='moc-huong-d4'", "push.placeId='ohquao-local-edit'"],
 'publication-runtime.js':["item.id==='moc-huong-d4'", "item.time='15:45–17:45'"],
 'export-runtime.js':["item.id==='moc-huong-d4'", "item.time='15:45–17:45'"]})){
 const src=fs.readFileSync(path.join(root,file),'utf8');for(const fragment of fragments)assert(src.includes(fragment),file+' missing '+fragment);
}
console.log('OHQUAO + SPA SYNC CONTRACT: PASS (static; not live Supabase)');
