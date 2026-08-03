#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.resolve(__dirname,'..');
const ctx={URLSearchParams,URL,location:{search:'',hash:'',pathname:'/index.html',href:'https://example.test/index.html',origin:'https://example.test'},document:{referrer:''},history:{},navigator:{},sessionStorage:{getItem(){return null},setItem(){}},matchMedia(){return {matches:false}}};ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);
for(const f of ['navigation-config.js','navigation.js','navigation-adapter.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
function eq(a,b,msg){if(a!==b){console.error('FAIL:',msg,'\n expected',b,'\n actual  ',a);process.exitCode=1}else console.log('PASS:',msg)}
eq(ctx.NAVIGATION_ADAPTER.day('day3','day3-item2'),'day.html?day=3#day3-item2','Day semantic route');
eq(ctx.NAVIGATION_ADAPTER.category('DINING'),'guide.html?category=DINING','Guide category route');
eq(ctx.NAVIGATION_ADAPTER.place('fergburger'),'place.html?id=fergburger','Place route');
eq(ctx.NAVIGATION_ADAPTER.places(['a','b']),'place.html?ids=a%2Cb','Place group route');
eq(ctx.NAVIGATION_ADAPTER.tripInfo('stay'),'trip.html?tripInfoId=stay','Trip Info route');
eq(ctx.NAVIGATION_ADAPTER.booking('hotel-1','stay'),'trip.html?bookingId=hotel-1&type=stay','Booking route');
eq(ctx.NAVIGATION_ADAPTER.day('bad',''),'','Invalid day is rejected');
eq(ctx.NAVIGATION_ADAPTER.place(''),'','Missing place is rejected');
if(process.exitCode)process.exit(1);console.log('E2C ROUTE CONTRACT TEST: ALL PASSED');
