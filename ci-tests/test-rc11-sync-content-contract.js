#!/usr/bin/env node
'use strict';
const fs=require('fs'),assert=require('assert'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const data=read('data.js'),day=read('day.html'),expenses=read('expenses.js'),trip=read('trip-config.js');
assert(/expense-title-emoji[^>]*[^]*?💰[^]*?Add expense/.test(expenses),'Add expense reset must preserve money-bag emoji');
assert(/replace\(\/To next stop/.test(day),'Timeline renderer must strip duplicated To next stop prefix');
const transfer=data.match(/"bk-transfer-in": \{[\s\S]*?\n  \}/)?.[0]||'';
assert(/"status": "pending"/.test(transfer),'Arrival transfer must remain pending');
assert(/"bookingMethod": ""/.test(transfer),'Arrival transfer must not invent a booking method before booking info exists');
assert(/未預約/.test(transfer),'Arrival transfer should explicitly remain not booked');
console.log('RC11 SYNC/CONTENT CONTRACT: PASS');
