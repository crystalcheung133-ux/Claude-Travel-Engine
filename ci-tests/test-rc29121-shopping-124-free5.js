const fs=require('fs'),assert=require('assert');
const day=fs.readFileSync('day.html','utf8'),data=fs.readFileSync('data.js','utf8'),sd=fs.readFileSync('shopping-directory-data.js','utf8');
for(const x of ['Clothes Bar','Dot Dot Gem · JEWELLERY','Bubbli.wear','Blume III · NICHE PERFUME','Carpe Diem · CANDLES + GIFTS','dakao quartier','Aurora Saigon · 925 SILVER','Wicky Candle · SAME ADDRESS','Vina Design Store']) assert(day.includes(x),x+' missing from route');
assert(!day.includes("'5':{title:'Day 5"),'Day 5 must not have Shopping Route Map');
for(const x of ['Dot Dot Gem','Blume III','Carpe Diem','dakao quartier','Aurora Saigon','Wicky Candle','Vina Design Store']) assert(sd.includes(x),x+' missing from Shopping Directory');
assert(data.includes('Free Browse · Revisit Anything'),'Day 5 free browse missing');
assert(!sd.includes('PLANNED · Day 5'),'Day 5 must not be planned shopping');
console.log('RC29.121 SHOPPING 1/2/4 + FREE DAY5: PASS');
