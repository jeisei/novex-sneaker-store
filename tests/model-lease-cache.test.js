import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeaseCache } from '../src/three/lease-cache.js';
const owner=()=>new AbortController();
function fixture(options={}){
  const loaded=[],released=[],destroyed=[];
  const cache=createLeaseCache({async load(key){loaded.push(key);return {key};},suspend:v=>released.push(v.key),dispose:v=>destroyed.push(v.key),...options});
  return {cache,loaded,released,destroyed};
}
test('released CPU models are reused without decoding while each lease releases GPU once',async()=>{
  const f=fixture(),a=await f.cache.acquire('shoe',owner().signal);a.release();a.release();
  const b=await f.cache.acquire('shoe',owner().signal);assert.equal(a.model,b.model);b.release();
  assert.deepEqual(f.loaded,['shoe']);assert.deepEqual(f.released,['shoe','shoe']);assert.equal(f.cache.stats().active,0);
});
test('cache evicts the least recent inactive model and never an active lease',async()=>{
  const f=fixture(),shelf=await f.cache.acquire('shelf',owner().signal),shoe=await f.cache.acquire('shoe1',owner().signal);shoe.release();
  const next=await f.cache.acquire('shoe2',owner().signal);assert.deepEqual(f.destroyed,['shoe1']);assert.equal(f.cache.stats().active,2);
  next.release();shelf.release();f.cache.clear();assert.equal(f.cache.stats().entries,0);
});
test('cancelled pending load cannot return its old model to a new owner',async()=>{
  let finish;const f=fixture({load:()=>new Promise(r=>finish=r)}),a=owner();
  const pending=f.cache.acquire('shoe',a.signal);await Promise.resolve();a.abort();
  await assert.rejects(pending,{name:'AbortError'});finish({key:'shoe'});await new Promise(r=>setTimeout(r,0));
  assert.deepEqual(f.destroyed,['shoe']);assert.equal(f.cache.stats().entries,0);
});
test('failed load is retryable and byte limit destroys released oversized entries',async()=>{
  let calls=0;const f=fixture({load:async key=>{if(!calls++)throw new Error('network');return {key};},weight:()=>20,maxBytes:10});
  await assert.rejects(f.cache.acquire('shoe',owner().signal),/network/);
  const a=await f.cache.acquire('shoe',owner().signal);a.release();assert.deepEqual(f.destroyed,['shoe']);
});
