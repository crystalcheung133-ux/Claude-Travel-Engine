#!/usr/bin/env node
'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const rootDir=path.resolve(__dirname,'..');
const root={};
const context={console,globalThis:root,window:root};
vm.createContext(context);
for(const file of ['locale-config.js','asset-config.js','theme-config.js','trip-config.js']){
  vm.runInContext(fs.readFileSync(path.join(rootDir,file),'utf8'),context,{filename:file});
}
let dataCode=fs.readFileSync(path.join(rootDir,'data.js'),'utf8');
dataCode+='\n;globalThis.__CANONICAL_DATA={PLACES,CATEGORIES,GUIDE_ORDER,DAY_LINKS,FRIENDS,BOOKINGS_DATA,TRIP_DATA,TRIP_ORDER,ITINERARY_DATA};';
vm.runInContext(dataCode,context,{filename:'data.js'});
const integrity=require(path.join(rootDir,'engine-integrity.js'));
const result=integrity.acceptTripData(root.__CANONICAL_DATA,root.TRIP_CONFIG);
if(result.blockingErrorCount!==0)throw new Error(`Canonical integrity has ${result.blockingErrorCount} blocking errors.`);
const adapter=require(path.join(rootDir,'generation-selection-adapter.js'));
const projection=adapter.createProductionProjection(root.__CANONICAL_DATA,root.TRIP_CONFIG);
if(!projection||projection.acceptance.status!=='PASS')throw new Error('Production projection did not pass canonical acceptance.');
if(Object.keys(projection.itinerary.days||{}).length!==9)throw new Error('Projection must contain 9 itinerary days.');
console.log(`Canonical integrity PASS — ${result.warningCount} non-blocking warnings; projection has 9 days.`);
