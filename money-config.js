/* Japan Trip Package — canonical money/FX configuration. */
(function(root){
  'use strict';
  root.MONEY_CONFIG=Object.freeze({
    homeCurrency:'AUD', exchangeProvider:'frankfurter', apiBase:'https://api.frankfurter.dev/v1/latest',
    cacheHours:12, storageVersion:1, supportedCurrencies:Object.freeze(['JPY','AUD'])
  });
})(globalThis);
