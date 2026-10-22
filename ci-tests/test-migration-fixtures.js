#!/usr/bin/env node
/* RC29.138 gating migration regression (Node, BROWSER-SHAPED globals: globalThis.ITINERARY_DATA is NOT injected).
   Covers: fresh install, Saved Override (baseline / legacy / flat legacy), Pending Draft (baseline / legacy),
   Saved+Pending, old-revision publication, deletions, notes/times on moved + merged cards, idempotence. */
const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),F=require('./migration-fixtures.js');
let checks=0;const ok=(c,m)=>{checks++;assert.ok(c,m);};
function boot(seed){
  const c={console:{warn(){},log(){},error(){}}};c.globalThis=c;vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),c);
  const mem={};
  c.STORAGE_CONFIG={keys:{itineraryOverrides:'ovr',adminDraft:'draft'}};
  c.STORAGE={local:{readJSON:(k,d)=>k in mem?JSON.parse(mem[k]):d,writeJSON:(k,v)=>{mem[k]=JSON.stringify(v);return true;}}};
  c.getAdminDraft=()=>('draft' in mem?JSON.parse(mem.draft):null);
  c.replaceAdminDraft=d=>{mem.draft=JSON.stringify(d);return true;};
  Object.entries(seed||{}).forEach(([k,v])=>{mem[k]=JSON.stringify(v);});
  vm.runInContext(fs.readFileSync(path.join(root,'itinerary-authority.js'),'utf8'),c);
  const M=c.TRAVEL_DATASETS.ITINERARY_DATA;
  return {c,mem,A:c.ITINERARY_AUTHORITY,M,
    all:()=>({'2':c.ITINERARY_AUTHORITY.resolveDayItems('2',M['2'].items),'4':c.ITINERARY_AUTHORITY.resolveDayItems('4',M['4'].items),'5':c.ITINERARY_AUTHORITY.resolveDayItems('5',M['5'].items)})};
}
const probe=boot();ok(probe.c.globalThis.ITINERARY_DATA===undefined,'harness must be browser-shaped (no injected ITINERARY_DATA global)');
const FX=F.build(probe.M);
const ids=l=>l.map(x=>x.id),txt=l=>JSON.stringify(l);
const dup=l=>new Set(ids(l)).size!==ids(l).length;
const card=(l,id)=>l.find(x=>x.id===id);
const MASTER_D5=probe.M['5'].items.map(x=>x.id);
function commonStructure(label,r){
  ok(!dup(r['2'])&&!dup(r['4'])&&!dup(r['5']),label+': no duplicate card ids');
  ['running-bean','quan-cua-ca-mau-d2','shopping-tqd','qspa-d2'].forEach(id=>ok(ids(r['2']).includes(id),label+': Day 2 has '+id));
  ok(!ids(r['2']).includes('pizza4ps'),label+': no obsolete Day 2 Pizza card');
  ['pink-church','push-push-d4','pizza4ps','thao-dien-open-list','moc-huong-d4','aum-d4'].forEach(id=>ok(ids(r['4']).includes(id),label+': Day 4 has '+id));
  ok(ids(r['4']).filter(x=>x==='pizza4ps').length===1,label+': exactly one Day 4 Pizza card');
  ok(JSON.stringify(ids(r['5']))===JSON.stringify(MASTER_D5),label+': Day 5 is exactly the 8 master cards in order: '+ids(r['5']).join(','));
  ['running-bean','hotel-luggage','grab-ha-spa'].forEach(id=>ok(!ids(r['5']).includes(id),label+': no resurrected Day 5 '+id));
}
function userContent(label,r,opts){
  opts=opts||{};
  ok(txt(card(r['2'],'running-bean')).includes('USER_RB'),label+': Day 5 Running Bean note moved to Day 2 Running Bean');
  ok(!txt(r['5']).includes('USER_RB'),label+': Running Bean note not duplicated on Day 5');
  ok(txt(card(r['4'],'pizza4ps')).includes('USER_PIZZA'),label+': Day 2 Pizza note moved to Day 4 Pizza');
  ok(txt(card(r['4'],'pizza4ps')).includes('USER_PIZZA_ROUTE'),label+': Day 2 Pizza route note moved too');
  ok(txt(card(r['2'],'com-tam-moc')).includes('USER_CTM'),label+': edited retired Com Tam Moc note preserved (non-destructive)');
  ok(txt(card(r['4'],'quan-thuy')).includes('USER_QT'),label+': Quan Thuy note preserved');
  ok(txt(card(r['4'],'thao-dien-open-list')).includes('USER_SHOP'),label+': shopping note preserved');
  ok(txt(card(r['5'],'day5-free-browse')).includes('USER_SHOP5'),label+': Day 5 shopping note preserved');
  ok(txt(card(r['5'],'hotel-checkout')).includes('USER_LUGGAGE'),label+': luggage note merged into Hotel Check-out');
  ok(txt(card(r['5'],'hotel-checkout')).includes('14:45'),label+': luggage manual time preserved');
  ok(txt(card(r['5'],'ha-spa')).includes('USER_GRAB')&&txt(card(r['5'],'ha-spa')).includes('USER_GRAB_ROUTE'),label+': transport note+route merged into Hạ Spa');
  ok(txt(card(r['5'],'ha-spa')).includes('14:50'),label+': transport manual time preserved');
  ok(card(r['2'],'qspa-d2').time==='15:00–17:00',label+': manual Qspa time preserved');
  ok(card(r['4'],'aum-d4').time==='19:30–20:45',label+': manual AUM Timeline time preserved (Booking authority still decides display)');
  if(opts.deletionsHonoured){
    ok(!ids(r['2']).includes('rue-miche-ledition'),label+': user-deleted Rue Miche stays deleted');
    ok(!ids(r['4']).includes('complex-0123-d4'),label+': user-deleted 0123 stays deleted');
  }else{
    ok(ids(r['2']).includes('rue-miche-ledition')&&ids(r['4']).includes('complex-0123-d4'),label+': LEGACY LIMITATION documented - deletion unknowable without a baseline, cards are restored non-destructively');
  }
}
const store=(withBase,flat)=>{
  if(flat)return {'2':FX.edited['2'],'4':FX.edited['4'],'5':FX.edited['5']};
  const dc={};['2','4','5'].forEach(d=>{dc[d]={items:F.clone(FX.edited[d]),...(withBase?{baseItems:F.clone(FX.base[d])}:{})};});
  return {masterRevision:'OLDREV',dayChanges:dc};
};
const draft=(withBase)=>{
  const ch={};['2','4','5'].forEach(d=>{ch['itineraryDay'+d]={day:d,items:F.clone(FX.edited[d]),masterRevision:'OLDREV',...(withBase?{baseItems:F.clone(FX.base[d])}:{})};});
  return {version:1,changes:ch,updatedAt:'x'};
};
function idem(label,mk){
  const b=mk();const r1=b.all();const s1=JSON.stringify(b.mem);
  const r2=b.all();const r3=b.all();
  ok(JSON.stringify(r1)===JSON.stringify(r2)&&JSON.stringify(r2)===JSON.stringify(r3),label+': repeated resolution identical');
  ok(s1===JSON.stringify(b.mem),label+': storage stable after the first migration pass (idempotent)');
  const again=boot(Object.fromEntries(Object.entries(b.mem).map(([k,v])=>[k,JSON.parse(v)])));
  ok(JSON.stringify(again.all())===JSON.stringify(r1),label+': fresh page load over the migrated storage gives the same itinerary');
  return r1;
}
// 1 fresh
{const r=boot().all();commonStructure('1 fresh',r);ok(!txt(r).includes('USER_'),'1 fresh: nothing invented');
 ok(card(r['2'],'running-bean').time==='09:00'&&card(r['4'],'pizza4ps').time==='11:30','1 fresh: Running Bean 09:00, Pizza 11:30');}
