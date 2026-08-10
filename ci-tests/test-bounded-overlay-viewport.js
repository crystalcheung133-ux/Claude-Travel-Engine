const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const fail=[];
if(!css.includes('Travel Engine 25.4.23 — bounded overlay viewport contract')) fail.push('25.4.23 contract missing');
if(!css.includes('--engine-mobile-bottom-clearance:var(--studio-bottom-nav-clearance')) fail.push('mobile bottom clearance variable missing');
if(!css.includes('bottom:var(--engine-mobile-bottom-clearance)!important')) fail.push('modal bottom does not clear mobile nav');
if(!css.includes('- var(--engine-mobile-bottom-clearance)')) fail.push('modal max-height does not subtract bottom nav');
if(!admin.includes("document.querySelector('.app-nav')")) fail.push('bottom nav measurement missing');
if(!admin.includes("window.innerHeight-rect.top")) fail.push('bottom nav visible clearance calculation missing');
if(!admin.includes("addEventListener('resize'")) fail.push('resize metric refresh missing');
if(!admin.includes("addEventListener('orientationchange'")) fail.push('orientation metric refresh missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('BOUNDED OVERLAY VIEWPORT: PASS');
