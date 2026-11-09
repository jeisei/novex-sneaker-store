# NOVEX final release candidate

Date: 2026-11-09. Owner: jeisei. The owner approved public publication and the existing wall/logo on 2026-11-09. GitHub and Netlify publication and public-site verification are complete.

## Work completed

- Preserved the initial source/docs/tests/scripts in a local checkpoint before edits.
- Audited routing, lifecycle, GSAP ownership, cart storage, the loader/lease cache, WebGL controls/disposal, CSS and asset delivery.
- Removed the architectural sculpture at the owner's revised request. Home remains text-only on every screen; no sculpture component, production image or download remains.
- Made Product Details initialization safe when no optional details block exists.
- Removed the obsolete unused animated-cart-layout implementation. Existing cart interactions remain direct and stable.
- Removed the retired diagnostic branch from the application entry. Diagnostic-only modules are excluded from the candidate, retained in the local archive.
- Corrected nested main landmarks: one shared route main, without moving content.
- Added portable, case-sensitive production asset verification and retained the independent local provenance audit.
- Added ESLint, a reproducible Playwright browser audit, dependency checks, CI, Netlify build/security/cache configuration, current English documentation and asset attribution.

## Visual contract

The approved Home text/button/header positions remain. The shared footer has a hosting-only clearance adjustment for the mandatory Netlify badge. Shop retains its order, 5×2 desktop grid, scale, silver shelves and hover lighting. Product's render recipe, materials, camera and seamless preview handoff were not changed. Cart keeps the recently approved scale and stable interactions. The cancelled sculpture and its reference remain only in the local archive, outside the candidate.

## Assets and rights

Ten optimized sneaker GLBs: **169,857,944 bytes**. Largest: 26,028,128 bytes. Unoptimized originals: **471,732,542 bytes**, excluded. A necessary shared shelf adds 4,124,588 bytes. Same-origin production delivery from public/assets/models/; no Git LFS or paid storage dependency.

All ten sneaker files preserve Meshopt compression, embedded textures and hashes. VX-007 UV correction is unchanged. The owner confirms Meshy Free generation; Meshy CC BY 4.0 attribution is included in README, ASSETS, THIRD_PARTY_NOTICES and the public credits page.

The supplied wall texture and NOVEX SVG identity have no separate upstream license evidence in the project. The owner explicitly approved their unchanged public inclusion on 2026-11-09. No affiliation or official-store claim is made for third-party brands.

## Verification status

- Local source tests: 47 passing; four assertions concern archival original-render provenance and are not included in the portable public suite.
- Portable asset inventory: 192 files, **188,315,293 bytes**. Exact case, byte count, SHA-256, self-contained GLBs and render recipe checked.
- Independent source-archive check: 58 protected original files unchanged.
- ESLint: passing. Dependency audit: zero reported vulnerabilities. ESLint's minimatch dependency is pinned to the audited patched 11.0.1 through scoped overrides.
- Production build: passing. Entry JS approximately 208.43 KB / 70.11 KB gzip, CSS 40.07 KB / 9.16 KB gzip. Three.js viewer/model chunks remain lazy.
- Responsive browser audit: 196 assertions across the ten requested viewport sizes, including text-only Home without image/GLB requests, search, cart persistence/totals, contact states, shared chrome, no horizontal overflow and keyboard navigation.
- 3D browser audit: 161 assertions passing across all ten models, including four presets, keyboard rotation/reset, idle rendering, UV correction, resource/context recovery, delayed loading, touch drag and rapid navigation.
- Security-configured production preview: 35 assertions passing, including all model URLs, embedded textures, cart actions and cancellation of normal-motion transitions. No browser errors or CSP violations were recorded. Fixed connect-src to allow the blob URLs used by embedded GLB textures.
- Independent Git clone: npm ci, ESLint, all 43 portable tests, asset verification and production build passed. Preview recipe hashing normalizes CRLF/LF so Windows and Linux checkouts produce the same recipe. The resulting bundle hashes match the candidate.

