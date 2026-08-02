const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const exts=new Set(['.html','.js','.json','.webmanifest']);
const forbidden=[/ADVENTURE AWAITS/i,/NEW ZEALAND 2026/i,/New Zealand Adventure/i,/MEL · Lee/i,/SYD · Fowlers/i,/NTL · Yau/i,/nz-adventure-logo\.png/i,/nz-adventure-mark\.png/i];
let failures=[];
for(const name of fs.readdirSync(root)){const p=path.join(root,name);if(!fs.statSync(p).isFile()||!exts.has(path.extname(name)))continue;const t=fs.readFileSync(p,'utf8');for(const re of forbidden)if(re.test(t))failures.push(`${name}: ${re}`);}
for(const name of ['nz-adventure-logo.png','nz-adventure-mark.png'])if(fs.existsSync(path.join(root,name)))failures.push(`legacy asset shipped: ${name}`);
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const expected of ['japan-onsen-logo.png','WINTER CELEBRATION','JAPAN 2026'])if(!index.includes(expected))failures.push(`index first paint missing: ${expected}`);
for(const name of ['memory.html','offline.html']){const t=fs.readFileSync(path.join(root,name),'utf8');if(/lee|fowlers|yau/i.test(t))failures.push(`${name}: legacy party identity`);}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Trip identity clean: PASS');
