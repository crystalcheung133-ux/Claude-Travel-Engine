const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const fail=[];
if(!css.includes('Travel Engine 25.4.26 — resilient mobile bottom-nav clearance')) fail.push('25.4.26 contract missing');
if(!css.includes('calc(104px + env(safe-area-inset-bottom,0px))')) fail.push('non-zero mobile fallback missing');
if(!admin.includes("if(measured>24) bottomClearance=measured")) fail.push('measurement sanity guard missing');
if(!admin.includes("removeProperty('--studio-bottom-nav-clearance')")) fail.push('invalid 0px metric is not cleared');
if(!admin.includes('schedulePersistentChromeMetrics')) fail.push('deferred layout measurement missing');
if(!admin.includes('requestAnimationFrame')) fail.push('post-layout remeasure missing');
if(!admin.includes('setTimeout(updatePersistentChromeMetrics,350)')) fail.push('late remeasure missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('MOBILE BOTTOM CLEARANCE RESILIENCE: PASS');