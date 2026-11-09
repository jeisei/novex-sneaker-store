import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { frameBounds, flipTransform, validRect } from '../src/animations/shared-geometry.js';
import { transitionPreviews } from '../src/data/transition-previews.js';
import { assets } from '../src/data/asset-manifest.js';

test('shared-element geometry maps capture pixels to CSS pixels with exact FLIP inversion',()=>{
 const to=frameBounds({bounds:[300,200,1200,700],canvas:[1500,1000]},{x:100,y:50,width:750,height:500});
 assert.deepEqual(to,{x:250,y:150,width:450,height:250});
 const from={x:20,y:400,width:180,height:100},flip=flipTransform(from,to);
 assert.equal(to.x+flip.x,from.x);assert.equal(to.y+flip.y,from.y);
 assert.equal(to.width*flip.scaleX,from.width);assert.equal(to.height*flip.scaleY,from.height);
 assert.equal(validRect({...to,y:2000},1920,1080),false);
 assert.equal(validRect(to,1920,1080),true);
 assert.equal(flipTransform({...from,width:0},to),null);
 assert.equal(flipTransform({...from,x:NaN},to),null);
});

test('all ten matched transition images have bounded crops, checked bytes and original source frames',async()=>{
 assert.deepEqual(Object.keys(transitionPreviews),assets.map(asset=>asset.id));
 for(const asset of assets){
  const frame=transitionPreviews[asset.id],bytes=await readFile(new URL('../public/'+frame.image,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),frame.sha256);
  const [l,t,r,b]=frame.bounds,[w,h]=frame.canvas;
  assert.ok(l>=0&&t>=0&&r<=w&&b<=h&&r>l&&b>t);
  assert.ok(frame.width<=900&&frame.bytes<500000);
 }
 const parity=JSON.parse(await readFile(new URL('./fixtures/preview-parity.json',import.meta.url),'utf8'));
 assert.equal(parity.length,10);
 for(const item of parity){assert.ok(item.maximumChannelDifference<=1);assert.ok(item.changedPixels<=12);}
});

test('cancelling a retired prefetch cannot abort the newer product intent',async()=>{
 const {prefetchModelBytes,cancelModelIntent}=await import('../src/three/model-bytes.js');
 const original=globalThis.fetch;
 globalThis.fetch=(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));
 try{
  const first=prefetchModelBytes('https://example.invalid/first.glb');
  const next=prefetchModelBytes('https://example.invalid/next.glb');
  assert.equal(first.controller.signal.aborted,true);
  cancelModelIntent(first.url);assert.equal(next.controller.signal.aborted,false);
  cancelModelIntent(next.url);assert.equal(next.controller.signal.aborted,true);
  await Promise.allSettled([first.promise,next.promise]);
 }finally{globalThis.fetch=original;}
});
import { Group, Mesh, BufferGeometry, Float32BufferAttribute } from 'three';
import { buildSoleProfile, buildSoleProfileAsync } from '../src/three/sole-profile.js';

test('cooperative support construction preserves the exact synchronous envelope and aborts safely',async()=>{
 const geometry=new BufferGeometry(),positions=[];
 for(let i=0;i<70000;i++)positions.push(Math.sin(i)*.6,Math.cos(i*.2)*.4,Math.sin(i*.11));
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
 const root=new Group();root.add(new Mesh(geometry));
 const sync=buildSoleProfile(root),asyncProfile=await buildSoleProfileAsync(root);
 for(const pitch of [0,.3,-.5,Math.PI/2,Math.PI,2*Math.PI])assert.equal(asyncProfile.minY(pitch),sync.minY(pitch));
 const controller=new AbortController();controller.abort();
 await assert.rejects(buildSoleProfileAsync(root,1024,controller.signal),{name:'AbortError'});
 geometry.dispose();
});

import { litePreviews } from '../src/data/lite-previews.js';
import { productPreviews } from '../src/data/product-previews.js';
import { shopPreviews } from '../src/data/shop-previews.js';

test('SHOP derivatives retain the PRODUCT capture provenance with a bounded catalog payload',async()=>{
 let total=0;
 assert.deepEqual(Object.keys(shopPreviews),assets.map(a=>a.id));
 for(const asset of assets){
  const frame=shopPreviews[asset.id],original=transitionPreviews[asset.id];
  assert.equal(frame.sourceSHA256,original.sha256);
  assert.equal(frame.width,480);assert.equal(frame.height,Math.round(original.height*480/original.width));
  const bytes=await readFile(new URL('../public/'+frame.image,import.meta.url));
  assert.equal(bytes.byteLength,frame.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),frame.sha256);
  total+=bytes.byteLength;
 }
 assert.ok(total<250000);
});
test('small progressive frames preserve provenance and use a bounded transfer budget',async()=>{
 for(const asset of assets){
  const frame=litePreviews[asset.id];assert.equal(frame.sourceSHA256,productPreviews[asset.id].frames.initial.sha256);
  assert.ok(frame.bytes<35000);assert.deepEqual([frame.width,frame.height],[384,256]);
  const bytes=await readFile(new URL('../public/'+frame.image,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),frame.sha256);
 }
});
