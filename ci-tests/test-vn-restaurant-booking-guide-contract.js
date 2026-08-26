const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('data.js','utf8')+'\n;globalThis.__P=PLACES;globalThis.__B=BOOKINGS_DATA;';
const c={console};vm.createContext(c);vm.runInContext(src,c);
const P=c.__P,B=c.__B;
assert.equal(P.pizza4ps.title,'Pizza 4P’s Hai Bà Trưng');
assert.equal(P.pizza4ps.address,'151A–151B Hai Bà Trưng, Ho Chi Minh City, Vietnam');
assert.equal(B['bk-pizza4ps'].title,'Pizza 4P’s Hai Bà Trưng');
assert.equal(B['bk-pizza4ps'].address,'151A–151B Hai Bà Trưng, Ho Chi Minh City, Vietnam');
const expected={'bk-omakase-tiger':'🍣','bk-lune':'🥂','bk-man-moi':'🍲','bk-pizza4ps':'🍕'};
for(const [id,e] of Object.entries(expected)){assert.equal(B[id].emoji,e,id+' emoji');assert(B[id].signatureDishes?.length>=3,id+' signature dishes');}
assert(!B['bk-little-bear'],'Monday-closed Little Bear must not have a planned Booking');
for(const id of ['omakase-tiger','lune','man-moi','little-bear','pizza4ps']) assert(P[id].signature?.length>=3,id+' Guide signature dishes');
assert(P.pizza4ps.signature.join(' ').includes('Crab tomato cream spaghetti'));
assert(P.lune.signature.join(' ').includes('lobster raviolo'));
assert(P['man-moi'].signature.join(' ').includes('Pork jowl'));
assert(P['little-bear'].signature.join(' ').includes('Tagliolini'));
console.log('VN RESTAURANT BOOKING/GUIDE CONTRACT: PASS');
