import { transitionPreviews } from '../data/transition-previews.js';
import { productPreviews } from '../data/product-previews.js';
import { prefetchModelBytes, cancelModelIntent } from '../three/model-bytes.js';

const images=new Map();
export function warmTransitionPreview(id){
  const key='transition:'+id;
  if(images.has(key))return images.get(key);
  const img=new Image();img.decoding='async';img.src=import.meta.env.BASE_URL+transitionPreviews[id].image;
  images.set(key,img);if(images.size>6)images.delete(images.keys().next().value);
  return img;
}
export function warmProductPreview(product){
  warmTransitionPreview(product.id);
  const variant=matchMedia('(max-width:600px)').matches?'mobile':'initial',key=product.id+variant;
  if(images.has(key))return;
  const img=new Image();img.src=import.meta.env.BASE_URL+productPreviews[product.id].frames[variant].image;
  images.set(key,img);if(images.size>6)images.delete(images.keys().next().value);
}
export function installProductIntent(root,signal,getProduct){
  let timer,active,opening=false,generation=0;
  const productFor=target=>{const card=target.closest('.product-card');return card?getProduct(card.dataset.productId):null;};
  function schedule(event){
    const product=productFor(event.target);if(!product||active===product.id)return;
    clearTimeout(timer);generation++;active=product.id;
    const current=generation;
    timer=setTimeout(async()=>{
      try{
      warmProductPreview(product);
      const connection=navigator.connection;
      if(connection?.saveData||/2g/.test(connection?.effectiveType??'')||(navigator.deviceMemory??8)<4||matchMedia('(pointer:coarse)').matches)return;
      const {productModels}=await import('../three/product-models.js');
      if(signal.aborted||current!==generation)return;
      const url=new URL(import.meta.env.BASE_URL+product.asset.model,location.href).href;
      if(!productModels.has(url))prefetchModelBytes(url);
      import('../three/product-viewer.js').catch(()=>{});
      }catch{/* Intent is speculative; actual PRODUCT owns errors/retry. */}
    },180);
  }
  root.addEventListener('pointerover',schedule,{signal});root.addEventListener('focusin',schedule,{signal});
  root.addEventListener('pointerdown',event=>{const p=productFor(event.target);if(p)warmProductPreview(p);},{signal});
  function leave(event){
    const card=event.target.closest('.product-card');
    if(!card||card.contains(event.relatedTarget))return;
    clearTimeout(timer);active=undefined;generation++;if(!opening)cancelModelIntent();
  }
  root.addEventListener('pointerout',leave,{signal});root.addEventListener('focusout',leave,{signal});
  root.addEventListener('click',event=>{if(event.target.closest('.product-card-link'))opening=true;},{signal,capture:true});
  root.addEventListener('novex:motionresume',()=>{opening=false;},{signal});
  root.addEventListener('novex:retire',()=>{clearTimeout(timer);active=undefined;generation++;},{signal});
  signal.addEventListener('abort',()=>{clearTimeout(timer);generation++;if(!opening)cancelModelIntent();},{once:true});
}
