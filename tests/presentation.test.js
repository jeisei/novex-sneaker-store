import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPresentation, prepareModel } from '../src/three/presentation.js';
import { disposeModel } from '../src/three/dispose.js';

test('neutral presentation keeps camera fixed and normalizes model without editing geometry', () => {
  const { scene, camera } = createPresentation();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 2), new THREE.MeshStandardMaterial());
  const vertices = Array.from(mesh.geometry.attributes.position.array);
  const pivot = prepareModel(mesh, {});
  scene.add(pivot);
  const initialCamera = camera.position.toArray();
  assert.equal(new THREE.Box3().setFromObject(pivot).getSize(new THREE.Vector3()).x, 2);
  for (const angle of [0, 1.4, 3.2, 6.5]) {
    pivot.rotation.set(.2, angle, .1);
    scene.updateMatrixWorld(true);
    assert.deepEqual(camera.position.toArray(), initialCamera);
    assert.deepEqual(Array.from(mesh.geometry.attributes.position.array), vertices);
  }
  disposeModel(scene);
});
