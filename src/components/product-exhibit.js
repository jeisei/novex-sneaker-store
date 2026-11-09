import { shopPlate } from '../data/shop-shelves.js';

const states = ['rest', 'hover', 'ground'];

export function exhibitPlacement(exhibit) {
  const shoe = exhibit?.shoe;
  const bounds = shoe?.bounds;
  if (!shoe || !Array.isArray(shoe.canvas) || shoe.canvas.length !== 2 || !Array.isArray(bounds) || bounds.length !== 4)
    throw new Error('Invalid exhibit shoe canvas');
  const [width, height] = shoe.canvas;
  const [left, top, right, bottom] = bounds;
  if (![width, height, ...bounds, shoe.width, shoe.left, shoe.anchor].every(Number.isFinite)
    || width <= 0 || height <= 0 || left < 0 || top < 0 || right > width || bottom > height || right <= left || bottom <= top
    || shoe.width <= 0 || shoe.width > 100 || Math.abs(shoe.left) > 30 || Math.abs(shoe.anchor) > 100)
    throw new Error('Invalid exhibit shoe placement');
  for (const state of states) {
    if (!exhibit.layers?.[`shoe-${state}`]) throw new Error(`Missing exhibit shoe ${state}`);
    for (const kind of ['plate', 'shadow']) if (!exhibit.layers?.[`${kind}-${state}`]) throw new Error(`Missing exhibit ${kind} ${state}`);
  }
  for (const state of ['hover', 'ground']) if (!exhibit.layers?.[`glow-${state}`]) throw new Error(`Missing exhibit glow ${state}`);
  for (const [name, layer] of Object.entries(exhibit.layers)) {
    if (!layer.image || !Array.isArray(layer.canvas) || layer.canvas.some(n => !Number.isFinite(n) || n <= 0))
      throw new Error('Invalid exhibit layer');
    if (layer.frame && (![layer.frame.width, layer.frame.left, layer.frame.anchor].every(Number.isFinite) || layer.frame.width <= 0 || layer.frame.width > 240))
      throw new Error('Invalid exhibit layer frame');
    if (!name.startsWith('shoe-') && !layer.frame) throw new Error('Missing exhibit layer frame');
    if (name.startsWith('shoe-') && (layer.canvas[0] !== width || layer.canvas[1] !== height)) throw new Error('Exhibit shoe states must share one canvas');
  }
  return { width: right - left, height: bottom - top, canvasWidth: width, canvasHeight: height, left, top,
    shoeWidth: shoe.width, shoeLeft: shoe.left, shoeAnchor: shoe.anchor };
}

function frameStyle(frame) {
  return `--exhibit-width:${frame.width}%;--exhibit-left:${frame.left}%;--exhibit-anchor:${frame.anchor}%`;
}

// Express the wash depth in the image's own coordinates while keeping it
// proportional to shelf width, independent of each trimmed glow canvas.
function glowFalloffStyle(layer) {
  const [width, height] = layer.canvas;
  return `--exhibit-glow-reach:${36 * width / height}%`;
}

export function exhibitLayersMarkup(exhibit, base = import.meta.env?.BASE_URL ?? '/') {
  exhibitPlacement(exhibit);
  function image(kind, state, active = false) {
    const layer = kind === 'plate' ? shopPlate(exhibit,state) : exhibit.layers[`${kind}-${state}`];
    const falloff = kind === 'glow' ? `;${glowFalloffStyle(layer)}` : '';
    const attrs = `class="exhibit-layer exhibit-${kind} ${active ? 'exhibit-active' : 'exhibit-rest'}" style="${frameStyle(layer.frame)}${falloff}" width="${layer.canvas[0]}" height="${layer.canvas[1]}" alt="" draggable="false" decoding="async"`;
    if (state !== 'hover') return `<img ${attrs} src="${base + layer.image}">`;
    const reduced = kind === 'plate' ? shopPlate(exhibit,'ground') : exhibit.layers[`${kind}-ground`];
    // Ground and hover can have different crops. Separate elements retain exact world-space alignment.
    const reducedFalloff = kind === 'glow' ? `;${glowFalloffStyle(reduced)}` : '';
    return `<img ${attrs} src="${base + layer.image}"><img class="exhibit-layer exhibit-${kind} exhibit-active exhibit-ground" style="${frameStyle(reduced.frame)}${reducedFalloff}" src="${base + reduced.image}" width="${reduced.canvas[0]}" height="${reduced.canvas[1]}" alt="" draggable="false" decoding="async">`;
  }
  return `<span class="product-exhibit" aria-hidden="true">${image('shadow', 'rest')}${image('shadow', 'hover', true)}${image('glow', 'hover', true)}${image('plate', 'rest')}${image('plate', 'hover', true)}</span>`;
}

export function exhibitShoeMarkup(exhibit, base = import.meta.env?.BASE_URL ?? '/', preview = null) {
  const p = exhibitPlacement(exhibit);
  if (preview) {
    // PRODUCT's shoe-only capture: preserve the SHOP width and sole baseline,
    // while retaining the capture's natural aspect ratio. Shelf/light passes stay intact.
    const anchor = p.shoeAnchor * (p.height / p.width) / (preview.height / preview.width);
    return `<span class="product-image exhibit-shoe" style="aspect-ratio:${preview.width}/${preview.height};--exhibit-shoe-width:${p.shoeWidth}%;--exhibit-shoe-left:${p.shoeLeft}%;--exhibit-shoe-anchor:${anchor}%"><img src="${base + preview.image}" width="${preview.width}" height="${preview.height}" alt="" draggable="false" decoding="async" style="width:100%;height:100%;left:0;top:0"></span>`;
  }
  const imageStyle = `width:${100 * p.canvasWidth / p.width}%;left:${-100 * p.left / p.width}%;top:${-100 * p.top / p.height}%`;
  const img = (state, className) => `<img class="${className}" src="${base + exhibit.layers[`shoe-${state}`].image}" width="${p.canvasWidth}" height="${p.canvasHeight}" alt="" draggable="false" decoding="async" style="${imageStyle}">`;
  return `<span class="product-image exhibit-shoe" style="aspect-ratio:${p.width}/${p.height};--exhibit-shoe-width:${p.shoeWidth}%;--exhibit-shoe-left:${p.shoeLeft}%;--exhibit-shoe-anchor:${p.shoeAnchor}%">${img('rest', 'exhibit-shoe-rest')}${img('hover', 'exhibit-shoe-active')}${img('ground', 'exhibit-shoe-active exhibit-ground')}</span>`;
}
