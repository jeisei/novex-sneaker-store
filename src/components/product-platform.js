export function platformPlacement(platform, alphaBounds) {
  const [canvasWidth, canvasHeight] = platform.canvas;
  const [left, top, right, bottom] = platform.shoeCrop;
  const width=right-left, height=bottom-top;
  if (!(canvasWidth>0 && canvasHeight>0 && width>0 && height>0 && left>=0 && top>=0 && right<=canvasWidth && bottom<=canvasHeight))
    throw new Error('Invalid platform crop');
  if (width!==alphaBounds[2]-alphaBounds[0] || height!==alphaBounds[3]-alphaBounds[1])
    throw new Error('Platform must preserve the approved shoe crop');
  return { aspectRatio:`${width}/${height}`, width:100*canvasWidth/width,
    left:-100*left/width, bottom:-100*(canvasHeight-bottom)/height };
}

export function productPlatformMarkup(product) {
  const platform=product.asset.platformLayer;
  if (!platform) return '';
  const placement=platformPlacement(platform,product.asset.alphaBounds);
  const url=state=>import.meta.env.BASE_URL+platform.layers[state].image;
  const [width,height]=platform.canvas;
  const style=p=>`aspect-ratio:${p.aspectRatio};--platform-width:${p.width}%;--platform-left:${p.left}%;--platform-bottom:${p.bottom}%`;
  const wash=platform.layers.wash.canvas ? platform.layers.wash : platform;
  const washPlacement=platformPlacement(wash,product.asset.alphaBounds);
  return `<span class="product-platform-wash" aria-hidden="true" style="${style(washPlacement)}"><img class="platform-state" src="${url('wash')}" width="${wash.canvas[0]}" height="${wash.canvas[1]}" alt="" draggable="false" decoding="async"></span>
  <span class="product-platform" aria-hidden="true" style="${style(placement)}">
    <img class="platform-state platform-rest" src="${url('rest')}" width="${width}" height="${height}" alt="" draggable="false" decoding="async">
    <picture><source media="(prefers-reduced-motion: reduce)" srcset="${url('reduced')}"><img class="platform-state platform-active" src="${url('hover')}" width="${width}" height="${height}" alt="" draggable="false" decoding="async"></picture>
  </span>`;
}
