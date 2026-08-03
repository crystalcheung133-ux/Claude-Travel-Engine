const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
function read(f){return fs.readFileSync(path.join(root,f),'utf8');}function assert(x,m){if(!x){console.error('FAIL:',m);process.exitCode=1;}else console.log('PASS:',m);}
const htmlFiles=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
for(const file of htmlFiles){const src=read(file);if(/guide-runtime\.js/.test(src)){assert(/shared-popup-runtime\.js/.test(src),`${file} loads shared popup runtime`);}assert(/href=["']itinerary\.html["']/.test(src)||!/<nav class=["']app-nav/.test(src),`${file} keeps Days full-page route`);}
const runtime=read('shared-popup-runtime.js');
assert(/ensureHosts/.test(runtime),'one shared runtime creates modal hosts');
assert(/global\.openTripCard=renderTripCard/.test(runtime),'Trip detail authority is shared popup');
assert(/global\.openGuideModal=renderGuidePlace/.test(runtime),'Guide detail authority is shared popup');
assert(/global\.openGuideGroupFromDay/.test(runtime),'Timeline Guide links use popup authority');
assert(!/NAVIGATION_ADAPTER\.goToTripInfo/.test(runtime),'popup runtime does not route Trip details to full page');
assert(!/NAVIGATION_ADAPTER\.goToPlace/.test(runtime),'popup runtime does not route Guide details to full page');
if(process.exitCode)process.exit(1);
