import { getProduct } from './products.js';

export const CART_STORAGE_KEY = 'novex.cart.v1';
// Input safety limit per line, not an inventory or availability statement.
export const MAX_QUANTITY = 999;

function validateSelection(productId, size, quantity) {
  const product = getProduct(productId);
  if (!product?.offer || !product.offer.sizes.includes(size)) throw new Error('Choose an available product and size.');
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  return { productId, size, quantity, unitPriceCents:product.offer.priceCents, currency:product.offer.currency };
}

export function cartTotalCents(items) {
  if (items.some(item => !Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0 || !Number.isSafeInteger(item.quantity) || item.quantity < 1)) throw new Error('Invalid cart amount.');
  const total = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  if (!Number.isSafeInteger(total)) throw new Error('Cart total is too large.');
  return total;
}

export function createCartStore(storageProvider, onChange = () => {}) {
  function storage() {
    try {
      const value = storageProvider();
      if (!value) throw new Error();
      return value;
    } catch { throw new Error('Cart storage is unavailable. Nothing was changed.'); }
  }

  function readFrom(target) {
    let raw;
    try { raw = target.getItem(CART_STORAGE_KEY); }
    catch { throw new Error('Cart storage is unavailable. Nothing was changed.'); }
    if (raw === null) return [];
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.items)) throw new Error();
      const seen = new Set();
      return data.items.map(item => {
        if (!item || !Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0 || item.currency !== 'USD') throw new Error();
        const line = validateSelection(item.productId, item.size, item.quantity);
        const key = `${line.productId}:${line.size}`;
        if (seen.has(key)) throw new Error();
        seen.add(key);
        // Catalog data is authoritative; persisted prices are never trusted.
        return line;
      });
    } catch { throw new Error('Saved cart could not be read. Existing data was preserved.'); }
  }

  function mutate(change) {
    const target = storage();
    const items = change(readFrom(target));
    cartTotalCents(items);
    try { target.setItem(CART_STORAGE_KEY, JSON.stringify({ version:1, items })); }
    catch { throw new Error('Cart could not be saved. Nothing was changed.'); }
    onChange();
    return items;
  }

  return {
    read: () => readFrom(storage()),
    add(productId, size, quantity) {
      const line = validateSelection(productId, size, quantity);
      return mutate(items => {
        const existing = items.find(item => item.productId === productId && item.size === size);
        if (existing) existing.quantity = validateSelection(productId, size, existing.quantity + quantity).quantity;
        else items.push(line);
        return items;
      });
    },
    setQuantity(productId, size, quantity) {
      const line = validateSelection(productId, size, quantity);
      return mutate(items => {
        const index = items.findIndex(item => item.productId === productId && item.size === size);
        if (index === -1) throw new Error('Cart item was not found.');
        items[index] = line;
        return items;
      });
    },
    remove(productId, size) {
      return mutate(items => items.filter(item => item.productId !== productId || item.size !== size));
    },
  };
}

export const cart = createCartStore(() => globalThis.localStorage, () => {
  globalThis.dispatchEvent?.(new Event('novex:cart-change'));
});
