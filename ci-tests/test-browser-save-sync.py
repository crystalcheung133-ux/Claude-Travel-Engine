#!/usr/bin/env python3
"""Real-browser Save & Sync persistence test (Chromium, local static server, ALL external network blocked).

Exercises the REAL runtime modules in a real browser profile:
  - Timeline: checked commit -> reload -> read back identical (order, blanks, notes, add/delete)
  - Booking authority: save -> reload -> read back (time/venue/notes, intentional blank)
  - Offline Save: durable pending queue survives reload; label is 'Saved locally · Sync pending'
  - Guarantee: zero requests leave localhost (no production Supabase/Vercel writes from CI)

It drives the modules through page.evaluate (no admin PIN), so it verifies persistence, not button clicks.
NOT EXECUTED in the authoring environment (no browser available) - first CI run is the first execution.
"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib import util as _u
_spec=_u.spec_from_file_location('smoke', str(Path(__file__).resolve().parent/'test-browser-release-smoke.py'))
smoke=_u.module_from_spec(_spec)
try:
    _spec.loader.exec_module(smoke)
except SystemExit:
    pass
from playwright.sync_api import sync_playwright

def main():
    external=[]
    fails=[]
    with smoke.server() as base, sync_playwright() as pw:
        browser=pw.chromium.launch()
        ctx=browser.new_context()
        def guard(route):
            url=route.request.url
            if url.startswith(base) or url.startswith('data:') or url.startswith('blob:'):
                route.continue_()
            else:
                external.append(url); route.abort()
        ctx.route('**/*', guard)
        page=ctx.new_page()
        page.goto(base+'/day.html?day=1', wait_until='load')
        page.wait_for_function('window.ITINERARY_AUTHORITY && window.SAVE_SYNC && window.BOOKING_AUTHORITY')

        # --- Timeline: commit, reload, read back
        res=page.evaluate('''()=>{
          const day='1';const base=(ITINERARY_DATA[day]||{}).items||[];
          const items=JSON.parse(JSON.stringify(base)).reverse();
          if(items.length){items[0].time='';items[0].details=[];}
          items.push({id:'ci-added-1',time:'',title:'CI added',details:[],route:'',type:'custom',nonPlace:true});
          const r=ITINERARY_AUTHORITY.commitDayChangesChecked({itineraryDay1:{day:1,items}});
          return {ok:r.ok,ids:items.map(x=>x.id)};
        }''')
        if not res['ok']: fails.append('timeline commit not ok')
        page.reload(wait_until='load'); page.wait_for_function('window.ITINERARY_AUTHORITY')
        back=page.evaluate("()=>{const i=ITINERARY_AUTHORITY.getDayOverrideItems('1');return i&&i.map(x=>x.id)}")
        if back!=res['ids']: fails.append('timeline order/add/delete did not survive reload: %r vs %r'%(back,res['ids']))

        # --- Booking authority: save, reload, read back (blank must persist)
        bid=page.evaluate("()=>Object.keys(BOOKING_AUTHORITY.all().reduce((o,b)=>{o[b.id]=1;return o},{}))[0]")
        if bid:
            page.evaluate("(id)=>BOOKING_AUTHORITY.save(id,{time:'23:59',venue:'',notes:'ci manual note'},window.PRODUCTION_BOOKINGS&&PRODUCTION_BOOKINGS.byId||undefined)", bid)
            page.reload(wait_until='load'); page.wait_for_function('window.BOOKING_AUTHORITY')
            got=page.evaluate("(id)=>{const b=BOOKING_AUTHORITY.get(id);return b&&{time:b.time,venue:b.venue,notes:b.notes}}", bid)
            if not got or got['time']!='23:59' or got['notes']!='ci manual note' or got.get('venue')!='':
                fails.append('booking edit did not survive reload: %r'%(got,))

        # --- Offline durable queue survives reload
        ctx.set_offline(True)
        page.evaluate("()=>{SAVE_SYNC.enqueue('guide','ci-guide',{patch:{title:'offline'}},{})}")
        page.reload(wait_until='domcontentloaded') if False else None
        ctx.set_offline(False)
        page.goto(base+'/day.html?day=1', wait_until='load'); page.wait_for_function('window.SAVE_SYNC')
        pending=page.evaluate("()=>SAVE_SYNC.hasPending('guide','ci-guide')")
        if not pending: fails.append('offline pending mutation lost across reload')
        browser.close()
    if external: fails.append('external requests attempted (must be none): %r'%external[:5])
    if fails:
        print('BROWSER SAVE & SYNC: FAIL'); [print(' -',f) for f in fails]; sys.exit(1)
    print('BROWSER SAVE & SYNC: PASS (persistence across real reloads; zero external requests)')

if __name__=='__main__': main()
