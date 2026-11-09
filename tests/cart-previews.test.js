import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/data/products.js';
import { cartPreview } from '../src/data/cart-previews.js';
import { transitionPreviews } from '../src/data/transition-previews.js';
import { productPreviews } from '../src/data/product-previews.js';

test('cart framing preserves all ten shoe silhouettes at a consistent visible scale', () => {
  const scales = products.map(product => {
    const preview = cartPreview(product.id), source = productPreviews[product.id].frames.mobile;
    assert.equal(preview.image, source.image);
    assert.equal(preview.sha256, source.sha256);
    const [left,top,right,bottom] = preview.crop;
    assert.ok(left>=0 && top>=0 && right<=source.width && bottom<=source.height);
    const shoe = transitionPreviews[product.id], sx=source.width/shoe.canvas[0], sy=source.height/shoe.canvas[1];
    const [x1,y1,x2,y2] = shoe.bounds;
    assert.ok(x1*sx>=left && y1*sy>=top && x2*sx<=right && y2*sy<=bottom, product.id+' shoe is fully visible');
    return (x2-x1)*sx/(right-left);
  });
  assert.ok(Math.min(...scales)>.69);
  assert.ok(Math.max(...scales)-Math.min(...scales)<.08);
});
