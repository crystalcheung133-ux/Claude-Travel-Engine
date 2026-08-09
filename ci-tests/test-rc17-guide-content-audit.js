const fs=require('fs'),assert=require('assert');
const data=fs.readFileSync('data.js','utf8');
const guide=fs.readFileSync('guide-runtime.js','utf8');
const home=fs.readFileSync('index.html','utf8');
const cfg=fs.readFileSync('trip-config.js','utf8');
function record(key){
  const re=new RegExp('  "'+key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'": \\{([\\s\\S]*?)(?=\\n  "[^"\\n]+": \\{|\\n\\};\\n\\nconst CATEGORIES)');
  const m=data.match(re); assert(m,'Missing place '+key); return m[0];
}
assert.match(cfg,/version:'RC\d+-25\.4\.\d+(?:\.\d+)?'/,'Guide audit requires a valid release identity');
assert.match(home,/openGuideCategory\('SHOP'\)/,'Guide menu must expose Shopping');
assert.doesNotMatch(home,/home-shopping-button/,'Shopping must not be forced onto the Home hero');
for(const key of ['libe','dauple','nosbyn','new-playground','push-push','saigon-concept','ohquao','louh','garmentory','dalla-saigon','rubies','lane-ci','takashimaya']){
  assert.match(record(key),/"shoppingRoute":/,'Shopping route metadata missing: '+key);
}
assert.doesNotMatch(data,/"hours":\s*"(?:出發前|Unconfirmed|[^\"]*出發前再確認)/,'Guide data must not expose generic/unverified hours as Trading Hours');
for(const key of ['omakase-tiger']) assert.match(record(key),/"status": "booked"/,'Booked dining status missing: '+key);
for(const key of ['late-night-supper','man-moi','social-club']) assert.match(record(key),/"status": "optional"/,'Optional dining status missing: '+key);
for(const key of ['pho-sol','com-tam-moc','lune','quan-thuy','little-bear','running-bean','pizza4ps','quince','pho-vietnam','bep-me-in']) assert.match(record(key),/"status": "planned"/,'Planned dining status missing: '+key);
assert.match(guide,/explicit==='booked'/,'Guide renderer must honor explicit Booked status');
assert.doesNotMatch(record('fusion'),/"hours":/,'Stay card must not carry opening-hours metadata');
assert.match(record('cash-backup'),/"cat": "PRACTICAL"/,'Money exchange backup must be Practical');
assert.match(record('social-club'),/24樓|24\/F/,'Social Club card must explain rooftop setting');
assert.match(record('social-club'),/skyline/,'Social Club card must explain skyline value');
console.log('RC17 Guide content audit contract PASS');
