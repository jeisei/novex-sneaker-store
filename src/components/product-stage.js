import { litePreviews } from '../data/lite-previews.js';
import { escapeHTML } from '../utils/format.js';
import { homeScene } from '../data/home-scene.js';
import { productPreviews } from '../data/product-previews.js';

export function productStageMarkup(product) {
  const combined = product.id === homeScene.productId;
  const frame=productPreviews[product.id].frames.initial;
  const mobile=productPreviews[product.id].frames.mobile;
  return `<div class="product-stage" data-combined="${combined}" data-view="side" role="img" aria-label="${escapeHTML(product.name)} — static sneaker and shelf preview">
    <div class="product-stage-surface">
      <img class="product-initial-lite" src="${import.meta.env.BASE_URL+litePreviews[product.id].image}" width="384" height="256" alt="" decoding="async" fetchpriority="high" draggable="false">
      <picture><source media="(max-width:600px)" srcset="${import.meta.env.BASE_URL+mobile.image}"><img class="product-initial-frame" src="${import.meta.env.BASE_URL+frame.image}" width="${frame.width}" height="${frame.height}" alt="" decoding="async" fetchpriority="high" draggable="false"></picture>
    </div>
    <div class="product-stage-viewer" aria-busy="true"></div>
    <p class="product-viewer-status sr-only" role="status">Loading 3D preview</p>
    <button class="product-viewer-retry" type="button" hidden>Retry 3D</button>
    <p class="product-stage-error" role="status" hidden>Preview unavailable. Please reload or return to Shop.</p>
  </div>`;
}
