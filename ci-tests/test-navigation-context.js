const fs=require('fs');
function must(file,needle,label){const s=fs.readFileSync(file,'utf8');if(!s.includes(needle))throw new Error(label);}
must('guide-runtime.js',"if(!NAVIGATION.isPage('home'))","Guide categories must leave non-home pages");
must('guide-runtime.js',"query:{guideCategory:cat}","Guide category route missing");
must('guide-runtime.js',"NAVIGATION.getQuery('guideCategory'","Guide category reopen missing");
must('trip-runtime.js',"if(!NAVIGATION.isPage('trip'))","Trip cards must leave non-trip pages");
must('trip-runtime.js',"query:{tripCard:key}","Trip card route missing");
must('trip-runtime.js',"NAVIGATION.getQuery('tripCard'","Trip card reopen missing");
must('guide-runtime.js',"openGuideGroupFromDay","Timeline direct Guide path missing");
console.log('PASS navigation context ownership');
