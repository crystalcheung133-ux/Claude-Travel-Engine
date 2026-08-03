#!/usr/bin/env node
/* E2A.1 — enforce one production definition of the visible no-trip text
   and neutral Complete Trip fallback identity. */
'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const files=fs.readdirSync(root).filter(f=>/\.(js|html)$/.test(f));
const allowed='trip-failure-runtime.js';
let failures=0,definitions=0;
for(const f of files){
  const src=fs.readFileSync(path.join(root,f),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/<!--[^]*?-->/g,'');
  const matches=src.match(/['"]No Trip Loaded['"]/g)||[];
  if(f===allowed)definitions+=matches.length;
  else if(matches.length){failures++;console.error(`FAIL: ${f} contains ${matches.length} duplicate runtime literal(s)`);}
}
if(definitions!==1){failures++;console.error(`FAIL: expected exactly one authority definition in ${allowed}; found ${definitions}`);}else console.log('PASS: exactly one production No Trip Loaded definition');
const complete=fs.readFileSync(path.join(root,'complete-runtime.js'),'utf8');
if(/until\s+Lee\s+reopens/i.test(complete)){failures++;console.error('FAIL: complete-runtime.js still contains Lee fallback');}else console.log('PASS: Complete Trip fallback is identity-neutral');
if(!/until the trip admin reopens the trip/i.test(complete)){failures++;console.error('FAIL: neutral Complete Trip fallback not found');}else console.log('PASS: neutral Complete Trip fallback is present');
if(failures)process.exit(1);console.log('E2A.1 IDENTITY AUTHORITY TEST: ALL PASSED');
