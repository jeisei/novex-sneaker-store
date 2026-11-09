import { assets } from './asset-manifest.js';

// One approved silver material/light pass for the whole SHOP display.
// Keep each stand's horizontal framing; share the render and vertical crop.
const silver = assets[0].shopExhibit.layers;
export function shopPlate(exhibit, state) {
  const source = silver[`plate-${state}`], target = exhibit.layers[`plate-${state}`];
  return { ...source, frame:{ ...target.frame, anchor:source.frame.anchor } };
}
