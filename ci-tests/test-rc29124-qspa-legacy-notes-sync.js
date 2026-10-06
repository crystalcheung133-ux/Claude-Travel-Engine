const fs=require('fs'),assert=require('assert');
const auth=fs.readFileSync('booking-authority.js','utf8');
const sync=fs.readFileSync('booking-sync-runtime.js','utf8');
const day=fs.readFileSync('day.html','utf8');
assert(!auth.match(/EDITABLE_STATE_FIELDS=[\s\S]{0,900}'notes'/),'Notes must stay out of generic stale local authority');
assert(sync.includes("Number(record._remoteVersion||0)>0&&Object.prototype.hasOwnProperty.call(record,'notes')"),'remote canonical Notes handoff missing');
assert(sync.includes("const expectedNotes=String(record&&record.notes||'')"),'remote Notes readback verification missing');
assert(sync.includes("String(verified.notes||'')!==expectedNotes"),'canonical Notes verification missing');
assert(!sync.includes('QSPA_VISITS_MARKER'),'RC29.122 Notes carrier must be removed');
assert(!sync.includes('QSPA_VISITS_V1'),'Qspa visits must never be hidden inside Notes');
// D2 is intentionally restored unchanged from the pre-29.122 route structure.
assert(day.includes("{label:'MORNING · LOCAL FASHION'"));
assert(day.includes("{label:'AFTERNOON · VINCOM'"));
// D1/D4 remain shop-only with timed connectors.
assert(day.includes("['Dauple by Ka\\'s'")||day.includes('["Dauple by Ka\'s"'));
assert(day.includes("['Carpe Diem · CANDLES + GIFTS'"));
assert(day.includes("['OHQUAO Living etc. · ROUTE END'"));
assert(day.includes("modes:['🚶 1 min','🚶 5–8 min'"));
console.log('RC29.124 QSPA NOTES SYNC: PASS — Notes survive stale reconciliation, are verified remotely, carrier removed; D2 restored.');
