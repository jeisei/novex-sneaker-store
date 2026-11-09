import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {productRenderConfig,productFraming} from '../src/data/product-render-config.js';
import {productPreviews,productPreviewRecipeSHA256} from '../src/data/product-previews.js';
import {productPreviewRecipeHash} from '../scripts/product-preview-recipe.mjs';
import {assets} from '../src/data/asset-manifest.js';
test('ten PRODUCT initial frames are tied to original GLB hashes and the shared live configuration',async()=>{
  const configHash=createHash('sha256').update(JSON.stringify(productRenderConfig)).digest('hex');
  assert.equal(Object.keys(productPreviews).length,assets.length);
  assert.equal(productPreviewRecipeSHA256,await productPreviewRecipeHash());
  for(const asset of assets){
    const preview=productPreviews[asset.id];assert.equal(preview.modelSHA256,asset.modelSHA256);assert.equal(preview.configSHA256,configHash);
    assert.equal(preview.frames.initial.width,1536);assert.equal(preview.frames.initial.height,1024);
    for(const key of ['initial','mobile','side','top','rear','sole']){
      const frame=preview.frames[key],data=await readFile(new URL('../public/'+frame.image,import.meta.url));
      assert.equal(createHash('sha256').update(data).digest('hex'),frame.sha256);
    }
  }
});
test('adaptive camera keeps the same pose and horizontal framing when aspect changes',()=>{
  const a=productFraming('vx-005',1,1.5),b=productFraming('vx-005',1,1);
  assert.deepEqual(a.position,b.position);assert.deepEqual(a.target,b.target);assert.equal(a.span,b.span);assert.ok(b.fov>a.fov);
  assert.equal(productFraming('vx-003',1.8).span,productRenderConfig.camera.horizontalSpan*2);
});
