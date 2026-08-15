const fs=require('fs'),assert=require('assert');
const s=fs.readFileSync('moments.js','utf8');
assert(s.includes("MOMENT_PLANNED_EXCLUDED_TYPES=new Set(['money','transport','buffer','rest','stay'])"));
assert(s.includes('return resolved.filter(isMomentPlannable)'));
for(const type of ['money','transport','buffer','rest','stay']) assert(s.includes(`'${type}'`));
console.log('MOMENTS PLAN ACTIVITY FILTER: PASS — logistics/cash/reset items excluded.');
