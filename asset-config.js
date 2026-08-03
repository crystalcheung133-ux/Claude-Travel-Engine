/* Japan Trip Package — canonical asset configuration. */
(function(root){
  'use strict';
  root.ASSET_CONFIG=Object.freeze({
    branding:Object.freeze({
      primaryLogo:'assets/japan-onsen-logo.png', secondaryMark:'assets/japan-onsen-logo.png',
      splashLogo:'assets/japan-onsen-logo.png', splashMark:'assets/japan-onsen-logo.png'
    }),
    hero:Object.freeze({coverImage:null,heroImage:null,heroOverlay:null}),
    icons:Object.freeze({
      favicon:'assets/japan-onsen-icon-192.png', appIcon:'assets/japan-onsen-icon-192.png',
      appleIcon:'assets/japan-onsen-icon-192.png', icon192:'assets/japan-onsen-icon-192.png',
      icon512:'assets/japan-onsen-icon-512.png'
    }),
    splash:Object.freeze({background:null,assets:Object.freeze(['assets/japan-onsen-logo.png'])})
  });
})(globalThis);
