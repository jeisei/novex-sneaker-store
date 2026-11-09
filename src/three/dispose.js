export function disposeModel(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const images = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value);
      }
    }
  });
  root.removeFromParent();
  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) {
    if (texture.source?.data) images.add(texture.source.data);
    texture.dispose();
  }
  for (const material of materials) material.dispose();
  for (const image of images) image.close?.();
  root.clear();
}
