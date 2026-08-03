#!/usr/bin/env node
/* E2A.1 packaging gate: tests must have no external npm runtime dependency. */
'use strict';
const fs=require('fs'),path=require('path');
const dir=__dirname;
const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
const deps=Object.assign({},pkg.dependencies||{},pkg.devDependencies||{});
if(Object.keys(deps).length){console.error('FAIL: external CI dependencies remain: '+Object.keys(deps).join(', '));process.exit(1);}
if(!fs.existsSync(path.join(dir,'package-lock.json'))){console.error('FAIL: package-lock.json missing');process.exit(1);}
for(const file of fs.readdirSync(dir).filter(f=>/^test-.*\.js$/.test(f))){
  const src=fs.readFileSync(path.join(dir,file),'utf8');
  if(/require\(['"]jsdom['"]\)/.test(src)){console.error('FAIL: '+file+' still requires jsdom');process.exit(1);}
}
console.log('PASS: clean-room CI is self-contained, locked, and has no external npm dependency');
