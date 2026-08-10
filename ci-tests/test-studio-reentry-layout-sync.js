const fs=require('fs');
const a=fs.readFileSync('admin.js','utf8');
const fail=[];
if(!a.includes("originalOpenFriendModal();")) fail.push('traveller selector must open on Studio re-entry');
if(!a.includes('scrollToStudioCard')) fail.push('Studio card scroll target missing');
if(!a.includes('requestAnimationFrame(()=>requestAnimationFrame(scrollToStudioCard))')) fail.push('double-rAF Studio re-entry sync missing');
if(!a.includes('setTimeout(scrollToStudioCard,120)')) fail.push('120ms Studio re-entry sync missing');
if(!a.includes('setTimeout(scrollToStudioCard,350)')) fail.push('350ms Studio re-entry sync missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('STUDIO RE-ENTRY TO POPUP CARD: PASS');