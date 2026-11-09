import { headerMarkup } from '../components/header.js';
import { shopContactsMarkup } from '../components/shop-contacts.js';
import { cart, cartTotalCents, CART_STORAGE_KEY, MAX_QUANTITY } from '../data/cart.js';
import { getProduct } from '../data/products.js';
import { cartPreview } from '../data/cart-previews.js';
import { escapeHTML, formatMoney } from '../utils/format.js';
import '../styles/cart.css';

export function mountCart(app, signal, { chrome=true }={}) {
  app.innerHTML = `<section class="cart-page">${chrome ? '<div class="site-wall" aria-hidden="true"></div>' + headerMarkup('cart') : ''}
    <div class="cart-content" aria-labelledby="cart-title"><div class="cart-body"></div>
    <p class="cart-status sr-only" role="status" aria-live="polite" aria-atomic="true"></p><p class="cart-error" role="alert" hidden></p></div>${chrome ? shopContactsMarkup() : ''}</section>`;
  const root = app.querySelector('.cart-page');
  const body = root.querySelector('.cart-body');
  const status = root.querySelector('.cart-status');
  const errorMessage = root.querySelector('.cart-error');
  function render() {
    let items = [], error;
    try { items = cart.read(); } catch (failure) { error = failure.message; }
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const html = `<h1 id="cart-title" tabindex="-1">Your Cart${error ? '' : ` <span>(${count})</span>`}</h1>${error
      ? `<div class="cart-empty"><h2>Saved cart unavailable</h2><p>${escapeHTML(error)}</p><a class="cart-cta" href="#/shop">Explore Collection <span aria-hidden="true">→</span></a></div>`
      : !items.length ? `<div class="cart-empty"><h2>Your cart is empty</h2><p>Find your next pair in the collection.</p><a class="cart-cta" href="#/shop">Explore Collection <span aria-hidden="true">→</span></a></div>`
      : `<div class="cart-layout"><ul class="cart-items">${items.map((item, index) => {
        const product = getProduct(item.productId);
        const name = product.name;
        const label = escapeHTML(`${name}, size ${item.size}`);
        const preview = cartPreview(item.productId);
        const [left,top,right,bottom] = preview.crop, width = right-left, height = bottom-top;
        return `<li class="cart-item" data-product-id="${item.productId}" data-size="${item.size}">
          <a class="cart-image" href="#/product/${item.productId}" aria-label="View ${label}"><span class="cart-preview" style="aspect-ratio:${width}/${height}"><img src="${import.meta.env.BASE_URL + preview.image}" alt="${label} on display shelf" width="${preview.width}" height="${preview.height}" style="width:${preview.width/width*100}%;height:${preview.height/height*100}%;left:${-left/width*100}%;top:${-top/height*100}%" ${index > 2 ? 'loading="lazy"' : ''}></span></a>
          <div class="cart-details"><a href="#/product/${item.productId}"><h2>${escapeHTML(name)}</h2></a>
          ${product.offer.details.color ? `<p>${escapeHTML(product.offer.details.color)}</p>` : ''}<p>Size: ${escapeHTML(item.size)}</p></div>
          <div class="cart-quantity" role="group" aria-label="Quantity for ${label}"><button type="button" data-cart-action="decrease" ${item.quantity === 1 ? 'disabled' : ''} aria-label="Decrease quantity for ${label}">−</button><span aria-label="Quantity">${item.quantity}</span><button type="button" data-cart-action="increase" ${item.quantity === MAX_QUANTITY ? 'disabled' : ''} aria-label="Increase quantity for ${label}">+</button></div>
          <span class="cart-line-total">${formatMoney(item.unitPriceCents * item.quantity, item.currency)}</span>
          <button type="button" class="cart-remove" data-cart-action="remove" aria-label="Remove ${label}"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button></li>`;
      }).join('')}</ul><aside class="cart-summary" aria-labelledby="cart-summary-title"><h2 id="cart-summary-title">Order Summary</h2><dl><div><dt>Subtotal</dt><dd>${formatMoney(cartTotalCents(items))}</dd></div><div><dt>Shipping</dt><dd>Calculated at checkout</dd></div><div class="cart-total"><dt>Total</dt><dd>${formatMoney(cartTotalCents(items))}</dd></div></dl><p class="cart-shipping-note">Shipping is not included in this total. Demo store prices.</p><button type="button" class="cart-cta" data-checkout>Proceed to Checkout <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12h17m-6-6 6 6-6 6"/></svg></button><p class="cart-checkout-status" role="status" aria-live="polite"></p></aside></div>`}`;
    const commit=()=>{
      const template=document.createElement('template');template.innerHTML=html;
      const next=template.content;
      const list=body.querySelector('.cart-items'),nextList=next.querySelector('.cart-items');
      if(!list||!nextList){body.replaceChildren(next);return;}
      const key=row=>row.dataset.productId+':'+row.dataset.size;
      const existing=new Map([...list.children].map(row=>[key(row),row]));
      for(const incoming of [...nextList.children]){
        const row=existing.get(key(incoming));
        if(!row){list.append(incoming);continue;}
        existing.delete(key(row));
        row.querySelector('.cart-quantity span').textContent=incoming.querySelector('.cart-quantity span').textContent;
        row.querySelector('.cart-line-total').textContent=incoming.querySelector('.cart-line-total').textContent;
        for(const action of ['increase','decrease'])row.querySelector(`[data-cart-action="${action}"]`).disabled=incoming.querySelector(`[data-cart-action="${action}"]`).disabled;
      }
      existing.forEach(row=>row.remove());
      body.querySelector('h1 span').textContent=next.querySelector('h1 span').textContent;
      const sums=body.querySelectorAll('.cart-summary dd'),nextSums=next.querySelectorAll('.cart-summary dd');
      sums.forEach((sum,i)=>sum.textContent=nextSums[i].textContent);
    };
    commit();
  }
  render();
  if(chrome)body.querySelector('h1').focus({ preventScroll:true });
  root.addEventListener('click', event => {
    if (event.target.closest('[data-checkout]')) {
      root.querySelector('.cart-checkout-status').textContent = 'Checkout coming soon';
      return;
    }
    const button = event.target.closest('[data-cart-action]');
    if (!button || button.disabled) return;
    const row = button.closest('.cart-item');
    const rowIndex = [...root.querySelectorAll('.cart-item')].indexOf(row);
    const { productId, size } = row.dataset;
    const action = button.dataset.cartAction;
    try {
      if (action === 'remove') cart.remove(productId, size);
      else {
        const item = cart.read().find(line => line.productId === productId && line.size === size);
        if (!item) throw new Error('Cart item was not found. Please reload.');
        cart.setQuantity(productId, size, item.quantity + (action === 'increase' ? 1 : -1));
      }
      errorMessage.hidden = true;
      errorMessage.textContent = '';
      render();
      const rows = [...root.querySelectorAll('.cart-item')];
      const matchingRow = rows.find(item => item.dataset.productId === productId && item.dataset.size === size);
      const target = matchingRow?.querySelector(`[data-cart-action="${action}"]:not(:disabled)`)
        ?? matchingRow?.querySelector('[data-cart-action]:not(:disabled)')
        ?? rows[Math.min(rowIndex, rows.length - 1)]?.querySelector('.cart-remove') ?? body.querySelector('h1');
      target.focus({ preventScroll:true });
      status.textContent = action === 'remove' ? `Removed ${getProduct(productId).name}, size ${size}.` : `Updated ${getProduct(productId).name}, size ${size}.`;
    } catch (error) { errorMessage.textContent = error.message; errorMessage.hidden = false; }
  }, { signal });
  window.addEventListener('storage', event => {
    if (event.key === CART_STORAGE_KEY || event.key === null) {
      render();
      status.textContent = 'Cart updated from another tab.';
    }
  }, { signal });
}