Detailed evidence is stored beside this report: 392 browser assertions in total. Across the ten viewport samples, Home FCP/LCP ranged from 136 to 660 ms, with CLS 0. Maximum sampled Event Timing durations ranged from 48 to 392 ms. These local laboratory samples are not field INP or real-device performance guarantees. Model scenario durations include interactions and are not isolated download benchmarks. Software-rendered WebGL does not establish a physical device's 60 FPS capability.

## Public-site verification

- All ten real GLBs and their materials/textures loaded from Netlify, preserving the original UV correction and cameras. The combined public browser run passed 355 assertions.
- After the hosting footer adjustment, all ten requested viewport sizes passed the final 196-assertion responsive run. The final CSP/console/cart/rapid-navigation audit passed 36 assertions, with no console errors or CSP violations. These reruns overlap earlier scenarios and are not additional unique features.
- 191 public asset URLs returned HTTP 200. 190 decoded asset sizes match the inventory; credits.html is modified by Netlify to inject its hosting comment/badge. Optimized GLBs total 169,857,944 bytes and remain served from the same-origin assets/models directory.
- Final public Home FCP/LCP samples: 580–1,620 ms; CLS 0; maximum sampled Event Timing duration 216 ms. Full 3D readiness in the ten-model run ranged from about 2.4 to 14.2 seconds on this headless software-rendering setup, including network/decode/setup. Immediate previews and purchase controls remain available while loading. These are laboratory observations, not field INP or physical-device benchmarks.
- The initial strict console test intentionally aborted two GLB requests and therefore emitted two synthetic ERR_FAILED resource messages. The final console audit uses ordinary real requests during rapid navigation and passed; error/retry scenarios remain covered separately.

## Public candidate

The allowlisted candidate is prepared separately from the working archive. It includes runtime source, portable tests, build/QA scripts, lockfile/configuration, 192 runtime assets, English documentation, license notices and selected QA screenshots.

Excluded: unoptimized GLBs, Blender projects, original reference collages, backups, old build/report/video artifacts, node_modules, dist, .netlify, browser state, credentials and absolute personal paths. No original asset was deleted for cleanup.

Published repository: https://github.com/jeisei/novex-sneaker-store (public, owner jeisei). The initial release and verification commits were pushed without force or history rewriting. The allowlisted tree contains 303 files; originals, backups, credentials and the cancelled sculpture are excluded. Installation, tests and production build were independently verified from a Git clone.

## Netlify

Configured command: npm run build. Publish: dist. Node: 24. Hash routing requires no redirects. Production HTML is revalidated; fingerprinted bundles are immutable. CSP explicitly permits same-origin WebAssembly and blob workers.

Published site: https://clever-creponne-9b561b.netlify.app/. Connected to jeisei/novex-sneaker-store, branch main, with automatic publishing. The owner completed Netlify and GitHub browser authentication. The new project was successfully built and deployed in the selected team without a paid upgrade. Production visibility is public. The older novex-showcase address remains a separate deployment.

Netlify injects a free-plan badge. Its iframe script is allowed by an exact SHA-256 CSP hash, without enabling arbitrary inline JavaScript. The shared fixed contact zone reserves space above the hosting badge only when Netlify injects its HUD script; local layouts retain their established positions. The hash may need review if Netlify changes its injected script. Public HTML is revalidated, bundles are Brotli-compressed and immutable, and model/texture/font URLs are same-origin.

## Remaining steps and limits

Checkout and unset contacts remain honest demo limitations. No physical iPhone/Safari/Android hardware or field Core Web Vitals testing was performed. Netlify’s free-plan badge remains visible; no paid service was enabled. The exact script hash for that badge may require maintenance if Netlify changes its injected code.

## Screenshots

[Desktop Home](home-desktop.png) · [Mobile Home](home-mobile.png) · [Shop](shop.png) · [Product](product.png) · [Cart](cart.png)
