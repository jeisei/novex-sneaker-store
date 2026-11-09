# Architecture

NOVEX is a client-only Vite application. A persistent shell owns the wall, header, footer and search dialog. Hash routing mounts one active page through an abortable lifecycle. Each page owns its listeners and asynchronous work.

## Routing and ownership

`app/router.js` resolves Home, Shop, Product and Cart. Unknown IDs fall back to Shop. `app/lifecycle.js` aborts retired work and disposes late results. The transition manager owns GSAP contexts, cancellation, focus and scroll restoration.

Shared-element movement is forward-only from Shop to Product. Every return uses the common fade, including interruption during entry. One detached Shop page retains decoded images and scroll position. One interactive Product may be retained and suspended on capable desktops; other retired viewers are disposed after paint. Opening another Product releases the old viewer first.

The shell is installed once per application lifetime. Its navigation handlers and ResizeObserver intentionally share that lifetime. Route listeners use AbortSignal. Rapid navigation, resize, visibility changes and reduced motion settle the owned transition; outgoing pages are inert.

## Home and shared chrome

Home is entirely textual on every device. The architectural sculpture was removed at the owner's latest request; its component, loading, animation and production asset were removed together. No model or decorative image loads on Home.

The shared wall uses Home's exposure and is fixed to the viewport. One fixed, safe-area-aware contact zone serves all routes. Product's bounded grid row and internal info scrolling keep its scrollbar above the contacts.

## Shop

`data/products.js` and the asset manifest define stable order/IDs. Shop renders ten lightweight shoe captures without a canvas. Existing independent shadow/glow passes and hover lift remain. `data/shop-shelves.js` applies one existing silver shelf pass while retaining each stand's horizontal framing.

Intent loading is limited to one model and skipped on touch, data-saving/slow connections and low-memory devices. A real Product click adopts a pending download; leaving or cancellation aborts speculative work.

## Product and WebGL

Preview, sizes, quantity and purchase controls mount immediately. The selected GLB and shared shelf load independently of fallback decoding. Static and live frames share the render recipe and coordinates; a short opacity handoff preserves framing.

GLTFLoader uses bundled MeshoptDecoder workers with synchronous fallback. Parsing is serialized. A bounded CPU lease cache retains geometry/images while suspended resources release GPU allocations; eviction closes images and disposes materials/geometry. Late or aborted acquisitions cannot become a newer page's model.

The viewer owns one renderer, observer and control owner. Rendering wakes for interaction/resize and stops when idle, hidden, suspended or disposed. DPR is capped at 1.25. Controls support full yaw/pitch, four real presets, drag and Home/R reset. A cooperative sole profile maintains shelf clearance without scanning all vertices during dragging. Balenciaga's UV transform is restored in `three/presentation.js`.

Context loss restores the preview and exposes Retry 3D. Disposal removes controls/observers, releases leases, disposes the scene/environment/shadows/renderer and relinquishes its context. A recipe hash couples viewer configuration and generated previews.

## Catalog and cart

`data/products.js` is the display-name/offer/size source. Internal IDs remain stable. Product Details renders only supplied extra information; its mount tolerates absence.

The cart store uses only `novex.cart.v1`. Catalog prices are revalidated on read without rewriting storage. Mutations validate product, size, safe integer quantity and cent totals before writing. Unknown/corrupt schemas are preserved; storage failures remain visible errors.

Cart updates existing row/image nodes and numbers directly, without page-layout animation. Normal updates use an off-flow live region. Images are cropped existing Product frames. Cart creates no renderer and requests no GLBs. Checkout and unavailable contacts are honest demo states.

## Search

Search matches partial names without case/punctuation sensitivity. A native modal provides focus containment and inert background. Explicit Escape handling avoids input consumption. Closing restores root scroll styles and focus. Result links use normal hash navigation.

## Build and release

`scripts/public-assets.json` records production paths, bytes and SHA-256 hashes. The portable checker verifies checksums, exact filename/import case, embedded GLB resources, Meshopt and render-recipe compatibility. The text recipe hash normalizes CRLF/LF; .gitattributes preserves public asset bytes and uses LF for source. Builds do not need original unoptimized models or the render workstation.

The local archive retains all originals and historical provenance checks. Release packaging uses an explicit allowlist, excluding backups, credentials, diagnostics, old reports, original GLBs and unused render passes. Two archival render-provenance test files are omitted; portable unit/asset tests remain.

Netlify serves `dist`. Security headers permit local WASM/blob workers and fetching local blob texture URLs; no external asset origin is needed. HTML is revalidated and only fingerprinted bundles are immutable. Local Vite production previews serve the same CSP for verification. Hash routes need no catch-all rewrite. Public release requires owner confirmation and available deployment quota.
