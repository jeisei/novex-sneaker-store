import test from 'node:test';
import assert from 'node:assert/strict';
import { entryBounds } from '../src/animations/entry-bounds.js';

test('3D handoff uses canvas CSS coordinates and inverted NDC Y, including negative canvas offsets', () => {
  const bounds={min:[-.5,-.2,0],max:[.5,.6,1]};
  assert.deepEqual(entryBounds(bounds,{x:100,y:-20,width:800,height:500}), {x:300,y:80,width:400,height:200});
  // Same CSS viewport at a different DPR must produce the same flight target.
  assert.deepEqual(entryBounds(bounds,{x:100,y:-20,width:800,height:500,devicePixelRatio:2}), {x:300,y:80,width:400,height:200});
});

test('missing, zero-size and nonfinite geometry never produce an invalid transition transform', () => {
  const rect={x:0,y:0,width:800,height:500};
  assert.equal(entryBounds(null,rect),null);
  assert.equal(entryBounds({},rect),null);
  for(const bounds of [{min:[0,0,0],max:[0,1,1]},{min:[0,1,0],max:[1,0,1]},{min:[NaN,0,0],max:[1,1,1]}]) assert.equal(entryBounds(bounds,rect),null);
  assert.equal(entryBounds({min:[-1,-1,0],max:[1,1,1]},{...rect,height:0}),null);
});