// 2 saved with baseline
{const r=idem('2 saved+baseline',()=>boot({ovr:store(true)}));commonStructure('2 saved+baseline',r);userContent('2 saved+baseline',r,{deletionsHonoured:true});}
// 3 legacy saved (revision shape, no baseline)
{const r=idem('3 legacy saved',()=>boot({ovr:store(false)}));commonStructure('3 legacy saved',r);userContent('3 legacy saved',r,{});}
// 3b legacy flat store
{const r=idem('3b flat legacy saved',()=>boot({ovr:store(false,true)}));commonStructure('3b flat legacy saved',r);userContent('3b flat legacy saved',r,{});}
// 3c legacy UNEDITED defaults must not resurrect obsolete cards
{const un={masterRevision:'OLDREV',dayChanges:{'2':{items:F.clone(FX.unedited['2'])},'4':{items:F.clone(FX.unedited['4'])},'5':{items:F.clone(FX.unedited['5'])}}};
 const r=boot({ovr:un}).all();commonStructure('3c legacy unedited',r);
 ok(!ids(r['2']).includes('com-tam-moc')&&!ids(r['2']).includes('garmentory'),'3c: unedited default Com Tam Moc / Garmentory are not resurrected');}
// 4 pending with baseline
{const r=idem('4 pending+baseline',()=>boot({draft:draft(true)}));commonStructure('4 pending+baseline',r);userContent('4 pending+baseline',r,{deletionsHonoured:true});}
// 5 legacy pending (no baseline)
{const r=idem('5 legacy pending',()=>boot({draft:draft(false)}));commonStructure('5 legacy pending',r);userContent('5 legacy pending',r,{});}
// 5b current-revision draft written before baselines existed is upgraded without changing what the user sees
{const b=boot();const cur=b.A.getMasterRevision();const d={version:1,changes:{itineraryDay4:{day:'4',items:F.clone(b.M['4'].items).filter(x=>x.id!=='quan-thuy'),masterRevision:cur}}};
 const b2=boot({draft:d});const r=b2.all();ok(!ids(r['4']).includes('quan-thuy'),'5b: deletion in a current-revision baseline-less draft is honoured');
 const saved=JSON.parse(b2.mem.draft).changes.itineraryDay4;ok(Array.isArray(saved.baseItems)&&saved.baseItems.length&&Array.isArray(saved.basedOnItems),'5b: baseline written back to the draft');}
