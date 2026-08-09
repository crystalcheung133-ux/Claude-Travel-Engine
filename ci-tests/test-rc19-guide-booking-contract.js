const fs=require('fs'),assert=require('assert');
const data=fs.readFileSync('data.js','utf8');
const trip=fs.readFileSync('trip-runtime.js','utf8');
function has(x,msg){assert(data.includes(x),msg)}
has('"hours": "09:00–22:00 daily"','Moc Huong hours missing');
has('"hours": "09:00–20:00 daily"','Nha Suga hours missing');
has('"hours": "10:00–20:30 daily"','Tinh Thuc hours missing');
has('"hours": "08:30–22:00 daily"','Ha Spa hours missing');
has('"address": "61 Nguyễn Bá Huân, Thảo Điền, Ho Chi Minh City, Vietnam"','LOUH address missing');
has('"hours": "10:00–18:00 daily"','LOUH hours missing');
has('Guide 顯示 Session / Booking Time，而不是把課堂時段當成 Trading Hours','Cooking class presentation contract missing');
assert(!data.includes('LOUH Saigon（地址待核實）'),'Timeline still labels LOUH address unverified');
assert(!data.includes('星期一營業時間未完全確認，出發前再確認預約'),'Tinh Thuc stale warning remains');
assert(trip.includes('function genericBookingDetailNavigationHTML'),'Generic booking Previous/Next helper missing');
assert(trip.includes('${genericBookingDetailNavigationHTML(booking)}'),'Generic booking detail does not render navigation');
assert(trip.includes('disabled aria-disabled="true"'),'Edge navigation must disable, not wrap');
assert(!trip.includes("if(index<0||bookings.length<2)return ''"),'Single-card booking categories must still render disabled Previous/Next controls');
console.log('RC19 GUIDE + BOOKING CONTRACT: PASS');
