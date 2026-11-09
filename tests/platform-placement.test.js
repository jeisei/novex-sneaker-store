import test from 'node:test';
import assert from 'node:assert/strict';
import { platformPlacement } from '../src/components/product-platform.js';

test('padded platform canvas maps the shoe crop back onto its original image box',()=>{
  const alpha=[100,151,1511,897];
  const platform={canvas:[1800,1200],shoeCrop:[200,251,1611,997]};
  const p=platformPlacement(platform,alpha);
  const shoeWidth=259.375,shoeHeight=shoeWidth*746/1411;
  const layerWidth=shoeWidth*p.width/100;
  const layerHeight=layerWidth*1200/1800;
  const left=shoeWidth*p.left/100;
  const bottom=shoeHeight*p.bottom/100;
  assert.ok(Math.abs(left+200*layerWidth/1800)<1e-9);
  assert.ok(Math.abs(bottom+(1200-997)*layerHeight/1200)<1e-9);
  assert.ok(Math.abs((1611-200)*layerWidth/1800-shoeWidth)<1e-9);
});

test('wrong scale or clipped platform metadata is rejected before it can distort the shoe',()=>{
  assert.throws(()=>platformPlacement({canvas:[1800,1200],shoeCrop:[200,251,1610,997]},[100,151,1511,897]),/preserve/);
  assert.throws(()=>platformPlacement({canvas:[1800,1200],shoeCrop:[-1,0,1410,746]},[100,151,1511,897]),/Invalid/);
});
