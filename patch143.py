from pathlib import Path
p=Path(__file__).parent
f=p/'data.js';s=f.read_text(); pos=s.index('  "RESTAURANTS": [',s.index('const CATEGORIES=')); pos2=s.index('  ],',pos); block=s[pos:pos2]; assert 'quan-cua-ca-mau' not in block; block=block.replace('    {\n      "key": "aum-saigon"','    {\n      "key": "quan-cua-ca-mau"\n    },\n    {\n      "key": "aum-saigon"',1);s=s[:pos]+block+s[pos2:];f.write_text(s)
f=p/'guide-runtime.js';s=f.read_text();marker='function guideSortedCategoryItems(cat){'; assert marker in s
helper='''function guideDiningTime(item){
 const key=String(item&&item.key||'');
 const source=(window.ITINERARY_AUTHORITY&&typeof ITINERARY_AUTHORITY.current==='function')?ITINERARY_AUTHORITY.current():((typeof ITINERARY!=='undefined')?ITINERARY:{});
 for(const day of Object.values(source||{}))for(const row of (day&&day.items)||[]){
  if(row&&String(row.placeId||'')===key){const m=String(row.time||'').match(/(?:^|\\D)([01]?\\d|2[0-3]):([0-5]\\d)/);if(m)return Number(m[1])*60+Number(m[2]);}
 }
 const m=String(item&&item.sub||'').match(/(?:^|\\D)([01]?\\d|2[0-3]):([0-5]\\d)/);
 return m?Number(m[1])*60+Number(m[2]):9999;
}
'''
s=s.replace(marker,helper+marker,1)
old="if(semantic==='ATTRACTIONS'||semantic==='DINING'||semantic==='STAY') return items.sort((a,b)=>guideDayNumber(a)-guideDayNumber(b)||String(a.title||'').localeCompare(String(b.title||'')));"
new="if(semantic==='DINING') return items.sort((a,b)=>guideDayNumber(a)-guideDayNumber(b)||guideDiningTime(a)-guideDiningTime(b)||String(a.title||'').localeCompare(String(b.title||'')));\n if(semantic==='ATTRACTIONS'||semantic==='STAY') return items.sort((a,b)=>guideDayNumber(a)-guideDayNumber(b)||String(a.title||'').localeCompare(String(b.title||'')));"
assert old in s;s=s.replace(old,new,1);f.write_text(s)
f=p/'guide-navigation-runtime.js';s=f.read_text();old="else if(category==='ACTIVITIES')items.sort";assert old in s;s=s.replace(old,"else if(['DINING','RESTAURANTS','CAFÉS','CAFES'].includes(category))items.sort(function(a,b){return dayNumber(a.key)-dayNumber(b.key)||diningTime(a)-diningTime(b)||String(a.title||'').localeCompare(String(b.title||''));});\n    else if(category==='ACTIVITIES')items.sort",1)
marker='  function categoryKeys(category){';helper='''  function diningTime(item){
    const source=root.ITINERARY_AUTHORITY&&typeof root.ITINERARY_AUTHORITY.current==='function'?root.ITINERARY_AUTHORITY.current():root.ITINERARY;
    for(const day of Object.values(source||{}))for(const row of (day&&day.items)||[]){
      if(row&&row.placeId===item.key){const m=String(row.time||'').match(/(?:^|\\D)([01]?\\d|2[0-3]):([0-5]\\d)/);if(m)return Number(m[1])*60+Number(m[2]);}
    }
    const m=String(item.sub||'').match(/(?:^|\\D)([01]?\\d|2[0-3]):([0-5]\\d)/);
    return m?Number(m[1])*60+Number(m[2]):9999;
  }
''';assert marker in s;s=s.replace(marker,helper+marker,1);f.write_text(s)
# Preserve shopping notes and custom fields while combining any old standalone Garmentory card into shopping window.
f=p/'itinerary-authority.js';s=f.read_text();needle="      const garment=list.find(x=>x&&x.id==='garmentory');";assert needle in s
s=s.replace(needle,"""      const garment=list.find(x=>x&&x.id==='garmentory');
      const shopping=list.find(x=>x&&x.id==='shopping-tqd');
      if(garment&&shopping){
        const noteLines=(garment.details||[]).filter(t=>!/(?:11 Garmentory|Trần Quang Diệu|shopping)/i.test(String(t)));
        if(noteLines.length)appendLines(shopping,noteLines);
        removeById(list,'garmentory');
      }""",1)
f.write_text(s)
print('patched')
