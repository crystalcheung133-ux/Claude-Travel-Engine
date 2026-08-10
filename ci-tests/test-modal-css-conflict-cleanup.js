const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const bad=[];
const forbidden=[
  /#expenseModal\s+\.tools-sheet\s*\{[^}]*max-height\s*:/s,
  /#momentsModal\.show\s*,\s*#expenseModal\.show\s*\{/s,
  /#momentsModal\s+\.moments-sheet\s*,\s*#expenseModal\s+\.tools-sheet\s*\{/s
];
for(const re of forbidden){
  const m=css.match(re);
  if(m) bad.push(m[0].slice(0,180));
}
if(!css.includes('Travel Engine 25.4.28 — canonical full-overlay modal contract')) bad.push('canonical full-overlay contract missing');
if(!css.includes('bottom:0!important')) bad.push('modal does not extend to screen bottom');
if(!css.includes('pointer-events:none!important')) bad.push('bottom nav is not disabled while modal open');
if(bad.length){console.error(bad.join('\n---\n'));process.exit(1)}
console.log('MODAL CSS CONFLICT CLEANUP: PASS');