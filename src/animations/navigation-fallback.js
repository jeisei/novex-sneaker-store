import { gsap, motion, reducedMotion } from './motion.js';
import { transitionPreviews } from '../data/transition-previews.js';

// A cold PRODUCT image must not turn an already visible SHOP shoe into a blank
// region. Reuse that decoded source until the exact frame or live 3D is ready.
export function installNavigationFallback(root, origin, signal) {
  const image=root.querySelector('.product-initial-frame'),surface=root.querySelector('.product-stage-surface');
  if(!image||!surface||image.complete&&image.naturalWidth)return;
  const frame=transitionPreviews[origin.id];if(!frame)return;
  const fallback=surface.cloneNode(false),crop=document.createElement('div'),visual=origin.visual.cloneNode(true);
  fallback.classList.add('product-navigation-fallback');fallback.setAttribute('aria-hidden','true');
  const [left,top,right,bottom]=frame.bounds,[width,height]=frame.canvas;
  Object.assign(crop.style,{position:'absolute',left:`${left/width*100}%`,top:`${top/height*100}%`,width:`${(right-left)/width*100}%`,height:`${(bottom-top)/height*100}%`,overflow:'hidden'});
  Object.assign(visual.style,{position:'absolute',left:'0',top:'0',bottom:'auto',width:'100%',height:'100%',transform:'none',aspectRatio:'auto'});
  visual.style.setProperty('--shop-active','0');crop.append(visual);fallback.append(crop);surface.after(fallback);surface.style.opacity='0';
  const stage=surface.closest('.product-stage');let tween,finished=false;
  const observer=new MutationObserver(()=>{if(stage.dataset.viewer==='ready')finish();});
  observer.observe(stage,{attributes:true,attributeFilter:['data-viewer']});
  function clear(){observer.disconnect();tween?.kill();fallback.remove();surface.style.removeProperty('opacity');}
  function finish(){
    if(finished||signal.aborted)return;finished=true;observer.disconnect();surface.style.removeProperty('opacity');
    if(reducedMotion())fallback.remove();else tween=gsap.to(fallback,{opacity:0,duration:motion.fast,onComplete:()=>fallback.remove()});
  }
  Promise.any([image,root.querySelector('.product-initial-lite')].filter(Boolean).map(frame=>frame.decode())).then(finish,()=>{});
  signal.addEventListener('abort',clear,{once:true});
}
