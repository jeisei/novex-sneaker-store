import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry,Group,Mesh,MeshBasicMaterial,Euler } from 'three';
import { buildSoleProfile } from '../src/three/sole-profile.js';
import { orientation,shortestAngleDelta } from '../src/three/product-controls.js';
import { productScene } from '../src/data/product-scene.js';

test('sole support envelope keeps rotated original geometry above the shelf through a full vertical turn',()=>{
  const root=new Group(),mesh=new Mesh(new BoxGeometry(2,.8,.6),new MeshBasicMaterial());root.add(mesh);
  const profile=buildSoleProfile(root);
  for(let degrees=-360;degrees<=360;degrees++){
    const pitch=degrees*Math.PI/180;
    const expected=-.4*Math.abs(Math.cos(pitch))-.3*Math.abs(Math.sin(pitch));
    assert.ok(Math.abs(profile.minY(pitch)-expected)<1e-6);
    assert.ok(Math.abs(-profile.minY(pitch)+expected)<1e-6);
  }
  mesh.geometry.dispose();mesh.material.dispose();
});

test('view presets support top and sole while quaternion poses remain normalized through full turns',()=>{
  for(const from of productScene.views)for(const to of productScene.views){
    const a=orientation(from.yaw,from.pitch),b=orientation(to.yaw,to.pitch);
    for(let i=0;i<=100;i++){
      const angles=new Euler().setFromQuaternion(a.clone().slerp(b,i/100),'YXZ');
      const projected=orientation(angles.y,angles.x);
      const safe=new Euler().setFromQuaternion(projected,'YXZ');
      assert.ok(Math.abs(projected.length()-1)<1e-8);
      assert.ok(Math.abs(safe.z)<1e-8);
    }
  }
  const turned=orientation(Math.PI*4+.3,.1),neutral=orientation(.3,.1);
  assert.ok(turned.angleTo(neutral)<1e-7,'full yaw turns do not reset orientation');
  assert.ok(orientation(.3,Math.PI*4+.1).angleTo(neutral)<1e-7,'full vertical turns do not reset orientation');
  assert.deepEqual(productScene.views.map(view=>view.id),['side','top','rear','sole']);
  assert.ok(Math.abs(shortestAngleDelta(4*Math.PI+.2,.5)-.3)<1e-8);
  assert.ok(Math.abs(shortestAngleDelta(.1,2*Math.PI-.1)+.2)<1e-8);
  assert.ok(Math.abs(shortestAngleDelta(3*Math.PI,0))<=Math.PI);
});
