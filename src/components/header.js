const searchIcon = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="13.5" cy="13.5" r="9"/><path d="m20 20 8 8"/></svg>';
const cartIcon = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M7 9h18l2 20H5L7 9Z" stroke-linejoin="round"/><path d="M11 12V7a5 5 0 0 1 10 0v5" stroke-linecap="round"/></svg>';
const monogram = '<svg class="site-monogram" viewBox="0 0 46 34" fill="none" aria-hidden="true"><path d="m3 30 8-16M16 4l13 26L43 4" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="miter"/></svg>';

import { cart } from '../data/cart.js';

function cartState() {
  try {
    const count = cart.read().reduce((sum, item) => sum + item.quantity, 0);
    return { count, label:count ? `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}` : 'Shopping bag, empty' };
  } catch { return { count:0, label:'Shopping bag — saved cart unavailable' }; }
}

export function refreshCartIndicator(root = document) {
  const state = cartState();
  const link = root.querySelector('[data-cart-link]');
  if (!link) return;
  link.setAttribute('aria-label', state.label);
  const badge = link.querySelector('.cart-count');
  badge.textContent = state.count > 99 ? '99+' : String(state.count);
  badge.hidden = !state.count;
}

export function headerMarkup(active = 'home') {
  const state = cartState();
  return `<header class="site-header">
    <a class="site-logo" href="#/" aria-label="NOVEX Home">${monogram}<span>NOVEX</span></a>
    <nav class="site-nav" aria-label="Main navigation">
      <a href="#/" ${active === 'home' ? 'aria-current="page"' : ''}>Home</a>
      <a href="#/shop" ${active === 'shop' ? 'aria-current="page"' : ''}>Shop</a>
    </nav>
    <div class="site-tools"><button class="icon-button" data-search-open type="button" aria-label="Search products" aria-haspopup="dialog" aria-controls="product-search">${searchIcon}</button>
      <a class="icon-button" data-cart-link href="#/cart" aria-label="${state.label}">${cartIcon}<span class="cart-count" ${state.count ? '' : 'hidden'} aria-hidden="true">${state.count > 99 ? '99+' : state.count}</span></a>
    </div>
  </header>`;
}
