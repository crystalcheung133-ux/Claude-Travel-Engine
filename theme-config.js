/* Japan Trip Package — Winter Editorial Warm theme. */
(function(root){
  'use strict';
  const theme=Object.freeze({
    name:'Japan Winter Editorial Warm',
    colors:Object.freeze({
      primary:'#2F574C',primaryDeep:'#1F4038',secondary:'#B8684D',secondaryDeep:'#8E4B39',
      accent:'#C98B58',accentDeep:'#9F6840',highlight:'#7D91A3',background:'#F7F1E7',surface:'#FFFDFC',
      ink:'#17324B',muted:'#66727A',border:'rgba(23,50,75,.15)',heroSky:'#DCECEF',heroMeadow:'#E7E9D5',heroSun:'#F4D7AF'
    }),
    gradients:Object.freeze({
      hero:'linear-gradient(135deg,#DCECEF 0%,#E7E9D5 56%,#F4D7AF 100%)',
      primaryAction:'linear-gradient(135deg,#2F574C,#1F4038)',
      secondaryAction:'linear-gradient(135deg,#B8684D,#8E4B39)',
      accentAction:'linear-gradient(135deg,#C98B58,#9F6840)',
      homeHero:'linear-gradient(135deg,#D7ECEB 0%,#E8E7D3 55%,#F6D7AA 100%)',
      splash:'linear-gradient(180deg,#DCECEF 0%,#E7E9D5 58%,#F4D7AF 100%)'
    }),
    radius:Object.freeze({surface:'26px',hero:'30px',button:'18px',compactButton:'14px'}),
    borderWeight:'1px',
    shadows:Object.freeze({surface:'0 11px 28px rgba(16,42,67,.09)',hero:'0 16px 38px rgba(21,50,75,.09)',nav:'0 3px 15px rgba(21,50,75,.045)',action:'0 10px 24px rgba(31,64,56,.18)'}),
    treatments:Object.freeze({navigation:'light-glass',hero:'winter-editorial-gradient',watermark:'steam-wave',splash:'trip-badge-light-gradient'})
  });
  root.THEME_CONFIG=theme;
  if(typeof document!=='undefined'){
    const c=theme.colors,g=theme.gradients,r=theme.radius,s=theme.shadows;
    const vars={'--theme-primary':c.primary,'--theme-primary-deep':c.primaryDeep,'--theme-secondary':c.secondary,'--theme-secondary-deep':c.secondaryDeep,'--theme-accent':c.accent,'--theme-accent-deep':c.accentDeep,'--theme-highlight':c.highlight,'--theme-background':c.background,'--theme-surface':c.surface,'--theme-ink':c.ink,'--theme-muted':c.muted,'--theme-border':c.border,'--theme-hero-sky':c.heroSky,'--theme-hero-meadow':c.heroMeadow,'--theme-hero-sun':c.heroSun,'--theme-hero-gradient':g.hero,'--theme-primary-action':g.primaryAction,'--theme-secondary-action':g.secondaryAction,'--theme-accent-action':g.accentAction,'--theme-home-hero':g.homeHero,'--theme-splash':g.splash,'--theme-surface-radius':r.surface,'--theme-hero-radius':r.hero,'--theme-button-radius':r.button,'--theme-compact-button-radius':r.compactButton,'--theme-border-weight':theme.borderWeight,'--theme-shadow-surface':s.surface,'--theme-shadow-hero':s.hero,'--theme-shadow-nav':s.nav,'--theme-shadow-action':s.action};
    const style=document.createElement('style');style.id='travel-engine-theme-tokens';style.textContent=':root{'+Object.entries(vars).map(([k,v])=>k+':'+v).join(';')+';}';document.head.appendChild(style);
  }
})(globalThis);
