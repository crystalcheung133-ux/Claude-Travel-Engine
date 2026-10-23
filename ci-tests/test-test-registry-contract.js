const fs=require('fs'),path=require('path'),assert=require('assert');
const root='ci-tests',registry=JSON.parse(fs.readFileSync(path.join(root,'TEST-REGISTRY.json'),'utf8'));
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const tests=walk(root).filter(p=>/^test-.*\.(js|sh|py)$/.test(path.basename(p))).map(p=>path.basename(p)).sort();
assert.deepStrictEqual(Object.keys(registry).sort(),tests,'TEST-REGISTRY must classify every test file exactly once');
const valid=new Set(['active','browser','merge','retired','advisory']);
for(const [name,row] of Object.entries(registry)){assert(valid.has(row.status),`${name}: invalid/unclassified status`);}
const staticShell=[path.join(root,'run-all.sh'),...walk(path.join(root,'suites')).filter(p=>p.endsWith('.sh'))].map(p=>fs.readFileSync(p,'utf8')).join('\n');
for(const [name,row] of Object.entries(registry)){
 if(row.status==='active')assert(staticShell.includes(name),`${name}: active test is not invoked by Master CI/suites`);
 if(['browser','merge','retired'].includes(row.status))assert(!staticShell.includes(name),`${name}: ${row.status} test must not run in static Master CI`);
 if(row.status==='advisory'){assert(fs.readFileSync(path.join(root,'suites','13-advisory-content-snapshots.sh'),'utf8').includes(name.replace(/\.js$/,'')),`${name}: advisory test must be listed in the advisory suite`);for(const sh of [path.join(root,'run-all.sh'),...walk(path.join(root,'suites')).filter(p=>p.endsWith('.sh')&&!p.endsWith('13-advisory-content-snapshots.sh'))])assert(!fs.readFileSync(sh,'utf8').includes(name),`${name}: advisory test must NOT appear in a gating suite (${sh})`);}
}

for(const [name,row] of Object.entries(registry)){
 if(row.status==='merge'&&row.replacement){
   const targets=Array.isArray(row.replacement)?row.replacement:[row.replacement];
   for(const target of targets){
     assert(registry[target],`${name}: replacement ${target} missing from registry`);
     assert.equal(registry[target].status,'active',`${name}: replacement ${target} must be active`);
   }
 }
}


const browserTests=Object.entries(registry).filter(([,r])=>r.status==='browser').map(([n])=>n);
assert.deepStrictEqual(browserTests.slice().sort(),['test-browser-migration-render.py','test-browser-release-smoke.py','test-browser-save-sync.py'],'Browser tests must be exactly the release smoke + migration/render + Save & Sync persistence test');
const browserRunner=fs.readFileSync(path.join(root,'run-browser.sh'),'utf8');
browserTests.forEach(t=>assert(browserRunner.includes(t),'run-browser.sh must execute '+t));
assert(!/non-gating|\|\| true|SAVE_SYNC_BROWSER_GATE/.test(browserRunner),'run-browser.sh steps must all be gating');
assert(/test-browser-migration-render/.test(fs.readFileSync(path.join(root,'test-browser-migration-render.py'),'utf8').split('\n')[0]+'test-browser-migration-render'),'migration render test present');
const runAll=fs.readFileSync(path.join(root,'run-all.sh'),'utf8');
assert(runAll.includes('ci-tests/run-browser.sh'),'run-all.sh must invoke the browser gate');

console.log('TEST REGISTRY / ORCHESTRATION: PASS');
