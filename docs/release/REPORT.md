# NOVEX final release candidate

Date: 2026-11-09. Owner: jeisei. Publication is pending owner confirmation.

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

The approved Home text/button/header/footer positions remain. Shop retains its order, 5×2 desktop grid, scale, silver shelves and hover lighting. Product's render recipe, materials, camera and seamless preview handoff were not changed. Cart keeps the recently approved scale and stable interactions. The cancelled sculpture and its reference remain only in the local archive, outside the candidate.

## Assets and rights

Ten optimized sneaker GLBs: **169,857,944 bytes**. Largest: 26,028,128 bytes. Unoptimized originals: **471,732,542 bytes**, excluded. A necessary shared shelf adds 4,124,588 bytes. Same-origin production delivery from public/assets/models/; no Git LFS or paid storage dependency.

All ten sneaker files preserve Meshopt compression, embedded textures and hashes. VX-007 UV correction is unchanged. The owner confirms Meshy Free generation; Meshy CC BY 4.0 attribution is included in README, ASSETS, THIRD_PARTY_NOTICES and the public credits page.

The supplied wall texture and NOVEX SVG identity have no separate upstream license evidence in the project. Their unchanged inclusion is explicitly part of the final owner publication review. No affiliation or official-store claim is made for third-party brands.

## Verification status

- Local source tests: 47 passing; four assertions concern archival original-render provenance and are not included in the portable public suite.
- Portable asset inventory: 192 files, **188,315,209 bytes**. Exact case, byte count, SHA-256, self-contained GLBs and render recipe checked.
- Independent source-archive check: 58 protected original files unchanged.
- ESLint: passing. Dependency audit: zero reported vulnerabilities. ESLint's minimatch dependency is pinned to the audited patched 11.0.1 through scoped overrides.
- Production build: passing. Entry JS approximately 208.43 KB / 70.11 KB gzip, CSS 39.50 KB / 9.06 KB gzip. Three.js viewer/model chunks remain lazy.
- Responsive browser audit: 196 assertions across the ten requested viewport sizes, including text-only Home without image/GLB requests, search, cart persistence/totals, contact states, shared chrome, no horizontal overflow and keyboard navigation.
- Full 3D/context recovery/touch verification and clean-candidate installation/build are being finalized; do not treat this line as a passing result until the final evidence update.

Detailed evidence is stored beside this report. Laboratory FCP/LCP/CLS/Event Timing samples are not a field INP or real-device performance guarantee. Software-rendered WebGL does not establish a physical device's 60 FPS capability.

## Public candidate

The allowlisted candidate is prepared separately from the working archive. It includes runtime source, portable tests, build/QA scripts, lockfile/configuration, 192 runtime assets, English documentation, license notices and selected QA screenshots.

Excluded: unoptimized GLBs, Blender projects, original reference collages, backups, old build/report/video artifacts, node_modules, dist, .netlify, browser state, credentials and absolute personal paths. No original asset was deleted for cleanup.

GitHub authentication has been verified as **jeisei**. The intended repository is **jeisei/novex-sneaker-store**, which was not found during preflight. No repository or code has been published by this release task yet. Local Git review/commit and final publication manifest will be recorded after clean-candidate checks.

## Netlify

Configured command: npm run build. Publish: dist. Node: 24. Hash routing requires no redirects. Production HTML is revalidated; fingerprinted bundles are immutable. CSP explicitly permits same-origin WebAssembly and blob workers.

The pre-existing URL is https://novex-showcase-maxsweed918.netlify.app/ and represents an older deployment. The last attempted publication was refused because the prior team's credits were exhausted. This candidate has not been deployed. The owner requested browser authentication/account selection before continuing the Netlify phase; no paid upgrade or quota workaround is authorized.

## Remaining steps and limits

Finish the current evidence update and clean clone, obtain explicit public-publication/asset permission, publish and verify GitHub, complete Netlify account handoff, deploy only if quota permits, and audit the actual public release. Checkout and unset contacts remain honest demo limitations. Physical iPhone/Safari/Android hardware and field Core Web Vitals have not been tested.
