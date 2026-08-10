const fs=require('fs');
const a=fs.readFileSync('admin.js','utf8');
const fail=[];
if(!a.includes("originalOpenFriendModal();")) fail.push('re-entry must open traveller selector popup');
if(!a.includes("const studio=document.getElementById('adminModeControl')")) fail.push('Studio card target missing');
if(!a.includes("studioRect.top - sheetRect.top")) fail.push('Studio card positional targeting missing');
if(!a.includes("sheet.scrollTop + (studioRect.top - sheetRect.top) - 12")) fail.push('Studio card scroll target missing');
if(!a.includes('requestAnimationFrame(()=>requestAnimationFrame(scrollToStudioCard))')) fail.push('double-rAF layout settling missing');
if(!a.includes('setTimeout(scrollToStudioCard,350)')) fail.push('late layout settling missing');
if(a.includes("modal.classList.add('studio-view');\n      updateUI();")) fail.push('re-entry must not directly open full Studio workspace');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('STUDIO SELECTOR CARD RE-ENTRY: PASS');