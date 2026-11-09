import { productPlatformMarkup } from './product-platform.js';
import { exhibitShoeMarkup, exhibitLayersMarkup, exhibitPlacement } from './product-exhibit.js';
import { transitionPreviews } from '../data/transition-previews.js';
import { shopPreviews } from '../data/shop-previews.js';

// Keep the exact original frame proportions/baseline; only the downloaded file is smaller.
const shopPreview = id => ({ ...transitionPreviews[id], image: shopPreviews[id].image });

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function productImageMarkup(product, { shop = false, legacy = false } = {}) {
  if (shop && !legacy && product.asset.shopExhibit) return exhibitShoeMarkup(product.asset.shopExhibit, import.meta.env.BASE_URL, shopPreview(product.id));
  const [left, top, right, bottom] = product.asset.alphaBounds;
  const width = right - left;
  const height = bottom - top;
  const url = import.meta.env.BASE_URL + (shop ? product.asset.shopRender?.image ?? product.asset.image : product.asset.image);
  return `<span class="product-image" style="aspect-ratio:${width}/${height}">
    <img src="${url}" width="1600" height="1000" alt="" draggable="false" decoding="async"
      style="width:${160000 / width}%;left:${-left * 100 / width}%;top:${-top * 100 / height}%">
  </span>`;
}

export function productCardMarkup(product, { legacy = false } = {}) {
  if (!legacy && product.asset.shopExhibit) {
    try {
      exhibitPlacement(product.asset.shopExhibit);
      return `<li class="product-card" data-product-id="${product.id}" data-exhibit="true">
        <a class="product-card-link" href="#/product/${product.id}" aria-label="View ${escapeHTML(product.name)}">
          ${exhibitShoeMarkup(product.asset.shopExhibit, import.meta.env.BASE_URL, shopPreview(product.id))}
          <span class="product-image-error" role="status" hidden>Image unavailable</span>
          ${exhibitLayersMarkup(product.asset.shopExhibit)}
        </a>
      </li>`;
    } catch {
      // Invalid derivative metadata must not remove the existing product or its link.
      legacy = true;
    }
  }
  const [left, top, right, bottom] = product.asset.alphaBounds;
  const shadow = `<svg class="product-contact-shape" viewBox="${left} ${top} ${right - left} ${bottom - top}" preserveAspectRatio="none" aria-hidden="true"><image href="${import.meta.env.BASE_URL + (product.asset.shopRender?.image ?? product.asset.image)}" width="1600" height="1000" /></svg>`;
  return `<li class="product-card" data-product-id="${product.id}"${product.asset.platformLayer ? ' data-platform="true"' : ''}>
    <a class="product-card-link" href="#/product/${product.id}" aria-label="View ${escapeHTML(product.name)}">
      ${productImageMarkup(product, { shop: true, legacy })}
      <span class="product-image-error" role="status" hidden>Image unavailable</span>
      <span class="product-shelf" aria-hidden="true"><span class="product-shelf-surface"></span><span class="product-shelf-light"><svg viewBox="0 0 320 20" preserveAspectRatio="none"><defs><linearGradient id="shelf-face-${product.id}" x1="0" y1="0" x2="0" y2="1"><stop class="product-shelf-hot"/><stop class="product-shelf-warm" offset=".45"/><stop class="product-shelf-orange" offset="1"/></linearGradient></defs><path class="product-shelf-wash" d="M0 10 10 1H320L310 10Z"/><path class="product-shelf-face" d="M0 10H310V18H0Z" fill="url(#shelf-face-${product.id})"/><path class="product-shelf-side" d="m310 10 10-9v8l-10 9Z"/><path class="product-shelf-edge" d="M0 10H310L320 1"/></svg></span></span>
      <span class="product-contact-shadow" aria-hidden="true">${shadow}</span>
      ${productPlatformMarkup(product)}
    </a>
  </li>`;
}
