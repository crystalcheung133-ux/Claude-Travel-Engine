const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(name){return fs.readFileSync(path.join(root,name),'utf8');}
function assert(cond,msg){if(!cond){throw new Error(msg);}}
const data=read('data.js');
const day=read('day.html');
const css=read('styles.css');
const trip=read('trip-config.js');
const release=JSON.parse(read('RELEASE.json'));
assert(/version:'RC\d+(?:\.\d+)?-25\.5\.2'/.test(trip),'Build identity missing');
const token=release.asset_cache_token;assert(token,'Release asset cache token missing');
assert(!data.includes('"time": "Optional · 晚餐後"'),'Optional supper time still duplicates context');
assert(!data.includes('"title": "🌙 Optional · 酒店宵夜"'),'Optional supper title still duplicates Optional');
assert(day.includes('route-hint route-hint--delivery'),'Delivery route must not render as To next stop');
assert(css.includes('grid-template-columns:64px minmax(0,1fr)!important'),'Mobile timeline safe rail missing');
assert(css.includes('linear-gradient(160deg,#f7e3e7'),'Soft Moments mobile palette missing');
for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){
  const html=read(file);
  if(html.includes('<script')||html.includes('<link')) assert(html.includes('?v='+token),`${file}: stale asset token; expected ${token}`);
}
console.log('RC15 moments + timeline capability contract: PASS');
