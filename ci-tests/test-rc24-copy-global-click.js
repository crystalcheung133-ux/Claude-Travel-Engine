const fs=require('fs'),assert=require('assert');
const day=fs.readFileSync('day.html','utf8');
assert(day.includes('window.copyTimelineAddress=function copyTimelineAddress'),
  'Copy Address handler must be exposed on window because timeline button uses inline onclick');
assert(day.includes('onclick="copyTimelineAddress('),
  'Timeline Copy Address button must invoke global handler');
assert(day.includes('✓ COPIED')&&day.includes("'success'"),
  'Successful copy must show COPIED feedback');
assert(day.includes('COPY FAILED')&&day.includes("'failed'"),
  'Failed copy must show explicit failure feedback');
console.log('RC24 COPY GLOBAL CLICK CONTRACT: PASS');
