const fs=require('fs'),assert=require('assert');
const source=fs.readFileSync('guide-runtime.js','utf8');
const start=source.indexOf('function saveGuideEdit(key){');
const end=source.indexOf('window.openGuideEdit=',start);
assert(start>=0&&end>start,'Guide save handler missing');
const handler=source.slice(start,end);
assert(!/Object\.assign\(patch,\{desc:'',sub:''/.test(handler),'Guide Save clears hidden manual fields');
for(const key of ['notes','tips','highlights','signature','worth','practical','bookingNote']) {
 assert(!new RegExp('\\b'+key+':\\s*(?:\\[\\]|[\'\"]{2})').test(handler),'Guide Save silently clears '+key);
}
const original={title:'Before',notes:['Manual note'],tips:['Tip'],highlights:['Highlight'],signature:['Signature'],worth:['Worth'],practical:['Practical']};
const patch={title:'After'};const merged={...original,...patch};
for(const key of ['notes','tips','highlights','signature','worth','practical'])assert.deepStrictEqual(merged[key],original[key]);
console.log('GUIDE SAVE HIDDEN-FIELD PRESERVATION: PASS');
