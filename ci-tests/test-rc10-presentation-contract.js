#!/usr/bin/env node
'use strict';
const fs=require('fs'),assert=require('assert'),path=require('path');const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8'),data=fs.readFileSync(path.join(root,'data.js'),'utf8'),guide=fs.readFileSync(path.join(root,'guide-runtime.js'),'utf8'),trip=fs.readFileSync(path.join(root,'trip-runtime.js'),'utf8'),cfg=fs.readFileSync(path.join(root,'trip-config.js'),'utf8'),exp=fs.readFileSync(path.join(root,'expenses.html'),'utf8');
assert(css.includes('--rc10-expense')&&css.includes('--rc10-moment'),'RC10 module palette missing');
assert(exp.includes('expense-title-emoji')&&exp.includes('💰'),'Expense modal emoji missing');
assert(guide.includes("Signature / Must Try"),'Restaurant signature section missing');
assert(data.includes('Penthouse setting')&&data.includes('sunset 食到入夜'),'Omakase sunset/penthouse copy missing');
assert(!/Omakase Tiger[\s\S]{0,1800}正式營業時間出發前再確認/.test(data),'Omakase still asks to reconfirm generic trading hours');
assert(cfg.includes('tripMenuGroups')&&cfg.includes('activities-transport'),'VN trip menu grouping config missing');
assert(trip.includes('openTripModuleGroup')&&trip.includes('groupedModules'),'Generic trip module grouping runtime missing');
console.log('RC10 PRESENTATION + GUIDE CONTRACT: PASS');
