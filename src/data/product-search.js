import { products } from './products.js';

const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Match every word in any order, including partial names and XT-6 / XT6.
export function searchProducts(query, catalog = products) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return catalog;
  return catalog.filter(product => {
    const name = normalize(product.name), compact = name.replaceAll(' ', '');
    return words.every(word => name.includes(word) || compact.includes(word));
  });
}
