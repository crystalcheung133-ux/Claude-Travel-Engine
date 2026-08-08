const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const trip=read('trip-config.js'),css=read('styles.css'),currency=read('currency-runtime.js');
const version=(trip.match(/version:'(RC\d+-[0-9.]+)'/)||[])[1];
assert(version,'Trip version missing');
const m=version.match(/^RC(\d+)-([0-9.]+)$/);assert(m,'Trip version format invalid');
const token=`${m[2].replace(/\./g,'-')}-rc${m[1]}`;
for(const f of ['index.html','expenses.html','day.html','guide.html','moments.html','trip.html']){
  const h=read(f);
  assert(h.includes(`?v=${token}`),f+' missing current release cache token');
  assert(!/\?v=(rc25|stage3|nz1|engine-booking)/.test(h),f+' has stale cache token');
}
assert(css.includes('Traveller emoji is presentation, never a badge/chip.'));
assert(/grid-template-columns:(?:62|64)px minmax\(0,1fr\)!important/.test(css));
assert(currency.includes('1 ${state.quote} ≈ ${FORMATTER.decimal(inverse,0)} ${state.base}'));
console.log('RC14 cache + visual acceptance contract: PASS');
