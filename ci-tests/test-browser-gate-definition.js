const fs=require('fs'),assert=require('assert');
const gate=fs.readFileSync('ci-tests/test-browser-release-smoke.py','utf8');
const runner=fs.readFileSync('ci-tests/run-browser.sh','utf8');
for(const token of [
 'studio_login(page)',
 "page.reload(wait_until='domcontentloaded')",
 '#tripStudioSelectorToggle',
 '#tripStudioModal.show',
 'assert_studio_closed_clean',
 '.timeline-action--trip',
 '.timeline-action--guide',
 "has_text='Booking'",
 'tz>gz',
 'top_owner',
 'nav_visible',
 "active User Selector incorrectly opened traveller selector",
 "reload active User Selector incorrectly opened traveller selector",
 "'chromium-mobile-390x844'",
 "'chromium-desktop-1280x800'",
 "'webkit-mobile-390x844'",
 "'webkit-mobile-430x932'",
 "window.GUIDE_MODAL_ORIGIN",
 "Timeline-origin Guide remained open after Booking Close",
 "openBookingCategoryCard('Restaurants')",
 "openBookingCategoryCard('Spa')",
 "Change Effect Gate",
 "canonical['spa']",
 "canonical['restaurant']",
 "removed booking resurrected in Spa list",
 "Spa row lost deploy-master title",
 "rendered Restaurants list lost the deploy-master booking title to a stale override",
 "has a configured bookingUrl but rendered no Book Online action",
 "has a configured whatsapp contact but rendered no WhatsApp action",
 "has a configured messengerUrl but rendered no Messenger action",
 "stale pending override rolled the transfer back from its deploy-master confirmed status",
 "stale displayStatus poisoned confirmed accommodation rendering",
 "no D2 Timeline item exposes both Guide and Booking actions",
 "slow remote sync incorrectly showed a save-failure alert",
 "local authoritative value was not persisted before remote sync completed",
 "double-submit is not actually blocked",
 "double-submit guard failed",
 "window.__pendingRemoteSync=new Promise(()=>{})"
]) assert(gate.includes(token),`Browser smoke lost required coverage token: ${token}`);
// The generic browser release gate must never be re-pinned to a specific mutable VN/NZ
// itinerary name, exact reservation domain, or a status-taxonomy contact channel (e.g. a
// phone-only "Call" action) that the runtime does not even implement. Those belong in
// static Companion-content CI (see test-qspa-d1-d3-reconciliation.js), not here.
for(const forbidden of [
 
 "'14:00'",
 'tablecheck.com',
 'trip-action-btn--call',
 "'#pizza4ps'"
]) assert(!gate.includes(forbidden),`Browser smoke must not hard-code obsolete/itinerary-specific content: ${forbidden}`);
assert(runner.includes('test-browser-release-smoke.py'),'Browser runner must execute the canonical release smoke');
assert(gate.includes('BROWSER_BASE_URL'),'Browser smoke must support validating a deployed production URL');
assert(gate.includes('BOOKING_AUTHORITY.deployMaster()'),'Browser smoke must use immutable deploy master, not potentially hydrated BOOKINGS_DATA, for stale-cache reconciliation');
assert(!runner.includes('|| true'),'Browser runner must never convert a failed browser test into PASS');
const workflow=fs.readFileSync('.github/workflows/browser-release-smoke.yml','utf8');
assert(workflow.includes('sh ci-tests/run-browser.sh'),'GitHub browser workflow must execute canonical browser runner');
assert(workflow.includes('mcr.microsoft.com/playwright/python:v1.56.0-noble'),'GitHub browser workflow must use pinned Chromium + WebKit preinstalled image');
assert(workflow.includes("('chromium', 'webkit')"),'GitHub browser workflow must verify both browser engines launch');
assert(!workflow.includes('playwright install --with-deps'),'Browser workflow must not reinstall Ubuntu dependencies on every run');
assert(gate.includes('pw.webkit.launch'),'Browser release gate must execute WebKit');
assert(gate.includes("'webkit-mobile-390x844'"),'Browser release gate must cover iPhone-class 390×844 WebKit');
console.log('BROWSER GATE DEFINITION: PASS — Studio lifecycle/reload, Booking foreground, Guide→Booking stacking and nav visibility are mandatory; itinerary-specific content is excluded from the generic gate.');

if(!gate.includes('booking-edit-btn')) throw new Error('Browser gate must verify Studio-only Booking Edit entry');
