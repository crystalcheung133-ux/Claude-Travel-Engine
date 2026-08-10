const fs=require('fs');
const a=fs.readFileSync('admin.js','utf8');
const fail=[];
if(!a.includes('requestAnimationFrame(()=>requestAnimationFrame(scrollToStudioEntry))')) fail.push('double-rAF Studio re-entry sync missing');
if(!a.includes('setTimeout(scrollToStudioEntry,120)')) fail.push('120ms Studio re-entry sync missing');
if(!a.includes('setTimeout(scrollToStudioEntry,350)')) fail.push('350ms Studio re-entry sync missing');
if(!a.includes('studioEntry.offsetTop-12')) fail.push('Studio entry anchor targeting missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('STUDIO RE-ENTRY LAYOUT SYNC: PASS');