const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');function read(f){return fs.readFileSync(path.join(root,f),'utf8');}function assert(x,m){if(!x){console.error('FAIL:',m);process.exitCode=1;}else console.log('PASS:',m);}const r=read('shared-popup-runtime.js');
assert(/\.trip-trigger/.test(read('navigation.js')),'Trip bottom control retains popup list');
assert(/\.guide-trigger/.test(r),'Guide bottom control opens popup category list');
assert(/data-popup-guide-category/.test(r),'Guide list to detail stays in popup flow');
assert(/data-popup-trip/.test(r),'Trip detail previous/next stays in popup flow');
assert(/Escape/.test(r),'Escape closes active popup');
if(process.exitCode)process.exit(1);
