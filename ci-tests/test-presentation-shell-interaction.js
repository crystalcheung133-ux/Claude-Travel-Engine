const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const admin=fs.readFileSync(process.argv[3]||'admin.js','utf8');
const fail=[];
if(!css.includes('dedicated Trip Studio foreground shell')) fail.push('dedicated Studio popup contract missing');
if(!css.includes('#tripStudioModal')) fail.push('Trip Studio modal selector missing');
if(css.includes('#mamaModal.studio-view')) fail.push('Studio must not reuse Traveller Selector shell');
if(!admin.includes("studioModal.id='tripStudioModal'")) fail.push('Studio modal runtime root missing');
if(!admin.includes("studio.scrollIntoView({block:'start'})")) fail.push('Studio open must align its dedicated scroll owner');
if(!admin.includes('key!==previousFriend')) fail.push('traveller-switch exit guard missing');
for(const x of ['setStoredMode(false);','lockAdminSession();','closeTripStudioPanel();']) if(!admin.includes(x)) fail.push('missing '+x);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('PRESENTATION SHELL INTERACTION: PASS');
