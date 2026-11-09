import { gsap } from 'gsap';
export { gsap };
export const motion = Object.freeze({ fast:.14, normal:.22, slow:.35, page:.36, shared:.44, leave:.14, enter:.24 });
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const running = new WeakMap();
const bound = new WeakSet();

function bind(root, signal) {
  if (!signal || bound.has(root)) return;
  bound.add(root);
  signal.addEventListener('abort',()=>stopFeedback(root),{once:true});
}

// Per-component ownership: never accumulate tweens or leave temporary properties.
export function stopFeedback(root) {
  const previous=running.get(root);previous?.revert();running.delete(root);
}
export function feedback(root, targets, signal) {
  if (!targets?.length || reducedMotion() || signal?.aborted) return;
  stopFeedback(root);
  const context=gsap.context(()=>{
    gsap.fromTo(targets,{opacity:.6},{opacity:1,duration:motion.fast,ease:'power2.out',clearProps:'opacity'});
  },root);
  running.set(root,context);
  bind(root,signal);
}
