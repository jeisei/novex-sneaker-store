# Production assets

The release contains only runtime assets, a small set of screenshots and license notices. Unoptimized originals and render-workstation files remain in the owner's local archive and are not published.

## Sneaker GLBs

All ten GLBs use glTF 2.0, EXT_meshopt_compression and embedded WebP images. No external model texture URLs are required. Geometry and texture resolution were preserved. Runtime delivery is same-origin under `public/assets/models/`, copied by Vite into `dist/assets/models/`.

| ID | File | Bytes | Embedded images |
| --- | --- | ---: | ---: |
| VX-001 | vx-001.glb | 10,838,424 | 3 |
| VX-002 | vx-002.glb | 20,952,176 | 3 |
| VX-003 | vx-003.glb | 26,028,128 | 1 |
| VX-004 | vx-004.glb | 16,022,836 | 1 |
| VX-005 | vx-005.glb | 20,803,328 | 3 |
| VX-006 | vx-006.glb | 13,338,580 | 1 |
| VX-007 | vx-007.glb | 22,993,824 | 1 |
| VX-008 | vx-008.glb | 13,112,720 | 3 |
| VX-009 | vx-009.glb | 12,313,532 | 1 |
| VX-010 | vx-010.glb | 13,454,396 | 3 |

Total: **169,857,944 bytes** (169.86 MB / approximately 162 MiB). The original unoptimized models total 471,732,542 bytes and are excluded. Every optimized model is below GitHub's 100 MiB file limit; the largest is about 24.8 MiB. Git LFS and external asset hosting are not required for this delivery scheme.

The shared shelf at `assets/models/product/floating-wall-shelf.glb` adds 4,124,588 bytes. Product loads only its selected sneaker plus this shared shelf. Home and Cart load no GLBs. Deliberate capable-desktop Shop intent may prefetch one selected sneaker.

VX-007 retains its UV correction: offset [0.0000070000001, 0.00000300000011], repeat [16.0031834, 16.0035038]. This restores the supplied model's texture transform; it does not replace its textures.

## Images

- `assets/images/shop-preview/v1`: ten lightweight shoe-only derivatives, approximately 224 KB combined.
- `assets/images/product-initial/v1`: exact initial desktop/mobile frames and four real thumbnails per product.
- `assets/images/product-lite/v1`: small first-frame derivatives; paths are recorded in the inventory.
- `assets/images/product-transition/v1`: shoe captures used only for intent/shared-element transitions.
- Existing shelf, glow and shadow passes: Shop uses one silver plate pass with per-stand placement. Original unused passes remain in the local archive.
- Cart crops existing Product frames in CSS rather than generating new files or loading models.

The cancelled architectural sculpture, its reference collage and generated master are retained only in the local archive and are excluded from the public candidate. Home is text-only.

## Fonts and background

Local Montserrat/Inter WOFF2 fonts include their SIL OFL notices. The existing graphite wall and supplied NOVEX SVG identity are preserved. Their separate upstream rights evidence is not present; permission to distribute those project materials is part of the owner's final publication review.

## Integrity and provenance

`scripts/public-assets.json` contains exact paths, sizes and SHA-256 hashes for the production assets. `npm run check:assets` verifies bytes, filename case, Meshopt, self-contained GLBs and renderer/preview compatibility. It runs before development/build. Asset paths are case-sensitive and ASCII in the production tree.

The owner confirms the ten sneaker models were created by them on Meshy's Free plan. Attribution: **Model created with Meshy — CC BY 4.0 License.** The shelf and generated derivatives are also credited; see THIRD_PARTY_NOTICES.md and public/credits.html. Attribution does not imply ownership of third-party brand marks or source-image rights.

The manifest retains historical relative source/provenance metadata for identification. Those fields do not cause runtime requests and do not require the author's source archive to build the public project.
