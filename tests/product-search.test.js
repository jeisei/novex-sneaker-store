import test from 'node:test';
import assert from 'node:assert/strict';
import { searchProducts } from '../src/data/product-search.js';
import { products } from '../src/data/products.js';
import { productInfoMarkup } from '../src/components/product-info.js';

test('search finds partial names regardless of case, punctuation or word order', () => {
  for (const query of ['SALOMON', 'xt6', 'XT-6', 'graphite sal', '  salomon   graphite  ']) {
    assert.deepEqual(searchProducts(query).map(p => p.id), ['vx-005']);
  }
  assert.deepEqual(searchProducts('new bal').map(p => p.id), ['vx-004', 'vx-006']);
  assert.deepEqual(searchProducts('nike black').map(p => p.id), ['vx-010']);
  assert.deepEqual(searchProducts('nike').map(p => p.id), ['vx-001', 'vx-010']);
  assert.equal(searchProducts('nonexistent shoe').length, 0);
  assert.equal(searchProducts('<script>').length, 0);
  assert.deepEqual(searchProducts('   '), products);
  assert.deepEqual(searchProducts('vx-005'), []);
});

test('details disappear when only primary information, sizes or a repeated description exist', () => {
  const product = { name:'Test pair', shortDescription:'Short intro', description:' Short intro ', offer:{ priceCents:10000, currency:'USD', sizes:['9'], defaultSize:'9', details:{ material:'Mesh', color:'Black', shipping:'Not configured', brand:' ', weight:'Not provided' } } };
  assert.doesNotMatch(productInfoMarkup(product), /<details|<summary|undefined/);
  assert.doesNotMatch(productInfoMarkup({ name:'No extra information' }), /<details|<summary|undefined/);
  assert.doesNotMatch(productInfoMarkup({ ...product, description:undefined, offer:{ ...product.offer, details:undefined } }), /<details|<summary|undefined/);
});

test('details show only supplied additional content and escape it', () => {
  const base = { name:'Test pair', shortDescription:'Intro' };
  const descriptionOnly = productInfoMarkup({ ...base, description:'Extra <information>' });
  assert.match(descriptionOnly, /<summary>Product Details<\/summary>/);
  assert.match(descriptionOnly, /Extra &lt;information&gt;/);
  assert.doesNotMatch(descriptionOnly, /<dt>Brand|undefined/);
  const partial = productInfoMarkup({ ...base, offer:{ priceCents:10000, currency:'USD', sizes:['9'], details:{ brand:'Test & Brand' } } });
  assert.match(partial, /<dt>Brand<\/dt><dd>Test &amp; Brand<\/dd>/);
  assert.doesNotMatch(partial, /<dt>Weight|<dt>Category|undefined/);
});
