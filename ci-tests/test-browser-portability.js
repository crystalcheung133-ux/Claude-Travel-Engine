#!/usr/bin/env node
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const MIME={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webmanifest':'application/manifest+json'};
function server(){return http.createServer((req,res)=>{const raw=(req.url||'/').split('?')[0];const rel=raw==='/'?'index.html':decodeURIComponent(raw.replace(/^\//,''));const file=path.join(ROOT,rel);if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found')}res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);});}
(async()=>{
 const srv=server();await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port,base=`http://127.0.0.1:${port}`;
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/v1/latest**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({rates:{AUD:0.000057},date:'2026-08-08'})}));
  await page.route('**/currencies/*.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({date:'2026-08-08',vnd:{aud:0.000057},nzd:{aud:0.91}})}));
  await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.getElementById('ccmvSplash')?.remove());
  assert.equal(await page.locator('meta[name="travel-engine-build"]').getAttribute('content'),'VN-RC6|25.3.3','Build identity mismatch: deployed files are not RC6 / Engine 25.3.3');
  assert.equal(await page.evaluate(()=>TRIP_CONFIG.version),'RC6-25.3.3','Runtime build identity mismatch');
  const logo=await page.locator('.site-nav .brand-mark img').boundingBox(),host=await page.locator('.site-nav .brand-mark').boundingBox();assert(logo&&host&&logo.width<=host.width+1&&logo.height<=host.height+1,'Header logo overflows its safe area');
  const currency=page.locator('#currencyCardMeta');await currency.waitFor({state:'visible'});await page.waitForTimeout(100);assert(!/unavailable/i.test(await currency.innerText()),'Currency converter has no usable rate');
  await page.goto(base+'/day.html?day=2',{waitUntil:'domcontentloaded'});await page.waitForTimeout(80);
  const first=page.locator('.timeline-item').first();if(await first.count()){const time=await first.locator('.timeline-time').boundingBox();assert(time&&time.width<=72,'Mobile timeline time rail is too wide');}
  const actionButtons=page.locator('.timeline-actions button.timeline-action');for(let i=0;i<await actionButtons.count();i++){const el=actionButtons.nth(i);assert(await el.getAttribute('onclick'),'Timeline action button has no route');}
  await page.goto(base+'/trip.html',{waitUntil:'domcontentloaded'});await page.waitForTimeout(50);
  await page.locator('.trip-trigger').click();
  const tripMenuText=await page.locator('#tripMenu').innerText();assert(/Stay/.test(tripMenuText)&&/Restaurants/.test(tripMenuText)&&/Spa/.test(tripMenuText)&&/Activities/.test(tripMenuText)&&/Transport/.test(tripMenuText),'Trip menu is not split into semantic modules');assert(!/^Bookings$/m.test(tripMenuText),'Consolidated Bookings entry must not appear in Trip menu');
  await page.locator('#tripMenu a').filter({hasText:'Stay'}).click();await page.waitForTimeout(20);const stayText=await page.locator('#tripModalContent').innerText();assert(/AUD 1,693/.test(stayText)&&/AUD 215/.test(stayText)&&/AUD 1,478/.test(stayText),'Stay popup does not show Total / Cashback / Net');assert.equal(new URL(page.url()).pathname,'/trip.html','Stay interaction navigated away instead of opening modal');
  await page.locator('#tripModal .trip-close').click();assert.equal(new URL(page.url()).pathname,'/trip.html','Closing Trip modal changed page URL');
  await page.goto(base+'/day.html?day=2',{waitUntil:'domcontentloaded'});await page.waitForTimeout(50);const guideButton=page.locator('.timeline-action--guide').first();if(await guideButton.count()){await guideButton.click();await page.waitForTimeout(20);assert(await page.locator('#guideModal').evaluate(el=>el.classList.contains('show')),'Timeline Guide did not open modal');assert.equal(new URL(page.url()).pathname,'/day.html','Timeline Guide navigated away from Day page');await page.locator('#guideModal .guide-close').click();assert.equal(new URL(page.url()).pathname,'/day.html','Closing Guide modal changed Day URL');}
  const bookingButton=page.locator('.timeline-action--trip').first();if(await bookingButton.count()){await bookingButton.click();await page.waitForTimeout(20);assert(await page.locator('#tripModal').evaluate(el=>el.classList.contains('show')),'Timeline Booking did not open modal');assert.equal(new URL(page.url()).pathname,'/day.html','Timeline Booking navigated away from Day page');await page.locator('#tripModal .trip-close').click();}
  await page.goto(base+'/expenses.html',{waitUntil:'domcontentloaded'});await page.locator('button[onclick="openExpenseModal()"]') .click();await page.waitForTimeout(30);assert.equal(await page.locator('#expenseCurrencyToggle .expense-currency-btn').count(),2,'Dual-currency selector is not visible');assert(/AUD/.test(await page.locator('#expenseCurrencyToggle').innerText())&&/VND|NZD/.test(await page.locator('#expenseCurrencyToggle').innerText()),'Dual-currency selector does not show home and destination currencies');await page.locator('[data-split-mode="custom"]').click();
  const rows=page.locator('.custom-split-row');for(let i=0;i<await rows.count();i++){const row=rows.nth(i),box=await row.boundingBox(),field=await row.locator('.expense-money-field').boundingBox();assert(box&&field&&field.x>=box.x-1&&field.x+field.width<=box.x+box.width+1,'Custom split controls overflow row');}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'Expenses page has horizontal overflow');
  const tripId=await page.evaluate(()=>window.TRIP_CONFIG&&TRIP_CONFIG.id||TRIP_CONFIG.storageNamespace||'');
  if(String(tripId).includes('vietnam')){
    await page.goto(base+'/day.html?day=2',{waitUntil:'domcontentloaded'});await page.waitForTimeout(80);const text=(await page.locator('.timeline').innerText());assert(!/Grab\s*→/i.test(text),'Routine Grab transition rendered as standalone timeline card');
  }
  assert.equal(errors.length,0,'Browser page errors: '+errors.join(' | '));
  console.log('BROWSER PORTABILITY SMOKE: PASS — mobile logo, FX, timeline rail/actions, expense custom split and transition filtering.');
 }finally{if(browser)await browser.close();await new Promise(r=>srv.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
