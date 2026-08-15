const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=fs.readFileSync('data.js','utf8');
const authority=fs.readFileSync('booking-authority.js','utf8');

const stale={
  'bk-pizza4ps':{id:'bk-pizza4ps',bookingId:'bk-pizza4ps',title:'Pizza 4P’s Hai Bà Trưng',day:4,dayId:'day4',date:'2026-11-02',time:'11:30',status:'pending',bookingName:'',notes:'Reserve lunch for 4 guests.'},
  'bk-moc-huong':{id:'bk-moc-huong',bookingId:'bk-moc-huong',title:'Mộc Hương Wellness',day:3,dayId:'day3',date:'2026-11-01',time:'15:30',status:'pending'},
  'bk-moc-healing':{id:'bk-moc-healing',bookingId:'bk-moc-healing',title:'Mộc Healing Spa',day:4,dayId:'day4',date:'2026-11-02',time:'16:45',status:'pending'}
};
let stored={version:1,overrides:stale,deletedIds:[],updatedAt:'2026-08-01T00:00:00Z'};
const context={
  console,
  TRIP_CONFIG:{bookingMasterRevision:2},
  STORAGE_CONFIG:{keys:{bookingOverrides:'test-booking-overrides'}},
  STORAGE:{local:{
    readJSON:(k,f)=>JSON.parse(JSON.stringify(stored)),
    writeJSON:(k,v)=>{stored=JSON.parse(JSON.stringify(v));return true;},
    remove:()=>{stored=null;return true;}
  }},
  CustomEvent:function(){},document:undefined
};
vm.createContext(context);
vm.runInContext(data+'\n;globalThis.BOOKINGS_DATA=BOOKINGS_DATA;',context);
vm.runInContext(authority,context);

const A=context.BOOKING_AUTHORITY;
let pizza=A.get('bk-pizza4ps');
assert.equal(pizza.title,'Pizza 4P’s Bến Thành');
assert.equal(pizza.time,'13:00');
assert.equal(pizza.day,4);
assert.equal(pizza.timelineItemId,'pizza4ps');
assert.equal(pizza.address,'8 Thủ Khoa Huân, Bến Thành, District 1, Ho Chi Minh City');

let mh=A.get('bk-moc-huong');
assert.equal(mh.day,2);
assert.equal(mh.dayId,'day2');
assert.equal(mh.time,'14:00');
assert.equal(mh.timelineItemId,'moc-huong');

let heal=A.get('bk-moc-healing');
assert.equal(heal.day,4);
assert.equal(heal.time,'14:20');
assert.equal(heal.timelineItemId,'moc-healing');

// A fresh edit authored against the current master revision may override editable schedule fields.
const save=A.save('bk-pizza4ps',Object.assign({},pizza,{time:'13:15',bookingName:'Crystal',status:'confirmed'}),context.BOOKINGS_DATA);
assert(save.ok);
pizza=A.get('bk-pizza4ps');
assert.equal(pizza.time,'13:15');
assert.equal(pizza.bookingName,'Crystal');
assert.equal(pizza.status,'confirmed');
assert.equal(pizza.title,'Pizza 4P’s Bến Thành');
assert.equal(stored.overrides['bk-pizza4ps']._masterRevision,2);

console.log('BOOKING AUTHORITY STALE-STATE POISONING: PASS');
