#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const css=read('styles.css'),moods=read('moments-compat.js'),browser=read('ci-tests/test-browser-portability.js');
assert(css.includes('linear-gradient(145deg,#e7c7cf'),'Moments gradient missing');
assert(css.includes('linear-gradient(145deg,#a9c7a1'),'Expenses gradient missing');
assert(css.includes('repeat(2,minmax(0,1fr))'),'Split By 2x2 contract missing');
['正到爆','估你唔到','仆街了'].forEach(x=>assert(moods.includes(x),'Mixed-language mood missing: '+x));
assert(!browser.includes("'VN-RC6|25.3.3'"),'Browser CI still hard-codes RC6');
assert(browser.includes('expectedBuildIdentity'),'Browser CI is not release-neutral');
console.log('RC9 PRESENTATION CONTRACT: PASS');
