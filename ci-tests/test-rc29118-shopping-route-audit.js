const fs=require('fs'),assert=require('assert');
const s=fs.readFileSync('day.html','utf8');
for(const x of [
 "Dear José','49A Nguyễn Trãi, Bến Thành, District 1','ChIJwwlnWS4vdTERpL640u6KKVE",
 "111 Concept Store · OPTIONAL",
 "RUBIES Studio','47–49 Trần Quang Diệu, Nhiêu Lộc','ChIJVbEpSPgvdTER6hMDTyZp11A",
 "Mozaic Space · OPTIONAL','31/23 Đ. Lê Văn Sỹ",
 "YouOn Boutique · THẢO ĐIỀN BRANCH','29 Thảo Điền",
 "Fine Arts Museum · ROUTE START','97A Phó Đức Chính",
 "Saigon Centre / Takashimaya · final top-up','65–67 Lê Lợi"
]) assert(s.includes(x),'missing route contract: '+x);
assert(s.indexOf("['RUBIES Studio'")<s.indexOf("['Dalla Saigon'"),'Day2 RUBIES must precede Dalla');
assert(s.indexOf("['Lane Cì'")<s.indexOf("['Mì Workshop'"),'Day2 Lane Ci must precede Mi Workshop');
assert(s.includes("mapsFullRoute(stops,section.modes)"),'full route must receive route modes');
assert(s.includes("walking?'&travelmode=walking':''"),'all-walking full routes must force walking mode');
console.log('RC29.118 shopping route audit PASS');
