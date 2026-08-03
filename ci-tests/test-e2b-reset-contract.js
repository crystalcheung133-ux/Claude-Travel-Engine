#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const reset=fs.readFileSync(path.join(root,'reset-runtime.js'),'utf8');
if(!/STORAGE_CONFIG\.prefix/.test(reset)||!/startsWith\(prefix\)/.test(reset)){console.error('FAIL reset is not namespace-prefix based');process.exit(1);}
if(/const exactKeys\s*=/.test(reset)){console.error('FAIL reset still hand-enumerates exact keys');process.exit(1);}
if(!/Object\.values\(STORAGE_CONFIG\.sessionKeys\)/.test(reset)){console.error('FAIL reset does not clear trip-scoped session state');process.exit(1);}
const storage=fs.readFileSync(path.join(root,'storage-config.js'),'utf8');
for(const literal of ['nz_friend','travel_engine_admin_mode_v1','travel_engine_itinerary_overrides_v1']){
 const outsideLegacy=storage.replace(/const legacyKeys=Object\.freeze\([\s\S]*?\n  \}\);/,'');
 if(outsideLegacy.includes(`'${literal}'`)){console.error('FAIL legacy key is still an active key: '+literal);process.exit(1);}
}
console.log('PASS: Reset clears the active trip namespace structurally and no active key uses a legacy global name');
