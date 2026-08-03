#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const nav=fs.readFileSync(path.join(root,'navigation.js'),'utf8');
let failed=0;
function check(ok,msg){if(ok) console.log('PASS: '+msg); else {console.error('FAIL: '+msg);failed++;}}
check(nav.includes('function ensureTripMenu()'),'Engine owns one generated Trip popup menu');
check(nav.includes("query:{tripInfoId:key}"),'Trip popup uses semantic tripInfoId routes');
check(nav.includes("querySelectorAll('.trip-trigger')"),'Trip triggers bind through one delegated Engine mechanism');
check(!nav.includes("openTripCard('flights')"),'No Trip-specific inline route is generated');
for(const file of ['index.html','day.html','guide.html','place.html','trip.html','itinerary.html','expenses.html','moments.html','memory.html','offline.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  check(!html.includes('id="tripMenu"'),'No duplicated static Trip menu host in '+file);
  if(file!=='offline.html') check(html.includes('navigation.js?v=e2c-popup1'),'Updated Trip popup runtime cache-buster in '+file);
}
if(failed) process.exit(1);
console.log('E2C.1 TRIP POPUP CONTRACT: ALL PASSED');
