const fs=require('fs');
const e=fs.readFileSync('expenses.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
function ok(v,m){if(!v)throw new Error(m)}
ok(e.includes('const EXPENSE_FX_ADJUSTMENT=1.003'), 'missing +0.3% expense FX adjustment');
ok(e.includes('fxReferenceRate:'), 'reference FX not preserved');
ok(e.includes('fxAdjustment:'), 'FX adjustment not preserved');
ok(e.includes('function syncMultiplePayerTotal()'), 'multiple payer auto-total missing');
ok(e.includes("totalInput.readOnly=!!toggle.checked"), 'derived total must be readonly in multiple-payer mode');
ok(!e.includes('Total is calculated automatically.')&&!e.includes('Enter what each person paid.'), 'developer/explanatory multiple-payer copy must stay out of user UI');
ok(css.includes('RC29.98 — compact Multiple Payers mobile UI'), 'compact multiple-payer mobile UI guard missing');
ok(css.includes('grid-template-columns:92px minmax(0,1fr)'), 'mobile daypart rail collision guard missing');
console.log('RC29.97 expense authority PASS');
