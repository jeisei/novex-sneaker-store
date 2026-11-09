import { productPreviews } from './product-previews.js';

// Opaque shoe + shelf bounds in the existing 768×512 PRODUCT frames.
// Exclude empty scene margins; keep 12px side/top and 16px bottom breathing room.
const bounds = {
  'vx-001':[49,100,712,368], 'vx-002':[72,97,689,361],
  'vx-003':[87,94,674,357], 'vx-004':[68,97,693,363],
  'vx-005':[42,84,718,372], 'vx-006':[65,98,696,363],
  'vx-007':[73,96,688,361], 'vx-008':[101,93,661,354],
  'vx-009':[74,96,687,361], 'vx-010':[62,98,698,364],
};

export function cartPreview(id) {
  const frame = productPreviews[id].frames.mobile;
  const [left,top,right,bottom] = bounds[id];
  const crop = [left-12,top-12,right+12,bottom+16];
  return { ...frame, crop };
}
