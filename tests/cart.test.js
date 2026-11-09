import test from 'node:test';
import assert from 'node:assert/strict';
import { CART_STORAGE_KEY, createCartStore, cartTotalCents, MAX_QUANTITY } from '../src/data/cart.js';
import { formatMoney } from '../src/utils/format.js';

function fixture(initial) {
  const values = new Map([['unrelated-user-data', 'retain']]);
  if (initial !== undefined) values.set(CART_STORAGE_KEY, initial);
  let changes = 0;
  const storage = { getItem:key => values.get(key) ?? null, setItem:(key,value) => values.set(key,value) };
  return { values, storage, store:createCartStore(() => storage, () => changes++), changes:() => changes };
}

test('cart merges identical product/size, separates sizes, and persists integer-cent totals', () => {
  const { store, storage, values, changes } = fixture();
  assert.deepEqual(store.read(), []);
  assert.equal(values.has(CART_STORAGE_KEY), false, 'reading does not write an empty cart');
  store.add('vx-005', '9', 2);
  store.add('vx-005', '9', 1);
  store.add('vx-005', '8.5', 1);
  const reloaded = createCartStore(() => storage).read();
  assert.deepEqual(reloaded.map(line => [line.productId,line.size,line.quantity,line.unitPriceCents,line.currency]), [
    ['vx-005','9',3,22000,'USD'], ['vx-005','8.5',1,22000,'USD'],
  ]);
  assert.equal(cartTotalCents(reloaded), 88000);
  assert.equal(formatMoney(cartTotalCents(reloaded)), '$880');
  assert.equal(changes(), 3);
  assert.equal(values.get('unrelated-user-data'), 'retain');
});

test('unknown products, unapproved sizes and invalid quantities never write storage', () => {
  const { store, values, changes } = fixture();
  for (const args of [['vx-999','9',1],['vx-005','12',1],['vx-005',9,1],
    ...[0,-1,.5,NaN,Infinity,MAX_QUANTITY+1].map(quantity => ['vx-005','9',quantity])]) {
    assert.throws(() => store.add(...args));
  }
  assert.equal(values.has(CART_STORAGE_KEY), false);
  assert.equal(changes(), 0);
});

test('a merged quantity limit failure preserves the previously saved cart', () => {
  const { store, values } = fixture();
  store.add('vx-005','9',MAX_QUANTITY);
  const before = values.get(CART_STORAGE_KEY);
  assert.throws(() => store.add('vx-005','9',1), /Quantity/);
  assert.equal(values.get(CART_STORAGE_KEY), before);
});

test('quantity changes and removal affect only the selected line and preserve unrelated keys', () => {
  const { store, values } = fixture();
  store.add('vx-005','9',1);
  store.add('vx-005','10',1);
  store.setQuantity('vx-005','9',4);
  assert.equal(cartTotalCents(store.read()), 110000);
  store.remove('vx-005','9');
  assert.deepEqual(store.read().map(line => line.size), ['10']);
  store.remove('vx-005','10');
  assert.deepEqual(store.read(), []);
  assert.equal(values.get('unrelated-user-data'), 'retain');
  assert.throws(() => store.setQuantity('vx-005','9',1), /not found/);
});

test('invalid saved data and unknown schema versions are preserved without silent reset', () => {
  const line = { productId:'vx-005', size:'9', quantity:1, unitPriceCents:19000, currency:'USD' };
  for (const raw of ['broken JSON','null',JSON.stringify({version:2,items:[]}),
    JSON.stringify({version:1,items:[line,line]}),
    JSON.stringify({version:1,items:[{...line,size:'12'}]}),
    JSON.stringify({version:1,items:[{...line,currency:'EUR'}]})]) {
    const { store, values, changes } = fixture(raw);
    assert.throws(() => store.read(), /preserved/);
    assert.throws(() => store.add('vx-005','9',1), /preserved/);
    assert.equal(values.get(CART_STORAGE_KEY), raw);
    assert.equal(changes(), 0);
  }
});

test('saved price is revalidated against the current catalog without writing on read', () => {
  const raw = JSON.stringify({version:1,items:[{productId:'vx-005',size:'9',quantity:2,unitPriceCents:1,currency:'USD'}]});
  const { store, values } = fixture(raw);
  assert.equal(cartTotalCents(store.read()), 44000);
  assert.equal(values.get(CART_STORAGE_KEY), raw);
});

test('unavailable or full storage reports failure without emitting a saved-cart notification', () => {
  const { storage, values } = fixture();
  let changes = 0;
  const store = createCartStore(() => ({...storage,setItem:() => { throw new Error('quota'); }}), () => changes++);
  assert.throws(() => store.add('vx-005','9',1), /could not be saved/);
  assert.equal(changes, 0);
  assert.equal(values.has(CART_STORAGE_KEY), false);
  assert.throws(() => createCartStore(() => { throw new Error('denied'); }).read(), /unavailable/);
  assert.throws(() => createCartStore(() => ({getItem:() => { throw new Error('denied'); }})).read(), /unavailable/);
});

test('money totals reject fractional, negative and unsafe amounts', () => {
  for (const [unitPriceCents,quantity] of [[.1,1],[-1,1],[19000,0],[19000,1.5],[Number.MAX_SAFE_INTEGER,2]]) {
    assert.throws(() => cartTotalCents([{unitPriceCents,quantity}]));
  }
  assert.equal(formatMoney(19001), '$190.01');
});
