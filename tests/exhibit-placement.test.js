import test from 'node:test';
import assert from 'node:assert/strict';
import { exhibitPlacement, exhibitShoeMarkup, exhibitLayersMarkup } from '../src/components/product-exhibit.js';

function fixture() {
  const layers = {};
  for (const state of ['rest', 'hover', 'ground']) {
    layers[`shoe-${state}`] = { image: `shoe-${state}.webp`, canvas: [560, 320] };
    for (const kind of ['plate', 'shadow']) layers[`${kind}-${state}`] = {
      image: `${kind}-${state}.webp`, canvas: [640, 160], frame: { width: 111.111111, left: -5, anchor: 25 },
    };
  }
  for (const state of ['hover', 'ground']) layers[`glow-${state}`] = {
    image: `glow-${state}.webp`, canvas: [320, 100], frame: { width: 111, left: -5, anchor: 80 },
  };
  return { shoe: { canvas: [560, 320], bounds: [20, 20, 540, 300], width: 90, left: 5, anchor: -10 }, layers };
}

test('shoe contact anchor scales with the card while texture padding stays outside its visible box', () => {
  const e = fixture();
  const p = exhibitPlacement(e);
  for (const cardWidth of [288, 205, 130]) {
    const visibleWidth = cardWidth * p.shoeWidth / 100;
    const visibleHeight = visibleWidth * p.height / p.width;
    const textureWidth = visibleWidth * p.canvasWidth / p.width;
    const textureOffset = -p.left * textureWidth / p.canvasWidth;
    assert.ok(Math.abs(textureOffset + 20 * textureWidth / 560) < 1e-9);
    assert.ok(Math.abs(visibleHeight * p.shoeAnchor / 100 / cardWidth - (-.1 * .9 * 280 / 520)) < 1e-9);
  }
});

test('missing grounded light states or inconsistent shoe canvases cannot enter the gallery', () => {
  const e = fixture();
  delete e.layers['shoe-ground'];
  assert.throws(() => exhibitPlacement(e), /ground/);
  const mismatch = fixture();
  mismatch.layers['shoe-hover'].canvas = [600, 320];
  assert.throws(() => exhibitPlacement(mismatch), /share one canvas/);
  const badBounds = fixture();
  badBounds.shoe.bounds = [20, 20, 580, 300];
  assert.throws(() => exhibitPlacement(badBounds), /placement/);
});

test('layer markup keeps shoe separate from the stationary platform and includes grounded reduced-motion assets', () => {
  const shoe = exhibitShoeMarkup(fixture(), '/preview/');
  const layers = exhibitLayersMarkup(fixture(), '/preview/');
  assert.match(shoe, /class="product-image exhibit-shoe"/);
  assert.match(shoe, /src="\/preview\/shoe-ground.webp"/);
  assert.doesNotMatch(shoe, /plate-|shadow-|glow-/);
  assert.match(layers, /aria-hidden="true"/);
  assert.match(layers, /glow-ground.webp/);
  assert.match(layers, /shadow-hover.webp/);
  assert.doesNotMatch(layers, /shoe-rest.webp/);
});
