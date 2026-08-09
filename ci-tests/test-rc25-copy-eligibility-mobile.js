const fs=require('fs'),assert=require('assert');
const day=fs.readFileSync('day.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
const data=fs.readFileSync('data.js','utf8');
assert(day.includes('function timelineCopyEligible(item,place)'),'eligibility helper missing');
assert(day.includes('copyAddressEligible===false'),'explicit eligibility override missing');
assert(day.includes('copy-label-desktop')&&day.includes('copy-label-mobile'),'responsive copy labels missing');
assert(css.includes('.copy-label-mobile{display:none}')&&css.includes('@media(max-width:700px)'),'mobile copy CSS missing');
assert(/Night Walk[\s\S]{0,180}copyAddressEligible/.test(data)||/copyAddressEligible[\s\S]{0,180}Night Walk/.test(data),
  'Night Walk should explicitly suppress Copy Address');
console.log('RC25 COPY ELIGIBILITY + MOBILE LABEL CONTRACT: PASS');
