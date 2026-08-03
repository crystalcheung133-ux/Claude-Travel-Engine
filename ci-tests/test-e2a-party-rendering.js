#!/usr/bin/env node
/* Stage E2A/E2A.1 — self-contained party rendering test.
   Uses a minimal DOM fixture so clean-room CI has no external npm dependency. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const NZ_TRIP_CONFIG = `
(function(root){root.TRIP_CONFIG=Object.freeze({
  tripName:'New Zealand Companion',shortName:'NZ',storageNamespace:'nz-family-2026',
  participants:Object.freeze({defaultKey:'lee',order:Object.freeze(['lee','fowlers','yau']),identities:Object.freeze({
    lee:Object.freeze({code:'MEL',name:'Lee'}),fowlers:Object.freeze({code:'SYD',name:'Fowlers'}),yau:Object.freeze({code:'NTL',name:'Yau'})
  })})
});})(globalThis);`;

const NON_NZ_TRIP_CONFIG = `
(function(root){root.TRIP_CONFIG=Object.freeze({
  tripName:'Japan Onsen Companion',shortName:'Japan',storageNamespace:'japan-test-fixture',
  participants:Object.freeze({defaultKey:'moon',order:Object.freeze(['moon','ava']),identities:Object.freeze({
    moon:Object.freeze({code:'MOON',name:'Moon'}),ava:Object.freeze({code:'AVA',name:'Ava'})
  })})
});})(globalThis);`;

class ClassList { constructor(values=[]){this.s=new Set(values);} contains(v){return this.s.has(v);} }
class El {
  constructor({id='', classes=[], value='', dataset={}}={}){this.id=id;this.classList=new ClassList(classes);this.value=value;this.dataset={...dataset};this.innerHTML='';this.textContent='';}
}
function text(html){return String(html||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim();}
function optionTexts(html){return [...String(html||'').matchAll(/<option[^>]*>([\s\S]*?)<\/option>/g)].map(m=>text(m[1]));}
function makeDocument(){
  const paid=new El({id:'expensePaidBy'}), consumed=new El({id:'expenseConsumedBy'});
  const split=new El(), friend=new El({dataset:{family:''}}), choices=new El({classes:['friend-choice-list']});
  const bySelector={
    'select[data-party-options]':[paid,consumed],
    '[data-party-split-options]':[split],
    '[data-friend-label]':[friend]
  };
  return {
    readyState:'complete',
    addEventListener(){},
    querySelectorAll(sel){return bySelector[sel]||[];},
    querySelector(sel){if(sel==='#mamaModal .friend-choice-list')return choices;return null;},
    getElementById(){return null;},
    __els:{paid,consumed,split,friend,choices}
  };
}
function loadFixture(configSource){
  const document=makeDocument();
  const sandbox={console,document,localStorage:null,globalThis:null,window:null};
  sandbox.globalThis=sandbox;sandbox.window=sandbox;
  vm.createContext(sandbox);
  for(const src of [read('trip-failure-runtime.js'),configSource,read('party-render-runtime.js')]) vm.runInContext(src,sandbox);
  if(typeof sandbox.__partyRenderRuntimeRun==='function')sandbox.__partyRenderRuntimeRun();
  return document.__els;
}
let failures=0;const fail=m=>{failures++;console.error('FAIL: '+m)};const ok=m=>console.log('PASS: '+m);
{
  const e=loadFixture(NZ_TRIP_CONFIG); const a=optionTexts(e.paid.innerHTML), b=optionTexts(e.consumed.innerHTML);
  if(a.some(t=>/MEL · Lee/.test(t))&&a.some(t=>/SYD · Fowlers/.test(t))&&a.some(t=>/NTL · Yau/.test(t)))ok('NZ fixture renders all configured parties');else fail('NZ parties missing: '+a.join('|'));
  if(b.length===a.length&&b.length>0)ok('consumed-by uses same party set');else fail('consumed-by mismatch');
  if(/Lee/.test(text(e.split.innerHTML))&&/Fowlers/.test(text(e.split.innerHTML))&&/Yau/.test(text(e.split.innerHTML)))ok('split list renders NZ parties');else fail('split list missing NZ parties');
  if(/Lee/.test(text(e.friend.innerHTML)||e.friend.textContent))ok('friend label renders configured NZ identity');else fail('friend label missing NZ identity');
}
{
  const e=loadFixture(NON_NZ_TRIP_CONFIG); const a=optionTexts(e.paid.innerHTML); const label=text(e.friend.innerHTML)||e.friend.textContent;
  if(!a.some(t=>/Lee|Fowlers|Yau/.test(t)))ok('non-NZ fixture contains no NZ parties');else fail('NZ leak: '+a.join('|'));
  if(a.some(t=>/Moon/.test(t))&&a.some(t=>/Ava/.test(t)))ok('non-NZ fixture renders its own parties');else fail('fixture parties missing');
  if(!/Lee|Fowlers|Yau/.test(label))ok('non-NZ friend label contains no NZ identity');else fail('NZ label leak: '+label);
}
{
  const e=loadFixture('/* no TRIP_CONFIG */'); const a=optionTexts(e.paid.innerHTML); const label=e.friend.textContent||text(e.friend.innerHTML);
  if(a.length===0)ok('no-trip fixture fabricates no party options');else fail('unexpected options');
  if(label==='No Trip Loaded')ok('no-trip fixture uses shared failure text');else fail('wrong failure text: '+label);
  if(!/Lee|Fowlers|Yau|nz-family-2026/.test(label))ok('no NZ fallback leaked');else fail('NZ fallback leaked');
}
if(failures){console.error(`E2A PARTY RENDERING TEST: FAILED (${failures})`);process.exit(1);}console.log('E2A PARTY RENDERING TEST: ALL PASSED');
