const fs=require('fs'),assert=require('assert');
const guide=fs.readFileSync('guide-runtime.js','utf8'),trip=fs.readFileSync('trip-runtime.js','utf8');
assert(guide.includes("window.GUIDE_MODAL_ORIGIN='timeline'"),'Timeline Guide must record timeline origin');
assert(guide.includes("window.GUIDE_MODAL_ORIGIN='guide'"),'Guide menu must record Guide origin');
assert(guide.includes("window.TRIP_MODAL_RETURN_TO_GUIDE=window.GUIDE_MODAL_ORIGIN!=='timeline'"),'Linked Booking return policy must derive from Guide origin');
assert(trip.includes("if(guideModal&&!returnToGuide)"),'Booking close must close intermediate Guide when return-to-Guide is false');
assert(trip.includes("window.GUIDE_MODAL_ORIGIN=null"),'Booking close must clear consumed Guide origin');
assert(trip.includes("window.GUIDE_MODAL_RETURN_SCROLL_Y=null"),'Timeline return must consume saved scroll position');
console.log('GUIDE → BOOKING RETURN CONTRACT: PASS — Timeline origin returns directly to Timeline; Guide origin may return to Guide.');
