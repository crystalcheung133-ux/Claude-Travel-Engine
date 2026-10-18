/* E. RELEASE SAFETY — static contracts about the pipeline itself (clearly labelled static). */
const assert=require('assert'),h=require('./harness');
const R=f=>h.fs.readFileSync(h.path.join(h.ROOT,f),'utf8');
const walk=d=>h.fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(h.path.join(d,e.name)):[h.path.join(d,e.name)]);
(async()=>{
console.log('E. Release safety (static contracts)');
await h.test('Save & Sync has NO Publish dependency: Save triggers auto-sync; auto-sync path never prompts or requires the Publish button',()=>{
  const admin=R('admin.js'),pub=R('publication-runtime.js');
  const save=admin.slice(admin.indexOf('window.saveAdminChanges='),admin.indexOf('window.discardAdminChanges='));
  assert(!/publish|confirm\(/i.test(save.replace(/travelengine:adminsave\b/g,'')),'saveAdminChanges must not call/require Publish');
  assert(save.includes("'travelengine:adminsaved'"),'Save must announce a verified local commit');
  assert(pub.includes("document.addEventListener('travelengine:adminsaved'"),'Timeline auto-sync must be driven by Save');
  const auto=pub.slice(pub.indexOf('async function timelineTransport'),pub.indexOf('function installButton'));
  assert(!/\bconfirm\(|\balert\(/.test(auto),'auto-sync must be silent (no dialogs)');
  assert(!/hasUnsavedAdminChanges/.test(auto),'auto-sync must not depend on the Publish unsaved-changes guard');
});
await h.test('Save never discards the draft unless the local commit was verified',()=>{
  const admin=R('admin.js');const s=admin.slice(admin.indexOf('window.saveAdminChanges='),admin.indexOf('window.discardAdminChanges='));
  assert(s.indexOf('if(!detail.result.ok)')>0&&s.indexOf('if(!detail.result.ok)')<s.indexOf('draft.changes={}'),'failure check must precede draft clearing');
  assert(/return false;/.test(s.slice(s.indexOf('if(!detail.result.ok)'),s.indexOf('draft.changes={}'))));
});
await h.test('no CI test or fixture can reach a real production host',()=>{
  const bad=[];walk(h.path.join(h.ROOT,'ci-tests')).filter(f=>/\.(js|py|sh)$/.test(f)).forEach(f=>{
    const t=h.fs.readFileSync(f,'utf8');
    if(/dafgbqygccvctifrevpa|sb_publishable_/.test(t)&&!/test-G-release-safety|test-supabase-sdk-pin|test-portability|test-analytics|test-release|test-build-meta|test-source-provenance|test-single-release|test-stage1/.test(f))bad.push(h.path.relative(h.ROOT,f));
    if(/invariants/.test(f)&&/https:\/\/(?!staging\.invalid|example\.test)[a-z0-9.-]+\.supabase\.(co|in)/.test(t))bad.push(f)});
  assert.deepStrictEqual(bad,[],'tests referencing the production Supabase project');
  assert(/staging\.invalid/.test(R('ci-tests/invariants/test-C-guide-sync.js')));
});
await h.test('invariant tests contain no hard-coded personal itinerary assumptions',()=>{
  const words=/Lune|LÚNE|Maruco|Rue Miche|Qspa|Vincom|Quán|Mộc Hương|Omakase|Izakaya|Fusion Original|Crystal|Saigon|Vietnam|Ho Chi Minh/i;const bad=[];
  walk(h.path.join(h.ROOT,'ci-tests/invariants')).filter(f=>f.endsWith('.js')&&!/test-G-/.test(f)).forEach(f=>{if(words.test(h.fs.readFileSync(f,'utf8').replace(/shipped dataset[^\n]*/gi,'')))bad.push(h.path.basename(f))});
  assert.deepStrictEqual(bad,[]);
});
await h.test('checksum + release-manifest validation stays enabled in Master CI',()=>{
  const all=R('ci-tests/run-all.sh')+walk(h.path.join(h.ROOT,'ci-tests/suites')).map(f=>h.fs.readFileSync(f,'utf8')).join('\n');
  ['test-checksums.sh','test-release-metadata.js','test-release-metadata-freshness.js','test-build-meta-consistency.js','test-test-registry-contract.js'].forEach(n=>assert(all.includes(n),n+' must stay in Master CI'));
});
await h.test('new runtime module is shipped: loaded before its consumers on every page, precached, in the manifest',()=>{
  const pages=h.fs.readdirSync(h.ROOT).filter(f=>f.endsWith('.html')&&/(booking-sync-runtime|guide-sync-runtime|publication-runtime)\.js/.test(R(f)));
  assert(pages.length>=5);
  pages.forEach(p=>{const t=R(p),q=t.indexOf('save-sync-queue.js');assert(q>0,p+': queue not loaded');
    ['booking-sync-runtime.js','guide-sync-runtime.js','publication-runtime.js'].forEach(c=>{const i=t.indexOf(c);if(i>0)assert(q<i,p+': queue must load before '+c)})});
  assert(R('sw.js').includes('./save-sync-queue.js'));assert(R('PRODUCTION-FILE-MANIFEST.txt').includes('save-sync-queue.js'));
});
await h.test('no credential is written to browser storage by the Save & Sync layer',()=>{
  for(const f of ['save-sync-queue.js','guide-sync-runtime.js']){const t=R(f);assert(!/ADMIN_PIN|getAdminPublishCredential|p_admin_pin/.test(t),f+' must not touch the Studio credential')}
  const pub=R('publication-runtime.js');assert(!/(localStorage|STORAGE\.(local|session))[^;]{0,80}(credential|p_admin_pin)/.test(pub),'credential must not be persisted');
});
h.done('G. release safety');
})();
