import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from '../src/app/router.js';
import { createLifecycle } from '../src/app/lifecycle.js';

test('routes include deep links and safe unknown ID fallback', () => {
  assert.deepEqual(resolveRoute(''), { page: 'home' });
  assert.deepEqual(resolveRoute('#/shop'), { page: 'shop' });
  assert.deepEqual(resolveRoute('#/cart'), { page: 'cart' });
  assert.deepEqual(resolveRoute('#/product/vx-007'), { page: 'product', id: 'vx-007' });
  assert.equal(resolveRoute('#/product/vx-999').redirect, '#/shop');
  assert.equal(resolveRoute('#/unknown').redirect, '#/shop');
});

test('late async mount cleans up after a newer route and aborts its signal', async () => {
  const lifecycle = createLifecycle();
  let finish;
  let firstSignal;
  let disposed = 0;
  const first = lifecycle.mount((signal) => {
    firstSignal = signal;
    return new Promise((resolve) => { finish = resolve; });
  }, assert.fail);
  await lifecycle.mount(async () => () => { disposed += 1; }, assert.fail);
  assert.equal(firstSignal.aborted, true);
  finish(() => { disposed += 1; });
  await first;
  assert.equal(disposed, 1);
  lifecycle.dispose();
  assert.equal(disposed, 2);
  lifecycle.dispose();
  assert.equal(disposed, 2);
});
