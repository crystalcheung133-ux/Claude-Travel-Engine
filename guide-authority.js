/* guide-authority.js — Engine 25.7.2 Guide authority.
   Saved Guide overrides are local-first + auto-sync. Timeline Publish never owns Guide. */
(function(root){'use strict';
const SAVED='travel_engine_guide_overrides_v2',LEGACY='travel_engine_guide_overrides_v1',DRAFT='travel_engine_guide_draft_v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(e){return {}}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v||{}));
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
/* RC29.135a — Guide overrides arrive from local edits AND from other devices via trip_guides,
   and guide-runtime renders them through innerHTML. Neutralise markup at the authority boundary
   (angle brackets become full-width look-alikes, so text such as "<10 min" stays readable)
   and accept only http(s) links in URL-bearing fields. */
const URL_KEYS=/^(website|url|maps)$/i;
function cleanText(v){return String(v).replace(/</g,'\uFF1C').replace(/>/g,'\uFF1E');}
function cleanUrl(v){let t=String(v||'').trim();if(!t)return '';if(!/^https?:\/\//i.test(t)){if(/^[\w-]+(\.[\w-]+)+(\/|$)/.test(t))t='https://'+t;else return '';}return t.replace(/[\s"'<>`]/g,c=>encodeURIComponent(c));}
function cleanValue(v,key){
  if(typeof v==='string')return URL_KEYS.test(key||'')?cleanUrl(v):cleanText(v);
  if(Array.isArray(v))return v.map(x=>cleanValue(x,key));
  if(v&&typeof v==='object'){const o={};Object.keys(v).forEach(k=>{o[k]=cleanValue(v[k],k)});return o}
  return v;
}
function migrate(){if(Object.keys(read(SAVED)).length)return;const old=read(LEGACY),now=new Date().toISOString(),out={};Object.keys(old).forEach(k=>out[k]={patch:old[k],updatedAt:now});if(Object.keys(out).length)write(SAVED,out)}migrate();
function records(){return read(SAVED)}
function savedPatch(key){return cleanValue(records()[key]?.patch||{})}
function draftPatch(key){return cleanValue(read(DRAFT)[key]||{})}
function resolve(key,base){return Object.assign({},clone(base||{}),clone(savedPatch(key)),draftPatch(key));}
function stage(key,patch){const d=read(DRAFT);d[key]=Object.assign({},d[key]||{},cleanValue(clone(patch||{})));write(DRAFT,d);root.markAdminDirty&&root.markAdminDirty('guide:'+key,{key});document.dispatchEvent(new CustomEvent('travelengine:guidechange',{detail:{key}}));return resolve(key,{});}
function save(key,patch){const s=records(),now=new Date().toISOString();s[key]={patch:Object.assign({},s[key]?.patch||{},cleanValue(clone(patch||{}))),updatedAt:now};write(SAVED,s);const d=read(DRAFT);delete d[key];write(DRAFT,d);document.dispatchEvent(new CustomEvent('travelengine:guidechange',{detail:{key}}));document.dispatchEvent(new CustomEvent('travelengine:guidesaved',{detail:{key,updatedAt:now}}));return resolve(key,{});}
function mergeRemote(rows){const s=records();let changed=false;(rows||[]).forEach(r=>{if(!r?.id)return;const l=s[r.id];if(!l||String(r.updatedAt||'')>String(l.updatedAt||'')){s[r.id]={patch:cleanValue(clone(r.patch||{})),updatedAt:r.updatedAt||new Date().toISOString()};changed=true}});if(changed){write(SAVED,s);document.dispatchEvent(new CustomEvent('travelengine:guidechange',{detail:{remote:true}}))}return changed;}
function commit(){const d=read(DRAFT);Object.keys(d).forEach(k=>save(k,d[k]));write(DRAFT,{});}
function discard(){write(DRAFT,{});document.dispatchEvent(new CustomEvent('travelengine:guidechange'));}
function mergedPlaces(base){const out=clone(base||{});Object.keys(out).forEach(k=>out[k]=Object.assign({},out[k],savedPatch(k)));return out;}
root.GUIDE_AUTHORITY=Object.freeze({resolve,stage,save,commit,discard,mergedPlaces,records,mergeRemote});
})(globalThis);
