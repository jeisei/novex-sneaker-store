import { headerMarkup } from '../components/header.js';
import { productCardMarkup } from '../components/product-card.js';
import { shopContactsMarkup } from '../components/shop-contacts.js';
import { products, getProduct } from '../data/products.js';
import { installProductIntent } from '../app/product-intent.js';
import '../styles/shop.css';

export function mountShop(app, signal, { openProduct, focusId, chrome=true } = {}) {
  app.innerHTML = `<section class="shop" aria-labelledby="shop-title">
    ${chrome ? headerMarkup('shop') : ''}
    ${chrome ? '<div class="shop-wall" aria-hidden="true"></div>' : ''}
    <div class="shop-heading">
      <h1 id="shop-title" tabindex="-1">A different perspective.</h1>
    </div>
    <ul class="shop-grid" aria-label="Sneaker collection">${products.map(productCardMarkup).join('')}</ul>
    ${chrome ? shopContactsMarkup() : ''}
  </section>`;
  const root = app.querySelector('.shop');
  installProductIntent(root,signal,getProduct);
  root.addEventListener('click', (event) => {
    const link = event.target.closest('.product-card-link');
    if (!link || !openProduct || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const product = getProduct(link.closest('.product-card').dataset.productId);
    openProduct(product);
  }, { signal });
  const failedExhibits = new Set();
  const images = [...root.querySelectorAll('.product-image img, .product-platform img, .product-platform-wash img, .product-exhibit img')];
  Promise.all(images.map(async (image) => {
    try {
      await image.decode();
    } catch {
      if (!signal.aborted) {
        const card = image.closest('.product-card[data-exhibit]');
        if (card) {
          const id = card.dataset.productId;
          if (!failedExhibits.has(id) && card.isConnected) {
            failedExhibits.add(id);
            const focused = card.contains(document.activeElement);
            const template = document.createElement('template');
            template.innerHTML = productCardMarkup(getProduct(id), { legacy: true });
            const replacement = template.content.firstElementChild;
            replacement.dataset.exhibitFallback = 'true';
            card.replaceWith(replacement);
            if (focused) replacement.querySelector('.product-card-link').focus({ preventScroll: true });
          }
          return;
        }
        if (image.closest('.product-platform, .product-platform-wash')) {
          image.closest('.product-card').dataset.platformError = 'true';
          return;
        }
        image.closest('.product-card').dataset.imageError = 'true';
        image.closest('.product-card-link').querySelector('.product-image-error').hidden = false;
      }
    }
  })).then(() => { if (!signal.aborted) root.dataset.ready = 'true'; });
  const focusTarget = focusId ? root.querySelector(`[data-product-id="${focusId}"] .product-card-link`) : root.querySelector('h1');
  if(chrome)focusTarget?.focus({ preventScroll: true });
}
