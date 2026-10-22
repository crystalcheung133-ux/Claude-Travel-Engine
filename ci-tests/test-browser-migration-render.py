#!/usr/bin/env python3
"""RC29.138 gating real-browser regression: migration preservation AND rendered DOM (Chromium).

All external traffic (fonts, weather, FX, production Supabase ...) is MOCKED locally with HTTP 503 and never
leaves the machine; any host outside the known list fails the test. Scenarios use isolated fixtures from
ci-tests/migration-fixtures.js (no production data).

Covers R1 (hydration must complete before the projection is used) with a same-revision AND an old-revision
publication, checked in the rendered DOM on every day; Saved Override, Pending Draft, Saved+Pending, legacy
(baseline-less) data, deleted cards, notes/times on moved + merged cards, Save & Sync payload, reload idempotence.
"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib import util as _u
_spec=_u.spec_from_file_location('smoke', str(Path(__file__).resolve().parent/'test-browser-release-smoke.py'))
smoke=_u.module_from_spec(_spec)
try: _spec.loader.exec_module(smoke)
except SystemExit: pass
from playwright.sync_api import sync_playwright

FIX=(Path(__file__).resolve().parent/'migration-fixtures.js').read_text(encoding='utf8')
KNOWN={'fonts.googleapis.com','fonts.gstatic.com','api.open-meteo.com','api.frankfurter.dev','latest.currency-api.pages.dev'}
def known_host(h): return h in KNOWN or h.endswith('.supabase.co')  # any Supabase host is mocked, never contacted
fails=[]; checks=[0]; FRESH={}
def ok(cond,msg):
    checks[0]+=1
    if not cond: fails.append(msg)

DAYS_JS="""(ids)=>{const out={};ids.forEach(id=>{const els=Array.from(document.querySelectorAll('[id="'+id+'"]'));out[id]={n:els.length,t:els.map(e=>e.textContent).join(' ')}});return out}"""
ALL=['running-bean','quan-cua-ca-mau-d2','shopping-tqd','qspa-d2','com-tam-moc','garmentory','pizza4ps','rue-miche-ledition',
     'quan-thuy','pink-church','push-push-d4','thao-dien-open-list','moc-huong-d4','complex-0123-d4','aum-d4',
     'day5-easy-morning','day5-free-browse','hotel-luggage','hotel-checkout','bep-me-in','fine-arts','grab-ha-spa','ha-spa','day5-optional-dinner','airport-departure']
D5=['day5-easy-morning','day5-free-browse','hotel-checkout','bep-me-in','fine-arts','ha-spa','day5-optional-dinner','airport-departure']

def new_page(ctx,base,mocked):
    page=ctx.new_page()
    return page
def seed_env(browser,base,mocked,seed_js=None,arg=None):
    ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
    def guard(route):
        url=route.request.url
        if url.startswith(base) or url.startswith('data:') or url.startswith('blob:'): route.continue_(); return
        host=url.split('/')[2] if '//' in url else url
        mocked.append(host)
        route.fulfill(status=503,content_type='application/json',body='{"mocked":true}')
    ctx.route('**/*',guard)
    page=ctx.new_page()
    page.goto(base+'/index.html',wait_until='load'); page.wait_for_function('window.ITINERARY_AUTHORITY&&window.TRAVEL_DATASETS')
    page.evaluate("()=>localStorage.clear()")
    page.evaluate(FIX)
    if seed_js: page.evaluate(seed_js,arg)
    return ctx,page
def visit(page,base,day):
    page.goto(base+'/day.html?day=%s'%day,wait_until='load'); page.wait_for_function('window.ITINERARY_AUTHORITY&&window.PRODUCTION_PROJECTION',timeout=15000)
    page.wait_for_timeout(300)
    return page.evaluate(DAYS_JS,ALL)
def structure(label,page,base):
    r={d:visit(page,base,d) for d in ('2','4','5')}
    d2,d4,d5=r['2'],r['4'],r['5']
    ok(d2['running-bean']['n']==1 and d2['quan-cua-ca-mau-d2']['n']==1 and d2['shopping-tqd']['n']==1 and d2['qspa-d2']['n']==1,label+': Day 2 DOM has Running Bean, Shopping, Quán Cua Cà Mau, Qspa once each')
    ok(d2['pizza4ps']['n']==0,label+': no Pizza card on Day 2 DOM')
    ok(d4['pizza4ps']['n']==1 and d4['push-push-d4']['n']==1 and d4['pink-church']['n']==1 and d4['thao-dien-open-list']['n']==1,label+': Day 4 DOM has Pink Church, Push Push, Pizza (once), Shopping')
    ok(all(d5[i]['n']==1 for i in D5),label+': Day 5 DOM has all 8 master cards')
    ok(all(d5[i]['n']==0 for i in ('hotel-luggage','grab-ha-spa')) and d5['day5-easy-morning']['n']==1,label+': Day 5 DOM has no obsolete luggage/grab cards')
    return r
def user_dom(label,r,deleted=True):
    ok('USER_RB' in r['2']['running-bean']['t'],label+': DOM Day 2 Running Bean shows the Day 5 Running Bean note')
    ok('USER_RB' not in ' '.join(v['t'] for v in r['5'].values()),label+': DOM Day 5 does not show the Running Bean note')
    ok('USER_PIZZA' in r['4']['pizza4ps']['t'],label+': DOM Day 4 Pizza shows the Day 2 Pizza note')
    ok('USER_CTM' in r['2']['com-tam-moc']['t'],label+': DOM keeps edited Com Tam Moc note')
    ok('USER_QT' in r['4']['quan-thuy']['t'] and 'USER_SHOP' in r['4']['thao-dien-open-list']['t'],label+': DOM Day 4 notes preserved')
    ok('USER_LUGGAGE' in r['5']['hotel-checkout']['t'] and '14:45' in r['5']['hotel-checkout']['t'],label+': DOM luggage note + time merged into Check-out')
    ok('USER_GRAB' in r['5']['ha-spa']['t'] and '14:50' in r['5']['ha-spa']['t'],label+': DOM transport note + time merged into Hạ Spa')
    ok('USER_SHOP5' in r['5']['day5-free-browse']['t'],label+': DOM Day 5 shopping note preserved')
    if deleted: ok(r['2']['rue-miche-ledition']['n']==0 and r['4']['complex-0123-d4']['n']==0,label+': DOM user-deleted cards stay deleted')

SEED_STORE="""([key,withBase])=>{const m=TRAVEL_DATASETS.ITINERARY_DATA;const F=MIGRATION_FIXTURES.build(m);const dc={};
 ['2','4','5'].forEach(d=>{dc[d]={items:F.edited[d]};if(withBase)dc[d].baseItems=F.base[d];});
 localStorage.setItem(key,JSON.stringify({masterRevision:'OLDREV',dayChanges:dc}))}"""
SEED_DRAFT="""([key,withBase])=>{const m=TRAVEL_DATASETS.ITINERARY_DATA;const F=MIGRATION_FIXTURES.build(m);const ch={};
 ['2','4','5'].forEach(d=>{ch['itineraryDay'+d]={day:d,items:F.edited[d],masterRevision:'OLDREV'};if(withBase)ch['itineraryDay'+d].baseItems=F.base[d];});
 localStorage.setItem(key,JSON.stringify({version:1,changes:ch,updatedAt:'x'}))}"""
SEED_PUB="""([cacheKey,tripId,rev,sameRev])=>{const D=TRAVEL_DATASETS,m=D.ITINERARY_DATA,F=MIGRATION_FIXTURES.build(m);
 const it={},bs={};Object.keys(m).forEach(d=>{
   if(sameRev){const items=JSON.parse(JSON.stringify(m[d].items));if(d==='4')items.forEach(x=>{if(x.id==='thao-dien-open-list')x.details=['CLOUD_SAME_REV'];});it[d]={...m[d],items};bs[d]=JSON.parse(JSON.stringify(m[d].items));}
   else{it[d]={...JSON.parse(JSON.stringify(m[d])),items:F.edited[d]||JSON.parse(JSON.stringify(m[d].items))};bs[d]=F.base[d]||JSON.parse(JSON.stringify(m[d].items));}});
 const data={places:D.PLACES,categories:D.CATEGORIES,guideOrder:D.GUIDE_ORDER,dayLinks:D.DAY_LINKS,friends:D.FRIENDS,bookingsData:D.BOOKINGS_DATA,tripData:D.TRIP_DATA,tripOrder:D.TRIP_ORDER,itineraryData:it,itineraryBase:bs};
 localStorage.setItem(cacheKey,JSON.stringify({tripId:tripId,schemaVersion:1,version:546,publishedAt:'2026-10-10T00:00:00Z',savedAt:'2026-10-10T00:00:00Z',payload:{masterRevision:sameRev?rev:'OLDREV',data:data}}))}"""
KEYS="()=>({ovr:STORAGE_CONFIG.keys.itineraryOverrides,draft:STORAGE_CONFIG.keys.adminDraft,cache:SYNC_CONFIG.cacheKey,trip:SYNC_CONFIG.tripId,rev:MASTER_ITINERARY_REVISION})"

def main():
    mocked=[]
    with smoke.server() as base, sync_playwright() as pw:
        browser=pw.chromium.launch()
        # A fresh
        ctx,page=seed_env(browser,base,mocked)
        r=structure('A fresh',page,base)
        ok('USER_' not in json.dumps(r),'A fresh: nothing invented')
        for d in ('1','3'):
            visit(page,base,d); FRESH[d]=page.evaluate("()=>ITINERARY_DATA['%s'].items.filter(x=>document.getElementById(x.id)).map(x=>x.id)"%d)
            ok(len(FRESH[d])>=1,'A fresh: Day %s renders cards'%d)
        # navigation destinations (real hrefs)
        page.goto(base+'/day.html?day=4',wait_until='load'); page.wait_for_timeout(300)
        nav=page.evaluate("""()=>{const dest=id=>{const e=document.getElementById(id);const a=e&&Array.from(e.querySelectorAll('a')).filter(x=>(x.getAttribute('href')||'').includes('maps/dir'));return a&&a.map(x=>{const q=new URL(x.getAttribute('href')).searchParams;return {t:(x.innerText||'').trim(),o:q.get('origin')||'',d:q.get('destination')||''}})};
          return {pink:dest('pink-church'),push:dest('push-push-d4'),pizza:dest('pizza4ps')}}""")
        ok(any('20 Nguyễn Văn Nguyễn' in x['d'] for x in nav['pink']),'A nav: Pink Church directions go to Push Push (%r)'%nav['pink'])
        ok(any('Tan Dinh Church' in x['d'] for x in nav['pink'] if x['t'].startswith('🧭')),'A nav: Pink Church Navigate opens Pink Church')
        ok(any('20 Nguyễn Văn Nguyễn' in x['d'] for x in nav['push'] if x['t'].startswith('🧭')),'A nav: Push Push Navigate opens Push Push (%r)'%nav['push'])
        ok(any('44 Trần Ngọc Diện' in x['d'] and '20 Nguyễn Văn Nguyễn' in x['o'] for x in nav['push']),'A nav: Push Push -> Grab directly to Pizza 4P\'s Thảo Điền, origin Push Push')
        ok(any('In The Mood' in x['d'] for x in nav['pizza']),'A nav: Pizza -> In The Mood')
        page.goto(base+'/day.html?day=2',wait_until='load'); page.wait_for_timeout(300)
        first=page.evaluate("""()=>{const e=document.getElementById('shopping-tqd');return Array.from(e.querySelectorAll('a')).map(a=>({t:(a.innerText||'').trim(),h:a.getAttribute('href')||''}))}""")
        ok(any(x['t'].startswith('🧭 First Stop') and 'Garmentory' in x['t'] for x in first) or any('117B' in x['h'] for x in first if 'First Stop' in x['t']),'A nav: Day 2 shopping First Stop is 11 Garmentory (%r)'%[x['t'] for x in first])
        # shopping order on Day 4 from the data
        order=page.evaluate("()=>TRAVEL_DATASETS.ITINERARY_DATA['4'].items.find(x=>x.id==='thao-dien-open-list').guideIds")
        ok(order==['in-the-mood-d4','grade-b-d4','youon-thao-dien','vina-design-thao-dien','dakao-quartier','aurora-saigon','wicky-candle','ohquao'],'A: Day 4 shopping order %r'%order)
        ctx.close()
        # B saved + baseline
        k=None
        for label,seed,args,deleted in (('B saved+baseline',SEED_STORE,True,True),('B2 legacy saved (no baseline)',SEED_STORE,False,False)):
            ctx,page=seed_env(browser,base,mocked); k=page.evaluate(KEYS); page.evaluate(seed,[k['ovr'],args])
            r=structure(label,page,base); user_dom(label,r,deleted)
            r2=structure(label+' reload',page,base)
            ok(json.dumps(r)==json.dumps(r2),label+': DOM identical after repeated reloads (idempotent)')
            ctx.close()
        # C pending
        for label,args,deleted in (('C pending+baseline',True,True),('C2 legacy pending (no baseline)',False,False)):
            ctx,page=seed_env(browser,base,mocked); k=page.evaluate(KEYS); page.evaluate(SEED_DRAFT,[k['draft'],args])
            r=structure(label,page,base); user_dom(label,r,deleted)
            r2=structure(label+' reload',page,base); ok(json.dumps(r)==json.dumps(r2),label+': DOM identical after repeated reloads')
            ctx.close()
        # D saved + pending together
        ctx,page=seed_env(browser,base,mocked); k=page.evaluate(KEYS)
        page.evaluate(SEED_STORE,[k['ovr'],True]); page.evaluate(SEED_DRAFT,[k['draft'],True])
        r=structure('D saved+pending',page,base); user_dom('D saved+pending',r,True)
        ctx.close()
        # E1/E2 publications
        for label,same in (('E1 same-revision publication',True),('E2 old-revision publication',False)):
            ctx,page=seed_env(browser,base,mocked); k=page.evaluate(KEYS)
            page.evaluate(SEED_PUB,[k['cache'],k['trip'],k['rev'],same])
            r1=structure(label,page,base)
            st=page.evaluate("()=>({h:TRIP_SYNC.getState().hydrated,v:TRIP_SYNC.getState().activeVersion,c:!!localStorage.getItem(SYNC_CONFIG.cacheKey)})")
            ok(st['h'] and st['v']==546 and st['c'],label+': hydration succeeded, version 546 active, cache kept (%r)'%st)
            if same:
                ok('CLOUD_SAME_REV' in r1['4']['thao-dien-open-list']['t'],label+': cloud-edited Timeline note is in the RENDERED DOM (R1)')
            else:
                user_dom(label,r1,True)
            # all five days render
            for d in ('1','3'):
                visit(page,base,d)
                n=page.evaluate("()=>document.querySelectorAll('[id]').length")
                got=page.evaluate("()=>ITINERARY_DATA['%s'].items.filter(x=>document.getElementById(x.id)).map(x=>x.id)"%d)
                ok(got==FRESH[d],label+': Day %s still renders exactly as on a fresh install (no unrelated day lost): %r vs %r'%(d,got,FRESH[d]))
            r2=structure(label+' reload',page,base); ok(json.dumps(r1)==json.dumps(r2),label+': repeated hydration renders identically')
            ctx.close()
        # F save & sync payload
        ctx,page=seed_env(browser,base,mocked)
        res=page.evaluate("""()=>{const A=ITINERARY_AUTHORITY;const m=ITINERARY_DATA['2'].items;const items=JSON.parse(JSON.stringify(m));items[0].details=['MY EDIT'];
          const c=A.commitDayChangesChecked({itineraryDay2:{day:'2',items}});const e=c.store.dayChanges['2'];
          const p=TRIP_PUBLICATION.buildPayload();const v=TRIP_PUBLICATION.validatePayload(p);
          return {ok:c.ok,bl:e.baseItems.length,same:JSON.stringify(e.baseItems)===JSON.stringify(A.normalizeItems(m)),rev:c.store.masterRevision===MASTER_ITINERARY_REVISION,
                  baseDays:Object.keys(p.data.itineraryBase||{}),payloadOk:v.ok,prank:A.getPristineMaster()!==null}}""")
        ok(res['ok'] and res['bl']>0 and res['same'] and res['rev'],'F: Timeline save stores a non-empty baseline for the right revision (%r)'%res)
        ok(len(res['baseDays'])==5 and res['payloadOk'] and res['prank'],'F: publish payload itineraryBase has all 5 days, never {} (%r)'%res)
        res=page.evaluate("""()=>{const items=JSON.parse(JSON.stringify(ITINERARY_DATA['2'].items));items[0].details=['DRAFT EDIT'];
          const payload=ITINERARY_AUTHORITY.makeDraftPayload('2',items);getAdminDraft();
          const okRep=replaceAdminDraft({version:1,changes:{itineraryDay2:payload},updatedAt:'x'});
          const e=getAdminDraft().changes.itineraryDay2;
          return {okRep,rev:e.masterRevision===MASTER_ITINERARY_REVISION,base:e.baseItems.length,basedOn:e.basedOnItems.length,stored:JSON.parse(localStorage.getItem(STORAGE_CONFIG.keys.adminDraft)).changes.itineraryDay2.baseItems.length}}""")
        ok(res['okRep'] and res['rev'] and res['base']>0 and res['basedOn']>0 and res['stored']==res['base'],'F: Pending Draft payload carries baseline + revision and replaceAdminDraft refreshes cache and storage (%r)'%res)
        ctx.close(); browser.close()
    unexpected=sorted(set(h for h in mocked if not known_host(h)))
    ok(not unexpected,'only known external hosts were attempted (all mocked): %r'%unexpected)
    if fails:
        print('BROWSER MIGRATION RENDER: FAIL (%d/%d checks)'%(len(fails),checks[0])); [print(' -',f[:300]) for f in fails]; sys.exit(1)
    print('BROWSER MIGRATION RENDER: PASS (%d checks; %d external requests mocked, none sent)'%(checks[0],len(mocked)))
if __name__=='__main__': main()
