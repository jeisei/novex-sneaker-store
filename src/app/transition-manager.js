import { installNavigationFallback } from '../animations/navigation-fallback.js';
import { createLifecycle } from './lifecycle.js';
import { gsap, motion, reducedMotion } from '../animations/motion.js';
import { frameBounds, flipTransform, validRect } from '../animations/shared-geometry.js';
import { transitionPreviews } from '../data/transition-previews.js';
import { warmTransitionPreview } from './product-intent.js';

const key=route=>route.page+(route.id?'/'+route.id:'');
const contents=root=>[...root.querySelectorAll(':scope > .home-copy,:scope > .shop-heading,:scope > .shop-grid,:scope > .product-layout,:scope > .cart-content,:scope > .stage-placeholder')];

export function createTransitionManager({shell,host,update,loadView}) {
  let current,transition,generation=0,retiring,cachedProduct,cachedShop,completed=0,cancelled=0;
  const scrolls=new Map(),states=new Map(),measurements=[];
  const deferredDisposals=new Set();let cleanupScheduled=false;
  history.scrollRestoration='manual';
  function disposeSlot(slot){if(!slot)return;slot.lifecycle.dispose();slot.node.remove();}
  function flushDisposals(){for(const slot of deferredDisposals){deferredDisposals.delete(slot);disposeSlot(slot);}}
  function scheduleCleanup(){
    if(cleanupScheduled||!deferredDisposals.size)return;
    cleanupScheduled=true;
    // Give the completed page a paint before GPU/context teardown. Never run it mid-transition.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const run=()=>{cleanupScheduled=false;if(!transition)flushDisposals();};
      if(window.requestIdleCallback)requestIdleCallback(run,{timeout:1000});else setTimeout(run,0);
    }));
  }
  function deferDisposal(slot){slot.node.remove();deferredDisposals.add(slot);if(!transition)scheduleCleanup();}
  function retireSlot(slot) {
    if(!slot)return;
    if(slot.route.page==='shop'){
      if(cachedShop&&cachedShop!==slot)disposeSlot(cachedShop);
      cachedShop=slot;slot.node.remove();return;
    }
    const retain=slot.route.page==='product'&&current?.route.page!=='product'&&slot.node.querySelector('.product-stage[data-interactive]')
      &&matchMedia('(hover:hover) and (pointer:fine)').matches&&(navigator.deviceMemory??8)>=4&&!navigator.connection?.saveData;
    if(retain){
      disposeSlot(cachedProduct);cachedProduct=slot;slot.node.remove();
    }else if(slot.route.page==='product')deferDisposal(slot);
    else disposeSlot(slot);
  }
  function normalizeCached(){
    for(const slot of [cachedProduct,cachedShop]){
      if(!slot)continue;
      const targets=[...slot.node.querySelectorAll('[style]')].filter(el=>el.style.opacity||el.style.transform);
      if(targets.length)gsap.set(targets,{clearProps:'opacity,transform'});
    }
  }
  function completeOwned(token,measurement){
    if(token!==generation)return;
    const owned=transition;transition=undefined;owned?.context.revert();owned?.layer?.remove();owned?.aux?.forEach(el=>el.remove());
    retireSlot(retiring);retiring=undefined;normalizeCached();completed++;
    current.node.style.cssText='';current.node.firstElementChild?.dispatchEvent(new CustomEvent('novex:motionresume'));
    measurement.completed=performance.now();owned?.resolve();shell.dataset.motion='idle';scheduleCleanup();
  }
  function cancel() {
    if(!transition)return;
    const old=transition;transition=undefined;old.context.revert();old.layer?.remove();old.aux?.forEach(node=>node.remove());old.resolve();
    retireSlot(retiring);retiring=undefined;normalizeCached();cancelled++;
    if(current){current.node.style.cssText='';current.node.inert=false;current.node.removeAttribute('aria-hidden');}
  }
  function snapshotOrigin(route,root) {
    const card=root.querySelector(`[data-product-id="${route.id}"] .product-image`);
    if(!card)return null;
    if(Number(getComputedStyle(card.closest('.shop-grid')??card).opacity)<.95)return null;
    const rect=card.getBoundingClientRect();
    if(!validRect(rect,innerWidth,innerHeight))return null;
    return {rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},visual:card.cloneNode(true),scrollY,viewport:[innerWidth,innerHeight],id:route.id};
  }
  function shared(from,to,oldRoot,newRoot,origin) {
    // The shared shoe moves only into PRODUCT. Every return uses the common page fade.
    if(from?.page!=='shop'||to.page!=='product'||!origin)return null;
    const frame=transitionPreviews[to.id];if(!frame)return null;
    if(origin.viewport[0]!==innerWidth||origin.viewport[1]!==innerHeight)return null;
    const productRoot=newRoot;
    const preview=productRoot.querySelector('.product-initial-frame');if(!preview)return null;
    const productRect=frameBounds(frame,preview.getBoundingClientRect());
    const shoe=oldRoot.querySelector(`[data-product-id="${origin.id}"] .product-image`);
    if(!shoe)return null;
    const fromRect=origin.rect,toRect=productRect;
    if(!validRect(fromRect,innerWidth,innerHeight)||!validRect(toRect,innerWidth,innerHeight))return null;
    const matched=warmTransitionPreview(origin.id);
    // Use the ordinary fade when a matched capture has not decoded yet.
    if(!matched.complete||!matched.naturalWidth||!preview.complete||!preview.naturalWidth)return null;
    const transform=flipTransform(fromRect,toRect);if(!transform)return null;
    const layer=document.createElement('div');layer.className='motion-shared';layer.setAttribute('aria-hidden','true');layer.inert=true;
    Object.assign(layer.style,{left:`${toRect.x}px`,top:`${toRect.y}px`,width:`${toRect.width}px`,height:`${toRect.height}px`});
    const image=matched.cloneNode();image.className='motion-matched';
    const visual=origin.visual;
    visual.classList.add('motion-source');
    Object.assign(visual.style,{position:'absolute',left:'0',top:'0',bottom:'auto',width:'100%',height:'100%',transform:'none',aspectRatio:'auto'});
    visual.style.setProperty('--shop-active',getComputedStyle(shoe.closest('.product-card-link')).getPropertyValue('--shop-active'));
    layer.append(visual,image);document.body.append(layer);
    return {layer,transform,visual,image,shoe,stage:productRoot.querySelector('.product-stage')};
  }
  function navigate(route) {
    if(current&&key(current.route)===key(route))return;
    const requested=performance.now(),token=++generation;
    if(current?.route.page!=='product'&&route.page!=='product'&&transition&&retiring&&key(retiring.route)===key(route)&&transition.timeline.time()<motion.leave&&!retiring.pendingCancelled&&!retiring.signal?.aborted){
      const target=retiring,out=current,owned=transition;
      scrolls.set(key(out.route),scrollY);
      Object.assign(out.node.style,{position:'fixed',left:'0',top:`${-scrollY}px`,width:'100%',zIndex:'2',pointerEvents:'none'});
      out.node.inert=true;out.node.setAttribute('aria-hidden','true');out.node.firstElementChild?.dispatchEvent(new CustomEvent('novex:motionpause'));
      target.node.style.cssText='';target.node.inert=false;target.node.removeAttribute('aria-hidden');host.append(target.node);
      current=target;retiring=out;update(route);window.scrollTo({top:scrolls.get(key(route))??0,left:0,behavior:'auto'});
      const measurement={from:out.route.page,to:route.page,id:route.id,requested,mounted:performance.now(),shared:!!owned.layer,reversed:true};
      measurements.push(measurement);if(measurements.length>50)measurements.shift();
      owned.timeline.eventCallback('onComplete',()=>completeOwned(token,measurement));
      owned.timeline.eventCallback('onReverseComplete',()=>completeOwned(token,measurement));
      if(target===owned.a)owned.timeline.reverse();else owned.timeline.play();
      return;
    }
    // Preserve the visible interpolation when another route interrupts a tween.
    const visual=transition&&current?[...current.node.querySelectorAll('[style]')].filter(el=>el.style.opacity||el.style.transform).map(el=>({el,opacity:el.style.opacity,transform:el.style.transform})):[];
    cancel();
    for(const state of visual){state.el.style.opacity=state.opacity;state.el.style.transform=state.transform;}

    const previous=current,from=previous?.route;
    const chromeBefore=previous?[...shell.querySelectorAll(':scope > .site-header,:scope > .shop-contact-zone')].map(el=>({el,rect:el.getBoundingClientRect(),clone:el.cloneNode(true)})):[];
    const wall=shell.querySelector('.shell-wall'),wallRect=previous?wall.getBoundingClientRect():null;
    const wallFilter=previous?getComputedStyle(wall).filter:null,wallAfter=previous?getComputedStyle(wall,'::after').opacity:null;
    if(cachedProduct&&!cachedProduct.node.querySelector('.product-stage[data-viewer="ready"]')){disposeSlot(cachedProduct);cachedProduct=undefined;}
    if(cachedProduct&&route.page==='product'&&cachedProduct.route.id!==route.id){disposeSlot(cachedProduct);cachedProduct=undefined;}
    if(previous)scrolls.set(key(from),scrollY);
    const origin=from?.page==='shop'&&route.page==='product'?snapshotOrigin(route,previous.node):null;
    const oldRoot=previous?.node.firstElementChild;
    if(previous)previous.pendingCancelled=from.page==='product'&&oldRoot?.querySelector('.product-stage')?.dataset.viewer!=='ready';
    oldRoot?.dispatchEvent(new CustomEvent('novex:retire'));
    if(previous){
      retiring=previous;
      // Keep only the retiring scene alive for its short fade. New GPU setup
      // starts after this owned transition; no second live WebGL context.
      const y=scrollY;
      Object.assign(previous.node.style,{position:'fixed',left:'0',top:`${-y}px`,width:'100%',zIndex:'2',pointerEvents:'none'});
      previous.node.inert=true;previous.node.setAttribute('aria-hidden','true');
    }
    const reused=route.page==='shop'?cachedShop:route.page==='product'&&cachedProduct?.route.id===route.id?cachedProduct:undefined;
    if(reused){if(route.page==='shop')cachedShop=undefined;else cachedProduct=undefined;}
    const node=reused?.node??document.createElement('div');node.className='route-stage';node.style.cssText='';node.inert=false;node.removeAttribute('aria-hidden');host.append(node);
    let releaseScene;const sceneTurn=new Promise(resolve=>releaseScene=()=>{
      if(token!==generation||route.page!=='product'||!deferredDisposals.size){resolve();return;}
      // A new PRODUCT must not allocate another context before the old one is released.
      requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token===generation)flushDisposals();resolve();}));
    });
    const state=states.get(key(route))??{};states.set(key(route),state);
    const slot=reused??{route,node,lifecycle:createLifecycle(),signal:null};current=slot;
    update(route);
    if(!reused)slot.lifecycle.mount(signal=>{
      slot.signal=signal;
      return loadView(node,route,signal,{chrome:false,sceneTurn,state,focusId:from?.page==='product'?from.id:undefined});
    },error=>{
      if(token!==generation)return;
      node.textContent='This page could not be opened. Please try another page.';
      console.error(error);
    });
    const root=node.firstElementChild;
    const restore=route.page==='shop'?scrolls.get(key(route))??0:0;
    window.scrollTo({top:restore,left:0,behavior:'auto'});
    if(!root){releaseScene();disposeSlot(retiring);retiring=undefined;return;}
    root.dispatchEvent(new CustomEvent('novex:motionpause'));
    if(from?.page==='shop'&&route.page==='product'&&origin)installNavigationFallback(root,origin,slot.signal);
    const focus=route.page==='shop'&&from?.page==='product'?root.querySelector(`[data-product-id="${from.id}"] .product-card-link`):root.querySelector('h1');
    if(!shell.querySelector('.site-header').contains(document.activeElement))focus?.focus({preventScroll:true});
    const measurement={from:from?.page??null,to:route.page,id:route.id,requested,mounted:performance.now(),shared:false,reused:!!reused};
    measurements.push(measurement);if(measurements.length>50)measurements.shift();
    const finish=()=>completeOwned(token,measurement);
    if(!previous||reducedMotion()||document.hidden){retireSlot(retiring);retiring=undefined;normalizeCached();releaseScene();root.dispatchEvent(new CustomEvent('novex:motionresume'));measurement.completed=performance.now();shell.dataset.motion='idle';scheduleCleanup();return;}
    const restoredCustom=reused&&root.querySelector('.product-stage')?.dataset.view!=='side';
    const flight=restoredCustom?null:shared(from,route,oldRoot,root,origin);
    measurement.shared=!!flight;
    shell.dataset.motion='running';
    const aux=[],chromeEntering=[];
    const returning=from?.page==='product'&&route.page==='shop';
    const leave=returning ? .10 : motion.leave,enter=returning ? .20 : motion.enter,overlap=returning ? .04 : .08;
    const visible=r=>r.bottom>0&&r.top<innerHeight;
    for(const {el,rect,clone} of chromeBefore){
      const next=el.getBoundingClientRect();
      if(Math.abs(next.y-rect.y)<2)continue;
      if(visible(rect)){
        clone.setAttribute('aria-hidden','true');clone.inert=true;clone.classList.add('motion-chrome-ghost');
        clone.querySelectorAll('[id]').forEach(child=>child.removeAttribute('id'));
        Object.assign(clone.style,{position:'fixed',left:`${rect.x}px`,top:`${rect.y}px`,right:'auto',bottom:'auto',width:`${rect.width}px`,height:`${rect.height}px`,margin:'0',zIndex:'6',pointerEvents:'none'});
        shell.append(clone);aux.push(clone);
      }
      if(visible(next))chromeEntering.push(el);
    }
    if(wallRect&&Math.abs(wallRect.height-wall.getBoundingClientRect().height)>2){
      const clone=wall.cloneNode(false);clone.classList.add('motion-wall-ghost');
      Object.assign(clone.style,{position:'fixed',left:`${wallRect.x}px`,top:`${wallRect.y}px`,width:`${wallRect.width}px`,height:`${wallRect.height}px`,right:'auto',bottom:'auto',filter:wallFilter,transition:'none'});
      clone.style.setProperty('--wall-after',wallAfter);shell.append(clone);aux.push(clone);
    }
    let timeline;
    const context=gsap.context(()=>{
      timeline=gsap.timeline({defaults:{ease:'power2.out'},onComplete:finish});
      if(aux.length)timeline.to(aux,{opacity:0,duration:enter},0);
      if(chromeEntering.length)timeline.fromTo(chromeEntering,{opacity:0},{opacity:1,duration:enter},0);
      timeline.to(contents(oldRoot),{opacity:0,duration:leave},0);
      timeline.call(()=>{retireSlot(retiring);retiring=undefined;},[],leave);
      if(flight){
        const targets=[root.querySelector('.product-info'),root.querySelector('.product-gallery')];
        timeline.fromTo(targets,{opacity:0,y:8},{opacity:1,y:0,duration:motion.enter},.06);
        timeline.fromTo(flight.layer,flight.transform,{x:0,y:0,scaleX:1,scaleY:1,duration:motion.shared},0);
        gsap.set(flight.shoe,{opacity:0});gsap.set(flight.image,{opacity:0});
        timeline.to(flight.visual,{opacity:0,duration:motion.fast},.08);
        timeline.to(flight.image,{opacity:1,duration:motion.fast},.08);
        timeline.fromTo(flight.stage,{opacity:0},{opacity:1,duration:motion.fast},motion.shared-motion.fast);
        timeline.to(flight.layer,{opacity:0,duration:.08},motion.shared-.08);
      }else timeline.fromTo(contents(root),{opacity:0,y:8},{opacity:1,y:0,duration:enter},overlap);
    },shell);
    transition={context,timeline,a:previous,b:slot,layer:flight?.layer,aux,resolve:releaseScene};
  }
  const settle=()=>{if(transition){const active=transition;transition=undefined;active.context.revert();active.layer?.remove();active.aux?.forEach(node=>node.remove());retireSlot(retiring);retiring=undefined;active.resolve();normalizeCached();current?.node.firstElementChild?.dispatchEvent(new CustomEvent('novex:motionresume'));shell.dataset.motion='idle';scheduleCleanup();}};
  window.addEventListener('resize',settle);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(reducedMotion())settle();});
  window.addEventListener('pagehide',()=>{disposeSlot(cachedProduct);cachedProduct=undefined;disposeSlot(cachedShop);cachedShop=undefined;flushDisposals();});
  return {navigate,stats:()=>({page:current?.route,active:!!transition,retiring:!!retiring,cachedProduct:cachedProduct?.route.id??null,cachedShop:!!cachedShop,pendingDisposals:deferredDisposals.size,completed,cancelled,measurements:measurements.map(m=>({...m}))})};
}
