const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');function read(f){return fs.readFileSync(path.join(root,f),'utf8');}function assert(x,m){if(!x){console.error('FAIL:',m);process.exitCode=1;}else console.log('PASS:',m);}const n=read('navigation.js'),r=read('shared-popup-runtime.js');
assert(/ensureTripMenu/.test(n),'Trip button first opens list popup');
assert(/#tripMenu \[data-trip-info-ref\]/.test(r),'Trip list selection is intercepted');
assert(/renderTripCard/.test(r),'Trip list selection opens detail popup card');
if(process.exitCode)process.exit(1);
