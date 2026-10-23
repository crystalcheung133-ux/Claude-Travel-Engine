const fs=require('fs');function ok(x,m){if(!x)throw new Error(m)}
const ga=fs.readFileSync('guide-authority.js','utf8'),gs=fs.readFileSync('guide-sync-runtime.js','utf8'),gr=fs.readFileSync('guide-runtime.js','utf8'),pub=fs.readFileSync('publication-runtime.js','utf8'),day=fs.readFileSync('day.html','utf8'),cfg=fs.readFileSync('sync-config.js','utf8');
ok(cfg.includes("guides:'trip_guides'"),'Guide sync table missing');
ok(gr.includes('GUIDE_SYNC.saveNow(key,patch)')&&ga.includes('function saveChecked'),'Save Guide must be an immediate, checked local authority save followed by verified sync');
ok(gs.includes("travelengine:guidesaved")&&(gs.includes('.update(')&&gs.includes('.insert('))&&gs.includes(".eq('trip_id',cfg.tripId)"),'Guide remote auto-sync lifecycle incomplete');
ok(!pub.includes('GUIDE_AUTHORITY.mergedPlaces'),'Publication must not own Guide overrides');
ok(day.includes('buildDerivedNextStop(item,index)')&&day.includes('publishedNextId(item.id)===next.id'),'Next stop is not derived from Timeline order');
ok(day.includes('walk&&walk.max<=10')&&day.includes('🚶 Walk')&&day.includes('🚕 Grab'),'Walk and Grab travel estimates must be supported');
ok(day.includes('d4PizzaShoppingWalk')&&day.includes('🚶 Walk · approx. 1 min'),'Day 4 Pizza to shopping walk hint missing');
ok(day.includes('route-next-map')&&day.includes('>Directions ›</a>')&&!day.includes('>Walk ›</a>')&&!day.includes('>Grab / Directions ›</a>'),'Only one Directions link may be rendered in the next-stop hint');
ok(day.includes("else if(grab){lines.push(`🚕 Grab")&&day.includes('Live ETA in Maps'),'Long/unknown walk Grab rule missing');
ok(day.includes('www.google.com/maps/dir/?api=1&origin='),'Derived Directions map missing');
ok(!day.includes('id="timelineEditRoute"') && !day.includes('base.route=document.getElementById'), 'Travel note editor field must be removed while derived transport remains');
ok(day.includes("String(item&&item.id||'')==='aum-d4'") && day.includes("id:'derived-return-hotel'"),'Farewell dinner return-hotel fallback missing');
console.log('RC29.75 guide sync + derived next stop contract PASS');
