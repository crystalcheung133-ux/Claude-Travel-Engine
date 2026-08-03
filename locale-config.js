/* Japan Trip Package — canonical locale configuration. */
(function(root){
  'use strict';
  root.LOCALE_CONFIG=Object.freeze({
    locale:'zh-HK', language:'zh-Hant', region:'JP',
    currency:Object.freeze({code:'JPY',symbol:'¥',name:'Japanese Yen'}),
    timeZone:'Asia/Tokyo', dateFormat:'DD/MM/YYYY', timeFormat:'24h',
    numberFormat:'zh-HK', distanceUnit:'km', temperatureUnit:'C', weekStart:'Monday'
  });
})(globalThis);
