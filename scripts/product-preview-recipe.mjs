import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function productPreviewRecipeHash(){
  const files=['src/three/product-viewer.js','src/three/presentation.js','src/three/sole-profile.js','src/data/product-render-config.js','src/data/product-scene.js'];
  const bytes=await Promise.all(files.map(path=>readFile(new URL('../'+path,import.meta.url))));
  // Git checkouts may use CRLF or LF; line endings do not change the scene.
  const hash=createHash('sha256');for(const file of bytes)hash.update(file.toString('utf8').replace(/\r\n/g,'\n'));return hash.digest('hex');
}
