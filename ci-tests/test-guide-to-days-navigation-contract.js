const fs=require('fs'),assert=require('assert');
const core=fs.readFileSync('core-runtime.js','utf8');
const script=fs.readFileSync('script.js','utf8');
assert(core.includes("window.dismissAllContentOverlays==='function')window.dismissAllContentOverlays()"),'Days must dismiss Guide/Booking overlays');
assert(core.includes("toggleMenu('daysMenu'"),'Days must open its menu');
assert(script.includes('function renderCanonicalDayNavigation()'),'Days navigation must be data-driven');
console.log('GUIDE → DAYS NAVIGATION CONTRACT: PASS');
