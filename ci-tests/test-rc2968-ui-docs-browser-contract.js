const fs=require('fs');function ok(x,m){if(!x)throw new Error(m)}
const css=fs.readFileSync('styles.css','utf8'),idx=fs.readFileSync('index.html','utf8'),docs=fs.readFileSync('documents-runtime.js','utf8'),browser=fs.readFileSync('ci-tests/test-browser-release-smoke.py','utf8');
ok(css.includes('repeat(6,minmax(0,1fr))'),'bottom nav must be six columns');
ok(css.includes('.docs-form label[hidden]{display:none!important;}'),'document cascading rows must respect hidden');
ok(idx.includes('id="currencyAmount"')&&idx.includes('value="10000"'),'VND converter default must be 10000');
ok(docs.includes('function canLink(){return true}'),'VN collaborative documents must permit contextual link selection');
ok(browser.includes('__doubleSubmitRealBookingAuthority')&&browser.includes('window.BOOKING_AUTHORITY=window.__doubleSubmitRealBookingAuthority'),'browser smoke must restore wrapped authority between viewports');
console.log('RC29.68 UI + DOCUMENTS + BROWSER CONTRACT: PASS');