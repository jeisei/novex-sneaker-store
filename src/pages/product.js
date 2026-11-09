import { gsap, feedback } from '../animations/motion.js';
import { warmProductPreview } from '../app/product-intent.js';
import { prefetchModelBytes, cancelModelIntent } from '../three/model-bytes.js';
import { headerMarkup } from '../components/header.js';
import { shopContactsMarkup } from '../components/shop-contacts.js';
import { productGalleryMarkup } from '../components/product-gallery.js';
import { productStageMarkup } from '../components/product-stage.js';
import { productInfoMarkup } from '../components/product-info.js';
import { getProduct } from '../data/products.js';
import { cart, MAX_QUANTITY } from '../data/cart.js';
import '../styles/shop.css';
import '../styles/product.css';

export async function mountProduct(app, id, signal, { chrome=true, sceneTurn=Promise.resolve(), state={} }={}) {
  const product = getProduct(id);
  const modelURL=new URL(import.meta.env.BASE_URL+product.asset.model,location.href).href;
  app.innerHTML = `<section class="product-page" data-product-id="${product.id}">
    ${chrome ? '<div class="site-wall" aria-hidden="true"></div>' : ''}
    ${chrome ? headerMarkup('shop') : ''}
    <div class="product-layout">
      ${productGalleryMarkup(product)}
      ${productStageMarkup(product)}
      ${productInfoMarkup(product)}
    </div>
    ${chrome ? shopContactsMarkup() : ''}
  </section>`;
  const root = app.querySelector('.product-page');
  const stage = root.querySelector('.product-stage');
  const viewerContainer=root.querySelector('.product-stage-viewer');
  const viewerStatus=root.querySelector('.product-viewer-status');
  let viewer,viewerOwner,feedbackTimer,attempt=0;
  const retry=root.querySelector('.product-viewer-retry');
  function selectView(id){
    root.querySelectorAll('.product-thumbnail[data-view]').forEach(button=>{
      const active=button.dataset.view===id;button.setAttribute('aria-pressed',String(active));button.toggleAttribute('data-active',active);
    });
    stage.dataset.view=id??'custom';
  }
  root.addEventListener('novex:retire',()=>{
    // Cancel pending parsing/uploads immediately, rather than allowing an old
    // scene to start a long upload during the next route's fade.
    viewer?.suspend(true);
    if(stage.dataset.viewer!=='ready'){cancelModelIntent(modelURL);viewerOwner?.abort();}
  },{signal});
  root.addEventListener('novex:motionpause',()=>viewer?.suspend(true),{signal});
  root.addEventListener('novex:motionresume',()=>viewer?.suspend(false),{signal});
  viewerContainer.addEventListener('productviewererror',()=>{
    viewer?.dispose();delete stage.dataset.interactive;retry.hidden=false;
    selectView('side');
    stage.dataset.viewer='error';viewerStatus.textContent='3D view interrupted. Static preview is shown.';
    root.querySelectorAll('.product-thumbnail').forEach(button=>button.disabled=true);
  },{signal});
  let selectedSize = state.size ?? product.offer?.defaultSize;
  let quantity = state.quantity ?? 1;
  const status = root.querySelector('.product-purchase-status');
  const addButton = root.querySelector('.product-add');
  function updateQuantity() {
    root.querySelector('.product-quantity-value').value = String(quantity);
    root.querySelector('[data-quantity-step="-1"]').disabled = quantity === 1;
    root.querySelector('[data-quantity-step="1"]').disabled = quantity === MAX_QUANTITY;
  }
  function clearFeedback() {
    feedbackTimer?.kill();
    if (product.offer) status.textContent = '';
    addButton.querySelector('span').textContent = 'Add to Cart';
  }
  root.addEventListener('change', event => {
    if (!event.target.matches('input[name="product-size"]')) return;
    selectedSize = event.target.value;state.size=selectedSize;
    clearFeedback();
  }, { signal });
  root.addEventListener('click', event => {
    const step = event.target.closest('[data-quantity-step]');
    if(event.target.closest('.product-viewer-retry')){startViewer();return;}
    if (step) {
      quantity = Math.min(MAX_QUANTITY, Math.max(1, quantity + Number(step.dataset.quantityStep)));
      state.quantity=quantity;updateQuantity();
      feedback(root,[root.querySelector('.product-quantity-value')],signal);
      clearFeedback();
      return;
    }
    const view = event.target.closest('.product-thumbnail[data-view]');
    if (view && !view.disabled) {
      if(viewer)viewer.select(view.dataset.view);else selectView(view.dataset.view);
      return;
    }
    if (!event.target.closest('.product-add') || !product.offer) return;
    // Read the actual checked radio as well as state, so invalid/no selection
    // cannot create a malformed cart item.
    selectedSize = root.querySelector('input[name="product-size"]:checked')?.value;
    if (!product.offer.sizes.includes(selectedSize)) {
      status.textContent = 'Choose a size before adding to cart.';
      root.querySelector('input[name="product-size"]')?.focus();
      return;
    }
    try {
      cart.add(product.id, selectedSize, quantity);
      addButton.querySelector('span').textContent = 'Added to Cart';
      status.textContent = `Added ${quantity} · size ${selectedSize}. `;
      const link = document.createElement('a');
      link.href = '#/cart';
      link.textContent = 'View Cart';
      status.append(link);
      feedback(root,[addButton.querySelector('span')],signal);
      feedbackTimer?.kill();feedbackTimer=gsap.delayedCall(1.8,()=>{if(!signal.aborted)addButton.querySelector('span').textContent='Add to Cart';});
    } catch (error) { status.textContent = error.message; }
  }, { signal });
  signal.addEventListener('abort', () => {cancelModelIntent(modelURL);viewerOwner?.abort();viewer?.dispose();}, { once: true });
  if(chrome)root.querySelector('h1').focus({ preventScroll: true });
  const savedRadio=root.querySelector(`input[name="product-size"][value="${selectedSize}"]`);if(savedRadio)savedRadio.checked=true;updateQuantity();
  const details=root.querySelector('.product-more-details');
  if (details) {
    details.open=!!state.details;
    details.addEventListener('toggle',()=>{state.details=details.open;},{signal});
  }
  signal.addEventListener('abort',()=>feedbackTimer?.kill(),{once:true});
  // Decode fallback images independently. They must not delay the selected GLB.
  const highFrame=root.querySelector('.product-initial-frame');
  highFrame.decode().then(()=>{if(!signal.aborted)stage.dataset.previewReady='true';},()=>{});
  const images = [...root.querySelectorAll('img')];
  Promise.allSettled(images.map(image => image.decode())).then(results => {
    if (signal.aborted) return;
    if (results.some(result => result.status === 'rejected') && !images.some(image=>image.matches('.product-initial-frame,.product-initial-lite')&&image.complete&&image.naturalWidth) && stage.dataset.viewer !== 'ready') {
      stage.querySelector('.product-stage-error').hidden = false;
      root.dataset.imageError = 'true';
    }
    root.dataset.ready = 'true';
  });
  // Let the product controls remain available while the large selected GLB parses.
  async function startViewer(){
    const current=++attempt;
    viewerOwner?.abort();viewer?.dispose();viewer=undefined;
    const owner=new AbortController();viewerOwner=owner;
    selectView('side');
    stage.dataset.viewer='loading';delete stage.dataset.interactive;retry.hidden=true;
    viewerContainer.setAttribute('aria-busy','true');viewerStatus.textContent='Preparing interactive 3D view.';
    try{
      const {createProductViewer}=await import('../three/product-viewer.js');signal.throwIfAborted();
      // Network starts immediately; GPU work yields to the owned route animation.
      await sceneTurn;
      owner.signal.throwIfAborted();
      const result=await createProductViewer({container:viewerContainer,asset:product.asset,signal:owner.signal,onViewChange:selectView,generateThumbnails:new URLSearchParams(location.search).has('generatePreviews')});
      if(signal.aborted||current!==attempt){result.dispose();return;}viewer=result;
      viewerContainer.querySelector('canvas').tabIndex=-1;
      viewerContainer.querySelector('canvas').setAttribute('aria-label',product.name+'. Drag to rotate; arrow keys to turn; Home or R to reset.');
      root.querySelectorAll('.product-thumbnail[data-view]').forEach(button=>{
        const id=button.dataset.view;
        if(viewer.previews[id])button.querySelector('img').src=viewer.previews[id];
        button.setAttribute('aria-label',id[0].toUpperCase()+id.slice(1)+' view');
      });
      stage.dataset.viewer='ready';stage.setAttribute('role','group');stage.setAttribute('aria-label',product.name+' — interactive 3D sneaker');
      stage.querySelector('.product-stage-error').hidden=true;delete root.dataset.imageError;
      const reveal=()=>{
        if(signal.aborted||owner.signal.aborted||current!==attempt)return;
        stage.dataset.interactive='true';viewerContainer.querySelector('canvas').tabIndex=0;
        root.querySelectorAll('.product-thumbnail').forEach(button=>button.disabled=false);
        viewerContainer.setAttribute('aria-busy','false');viewerStatus.textContent='3D ready. Drag to rotate. Arrow keys to turn. Home or R resets the view.';
      };
      Promise.allSettled(viewerContainer.getAnimations().map(animation=>animation.finished)).then(reveal);
    }catch(error){
      if(signal.aborted||owner.signal.aborted||current!==attempt)return;stage.dataset.viewer='error';viewerContainer.setAttribute('aria-busy','false');retry.hidden=false;
      if(import.meta.env.DEV)stage.dataset.viewerError=error.message;
      viewerStatus.textContent='3D unavailable. Static preview is shown.';
      root.querySelectorAll('.product-thumbnail').forEach(button=>{button.disabled=true;button.title='3D preview unavailable';});
    }
  }
  warmProductPreview(product);
  // Start the selected download even on touch; never prefetch all ten GLBs.
  prefetchModelBytes(modelURL);
  startViewer();
  return () => {viewerOwner?.abort();viewer?.dispose();};
}
