import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { assets } from '../src/data/asset-manifest.js';
import { productPreviews } from '../src/data/product-previews.js';
import { litePreviews } from '../src/data/lite-previews.js';
import { transitionPreviews } from '../src/data/transition-previews.js';
import { shopPreviews } from '../src/data/shop-previews.js';
import { productScene } from '../src/data/product-scene.js';

const root=new URL('../',import.meta.url), files=new Set();
for(const asset of assets) {
  files.add(asset.model);files.add(asset.image);files.add(asset.shopRender.image);
  for(const layer of Object.values(asset.platformLayer?.layers??{})) files.add(layer.image);
  for(const [name,layer] of Object.entries(asset.shopExhibit.layers)) if(name.startsWith('shadow-')||name.startsWith('glow-')) files.add(layer.image);
  for(const frame of Object.values(productPreviews[asset.id].frames)) files.add(frame.image);
  files.add(litePreviews[asset.id].image);files.add(transitionPreviews[asset.id].image);files.add(shopPreviews[asset.id].image);
}
for(const state of ['rest','hover','ground']) files.add(assets[0].shopExhibit.layers[`plate-${state}`].image);
files.add(productScene.platform.model);
for(const folder of ['assets/fonts','assets/textures']) for(const name of await readdir(new URL('public/'+folder+'/',root))) files.add(folder+'/'+name);
files.add('credits.html');files.add('_headers');
const inventory=[];
for(const file of [...files].sort()) {
  const bytes=await readFile(new URL('public/'+file,root));
  inventory.push({path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(new URL('scripts/public-assets.json',root),JSON.stringify({version:1,files:inventory},null,2)+'\n');
console.log(`Inventoried ${inventory.length} production assets (${inventory.reduce((n,f)=>n+f.bytes,0)} bytes).`);
