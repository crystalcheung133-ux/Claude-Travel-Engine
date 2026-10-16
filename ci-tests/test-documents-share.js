const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync('documents.js','utf8');
assert(src.includes('shareDocument(\'${esc(d.id)}\',this)'));
assert(src.includes('navigator.canShare({files:[prepared]})'));
assert(src.includes('navigator.share({files:[prepared]})'));
assert(src.includes('sharePreparedFiles.set(id,file)'));
assert(!src.includes('navigator.share({url:'));
console.log('Documents Share contract: PASS');
