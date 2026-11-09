import test from 'node:test';
import assert from 'node:assert/strict';
import { assets } from '../src/data/asset-manifest.js';
import { shopPlate } from '../src/data/shop-shelves.js';

test('all SHOP shelves use the same silver render without changing individual horizontal placement', () => {
  for (const state of ['rest','hover','ground']) {
    const approved=assets[0].shopExhibit.layers[`plate-${state}`];
    for (const asset of assets) {
      const original=asset.shopExhibit.layers[`plate-${state}`], snapshot=JSON.stringify(original);
      const actual=shopPlate(asset.shopExhibit,state);
      assert.equal(actual.image,approved.image);
      assert.equal(actual.sha256,approved.sha256);
      assert.deepEqual(actual.canvas,approved.canvas);
      assert.equal(actual.frame.width,original.frame.width);
      assert.equal(actual.frame.left,original.frame.left);
      assert.equal(JSON.stringify(original),snapshot);
    }
  }
});
