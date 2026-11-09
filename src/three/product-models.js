import { createLeaseCache } from './lease-cache.js';
import { modelBytes } from './model-bytes.js';
import { parseModelBuffer } from './load-model.js';
import { disposeModel } from './dispose.js';

function resources(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  return {geometries,materials,textures};
}
function suspend(root){
  root.removeFromParent();const r=resources(root);
  for(const group of Object.values(r))for(const resource of group)resource.dispose();
  // Retain CPU arrays/ImageBitmaps for the next lease; eviction closes images.
}
function weight(root){
  const r=resources(root),buffers=new Set(),images=new Set();let bytes=0;
  for(const g of r.geometries){for(const a of Object.values(g.attributes))buffers.add(a.isInterleavedBufferAttribute?a.data.array.buffer:a.array.buffer);if(g.index)buffers.add(g.index.array.buffer);}
  for(const b of buffers)bytes+=b.byteLength;
  for(const t of r.textures){const i=t.source?.data;if(i&&!images.has(i)){images.add(i);bytes+=(i.width??0)*(i.height??0)*4;}}
  return bytes;
}
const cpuBudget=Math.min(320,Math.max(96,(globalThis.navigator?.deviceMemory??8)*48))*1024*1024;
export const productModels=createLeaseCache({maxBytes:cpuBudget,
  async load(url,signal,onTiming){
    const bytes=await modelBytes(url,signal,onTiming);
    const model=await parseModelBuffer(bytes,url,signal);onTiming('parseEnd',performance.now());return model;
  },suspend,dispose:disposeModel,weight,
});
