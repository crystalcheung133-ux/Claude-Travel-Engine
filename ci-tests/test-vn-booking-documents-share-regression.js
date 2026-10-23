'use strict';
const fs=require('fs'),assert=require('assert');
const read=n=>fs.readFileSync(n,'utf8');
const trip=read('trip-runtime.js'),docs=read('documents.js'),html=read('documents.html'),css=read('styles.css'),browser=read('ci-tests/test-browser-release-smoke.py');
for(const page of ['day','place','expenses','itinerary','moments','memory']){
 const src=read(page+'.html');
 assert(src.includes('documents-runtime.js'),page+' lacks Documents runtime');
 assert(src.indexOf('documents-runtime.js')<src.indexOf('trip-runtime.js'),page+' loads Documents too late');
}
assert(trip.includes('data-booking-documents='),'Booking details lack a stable document slot');
assert(trip.includes('existing.replaceWith(updated)'),'Documents sync does not update slot in place');
assert(html.includes('class="pill doc-viewer-share"'),'Share control not Companion pill');
assert(!html.includes('<span aria-hidden="true"></span><strong id="docViewerTitle"'),'Viewer header has extra grid child');
assert(css.includes('grid-template-columns:minmax(0,1fr) 100px 38px'),'Viewer header grid not aligned');
assert(docs.includes('prepareShareAttachment(d,url)'),'Attachment not prefetched');
assert(docs.includes('Promise.resolve(navigator.share(payload))'),'Native share not initiated on click');
assert(browser.includes('const previous=STORAGE.local.readJSON(BOOKING_AUTHORITY.key'),'Stale fixture still replaces saved edits');
assert(browser.includes('BOOKING_AUTHORITY.save(spa.id'),'Browser regression lacks saved edit fixture');
console.log('VN BOOKING DOCUMENTS + SHARE REGRESSION: PASS');
