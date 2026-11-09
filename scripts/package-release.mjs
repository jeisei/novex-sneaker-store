import { readFile, writeFile, mkdir, copyFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root=fileURLToPath(new URL('../',import.meta.url));
const destination=path.join(root,'release','novex-sneaker-store');
try{await access(destination);throw Error('Release candidate already exists; review it instead of overwriting it.');}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(destination,{recursive:true});
const files=[];
async function copy(relative) {
  const target=path.join(destination,relative);await mkdir(path.dirname(target),{recursive:true});
  await copyFile(path.join(root,relative),target);files.push(relative.replaceAll('\\','/'));
}
async function tree(folder,predicate=()=>true) {
  for(const entry of await readdir(path.join(root,folder),{withFileTypes:true})) {
    const relative=path.join(folder,entry.name);
    if(entry.isDirectory())await tree(relative,predicate);
    else if(entry.isFile()&&predicate(relative.replaceAll('\\','/')))await copy(relative);
  }
}
const excludedSource=new Set(['src/dev/model-check.js','src/three/viewer.js','src/three/model-controls.js','src/pages/product-placeholder.js']);
await tree('src',file=>!excludedSource.has(file));
await tree('tests',file=>!['tests/home-render.test.js','tests/shop-renders.test.js'].includes(file));
for(const file of ['package.json','package-lock.json','vite.config.js','eslint.config.js','.gitignore','.gitattributes','index.html','netlify.toml','README.md','ARCHITECTURE.md','ASSETS.md','DESIGN.md','PLAN.md','THIRD_PARTY_NOTICES.md','LICENSE.md'])await copy(file);
for(const file of ['check-public-assets.mjs','create-public-inventory.mjs','product-preview-recipe.mjs','audit-release.mjs','audit-security-preview.mjs','run-browser-audit.mjs','package-release.mjs','public-assets.json'])await copy('scripts/'+file);
const inventory=JSON.parse(await readFile(path.join(root,'scripts/public-assets.json'),'utf8'));
for(const file of inventory.files)await copy('public/'+file.path);
await tree('docs/release',file=>/\.(md|json|png|jpg)$/.test(file)&&!file.endsWith('model-progress.json'));
await tree('.github');
const manifest=[];
for(const file of files.sort()) {
  const bytes=await readFile(path.join(destination,file));
  if(bytes.length>=100*1024*1024)throw Error(`File exceeds GitHub limit: ${file}`);
  if(!/\.(glb|webp|png|jpg|woff2)$/.test(file)) {
    const text=bytes.toString('utf8');
    if(/(?:github_pat_|gh[pousr]_|nfp_)[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----|[A-Za-z]:[\\/](?:Users|home)[\\/]/i.test(text))throw Error(`Sensitive content or personal path: ${file}`);
  }
  manifest.push({path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(path.join(root,'release','publication-manifest.json'),JSON.stringify({candidate:'novex-sneaker-store',files:manifest,totalBytes:manifest.reduce((sum,file)=>sum+file.bytes,0)},null,2)+'\n');
console.log(`Prepared ${files.length} files at release/novex-sneaker-store. Nothing has been uploaded.`);
