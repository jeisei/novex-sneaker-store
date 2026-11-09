import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assets } from '../src/data/asset-manifest.js';
import { productPreviews, productPreviewRecipeSHA256 } from '../src/data/product-previews.js';
import { productPreviewRecipeHash } from './product-preview-recipe.mjs';

const root=new URL('../',import.meta.url);
const inventory=JSON.parse(await readFile(new URL('scripts/public-assets.json',root),'utf8'));
if(inventory.version!==1)throw Error('Unsupported production asset inventory');
async function checkImports(directory) {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const file=new URL(entry.name+(entry.isDirectory()?'/':''),directory);
    if(entry.isDirectory()){await checkImports(file);continue;}
    if(!/\.(js|css)$/.test(entry.name))continue;
    const source=await readFile(file,'utf8');
    for(const match of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*|@import\s*)['"](\.[^'"]+)['"]/g)) {
      const absolute=fileURLToPath(new URL(match[1],file));
      let parent=path.parse(absolute).root;
      for(const segment of absolute.slice(parent.length).split(path.sep)) {
        if(!(await readdir(parent)).includes(segment))throw Error(`Import filename case mismatch: ${match[1]} in ${entry.name}`);
        parent=path.join(parent,segment);
      }
    }
  }
}
await checkImports(new URL('src/',root));
for(const file of inventory.files) {
  let directory=new URL('public/',root);
  for(const segment of file.path.split('/')) {
    if(!(await readdir(directory)).includes(segment)) throw Error(`Missing asset or incorrect filename case: ${file.path}`);
    directory=new URL(segment+(segment===file.path.split('/').at(-1)?'':'/'),directory);
  }
  const bytes=await readFile(new URL('public/'+file.path,root));
  if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error(`Production asset changed: ${file.path}`);
}
if(await productPreviewRecipeHash()!==productPreviewRecipeSHA256)throw Error('PRODUCT render recipe changed without regenerating previews');
let total=0;
for(const asset of assets) {
  const bytes=await readFile(new URL('public/'+asset.model,root));total+=bytes.length;
  if(bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2)throw Error(`Invalid GLB ${asset.id}`);
  const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
  if(!gltf.extensionsRequired?.includes('EXT_meshopt_compression'))throw Error(`Missing Meshopt ${asset.id}`);
  if([...gltf.buffers??[],...gltf.images??[]].some(item=>item.uri&&!item.uri.startsWith('data:')))throw Error(`External GLB dependency ${asset.id}`);
  if(createHash('sha256').update(bytes).digest('hex')!==asset.modelSHA256||productPreviews[asset.id].modelSHA256!==asset.modelSHA256)throw Error(`Model or preview mismatch ${asset.id}`);
  if(bytes.length>=100*1024*1024)throw Error(`Model exceeds the GitHub single-file limit ${asset.id}`);
}
console.log(`Verified ${inventory.files.length} production assets and ${assets.length} Meshopt GLBs (${total} bytes); filename case and render recipe match.`);
