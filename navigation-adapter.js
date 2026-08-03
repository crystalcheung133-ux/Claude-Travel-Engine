(function(global){
  'use strict';
  if(!global.NAVIGATION) throw new Error('NAVIGATION must load before navigation-adapter.js');
  function clean(value){return value==null?'':String(value).trim();}
  function go(url){if(!url)return false;global.NAVIGATION.go(url);return true;}
  function day(dayRef,itemRef){
    const raw=clean(dayRef).replace(/^day/i,'');
    if(!/^\d+$/.test(raw)) return '';
    return global.NAVIGATION.build('day',{query:{day:raw},hash:clean(itemRef)||null});
  }
  function category(categoryRef){const ref=clean(categoryRef);return ref?global.NAVIGATION.build('guide',{query:{category:ref}}):global.NAVIGATION.build('guide');}
  function place(placeRef){const ref=clean(placeRef);return ref?global.NAVIGATION.build('place',{query:{placeId:ref}}):'';}
  function places(placeRefs){const refs=[...new Set((Array.isArray(placeRefs)?placeRefs:[]).map(clean).filter(Boolean))];return refs.length?(refs.length===1?place(refs[0]):global.NAVIGATION.build('place',{query:{placeIds:refs.join(',')}})):'';}
  function tripInfo(tripInfoRef){const ref=clean(tripInfoRef);return ref?global.NAVIGATION.build('trip',{query:{tripInfoId:ref}}):global.NAVIGATION.build('trip');}
  function booking(bookingRef,type){const ref=clean(bookingRef);if(!ref)return '';const query={bookingId:ref};const kind=clean(type);if(kind)query.type=kind;return global.NAVIGATION.build('trip',{query});}
  const api=Object.freeze({
    day,category,place,places,tripInfo,booking,go,
    goToDay:(d,i)=>go(day(d,i)),
    goToGuideCategory:c=>go(category(c)),
    goToPlace:p=>go(place(p)),
    goToPlaceGroup:p=>go(places(p)),
    goToTripInfo:t=>go(tripInfo(t)),
    goToBooking:(b,t)=>go(booking(b,t))
  });
  global.NAVIGATION_ADAPTER=api;
})(typeof self!=='undefined'?self:window);
