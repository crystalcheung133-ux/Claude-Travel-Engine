/* Shared harness for invariant tests. Loads REAL runtime modules into a vm sandbox with an
   in-memory storage and a fake Supabase. Never touches the network or a real database. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
function makeStorage(opts){
  opts=opts||{};const map=new Map();
  return {map,failWrites:false,
    getItem(k){return map.has(k)?map.get(k):null},
    setItem(k,v){if(this.failWrites)throw new Error('QuotaExceededError');map.set(k,String(v))},
    removeItem(k){map.delete(k)},key(i){return Array.from(map.keys())[i]??null},get length(){return map.size}};
}
function makeContext(extra){
  const events=[];const listeners={};
  const localStorage=makeStorage();
  const document={hidden:false,readyState:'complete',body:null,
    addEventListener(t,f){(listeners[t]=listeners[t]||[]).push(f)},
    dispatchEvent(e){events.push(e);(listeners[e.type]||[]).forEach(f=>f(e));return true},
    getElementById(){return null},querySelector(){return null}};
  const ctx=Object.assign({console,JSON,Date,Math,Promise,Map,Set,Object,Array,String,Number,Error,RegExp,setTimeout,clearTimeout,
    setInterval(){return 0},clearInterval(){},
    CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail},
    navigator:{onLine:true},localStorage,sessionStorage:makeStorage(),document,
    addEventListener(){},crypto:{randomUUID:(()=>{let n=0;return()=>'uuid-'+(++n)})()},
    TRIP_CONFIG:{storageNamespace:'fixture-trip',tripGeneration:1,bookingMasterRevision:1}},extra||{});
  ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);
  ctx.__events=events;ctx.__listeners=listeners;return ctx;
}
function load(ctx,file){vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file});return ctx}
function baseline(extra){const c=makeContext(extra);['storage-config.js','storage.js','save-sync-queue.js'].forEach(f=>load(c,f));return c}
/* Fixture generators — arbitrary counts/times, no personal itinerary assumptions. */
function genItems(day,n,seed){seed=seed||0;const out=[];for(let i=0;i<n;i++){const h=8+((i+seed)%12),m=((i*15+seed)%4)*15;out.push({id:`d${day}-a${i}-${seed}`,time:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,title:`Activity ${day}.${i}`,details:`note ${i}`,route:'',type:'custom',nonPlace:true})}return out}
function genItinerary(days,perDay){const o={};for(let d=1;d<=days;d++)o[String(d)]={items:genItems(d,perDay(d)),title:'Day '+d};return o}
let fails=0,passes=0;
function test(name,fn){return Promise.resolve().then(fn).then(()=>{passes++;console.log('  ok  '+name)}).catch(e=>{fails++;console.log('  FAIL '+name+'\n       '+(e&&e.message||e))})}
function done(suite){console.log(`${suite}: ${passes} passed, ${fails} failed`);if(fails)process.exit(1)}
module.exports={ROOT,makeStorage,makeContext,load,baseline,genItems,genItinerary,test,done,vm,fs,path};
/* Fake Supabase client: in-memory tables, eq filters, select/insert/update/maybeSingle, rpc.
   hooks.beforeUpdate(table,filters) lets a test simulate a concurrent writer between read and write. */
function fakeSupabase(tables,hooks){
  hooks=hooks||{};let tick=0;
  const stamp=()=>new Date(Date.now()+(++tick)).toISOString();
  function builder(name){
    const st={filters:[],op:'select',body:null,single:false,ret:false,order:null,lim:null};
    const match=r=>st.filters.every(([k,v])=>String(r[k])===String(v));
    const run=async()=>{
      tables[name]=tables[name]||[];const rows=tables[name];
      if(st.op==='select'){let out=rows.filter(match).map(r=>JSON.parse(JSON.stringify(r)));
        if(st.order)out.sort((a,b)=>(a[st.order.k]-b[st.order.k])*(st.order.asc?1:-1));if(st.lim)out=out.slice(0,st.lim);
        return {data:st.single?(out[0]||null):out,error:null}}
      if(st.op==='insert'){if(rows.some(r=>r.id===st.body.id&&r.trip_id===st.body.trip_id))return {data:null,error:{message:'duplicate key 23505'}};
        const row=JSON.parse(JSON.stringify(st.body));if(hooks.dropWrite){return {data:[{id:row.id,updated_at:row.updated_at}],error:null}}rows.push(row);return {data:[{id:row.id,updated_at:row.updated_at}],error:null}}
      if(st.op==='update'){if(hooks.beforeUpdate)hooks.beforeUpdate(name,st.filters,tables);
        const hit=rows.filter(match);if(!hit.length)return {data:[],error:null};
        if(hooks.dropWrite)return {data:hit.map(r=>({id:r.id,updated_at:st.body.updated_at||r.updated_at})),error:null};
        hit.forEach(r=>Object.assign(r,JSON.parse(JSON.stringify(st.body))));return {data:hit.map(r=>({id:r.id,updated_at:r.updated_at})),error:null}}
    };
    const api={select(){if(st.op!=='select')st.ret=true;return api},eq(k,v){st.filters.push([k,v]);return api},
      order(k,o){st.order={k,asc:!(o&&o.ascending===false)};return api},limit(n){st.lim=n;return api},
      maybeSingle(){st.single=true;return api},update(b){st.op='update';st.body=b;return api},insert(b){st.op='insert';st.body=b;return api},
      then(res,rej){return run().then(res,rej)}};
    return api;
  }
  return {from:builder,rpc:async(fn,args)=>hooks.rpc?hooks.rpc(fn,args,tables):{data:null,error:{message:'no rpc'}},stamp};
}
module.exports.fakeSupabase=fakeSupabase;
