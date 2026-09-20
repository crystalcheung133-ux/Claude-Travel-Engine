/* guide-authority.js — Engine 25.7.2 Studio Guide overrides. */
(function(root){'use strict';
const SAVED='travel_engine_guide_overrides_v1',DRAFT='travel_engine_guide_draft_v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(e){return {}}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v||{}));
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function resolve(key,base){return Object.assign({},clone(base||{}),read(SAVED)[key]||{},read(DRAFT)[key]||{});}
function stage(key,patch){const d=read(DRAFT);d[key]=Object.assign({},d[key]||{},clone(patch||{}));write(DRAFT,d);root.markAdminDirty&&root.markAdminDirty('guide:'+key,{key});document.dispatchEvent(new CustomEvent('travelengine:guidechange',{detail:{key}}));return resolve(key,{});}
function commit(){const s=read(SAVED),d=read(DRAFT);Object.keys(d).forEach(k=>s[k]=Object.assign({},s[k]||{},d[k]));write(SAVED,s);write(DRAFT,{});}
function discard(){write(DRAFT,{});document.dispatchEvent(new CustomEvent('travelengine:guidechange'));}
function mergedPlaces(base){const out=clone(base||{});Object.keys(out).forEach(k=>out[k]=resolve(k,out[k]));return out;}
document.addEventListener('travelengine:adminsave',commit);document.addEventListener('travelengine:admindiscard',discard);
root.GUIDE_AUTHORITY=Object.freeze({resolve,stage,commit,discard,mergedPlaces});
})(globalThis);
