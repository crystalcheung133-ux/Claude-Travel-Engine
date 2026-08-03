/* Japan Trip Package — compile-test v2. Operational parties only: Crystal, Moon, Ava. */
(function(root){
'use strict';
const identities={
  'party-crystal':Object.freeze({partyId:'party-crystal',displayName:'Crystal',shortName:'CRY',colour:'#9A5965',legacyAliases:Object.freeze(['crystal']),ordering:1,activeFromDay:1,activeToDay:9,permissions:Object.freeze({adminEligible:true})}),
  'party-moon':Object.freeze({partyId:'party-moon',displayName:'Moon',shortName:'MUM',colour:'#B78A55',legacyAliases:Object.freeze(['moon']),ordering:2,activeFromDay:1,activeToDay:9,permissions:Object.freeze({adminEligible:false})}),
  'party-ava':Object.freeze({partyId:'party-ava',displayName:'Ava',shortName:'AVA',colour:'#5C7387',legacyAliases:Object.freeze(['ava']),ordering:3,activeFromDay:1,activeToDay:9,permissions:Object.freeze({adminEligible:false})})
};
const config=Object.freeze({
  tripName:'Japan Onsen Trip',destination:'Japan',country:'Japan',
  startDate:'2026-01-15',endDate:'2026-01-23',
  currency:root.LOCALE_CONFIG.currency,timeZone:root.LOCALE_CONFIG.timeZone,language:root.LOCALE_CONFIG.language,
  logo:Object.freeze({splash:root.ASSET_CONFIG.branding.splashLogo,header:root.ASSET_CONFIG.branding.secondaryMark,icon192:root.ASSET_CONFIG.icons.icon192,icon512:root.ASSET_CONFIG.icons.icon512}),
  coverImage:root.ASSET_CONFIG.hero.coverImage,themeName:root.THEME_CONFIG.name,
  engineName:'Travel Engine',shortName:'Japan Onsen',navLabel:'Japan Onsen Companion',
  familyLabel:'CRYSTAL · MOON · AVA',
  participants:Object.freeze({
    defaultKey:'crystal',
    order:Object.freeze(['crystal','moon','ava']),
    identities:Object.freeze({
      crystal:Object.freeze({code:'CRY',name:'Crystal',activeFromDay:1}),
      moon:Object.freeze({code:'MUM',name:'Moon',activeFromDay:1}),
      ava:Object.freeze({code:'AVA',name:'Ava',activeFromDay:1})
    })
  }),
  parties:Object.freeze({
    defaultPartyId:'party-crystal',
    order:Object.freeze(['party-crystal','party-moon','party-ava']),
    identities:Object.freeze(identities)
  }),
  admin:Object.freeze({
    user:'crystal',displayName:'Crystal',
    studioMessage:'Trip Studio is available to Crystal only.',
    completeMessage:'Complete this trip? Editing will be disabled until Crystal reopens the trip.',
    pin:'260922'
  }),
  home:Object.freeze({
    ariaLabel:'Japan Onsen Companion home',
    reunionStory:'Three women. One winter celebration.',
    dateLine:'15 — 23 Jan 2026',
    regionLine:'Yokohama · Hakone · Gotemba · Kamakura · Tokyo',
    clockLabel:'Japan',homeCities:'Melbourne · Hong Kong',
    clockSuffix:'JST',seasonLabel:'Winter onsen trip',
    seasonNote:'Live winter conditions apply',
    welcomeMessage:'Welcome to Japan',
    completedMessage:'Thanks for the memories'
  }),
  guide:Object.freeze({excludedPlaceIds:Object.freeze([])}),
  exports:Object.freeze({expenseSummaryTitle:'JAPAN ONSEN TRIP EXPENSE SUMMARY'}),
  heroLine1:'Tokyo · Hakone · Fuji',heroEmphasis:'Onsen Trip',
  tagline:'Onsen · Shopping · Birthday',
  splashSlogan:'WINTER CELEBRATION',splashDestination:'JAPAN 2026',
  storageNamespace:'japan-onsen-2026',legacyStorageNamespace:null,
  version:'JAPAN-ROUND2-COMPILE-TEST-2',
  buildLabel:'Japan Round 2 Trip Package Compile Test v2',
  theme:root.THEME_CONFIG.colors
});
root.TRIP_CONFIG=config;
  function applyTripIdentity(){
    if(typeof document==='undefined')return;
    document.documentElement.lang=config.language;
    document.querySelectorAll('[data-trip-page-title]').forEach(function(el){const page=el.getAttribute('data-trip-page-title');document.title=page?page+' · '+config.tripName:config.tripName;});
    document.querySelectorAll('[data-brand-text]').forEach(function(el){const key=el.getAttribute('data-brand-text');const value=config[key];if(value==null)return;if(key==='splashSlogan')el.innerHTML=String(value).replace(/\n/g,'<br>');else el.textContent=value;});
    document.querySelectorAll('[data-brand-logo]').forEach(function(img){const key=img.getAttribute('data-brand-logo');if(config.logo[key])img.src=config.logo[key];});
    document.querySelectorAll('[data-trip-icon]').forEach(function(link){const key=link.getAttribute('data-trip-icon');if(config.logo[key])link.href=config.logo[key];});
    document.querySelectorAll('[data-trip-apple-title]').forEach(function(meta){meta.content=config.destination;});
    document.querySelectorAll('[data-trip-theme-color]').forEach(function(meta){meta.content=config.theme.primary;});
    document.querySelectorAll('[data-trip-currency-placeholder]').forEach(function(input){input.placeholder='Total '+root.LOCALE_CONFIG.currency.code;});
    document.querySelectorAll('[data-locale-currency-placeholder]').forEach(function(input){input.placeholder='0.00 '+root.LOCALE_CONFIG.currency.code;});
  }
  root.applyTripIdentity=applyTripIdentity;
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyTripIdentity);else applyTripIdentity();
  }
})(globalThis);
