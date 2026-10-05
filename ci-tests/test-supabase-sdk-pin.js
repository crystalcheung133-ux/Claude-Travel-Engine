const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const expected='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2';
const htmlFiles=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
let count=0;
for(const f of htmlFiles){
 const s=fs.readFileSync(path.join(root,f),'utf8');
 const urls=[...s.matchAll(/<script[^>]+src=["'](https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^"']+)["']/gi)].map(m=>m[1]);
 for(const url of urls){ count++; assert.equal(url,expected,`${f}: Supabase SDK must be exact-pinned`); }
}
assert(count>0,'No Supabase browser SDK references found');
console.log(`SUPABASE SDK PIN: PASS — ${count} references pinned to 2.117.2`);
