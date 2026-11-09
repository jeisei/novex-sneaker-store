import { Euler, Quaternion } from 'three';
import { productScene } from '../data/product-scene.js';

export const orientation = (yaw,pitch) => new Quaternion().setFromEuler(new Euler(pitch,yaw,0,'YXZ'));
export const shortestAngleDelta = (from,to) => ((to-from+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;

export function createProductControls({element,pivot,draw,onViewChange,hitTest=()=>true}) {
  const controller=new AbortController(), signal=controller.signal;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let raf, tween, liftTween, pointer, lastX, lastY, visible=true, pausedAt, disposed=false, suspended=false;
  let yaw=productScene.views[0].yaw,pitch=productScene.views[0].pitch,lift=0, hover=false,frames=0;
  const ease=t=>t*t*(3-2*t);
  const active=()=>visible&&!document.hidden&&!disposed&&!suspended;
  function wake(){if(!raf&&active())raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=undefined;if(!active())return;
    if(tween){
      const t=Math.max(0,Math.min(1,(now-tween.start)/600));
      // Interpolate on the periodic yaw/pitch manifold. This avoids Euler
      // decomposition flips at an inverted pose while taking the short arc.
      yaw=tween.fromYaw+tween.deltaYaw*ease(t);pitch=tween.fromPitch+tween.deltaPitch*ease(t);
      pivot.quaternion.copy(orientation(yaw,pitch));
      if(t===1){yaw=tween.yaw;pitch=tween.pitch;pivot.quaternion.copy(tween.to);tween=undefined;}
    }
    if(liftTween){
      const t=Math.max(0,Math.min(1,(now-liftTween.start)/220));
      lift=liftTween.from+(liftTween.to-liftTween.from)*ease(t);
      if(t===1)liftTween=undefined;
    }
    draw(lift);frames++;if(tween||liftTween)wake();
  }
  function hoverTo(value){
    const target=(value&&!reduced.matches&&pointer===undefined) ? .02 : 0;
    if((!liftTween&&Math.abs(target-lift)<1e-8)||liftTween?.to===target)return;
    if(reduced.matches){lift=target;liftTween=undefined;}else liftTween={from:lift,to:target,start:pausedAt??performance.now()};
    wake();
  }
  function select(id){
    const view=productScene.views.find(view=>view.id===id);if(!view||disposed)return;
    if(suspended){suspended=false;visibility();}
    release();const to=orientation(view.yaw,view.pitch);
    if(reduced.matches){pivot.quaternion.copy(to);tween=undefined;yaw=view.yaw;pitch=view.pitch;}
    else tween={fromYaw:yaw,fromPitch:pitch,deltaYaw:shortestAngleDelta(yaw,view.yaw),deltaPitch:shortestAngleDelta(pitch,view.pitch),to,yaw:view.yaw,pitch:view.pitch,start:performance.now()};
    onViewChange(id);wake();
  }
  function release(){
    if(pointer!==undefined&&element.hasPointerCapture(pointer))element.releasePointerCapture(pointer);
    pointer=undefined;element.removeAttribute('data-dragging');
  }
  function visibility(redraw=true){
    if(!active()) {if(pausedAt===undefined)pausedAt=performance.now();cancelAnimationFrame(raf);raf=undefined;release();}
    else {if(pausedAt!==undefined){const delta=performance.now()-pausedAt;if(tween)tween.start+=delta;if(liftTween)liftTween.start+=delta;pausedAt=undefined;}if(redraw||tween||liftTween)wake();}
  }
  element.addEventListener('pointerdown',event=>{
    if((event.pointerType==='mouse'&&event.button!==0)||pointer!==undefined)return;
    if(suspended){suspended=false;visibility();}
    tween=undefined;pointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;
    element.setPointerCapture(pointer);element.setAttribute('data-dragging','');element.focus({preventScroll:true});
    hoverTo(false);onViewChange(null);
  },{signal});
  element.addEventListener('pointermove',event=>{
    if(pointer===undefined){if(event.pointerType==='mouse'){const next=hitTest(event);if(next!==hover){hover=next;hoverTo(hover);}}return;}
    if(event.pointerId!==pointer)return;
    yaw+=(event.clientX-lastX)*.0065;pitch+=(event.clientY-lastY)*.0065;
    lastX=event.clientX;lastY=event.clientY;pivot.quaternion.copy(orientation(yaw,pitch));wake();
  },{signal});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,event=>{if(event.pointerId===pointer){release();hover=event.pointerType==='mouse'&&hitTest(event);hoverTo(hover);}}, {signal});
  element.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hover=hitTest(event);hoverTo(hover);}}, {signal});
  element.addEventListener('pointerleave',()=>{hover=false;hoverTo(false);}, {signal});
  element.addEventListener('keydown',event=>{
    if(!['Home','r','R','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    if(suspended){suspended=false;visibility();}
    if(event.key==='Home'||event.key.toLowerCase()==='r'){event.preventDefault();select('side');return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();tween=undefined;
    if(event.key==='ArrowLeft')yaw-=.12;if(event.key==='ArrowRight')yaw+=.12;
    if(event.key==='ArrowUp')pitch-=.06;if(event.key==='ArrowDown')pitch+=.06;
    pivot.quaternion.copy(orientation(yaw,pitch));onViewChange(null);wake();
  },{signal});
  window.addEventListener('blur',()=>{release();hover=false;hoverTo(false);},{signal});
  document.addEventListener('visibilitychange',visibility,{signal});
  reduced.addEventListener('change',()=>{if(reduced.matches){if(tween){pivot.quaternion.copy(tween.to);yaw=tween.yaw;pitch=tween.pitch;}tween=undefined;lift=0;liftTween=undefined;}wake();},{signal});
  const observer=new IntersectionObserver(([entry])=>{const changed=visible!==entry.isIntersecting;visible=entry.isIntersecting;visibility(changed);});observer.observe(element);
  return {select,wake,suspend(value){if(suspended===value)return;suspended=value;visibility();},stats:()=>({yaw,pitch,lift,dragging:pointer!==undefined,animating:!!tween,frameActive:!!raf,frames,reducedMotion:reduced.matches,disposed,suspended}),
    dispose(){if(disposed)return;disposed=true;release();cancelAnimationFrame(raf);raf=undefined;tween=undefined;liftTween=undefined;controller.abort();observer.disconnect();}};
}
