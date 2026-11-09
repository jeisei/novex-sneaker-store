import { searchProducts } from '../data/product-search.js';
import { shopPreviews } from '../data/shop-previews.js';
import { escapeHTML, formatMoney } from '../utils/format.js';
import './product-search.css';

const closeIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';

export function installProductSearch(shell) {
  const trigger = shell.querySelector('[data-search-open]');
  const dialog = document.createElement('dialog');
  dialog.id = 'product-search';
  dialog.className = 'product-search';
  dialog.setAttribute('aria-labelledby', 'search-title');
  dialog.innerHTML = `<div class="search-panel">
    <div class="search-heading"><h2 id="search-title">Find your pair</h2><button class="search-icon" data-search-close type="button" aria-label="Close search">${closeIcon}</button></div>
    <form class="search-form" role="search">
      <label for="search-query">Search by product name</label>
      <div class="search-field"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="search-query" type="search" placeholder="Try Salomon or New Balance" autocomplete="off" enterkeyhint="search" autofocus aria-controls="search-results"><button class="search-icon" data-search-clear type="button" aria-label="Clear search" hidden>${closeIcon}</button></div>
    </form>
    <p class="search-status" role="status" aria-live="polite" aria-atomic="true"></p>
    <ul class="search-results" id="search-results" aria-label="Products"></ul>
    <p class="search-empty" hidden>No pairs found. Try another name or fewer letters.</p>
  </div>`;
  shell.append(dialog);
  const input = dialog.querySelector('input'), results = dialog.querySelector('.search-results');
  const clear = dialog.querySelector('[data-search-clear]'), status = dialog.querySelector('.search-status');
  let animation, closing = false, announcement, scrollStyle;
  const duration = () => matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 180;

  function render() {
    const matches = searchProducts(input.value);
    clear.hidden = !input.value;
    results.innerHTML = matches.map(product => `<li><a class="search-result" href="#/product/${product.id}"><img src="${import.meta.env.BASE_URL + shopPreviews[product.id].image}" width="96" height="64" alt="" loading="lazy"><span class="search-result-name">${escapeHTML(product.name)}</span>${product.offer ? `<span class="search-result-price">${formatMoney(product.offer.priceCents, product.offer.currency)}</span>` : ''}</a></li>`).join('');
    dialog.querySelector('.search-empty').hidden = matches.length > 0;
    results.scrollTop = 0;
    const message = input.value.trim() ? `${matches.length} ${matches.length === 1 ? 'pair' : 'pairs'} found` : 'Explore all pairs';
    // Filtering is immediate; only screen-reader announcements wait for typing.
    clearTimeout(announcement);
    announcement = setTimeout(() => { status.textContent = message; }, 180);
  }
  function finishClose() {
    animation?.cancel(); animation = undefined; closing = false;
    clearTimeout(announcement);
    dialog.close();
    if (scrollStyle) {
      const root = document.documentElement;
      root.style.overflow = scrollStyle.overflow;
      root.style.scrollbarGutter = scrollStyle.scrollbarGutter;
      scrollStyle = undefined;
    }
  }
  function close(immediate = false) {
    if (!dialog.open) return;
    if (immediate) { finishClose(); return; }
    if (closing) return;
    closing = true;
    animation?.cancel();
    animation = dialog.querySelector('.search-panel').animate([{ opacity:1, transform:'translateY(0)' }, { opacity:0, transform:'translateY(-6px)' }], { duration:duration(), easing:'ease-out', fill:'forwards' });
    animation.onfinish = finishClose;
  }
  trigger.addEventListener('click', () => {
    if (closing) finishClose();
    if (dialog.open) return;
    input.value = ''; status.textContent = 'Explore all pairs'; render();
    const root = document.documentElement;
    scrollStyle = { overflow:root.style.overflow, scrollbarGutter:root.style.scrollbarGutter };
    // Keep an existing scrollbar's space, so opening the panel never shifts SHOP.
    if (innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    dialog.showModal();
    input.focus({ preventScroll:true });
    animation = dialog.querySelector('.search-panel').animate([{ opacity:0, transform:'translateY(-8px)' }, { opacity:1, transform:'translateY(0)' }], { duration:duration(), easing:'ease-out' });
  });
  input.addEventListener('input', render);
  clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  dialog.querySelector('[data-search-close]').addEventListener('click', () => close());
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  let backdropDown = false;
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog; });
  dialog.addEventListener('click', event => { if (event.target === dialog && backdropDown) close(); });
  results.addEventListener('click', event => { if (event.target.closest('a')) close(true); });
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault(); results.querySelector('a')?.click();
  });
  dialog.addEventListener('keydown', event => {
    // Search inputs otherwise consume the first Escape to clear their value.
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (!['ArrowDown','ArrowUp'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const links = [...results.querySelectorAll('a')], index = links.indexOf(document.activeElement);
    if (!links.length || (document.activeElement !== input && index < 0)) return;
    event.preventDefault();
    if (event.key === 'ArrowUp' && index <= 0) input.focus();
    else links[Math.min(links.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))].focus();
  });
  return { close: () => close(true) };
}
