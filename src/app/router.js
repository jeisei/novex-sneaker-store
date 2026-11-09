import { getProduct } from '../data/products.js';

export function resolveRoute(hash) {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/') return { page: 'home' };
  if (path === '/shop') return { page: 'shop' };
  if (path === '/cart') return { page: 'cart' };
  const match = /^\/product\/(vx-\d{3})$/.exec(path);
  if (match && getProduct(match[1])) return { page: 'product', id: match[1] };
  return { page: 'shop', error: 'Неизвестный адрес или товар.', redirect: '#/shop' };
}

export function startRouter(onRoute) {
  function update() {
    const route = resolveRoute(location.hash);
    if (route.redirect) history.replaceState(null, '', route.redirect);
    onRoute(route);
  }
  window.addEventListener('hashchange', update);
  update();
  return () => window.removeEventListener('hashchange', update);
}
