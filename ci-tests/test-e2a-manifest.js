#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');const os=require('os');
const ROOT=path.join(__dirname,'..');
const {buildManifest,loadConfig}=require(path.join(ROOT,'generate-manifest.js'));
let failures=0;function fail(x){failures++;console.error('FAIL: '+x)}function ok(x){console.log('PASS: '+x)}
{
 const cfg=loadConfig(ROOT), m=buildManifest(cfg);
 if(m.name===cfg.TRIP_CONFIG.tripName)ok('current Trip: manifest.name matches TRIP_CONFIG');else fail('current Trip name mismatch');
 if(m.short_name===cfg.TRIP_CONFIG.shortName)ok('current Trip: short_name matches TRIP_CONFIG');else fail('current Trip short_name mismatch');
 if(m.background_color===cfg.THEME_CONFIG.colors.background&&m.theme_color===cfg.THEME_CONFIG.colors.background)ok('current Trip: colours match theme');else fail('current Trip colours mismatch');
 for(const icon of m.icons){if(fs.existsSync(path.join(ROOT,icon.src)))ok('current Trip icon exists: '+icon.src);else fail('missing icon: '+icon.src)}
}
{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'manifest-portability-'));
 fs.mkdirSync(path.join(d,'assets'));
 fs.writeFileSync(path.join(d,'asset-config.js'),`(function(r){r.ASSET_CONFIG=Object.freeze({branding:Object.freeze({}),hero:Object.freeze({}),icons:Object.freeze({icon192:'assets/a.png',icon512:'assets/b.png'})});})(globalThis);`);
 fs.writeFileSync(path.join(d,'theme-config.js'),`(function(r){r.THEME_CONFIG=Object.freeze({colors:Object.freeze({background:'#112233'})});})(globalThis);`);
 fs.writeFileSync(path.join(d,'locale-config.js'),`(function(r){r.LOCALE_CONFIG=Object.freeze({});})(globalThis);`);
 fs.writeFileSync(path.join(d,'trip-config.js'),`(function(r){r.TRIP_CONFIG=Object.freeze({tripName:'Portable Trip',shortName:'Portable'});})(globalThis);`);
 fs.writeFileSync(path.join(d,'assets/a.png'),'x');fs.writeFileSync(path.join(d,'assets/b.png'),'x');
 const m=buildManifest(loadConfig(d));
 if(m.name==='Portable Trip'&&m.short_name==='Portable')ok('synthetic fixture uses its own identity');else fail('synthetic identity mismatch');
 if(m.background_color==='#112233')ok('synthetic fixture uses its own theme');else fail('synthetic theme mismatch');
 fs.rmSync(d,{recursive:true,force:true});
}
if(failures){console.error(`E2A MANIFEST GENERATION TEST: FAILED (${failures})`);process.exit(1)}
console.log('E2A MANIFEST GENERATION TEST: ALL PASSED');
