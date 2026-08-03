#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const files=fs.readdirSync(root).filter(f=>f.endsWith('.js')&&!['storage-config.js','storage-migration-runtime.js'].includes(f));
const forbidden=[
 'travel_engine_expense_tombstones_v1','travel_engine_expense_sync_meta_v1','travel_engine_moment_tombstones_v1','travel_engine_moment_sync_meta_v1',
 'travel_engine_booking_overrides_v1','travel_engine_itinerary_overrides_v1','travel_engine_admin_mode_v1','nz_friend','moments_list','moments_freeform'
];
let bad=[];
for(const file of files){const src=fs.readFileSync(path.join(root,file),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');for(const lit of forbidden)if(src.includes(`'${lit}'`)||src.includes(`\"${lit}\"`))bad.push(`${file}:${lit}`);}
if(bad.length){console.error('FAIL runtime owns legacy literal keys:\n'+bad.join('\n'));process.exit(1);}
const html=fs.readdirSync(root).filter(f=>f.endsWith('.html')&&fs.readFileSync(path.join(root,f),'utf8').includes('storage-config.js'));
for(const file of html){const src=fs.readFileSync(path.join(root,file),'utf8');if(!src.includes('storage-migration-runtime.js')){console.error('FAIL migration runtime missing from '+file);process.exit(1);}if(src.indexOf('storage-migration-runtime.js')<src.indexOf('storage.js')){console.error('FAIL migration loads before storage.js in '+file);process.exit(1);}}
console.log(`PASS: ${files.length} runtime files use central storage ownership; migration loads after storage.js on ${html.length} pages`);
