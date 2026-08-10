const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const app=fs.readFileSync('app-runtime.js','utf8');
const expenses=fs.readFileSync('expenses.html','utf8');
const trip=fs.readFileSync('trip.html','utf8');
const fail=[];
if(!css.includes('Travel Engine 25.4.25 — canonical scrollable modal sheet contract'))fail.push('canonical modal sheet contract missing');
if(!css.includes('height:100%!important')||!css.includes('overflow-y:auto!important'))fail.push('modal sheet must fill bounded viewport and scroll internally');
if(!css.includes('padding-bottom:28px!important'))fail.push('bottom action clearance missing');
if(!css.includes('position:static!important'))fail.push('modal actions must remain normal-flow, not sticky');
if(!app.includes('TRAVEL_ENGINE_RESET_MODAL_SCROLL'))fail.push('modal scroll reset runtime missing');
if(!app.includes('sheet.scrollTop=0'))fail.push('modal must open at top');
if(!expenses.includes('id="expenseSaveButton" data-modal-primary-action'))fail.push('Expense Save semantic marker missing');
if(!trip.includes('data-modal-primary-action onclick="saveMoments()"'))fail.push('Moments Save semantic marker missing');
if(!trip.includes('data-modal-primary-action onclick="saveUnexpected()"'))fail.push('Unexpected Save semantic marker missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('CANONICAL SCROLLABLE MODAL SHEET: PASS');
