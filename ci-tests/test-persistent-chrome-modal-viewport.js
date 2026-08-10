const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const fail=[];
if(!css.includes('--engine-fixed-chrome-height:calc(var(--studio-status-height,52px) + var(--studio-traveller-header-height,68px))')) fail.push('combined chrome height missing');
for(const modal of ['.guide-modal','.moments-modal','.unexpected-modal','.tools-modal','.mama-modal','.trip-modal']){
  if(!css.includes(modal)) fail.push(`generic modal missing: ${modal}`);
}
if(!css.includes('top:var(--engine-fixed-chrome-height)!important')) fail.push('modal top does not clear persistent chrome');
if(!css.includes('max-height:calc(100dvh - var(--engine-fixed-chrome-height))!important')) fail.push('modal viewport height not constrained');
if(!css.includes('max-height:calc(100dvh - var(--engine-fixed-chrome-height) - 24px)!important')) fail.push('modal sheet height not constrained');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('PERSISTENT CHROME MODAL VIEWPORT: PASS');
