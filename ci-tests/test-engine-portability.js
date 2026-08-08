const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const runtimeFiles=[
  'analytics-runtime.js','sync-config.js','storage-config.js','publication-runtime.js',
  'core-runtime.js','expenses.js','moments.js','moments-compat.js',
  'expense-sync-runtime.js','moment-sync-runtime.js','export-runtime.js','complete-runtime.js'
];
const forbidden=[
  ['NZ trip id',/nz-family-2026/],
  ['legacy NZ identity key',/nz_friend/],
  ['Lee literal fallback',/\|\|\s*['"]lee['"]/],
  ['fixed NZ party order',/\[['"]lee['"],['"]fowlers['"],['"]yau['"]\]/],
  ['New Zealand export filename',/New-Zealand-Expenses/]
];
let failures=[];
for(const file of runtimeFiles){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  for(const [label,re] of forbidden){if(re.test(text))failures.push(`${file}: ${label}`);}
}
if(failures.length){console.error('ENGINE PORTABILITY FAIL\n'+failures.join('\n'));process.exit(1);}
const trip=fs.readFileSync(path.join(root,'trip-config.js'),'utf8');
if(!/identityStorageKey:\s*['"]nz_friend['"]/.test(trip)){
  console.error('NZ reference config must preserve legacy identityStorageKey for deployed-device compatibility');process.exit(1);
}
const schema=fs.readFileSync(path.join(root,'ANALYTICS-SCHEMA.sql'),'utf8');
if(/nz-family-2026/.test(schema)||!/grant insert on public\.trip_analytics_events to authenticated/i.test(schema)||!/revoke select, update, delete on public\.trip_analytics_events from authenticated/i.test(schema)){
  console.error('Analytics schema is not portable INSERT-only');process.exit(1);
}
console.log('PASS engine portability: reusable runtimes are trip-neutral; NZ legacy identity remains instance-owned');
