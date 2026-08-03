#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
function local(initial={}){
 const map=new Map(Object.entries(initial).map(([k,v])=>[k,typeof v==='string'?v:JSON.stringify(v)]));
 return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),key:i=>[...map.keys()][i]??null,get length(){return map.size},dump:()=>Object.fromEntries(map)};
}
function run(tripId,initial){
 const ls=local(initial);const context={console,TRIP_CONFIG:{storageNamespace:tripId,legacyStorageNamespace:tripId==='nz-family-2026'?'nz-family-2026':null},localStorage:ls,sessionStorage:local(),globalThis:null};context.globalThis=context;context.window=context;
 for(const file of ['storage-config.js','storage.js','storage-migration-runtime.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 return {cfg:context.STORAGE_CONFIG,data:ls.dump()};
}
const old={
 expenses:[{id:'e1'}],moments_list:[{id:'m1'}],moments_freeform:[{text:'x'}],checklist:[true],nz_friend:'lee',
 travel_engine_admin_mode_v1:'admin',travel_engine_admin_draft_v1:{changes:{x:1}},travel_engine_cloud_snapshot_v1:{bad:true},
 travel_engine_itinerary_overrides_v1:{masterRevision:'r1',dayChanges:{}},travel_engine_itinerary_master_signature_v1:'r1',
 travel_engine_booking_overrides_v1:{version:1,overrides:{b1:{time:'10:00'}}},travel_engine_trip_completion_v1:{version:1,completed:true},
 moment_place1:{id:'legacy-m'},moment_latest_place1:{id:'latest-m'}
};
const nz=run('nz-family-2026',old),K=nz.cfg.keys;
for(const key of [K.expenses,K.momentsList,K.momentsFreeform,K.checklist,K.friend,K.itineraryOverrides,K.itineraryMasterSignature,K.bookingMigrationQuarantine,K.completionMigrationQuarantine,K.migrationMarker])if(!(key in nz.data)){console.error('FAIL missing migrated key',key);process.exit(1);}
for(const unsafe of ['travel_engine_admin_mode_v1','travel_engine_admin_draft_v1','travel_engine_cloud_snapshot_v1','nz_friend','expenses','moments_list','travel_engine_booking_overrides_v1','travel_engine_trip_completion_v1','moment_place1','moment_latest_place1'])if(unsafe in nz.data){console.error('FAIL legacy key survived',unsafe);process.exit(1);}
if(!(nz.cfg.momentKey('place1') in nz.data)||!(nz.cfg.latestMomentKey('place1') in nz.data)){console.error('FAIL dynamic moments not migrated');process.exit(1);}
const japan=run('japan-test',old);
if(japan.cfg.keys.expenses in japan.data){console.error('FAIL non-NZ trip claimed NZ legacy expense data');process.exit(1);}
if(!('expenses' in japan.data)||!('nz_friend' in japan.data)){console.error('FAIL non-owner migration mutated quarantined NZ legacy keys');process.exit(1);}
console.log('PASS: NZ legacy data migrates once to its own namespace; unsafe state is discarded/quarantined; another Trip cannot claim it');