// 6 saved + pending together
{const b=boot({ovr:store(true),draft:draft(true)});
 // pending deliberately differs from saved: extra note on Garmentory-successor shopping card
 const r0=b.all();commonStructure('6 saved+pending',r0);userContent('6 saved+pending',r0,{deletionsHonoured:true});
 // newer saved edit made AFTER the draft must survive underneath the draft
 const b2=boot({draft:draft(true)});const r1=b2.all();
 const cur=b2.A.getMasterRevision();
 const savedNow=b2.A.commitDayChangesChecked({itineraryDay4:{day:'4',items:F.clone(r1['4']).map(x=>x.id==='aum-d4'?Object.assign(x,{details:['NEWER_SAVED']}):x)}});
 ok(savedNow.ok,'6: committing a newer saved edit works');
 const r2=b2.all();
 ok(txt(card(r2['4'],'aum-d4')).includes('NEWER_SAVED'),'6: newer Saved Override edit is NOT masked by an older Pending Draft');
 ok(txt(card(r2['4'],'pizza4ps')).includes('USER_PIZZA'),'6: Pending Draft content still present alongside the newer saved edit');}
// 8 old-revision publication
{const b=boot();
 const data={itineraryData:{},itineraryBase:{}};
 Object.keys(b.M).forEach(d=>{data.itineraryData[d]={...F.clone(b.M[d]),items:F.clone(FX.edited[d]||b.M[d].items)};data.itineraryBase[d]=F.clone(FX.base[d]||b.M[d].items);});
 const out=b.A.rebasePublishedItinerary(data);
 ok(out&&Object.keys(out).length===Object.keys(b.M).length,'8 publication: all five days present');
 const r={'2':out['2'].items,'4':out['4'].items,'5':out['5'].items};
 commonStructure('8 publication',r);userContent('8 publication',r,{deletionsHonoured:true});
 const out2=b.A.rebasePublishedItinerary({itineraryData:out,itineraryBase:Object.fromEntries(Object.keys(b.M).map(d=>[d,F.clone(b.M[d].items)]))});
 ok(JSON.stringify(out2)===JSON.stringify(out),'8 publication: rebasing its own output is a no-op (idempotent)');
 ok(b.A.rebasePublishedItinerary({itineraryData:data.itineraryData,itineraryBase:{}})===null,'8 publication: empty itineraryBase is never treated as rebasable');}
// F payload baseline (authority level)
{const b=boot();const r=b.A.commitDayChangesChecked({itineraryDay2:{day:'2',items:F.clone(b.M['2'].items).map((x,i)=>i?x:Object.assign(x,{details:['MY EDIT']}))}});
 const e=r.store.dayChanges['2'];ok(r.ok&&e.baseItems.length===b.M['2'].items.length&&JSON.stringify(e.baseItems)===JSON.stringify(b.A.normalizeItems(b.M['2'].items)),'F: Timeline save stores the full Master baseline');
 const p=b.A.makeDraftPayload('2',b.M['2'].items);ok(p.masterRevision===b.A.getMasterRevision()&&p.baseItems.length&&p.basedOnItems.length,'F: new draft payload carries revision + baseline');}
// Real UI wiring (static): day.html must build drafts through makeDraftPayload; admin.js must store the payload verbatim
{const day=fs.readFileSync(path.join(root,'day.html'),'utf8'),admin=fs.readFileSync(path.join(root,'admin.js'),'utf8');
 ok(/markTimelineDayDirty[\s\S]{0,400}ITINERARY_AUTHORITY\.makeDraftPayload\(dayKey,items\)/.test(day),'day.html builds Pending Drafts with makeDraftPayload (baseline + revision)');
 ok(/draft\.changes\[String\(changeKey\|\|'general'\)\]=payload==null\?true:payload/.test(admin),'admin.js stores the draft payload verbatim (baseline fields are not stripped)');
 ok(/window\.replaceAdminDraft=function/.test(admin),'admin.js exposes replaceAdminDraft so a migrated draft refreshes the in-memory cache');}
console.log('MIGRATION FIXTURES: PASS ('+checks+' checks)');
