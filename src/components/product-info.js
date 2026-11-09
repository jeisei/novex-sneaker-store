import { escapeHTML, formatMoney } from '../utils/format.js';

export function productInfoMarkup(product) {
  const offer = product.offer;
  const title = product.name;
  const description = escapeHTML(product.shortDescription ?? '');
  const detailRows = [['Brand','brand'],['Category','category'],['Style','style'],['Cushioning','cushioning'],['Outsole','outsole'],['Weight','weight'],['Gender','gender']];
  const hasValue = value => typeof value === 'string' && value.trim() && !/^(not provided|not configured|n\/a)$/i.test(value.trim());
  const extraDescription = hasValue(product.description) && product.description.trim() !== (product.shortDescription ?? '').trim() ? product.description.trim() : '';
  const extraRows = detailRows.filter(([, key]) => hasValue(offer?.details?.[key]));
  const moreDetails = extraDescription || extraRows.length ? `<details class="product-more-details"><summary>Product Details</summary>
      ${extraDescription ? `<p>${escapeHTML(extraDescription)}</p>` : ''}
      ${extraRows.length ? `<dl class="product-details">${extraRows.map(([label,key]) => `<div><dt>${label}</dt><dd>${escapeHTML(offer.details[key].trim())}</dd></div>`).join('')}</dl>` : ''}
    </details>` : '';
  return `<section class="product-info" aria-labelledby="product-title">
    <p class="product-eyebrow">DEMO COLLECTION</p>
    <h1 id="product-title" tabindex="-1">${escapeHTML(title)}</h1>
    <p class="product-description">${description}</p>
    <p class="product-price ${offer ? 'product-price-configured' : ''}">${offer ? formatMoney(offer.priceCents, offer.currency) : 'Price unavailable'}</p>
    <div class="product-size-row"><span id="product-size-label">Size</span><div class="product-size-options" role="group" aria-labelledby="product-size-label">${offer ? offer.sizes.map(size => `<label class="product-size-choice"><input class="sr-only" type="radio" name="product-size" value="${size}" aria-label="Size ${size}" ${size === offer.defaultSize ? 'checked' : ''}><span class="product-size-button">${size}</span></label>`).join('') : '<span class="product-size-unavailable">Not provided</span>'}</div></div>
    <div class="product-quantity-row"><span>Quantity</span><div class="product-quantity" role="group" aria-label="Quantity">
      <button type="button" data-quantity-step="-1" disabled aria-label="Decrease quantity">−</button><output class="product-quantity-value" aria-live="polite" aria-label="Quantity">1</output><button type="button" data-quantity-step="1" aria-label="Increase quantity">+</button>
    </div></div>
    <button class="product-add" type="button" ${offer ? '' : 'disabled'} aria-describedby="product-purchase-status"><span>Add to Cart</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>
    <p class="product-purchase-status" id="product-purchase-status" role="status" aria-live="polite" aria-atomic="true">${offer ? '' : 'Purchasing unavailable for this product'}</p>
    <dl class="product-details">
      <div><dt>Material</dt><dd>${escapeHTML(offer?.details?.material ?? 'Not provided')}</dd></div>
      <div><dt>Color</dt><dd>${escapeHTML(offer?.details?.color ?? 'Not provided')}</dd></div>
      <div><dt>Shipping</dt><dd>${escapeHTML(offer?.details?.shipping ?? 'Not configured')}</dd></div>
    </dl>
    ${moreDetails}
    <p class="product-demo-note">Demo store data. Names, prices and specifications are illustrative, not verified manufacturer specifications.</p>
  </section>`;
}
