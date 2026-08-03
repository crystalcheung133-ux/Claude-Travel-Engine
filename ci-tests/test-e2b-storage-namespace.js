#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
function load(tripId){
 const context={console,TRIP_CONFIG:{storageNamespace:tripId},globalThis:null};context.globalThis=context;
 vm.runInNewContext(fs.readFileSync(path.join(root,'storage-config.js'),'utf8'),context,{filename:'storage-config.js'});
 return context.STORAGE_CONFIG;
}
const a=load('trip-a'),b=load('trip-b');
for(const cfg of [a,b]){
 const prefix=`travel-engine.${cfg.tripId}.`;
 for(const [name,key] of Object.entries(cfg.keys)){
  if(!key.startsWith(prefix)||!/\.v1$/.test(key)){console.error(`FAIL ${name}: ${key}`);process.exit(1);}
 }
 for(const [name,key] of Object.entries(cfg.sessionKeys)){
  if(!key.startsWith(prefix)||!/\.v1$/.test(key)){console.error(`FAIL session ${name}: ${key}`);process.exit(1);}
 }
 if(cfg.indexedDbName!==`travel-engine-${cfg.tripId}`)throw new Error('IndexedDB is not trip scoped');
 if(cfg.momentKey('place 1')===cfg.latestMomentKey('place 1'))throw new Error('moment key builders collide');
}
const overlap=Object.values(a.keys).filter(x=>Object.values(b.keys).includes(x));
if(overlap.length){console.error('FAIL cross-trip key overlap',overlap);process.exit(1);}
if(a.momentKey('x')===b.momentKey('x')||a.fxKey('NZD','AUD',1)===b.fxKey('NZD','AUD',1)){console.error('FAIL dynamic key overlap');process.exit(1);}
console.log('PASS: all declared and dynamic storage keys are trip scoped with zero cross-trip overlap');
