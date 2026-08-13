#!/usr/bin/env node
'use strict';
const fs=require('fs'),assert=require('assert');
const read=f=>fs.readFileSync(f,'utf8');
const root=__dirname+'/..';
const cfg=read(root+'/trip-config.js'),css=read(root+'/styles.css'),core=read(root+'/core-runtime.js'),exp=read(root+'/expenses.js'),day=read(root+'/day.html'),storage=read(root+'/storage-config.js');
assert(/version:'RC\d+(?:\.\d+)?-25\.[45]\.[0-9]+(?:\.[0-9]+)?'/.test(cfg),'25.4.x+ version missing');
assert(cfg.includes('\"presentation\":\"emoji-name\"'),'party presentation must be emoji-name');
assert(core.includes("closeBtn.hidden=true")&&core.includes("closeBtn.style.display='none'"),'required traveller close must be DOM-disabled');
assert(css.includes('.friend-pill .family-name{display:inline!important'),'header traveller name contract missing');
assert(css.includes('#expenseModal .custom-split-row{display:grid!important;grid-template-columns:1fr!important'),'mobile custom split full-name layout missing');
assert(exp.includes('const other=code===home?trip:home')&&exp.includes('${FORMATTER.decimal(basis,0)} ${code} ≈ ${FORMATTER.decimal(basisConverted,2)} ${other}'),'bidirectional input-currency FX rate missing');
assert(day.includes("String(booking.status||booking.displayStatus||'pending')"),'timeline booking status must resolve canonical status first');
assert(storage.includes("bookingOverrides:namespace+':booking_overrides:v2'"),'booking overrides must be trip namespaced');
assert(!css.includes('\\n\\n/* Engine 25.3.9'),'escaped-newline CSS corruption still present');
console.log('RC13 BROWSER ACCEPTANCE CONTRACT: PASS');
