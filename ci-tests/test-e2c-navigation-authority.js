#!/usr/bin/env node
const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const htmlFiles=['index.html','day.html','expenses.html','moments.html','memory.html','itinerary.html','place.html','trip.html'];
function read(f){return fs.readFileSync(path.join(root,f),'utf8');}
function assert(ok,msg){if(!ok){console.error('FAIL:',msg);process.exitCode=1;}else console.log('PASS:',msg);}
for(const file of htmlFiles){const src=read(file);assert(!/id=["']guideModal["']/.test(src),`${file} has no Guide modal host`);assert(!/id=["']tripModal["']/.test(src),`${file} has no Trip modal host`);assert(!/id=["']guideMenu["']/.test(src),`${file} has no static Guide mini-menu`);assert(!/id=["']tripMenu["']/.test(src),`${file} has no static Trip mini-menu`);assert(/href=["']guide\.html["']/.test(src),`${file} bottom Guide route is full-page`);assert(/href=["']trip\.html["']/.test(src),`${file} bottom Trip route is full-page`);assert(/href=["']itinerary\.html["']/.test(src),`${file} bottom Days route is full-page`);assert(/navigation-adapter\.js/.test(src),`${file} loads navigation adapter`);}
const guide=read('guide.html'),trip=read('trip.html'),day=read('day.html');
assert(/id=["']guidePageContent["']/.test(guide),'guide.html owns Guide page content');
assert(/id=["']tripPageContent["']/.test(trip),'trip.html owns Trip page content');
assert(!/guidePageContent/.test(day),'day.html does not own Guide page content');
assert(!/tripPageContent/.test(day),'day.html does not own Trip page content');
const guideRuntime=read('guide-runtime.js');
assert(!/milford|doubtful|gold panning|glowworm/i.test(guideRuntime),'Guide grouping contains no NZ-specific inference vocabulary');
assert(/openGuideModal=function\(key\)\{NAVIGATION_ADAPTER\.goToPlace/.test(guideRuntime),'legacy Guide modal call routes to full Place page');
const tripRuntime=read('trip-runtime.js');
assert(/NAVIGATION_ADAPTER\.goToTripInfo/.test(tripRuntime),'Trip card calls route through navigation adapter off Trip page');
assert(/NAVIGATION_ADAPTER\.goToBooking/.test(tripRuntime),'Booking calls route through navigation adapter off Trip page');
if(process.exitCode){console.error('E2C NAVIGATION AUTHORITY TEST: FAILED');process.exit(1);}console.log('E2C NAVIGATION AUTHORITY TEST: ALL PASSED');
