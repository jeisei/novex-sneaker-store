import { headerMarkup, refreshCartIndicator } from '../components/header.js';
import { shopContactsMarkup } from '../components/shop-contacts.js';
import { gsap, motion, reducedMotion } from '../animations/motion.js';
import { installProductSearch } from '../components/product-search.js';

export function createShell(app, initialPage='home') {
  app.innerHTML=`<div class="site-shell" data-page="${initialPage}"><div class="site-wall shell-wall" aria-hidden="true"></div>${headerMarkup('home')}<main class="route-host"></main>${shopContactsMarkup()}<p class="sr-only route-announcement" role="status" aria-live="polite"></p></div>`;
  const shell=app.firstElementChild,host=shell.querySelector('.route-host');
  const search=installProductSearch(shell);
  const nav=shell.querySelector('.site-nav'),indicator=document.createElement('span');
  indicator.className='site-nav-indicator';indicator.setAttribute('aria-hidden','true');nav.append(indicator);
  let active,underline,badgeAnimation,first=true;
  function place(link,animate=true) {
    underline?.kill();
    if(!link){underline=gsap.to(indicator,{opacity:0,duration:reducedMotion()?0:motion.fast});return;}
    const navRect=nav.getBoundingClientRect(),linkRect=link.getBoundingClientRect();
    const left=linkRect.left-navRect.left,width=linkRect.width;
    const target={x:left,scaleX:width,opacity:1,duration:!animate||reducedMotion()?0:motion.normal,ease:'power2.out',overwrite:true};
    underline=gsap.to(indicator,target);
  }
  function update(route) {
    search.close();
    shell.dataset.page=route.page;
    const key=route.page==='product'?'shop':route.page;
    nav.querySelectorAll('a').forEach(link=>{
      const selected=link.hash===(key==='home'?'#/':key==='shop'?'#/shop':'');
      if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    });
    active=nav.querySelector('[aria-current]');place(active,!first);first=false;
    shell.querySelector('.route-announcement').textContent=route.page==='product'?'Product details':route.page==='cart'?'Your cart':route.page==='shop'?'Sneaker collection':'Home';
  }
  nav.addEventListener('pointerover',event=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches){const link=event.target.closest('a');if(link)place(link);}});
  nav.addEventListener('pointerleave',()=>place(active));
  nav.addEventListener('focusin',event=>{const link=event.target.closest('a');if(link)place(link);});
  nav.addEventListener('focusout',event=>{if(!nav.contains(event.relatedTarget))place(active);});
  const resize=new ResizeObserver(()=>place(active,false));resize.observe(nav);
  document.fonts.ready.then(()=>place(active,false));
  window.addEventListener('resize',()=>place(active,false));
  function refresh() {
    const badge=shell.querySelector('.cart-count'),before=badge.textContent;
    refreshCartIndicator(shell);
    if(before!==badge.textContent&&!badge.hidden&&!reducedMotion()){
      badgeAnimation?.revert();badgeAnimation=gsap.fromTo(badge,{scale:.9,opacity:.7},{scale:1,opacity:1,duration:motion.fast,ease:'power2.out',clearProps:'transform,opacity'});
    }
  }
  return {shell,host,update,refresh};
}
