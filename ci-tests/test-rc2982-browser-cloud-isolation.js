const fs=require('fs'),assert=require('assert');
const c=fs.readFileSync('sync-config.js','utf8');
assert(c.includes("typeof runtimeOverride.enabled==='boolean'"),'explicit runtime enabled:false must override baked-in cloud config');
console.log('RC29.82 BROWSER CLOUD ISOLATION: PASS');
