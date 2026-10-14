/* guide-authority.js — Engine 25.7.2 Guide authority.
   Saved Guide overrides are local-first + auto-sync. Timeline Publish never owns Guide. */
(function(root){'use strict';
const SAVED='travel_engine_guide_overrides_v2',LEGACY='travel_engine_guide_overrides_v1',DRAFT='travel_engine_guide_draft_v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(e){return {}}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v||{}));
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function migrate(){if(Object.keys(read(SAVED)).length)return;const old=read(LEGACY),now=new Date().toISOString(),out={};Object.keys(old).forEach(k=>out[k]={patch:old[k],updatedAt:now});if(Object.keys(out).length)write(SAVED,out)}migrate();
function records(){return read(SAVED)}
function savedPatch(key){return records()[key]?.patch||{}}
function resolve(key,base){return Object.assign({},clone(base||{}),clone(savedPatch(key)),read(DRAFT)[key]||{});}
function stage(key,patch){const d=read(DRAFT);d[key]=Object.assign({},d[key]||{},clone(patch||{}));write(DRAFT,d);root.markAdminDirty&&root.markAdminDirty('guide:'+key,{key});document.dispatchEvent(new CustomEvent('travelengine:guidechange',{detail:{key}}));return resolve(key,{});}
function save(key,patch){const s=records(),now=new Date().toISOString();s[key]={patch:Object.assign({},s[key]?.patch||{},clone(patch||{})),updatedAt:now};write(SAVED,s);const d=read(DRAFT);delete d[key];write(DRAFT,d);document.dispatchEvent(new CustomEvent('travelengine:guidechange',{detail:{key}}));document.dispatchEvent(new CustomEvent('travelengine:guidesaved',{detail:{key,updatedAt:now}}));return resolve(key,{});}
function mergeRemote(rows){const s=records();let changed=false;(rows||[]).forEach(r=>{if(!r?.id)return;const l=s[r.id];if(!l||String(r.updatedAt||'')>String(l.updatedAt||'')){s[r.id]={patch:clone(r.patch||{}),updatedAt:r.updatedAt||new Date().toISOString()};changed=true}});if(changed){write(SAVED,s);document.dispatchEvent(new CustomEvent('travelengine:guidechange',{detail:{remote:true}}))}return changed;}
function commit(){const d=read(DRAFT);Object.keys(d).forEach(k=>save(k,d[k]));write(DRAFT,{});}
function discard(){write(DRAFT,{});document.dispatchEvent(new CustomEvent('travelengine:guidechange'));}
function mergedPlaces(base){const out=clone(base||{});Object.keys(out).forEach(k=>out[k]=Object.assign({},out[k],savedPatch(k)));return out;}
root.GUIDE_AUTHORITY=Object.freeze({resolve,stage,save,commit,discard,mergedPlaces,records,mergeRemote});
})(globalThis);
