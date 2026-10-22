/* Shared isolated fixtures for the migration regression tests (Node AND real browser).
   build(master) returns the PREVIOUS production master for Days 2/4/5 (reconstructed from the approved
   current master plus the cards that were retired/moved in RC29.138), the matching user edits, and
   the expected markers. No production data is used. Works as CommonJS and as a plain browser script. */
(function(root){
  const clone=v=>JSON.parse(JSON.stringify(v));
  function byId(items,id){return items.find(x=>x&&x.id===id);}
  function build(master){
    const m=clone(master);
    const retiredD2=[
      {id:'com-tam-moc',time:'09:00',title:'🍚 Cơm Tấm Mộc',details:['炭燒碎米飯早餐；09:00 開門。'],route:'',type:'meal',placeId:'com-tam-moc'},
      {id:'garmentory',time:'10:00',title:'🧥 11 Garmentory',details:['本地設計師服飾, 兩層樓大空間，男女裝俱全'],route:'',type:'shopping',placeId:'garmentory'},
      {id:'pizza4ps',time:'13:00',title:'🍕 Pizza 4P’s · Hai Bà Trưng',details:['必食Pizza + 自家芝士，午餐休息'],route:'',type:'meal',placeId:'pizza4ps',bookingId:'bk-pizza4ps'}
    ];
    const d2master=m['2'].items.filter(x=>!['running-bean','quan-cua-ca-mau-d2'].includes(x.id));
    const old2=[retiredD2[0],retiredD2[1],...d2master.slice(0,1),retiredD2[2],...d2master.slice(1)]; // keeps shopping-tqd first among survivors
    const old4=m['4'].items.filter(x=>!['push-push-d4','pizza4ps'].includes(x.id));
    const oldRB={id:'running-bean',time:'09:00',title:'☕ The Running Bean · Bến Thành',details:['步行4分鐘cafe精品咖啡+ all day brunch'],route:'',type:'meal',placeId:'running-bean'};
    const oldLug={id:'hotel-luggage',time:'PM',title:'🧳 Fusion Original · Pick Up Luggage',details:['約 14:30 返酒店攞行李'],route:'',type:'custom',nonPlace:true};
    const oldGrab={id:'grab-ha-spa',time:'PM',title:'🚕 Grab → Hạ Spa',details:['由酒店直接出發，預留交通時間；以即時路況為準。'],route:'',type:'custom',nonPlace:true};
    const old5=m['5'].items.filter(x=>x.id!=='day5-easy-morning');
    old5.unshift(oldRB);
    const i=old5.findIndex(x=>x.id==='hotel-checkout');old5.splice(i,0,oldLug);
    const j=old5.findIndex(x=>x.id==='ha-spa');old5.splice(j,0,oldGrab);
    const base={'2':old2,'4':old4,'5':old5};
    // ---- the user's manual edits (applied on top of the old master) ----
    const edited=clone(base);
    const set=(d,id,patch)=>Object.assign(byId(edited[d],id),patch);
    set('2','com-tam-moc',{details:['炭燒碎米飯早餐；09:00 開門。','USER_CTM']});
    set('2','pizza4ps',{details:['必食Pizza + 自家芝士，午餐休息','USER_PIZZA'],route:'USER_PIZZA_ROUTE'});
    set('2','qspa-d2',{time:'15:00–17:00'});
    edited['2']=edited['2'].filter(x=>x.id!=='rue-miche-ledition');           // user deleted
    set('4','quan-thuy',{details:[...toLines(byId(edited['4'],'quan-thuy').details),'USER_QT']});
    set('4','thao-dien-open-list',{details:[...toLines(byId(edited['4'],'thao-dien-open-list').details),'USER_SHOP']});
    set('4','aum-d4',{time:'19:30–20:45'});
    edited['4']=edited['4'].filter(x=>x.id!=='complex-0123-d4');             // user deleted
    set('5','running-bean',{details:['步行4分鐘cafe精品咖啡+ all day brunch','USER_RB']});
    set('5','hotel-luggage',{details:['約 14:30 返酒店攞行李','USER_LUGGAGE'],time:'14:45'});
    set('5','grab-ha-spa',{details:['由酒店直接出發，預留交通時間；以即時路況為準。','USER_GRAB'],time:'14:50',route:'USER_GRAB_ROUTE'});
    set('5','day5-free-browse',{details:[...toLines(byId(edited['5'],'day5-free-browse').details),'USER_SHOP5']});
    // an UNEDITED legacy copy (default text only) used to prove obsolete defaults are not resurrected
    return {base,edited,unedited:clone(base),master:m};
  }
  function toLines(v){return Array.isArray(v)?v.slice():(v?[String(v)]:[]);}
  const api={build,clone,byId,toLines};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MIGRATION_FIXTURES=api;
})(typeof globalThis!=='undefined'?globalThis:this);
