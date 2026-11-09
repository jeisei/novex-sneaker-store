import { productScene } from '../data/product-scene.js';
import { productPreviews } from '../data/product-previews.js';

// Only supported views are operable; future renderers receive the same view key.
export function productGalleryMarkup(product) {
  return `<aside class="product-gallery" aria-label="Product views">
    <ol class="product-gallery-list">
      ${productScene.views.map(view => `<li><button type="button" class="product-thumbnail" data-view="${view.id}" ${view.id==='side'?'data-active="true"':''} disabled aria-pressed="${view.id==='side'}" aria-label="${view.label} — preparing 3D">
        <img src="${import.meta.env.BASE_URL+productPreviews[product.id].frames[view.id].image}" width="192" height="128" alt="" draggable="false">
      </button></li>`).join('')}
    </ol>
  </aside>`;
}
