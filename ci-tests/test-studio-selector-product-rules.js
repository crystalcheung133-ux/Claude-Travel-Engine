const fs=require('fs'),assert=require('assert');
const s=fs.readFileSync('admin.js','utf8');
assert(s.includes("familyList.insertAdjacentElement('afterend',selectorToggle)"),
  'Studio Mode must render after/below traveller list');
assert(!s.includes("familyList.insertAdjacentElement('beforebegin',selectorToggle)"),
  'obsolete Studio-before-travellers ordering survived');
const reentry=/window\.openFriendModal=function\(\)\{[\s\S]{0,800}?if\(state\.mode && isUnlocked\(\) && isAdminUser\(\)\)\{[\s\S]{0,300}?openTripStudioPanel\(\);[\s\S]{0,100}?return;/;
assert(reentry.test(s),'active Studio session must make User Selector reopen Studio workspace directly');
console.log('STUDIO SELECTOR PRODUCT RULES: PASS');
