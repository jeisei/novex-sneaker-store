// Three.js NDC bounds -> viewport CSS pixels (not drawing-buffer/device pixels).
export function entryBounds(bounds, rect) {
  if (!bounds || !rect || !Array.isArray(bounds.min) || !Array.isArray(bounds.max) || bounds.min.length<2 || bounds.max.length<2
    || ![...bounds.min, ...bounds.max, rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
    || rect.width <= 0 || rect.height <= 0 || bounds.max[0] <= bounds.min[0] || bounds.max[1] <= bounds.min[1]) return null;
  return { x:rect.x+(bounds.min[0]+1)*rect.width/2, y:rect.y+(1-bounds.max[1])*rect.height/2,
    width:(bounds.max[0]-bounds.min[0])*rect.width/2, height:(bounds.max[1]-bounds.min[1])*rect.height/2 };
}
