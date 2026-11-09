import * as THREE from 'three';

export function prepareModel(model, asset, {longestSide=2,yaw=Math.PI}={}) {
  if (asset.uvCorrection) {
    const corrected = new Set();
    model.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        const map = material?.map;
        if (!map || corrected.has(map)) continue;
        map.offset.fromArray(asset.uvCorrection.offset);
        map.repeat.fromArray(asset.uvCorrection.scale);
        map.rotation = 0;
        map.updateMatrix();
        corrected.add(map);
      }
    });
  }
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(longest) || longest <= 0) throw new Error('Пустая геометрия GLB.');
  const scale = longestSide / longest;
  const normalized = new THREE.Group();
  normalized.scale.setScalar(scale);
  normalized.position.copy(center).multiplyScalar(-scale);
  normalized.add(model);
  const pivot = new THREE.Group();
  pivot.add(normalized);
  pivot.rotation.y = yaw;
  return pivot;
}

export function createPresentation() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#242424');
  scene.add(new THREE.HemisphereLight(0xffffff, 0x514944, 2));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  fill.position.set(2, 1, -3);
  scene.add(fill);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 100);
  camera.position.set(0.2, 0.25, 5.3);
  camera.lookAt(0, 0, 0);
  return { scene, camera };
}
