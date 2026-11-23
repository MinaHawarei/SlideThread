# SlideThread — Architecture & Design Decisions

Records rationale, alternatives, sizes, and platform verifications per `Spec.md` and `IMPLEMENTATION_PLAN.md`.

## 2026-11-23 — Template CLI validation dependencies (R2-7)
- **Decision:** Add `ajv` + `ajv-formats` for the template CLI to execute the repository's Draft 2020-12 JSON Schema, and `sharp` 0.35.5 to encode WebP previews and perform tolerant pixel comparisons. Keep all three in `devDependencies`; none is imported by the shipped browser app, so app gzip impact is 0 KB.
- **Why:** The manifest's published JSON Schema must run in CI independently of the Zod runtime schema. Ajv uses a separate class for Draft 2020-12 and format validators are provided by `ajv-formats`. `sharp` avoids relying on system-installed image tools and supports the required WebP output and pixel-level comparison.
- **Alternatives:** Zod-only validation would not execute the published JSON Schema. A custom JSON Schema evaluator or hand-built image conversion/diff code would duplicate standards and image codec behavior. System ImageMagick/cwebp would add an undocumented CI host dependency.
- **License:** Ajv and ajv-formats are MIT; sharp is Apache-2.0. Sharp's ready-compiled libvips binaries are build-tool dependencies only and are not shipped in the browser application. Sources checked 2026-11-23: https://ajv.js.org/json-schema, https://github.com/ajv-validator/ajv/blob/master/LICENSE, https://github.com/ajv-validator/ajv-formats, https://www.npmjs.com/package/sharp, https://sharp.pixelplumbing.com/install/.
- **Dependency size:** Development-only Node tools; browser bundle/gzip delta: 0 KB. No production asset is added.
- **Decision:** Use the existing `src/templates/starters/<id>/` folders named by R2-6, rather than introducing the prose example's category/slug directory shape. This preserves current manifests, preview URLs, and lazy loaders; the index derives category relationships from each manifest.

## 2026-11-23 — Template CSS manifest representation (R2-8)
- **Conflict:** `REVISION_PLAN.md` §5.1 describes level-4 CSS as a `style.css` file path, while the implemented Zod and JSON Schemas define `customCss` as CSS text. The runtime accepts CSS text separately from its template load path, and the application preview does not yet apply contributed template CSS.
- **Decision:** Document the current inline `customCss` representation and clearly label preview/runtime application as pending. Do not promise separate `style.css` support until the schema and runtime are reconciled; the contributor's ordinary theme-only path remains fully data-only and verified.
- **Remaining:** Reconcile the plan/schema contract and apply sanitized custom CSS in the template runtime before advertising level 4 as a supported user-visible extension.

## 2026-11-23 — Schema v2 migration defaults (R1-1)
- Plain string fields migrate to one unmarked paragraph/run; existing content remains editable in the legacy field editor until R4 provides rich text editing.
- Legacy template IDs map `network` → `tech-mesh`, `clean` → `clean-minimal`, and `bold` → `bold-marketing`.
- New v2 defaults use the standard bottom-right number counter and bottom-center inline signature. Counter display is enabled only for carousels; the `network` template maps to an enabled mesh pattern at intensity 1, while other legacy templates default to no pattern.
- These are deterministic compatibility defaults because the plan defines the v2 shape but does not define per-project migration values.

## 2026-11-23 — Coptic font package for the lazy font registry (R1-5)
- Add `@fontsource/noto-sans-coptic@5.3.0` to satisfy the plan's Coptic-script registry requirement. The selected Coptic WOFF2 subset is 20,196 bytes (20,260 bytes when gzip-wrapped); it is dynamically imported only when a Coptic font is requested or Coptic text is exported. Package unpacked size is approximately 107 KB.
- License checked in the installed package metadata and license file and against Fontsource's [Noto Sans Coptic details](https://fontsource.org/fonts/noto-sans-coptic/about) on 2026-11-23: SIL OFL-1.1; attribution is recorded in `NOTICE` and `docs/ASSET_LICENSES.md`. Upstream font source: [notofonts/coptic](https://github.com/notofonts/coptic).
- Alternative considered: keep a platform fallback and omit Coptic registration. Rejected because output would vary by device and the R1-5 plan explicitly requires Coptic-capable fonts in the registry. No additional typeface package is needed for English, Arabic, or code; their existing OFL packages remain unchanged.

---

## 2026-11-22 — Project scaffolding & tooling (P0-1)
- **Framework & Bundler:** Vite 5 + React 18 + TypeScript (strict). Fast builds, standard ESM bundling.
- **Styling:** Tailwind CSS v3 for app chrome; slide components will use plain CSS / CSS modules with CSS custom properties to ensure deterministic export renders.
- **Testing:** Vitest for unit tests; Playwright configured with Chromium/system Chrome for e2e and export verification tests.
- **Directories:** Created Spec §13 directory structure (`core`, `store`, `templates`, `slides`, `render`, `export`, `i18n`, `ui`, `tests`).

## 2026-11-22 — Vercel configuration & security headers (P0-2)
- **CSP Policy:** Restricts scripts and connections to self and Vercel Analytics (`va.vercel-scripts.com`, `vitals.vercel-insights.com`). Allows `data:` and `blob:` for images and client-side canvas/download generation.
- **Security Headers:** Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **SPA Rewrites:** Added rewrite for client-side routing on Vercel.
- **Owner Action:** Vercel deployment connection requires repository owner permissions (tracked under D-01 in `docs/TASKS.md` for Gate G0).

## 2026-11-22 — Typography & font loading (P0-3)
- **Self-hosted Fonts:** Installed `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-sans-arabic`, and `@fontsource/jetbrains-mono` (OFL license). Self-hosted and bundled with Vite to ensure offline availability and avoid Google Fonts CDN requests.
- **Weights:** 400, 500, 700 for Sans and Sans Arabic; 400, 700 for JetBrains Mono.
- **Font Readiness:** Created `fontsReady()` helper in `src/core/fonts.ts` awaiting `document.fonts.ready` and explicitly calling `document.fonts.load()` with Arabic test glyphs and Latin test text before any measurement or export.

## 2026-11-22 — Export candidate libraries interface (P0-5)
- **Libraries:** Installed `html-to-image` and `modern-screenshot` behind unified `capture(element, options)` interface in `src/export/capture.ts`.
- **Pre-capture Pipeline:** Runs `fontsReady()` and `imagesReady()` (decoding `<img>` elements) prior to capture.
- **Warm-up Pass:** Executes a pre-pass capture to prevent first-render font/layout glitches common on WebKit/Safari.

## 2026-11-22 — Candidate evaluation & matrix results (P0-6)
- **Candidate Performance:** Tested in Chromium across 1080×1350, 1080×1080, 1080×1920, and 1920×1080.
  - `html-to-image`: ~200–450ms per slide; excellent fidelity for Arabic ligatures, diacritics, SVG network, shadows, and images.
  - `modern-screenshot`: ~600–1100ms per slide; functional but noticeably higher latency.
- **Multi-slide Sequential Export:** 10 consecutive slide captures completed without memory bloat or canvas exhaustion.
- **Device Checks:** Documented real-device iOS Safari and Android Chrome test procedures in `docs/QA_CHECKLIST.md` for owner verification.

## 2026-11-22 — PDF and ZIP generation (P0-7)
- **Libraries:** Added `jspdf` for raster PDF assembly and `jszip` for multi-PNG packaging.
- **PDF Page Sizing:** Configured `unit: 'px'` with `hotfixes: ['px_scaling']` to ensure PDF dimensions match the slide pixel dimensions 1:1.
- **ZIP Naming:** Enforces `{project-title-slug}-{nn}.png` naming convention per Spec §9.2.

## 2026-11-22 — Schema definition & migration engine (P1-1)
- **Validation Engine:** Added `zod` for runtime schema validation on import and persistence.
- **Data Model:** Defined all Spec §3 domain models (`Project`, `Slide`, `MediaRef`, `BrandSettings`, `FormatDef`) in `src/core/schema.ts` with `CURRENT_SCHEMA_VERSION = 1`.
- **Migration:** Implemented `migrate(data)` in `src/core/migrate.ts`. Handles v0 legacy formats with safe defaults, preserves valid v1 projects, and explicitly throws on unsupported future versions or malformed payloads.

## 2026-11-22 — Format & platform registries (P1-2)
- **Format Registry:** Implemented `src/core/formats.ts` with 4 formats (`r_4_5`, `r_1_1`, `r_9_16`, `r_16_9`). All formats share short side 1080 px per Spec §4.1.
- **Orientation:** Handled for orientable format `r_16_9` (1920×1080 landscape default, 1080×1920 portrait).
- **Aspect Classes:** `aspectClass(w, h)` per Spec §5.2 (`landscape` > 1.2, `square` 0.9..1.2, `portrait` 0.65..<0.9, `tall` < 0.65).
- **Platform Matrix Re-verification:** Re-verified platform image sizes, formats, and limits against official platform specs:
  - **Instagram:** Feed posts and carousels support 4:5 (1080×1350), 1:1 (1080×1080), 16:9 (1920×1080 / 1080×566). Stories support 9:16 (1080×1920). Instagram officially expanded carousel slide limit to 20 media items in August 2024. Soft warning implemented for carousel > 20 slides.
  - **LinkedIn:** Document post carousels support 4:5 (1080×1350), 1:1 (1080×1080), 16:9 (1920×1080) exported as PDF (up to 300 pages, 100MB). Stories were sunset by LinkedIn in late 2021, so stories are not offered.
  - **Facebook:** Multi-image carousels support 1:1 and 4:5; stories support 9:16.
  - **Custom (Direct Size):** Offers all formats for post/carousel and 9:16 for stories.
  - **Export Defaults:** Preselects PDF for LinkedIn carousel, ZIP for Instagram/Facebook/Custom carousel, and PNG for single posts and stories per Spec §4.2. Soft warning for carousels with >30 slides across platforms.

## 2026-11-22 — Story safe zones verification (P1-9)
- **Official Platform Specs:** Re-verified story safe zones against official Instagram/Facebook design specifications for 9:16 vertical content (1080×1920 px):
  - Top ~14% (~250–270 px; exactly 268.8 px at 14% of 1920) is covered by native UI: user avatar, username, timestamp, close button, progress bars, audio name.
  - Bottom ~14% (~250–270 px; exactly 268.8 px at 14% of 1920) is covered by interactive UI: "Send message" reply input, quick reactions, share icon, like heart.
  - Safe area is vertical bounds 14% to 86% (269 px to 1651 px).
- **Implementation:** Defined `STORY_SAFE_ZONE_PERCENT = 0.14` in `src/core/storySafeZones.ts`. Built `StorySafeZoneOverlay` component rendering visual boundaries, dashed guides, and UI labels when toggled on. Added safe zone toggle in `/gallery` and wired safe zone padding in `slides.css` (`.aspect-tall .slide-content-area` and `.aspect-tall .slide-signature-container`). Overlay carries `data-no-export="true"` so it is never captured in final exports.

## 2026-11-22 — Templates 2 & 3: Clean & Bold and Design Review Pass (P2-1, P2-2, P2-4)
- **Design Review Comparison (Spec §7.1):**
  - **Network:** Developer / technology identity. Seeded deterministic mulberry32 graph spanning across carousel width, smooth gradient canvas, 24px radius translucent cards, cyan and violet dual-accent motifs, pill-shaped tags (radius 9999px).
  - **Clean:** Editorial / minimalist identity. Pure whitespace-led layout, solid flat background, no background graphics, flat cards with subtle 1px border, crisp 12px corners, 6px chip radius, single accent (no dual-accent gradients), lighter airy typography scale (h1: 96, h2: 64, body: 38).
  - **Bold:** High-contrast neo-brutalist / architectural identity. Large type (h1: 124, h2: 80, body: 44), 3.5px solid borders, sharp 0px radius geometry, high contrast color blocks with solid offset shadows (`box-shadow: 6px 6px 0px var(--acc)` / `var(--ink)`), uppercase badges, square avatar blocks, solid button with ink border, and giant stat values with ink text shadows.
- **Long Arabic Text Handling:**
  - Evaluated multi-line Arabic text with mixed bidi (English technical terms, commands, numbers), complex ligatures, and diacritics.
  - Verified `dir="rtl"` logical CSS properties (`padding-inline`, `border-inline-start`, `text-align: start`) mirror accurately without text clipping.
  - Confirmed strict absence of `letter-spacing` anywhere in slide text rules (preserving Arabic font ligature joining per Spec §5.5 and engineering conventions).
  - Slide counters strictly maintain `dir="ltr"` and tabular figures across both English and Arabic projects.
- **Image-Heavy Slides & Media Placements:**
  - Full-bleed media (`ImageSlide`), `background`, `top`, `side`, and `replace-text` placements hold up across all 3 templates.
  - Caption bar styled appropriately for each template: gradient overlay in Network, flat semi-transparent dark bar in Clean, solid contrast block with top accent border in Bold.

## 2026-11-22 — Persistence architecture & quota resilience (P4-1)
- **localStorage vs IndexedDB Partitioning (Spec §8.2):**
  - Text metadata and project settings are stored in `localStorage` (`app:current-project:v1` and `app:projects:v1`).
  - Large binary assets (images, photos) are stored in `IndexedDB` (`idb-keyval` store `slidethread-assets-db`/`media-assets`) keyed by `assetId`.
  - Rationale: Browsers strictly limit `localStorage` to ~5 MB. Storing image bytes in localStorage exhausts this limit immediately. Offloading binaries to IndexedDB while keeping text and settings in localStorage satisfies the owner's preference for client-side privacy while ensuring storage longevity.
- **Autosave Pipeline:** Debounced ~500ms on project mutation in `useProjectStore`, automatically syncing changes to `app:current-project:v1` and updating the recent projects list in `app:projects:v1`.
- **Quota Resilience:** Custom storage wrapper traps `DOMException` (`QuotaExceededError`). If localStorage quota is reached, in-memory state is preserved, an unobtrusive banner alerts the user to export JSON or delete older projects, and execution never crashes.
- **Data Cleanup ("Clear all my data"):** Removes `app:settings:v1`, `app:projects:v1`, and `app:current-project:v1` from localStorage and clears all IndexedDB media assets via `clearAllAssets()`.

## 2026-11-23 — Rich text editor engine (R0-3)
- **Decision:** Use Tiptap with a small explicit extension set for R4; persist the planned application `RichText` model and convert to/from Tiptap JSON. Do not persist editor HTML or private editor JSON.
- **Evidence:** Chromium probes selected an Arabic range under RTL, serialized bold as a typed mark, and inserted plain clipboard text without changing surrounding marks. Lexical also represented RTL text and marks after configuring root direction in its model, but its text-format integer and style fields need mapping into the planned run-mark schema. Browser probes do not validate native Arabic IME behavior.
- **Bundle:** Isolated Vite 5.4.11 + React 18.3.1 production probes measured 146.35 kB gzip initial-route JavaScript for Tiptap's small extension set and 127.27 kB for Lexical React rich-text plus history. The Tiptap probe omitted editor-local history; the application's shared undo/redo owns history. Tiptap StarterKit measured 177.16 kB route JavaScript gzip with broader behavior. These are prototype measurements, not app-wide bundle deltas.
- **License/version check (2026-11-23):** npm registry reported Tiptap 3.35.0 and Lexical 0.53.0; both project licenses are MIT. Official metadata: https://www.npmjs.com/package/@tiptap/react, https://www.npmjs.com/package/lexical, https://github.com/ueberdosis/tiptap/blob/main/LICENSE, https://github.com/facebook/lexical/blob/main/LICENSE.
- **Primary behavior sources checked (2026-11-23):** Tiptap React integration and JSON output https://tiptap.dev/docs/editor/getting-started/install/react; editor JSON, HTML and `textDirection` https://tiptap.dev/docs/editor/api/editor; paste/clipboard schema behavior https://tiptap.dev/docs/guides/faq; Lexical React bindings, state and JSON https://lexical.dev/docs/intro.
- **Owner action:** Native Arabic composition, bidi caret/selection during composition, and touch checks on real iOS Safari and Android Chrome remain pending D-09. Exact steps are in `docs/QA_CHECKLIST.md`. No dependency was added to the application by this spike.

## 2026-11-23 — Sortable slide rail (R0-4)
- **Decision:** Use Motion React `Reorder` by itself for the single slide rail in R7-1. It supplies keyboard reorder and spring layout animation; configure a separate drag handle to activate touch drag after a short hold. Keep Move Up/Down buttons and add a localized polite live-region announcement.
- **Evidence:** Chromium keyboard probe reordered with Space + ArrowDown and showed an in-progress layout transform; Chrome 390×844 mobile emulation reordered after a 350 ms Motion handle hold and preserved order on short tap. With `prefers-reduced-motion: reduce`, keyboard reorder still updated order. Current dnd-kit with Motion also passed keyboard and delayed touch probes; dnd-kit alone has no spring transition.
- **Bundle:** Vite 5.4.11 / React 18.3.1 prototype route gzip: Motion reorder 99.47 kB; current `@dnd-kit/react` sortable alone 85.11 kB; dnd-kit plus Motion layout 134.95 kB. The spring-capable combined stack was about 35.5 kB larger than Motion alone. Prototype figures, not application-wide delta.
- **License/version check (2026-11-23):** Motion 14.14.0 and `@dnd-kit/react` / `@dnd-kit/dom` 0.5.3 are MIT. Current dnd-kit documentation uses the React/dom architecture; the older `@dnd-kit/core` + `@dnd-kit/sortable` API is covered by a migration guide. No app dependency added by this spike.
- **Primary sources checked (2026-11-23):** Motion reorder and keyboard guide https://motion.dev/docs/react-reorder; Motion drag controls https://motion.dev/docs/react-use-drag-controls; Motion reduced-motion guide https://motion.dev/docs/react-accessibility; Motion layout springs https://motion.dev/docs/react-layout-animations; dnd-kit sortable API https://dndkit.com/react/hooks/use-sortable/; dnd-kit sensors https://dndkit.com/react/guides/sensors/; dnd-kit migration guide https://dndkit.com/react/guides/migration/; Motion license https://github.com/motiondivision/motion/blob/main/LICENSE.md; dnd-kit license https://github.com/clauderic/dnd-kit/blob/main/LICENSE.
- **Owner action:** Physical iOS and Android long-press/scroll/reduced-motion checks remain pending D-09; exact steps are in `docs/QA_CHECKLIST.md`. Desktop/Chrome touch emulation does not prove real-device behavior.

## 2026-11-23 — Template SVG and CSS sanitizers (R2-4)
- **Decision:** Use DOMPurify 3.5.0 with a strict SVG tag/attribute allowlist and XML parse checks. Use css-tree 3.2.1 to parse CSS to an AST, then validate scope, selectors, properties, functions, and size limits before serializing. Use `@types/css-tree` 3.2.0 for TypeScript declarations.
- **Why:** DOMPurify is purpose-built for HTML/SVG sanitization. css-tree provides a CSS parser, AST walker, and generator. This avoids unsafe regex-based sanitization; PostCSS was not chosen because it is already used as build tooling and this feature needs explicit CSS AST validation and serialization as a direct runtime utility.
- **Constraints:** SVG ≤100,000 characters; CSS ≤8,000 characters, 128 rules, and 512 declarations. CSS must be scoped to the template root class, disallows sibling selectors and at-rules, and only permits listed properties/functions. SVG excludes scripts, foreign objects, links and external paint URLs.
- **Alternatives:** PostCSS AST; browser-only handwritten checks; rejecting all CSS and SVG. The latter two cannot meet the planned template contribution levels; a vetted parser plus allowlists is the safer compromise.
- **Bundle:** An isolated esbuild browser bundle of `src/templates/security/sanitizers.ts` is 231.6 KB minified and 70,412 bytes gzip. It is loaded only when a caller imports the sanitizer; the helper is not yet wired into a runtime route (that is R2-5/R6-6 work).
- **License/version check (2026-11-23):** DOMPurify 3.5.0 is `(MPL-2.0 OR Apache-2.0)`; this project records the Apache-2.0 option in `NOTICE`. css-tree 3.2.1 and `@types/css-tree` 3.2.0 are MIT. Versions and license identifiers were checked against installed package metadata and the upstream license files. Sources: https://github.com/cure53/DOMPurify, https://github.com/cure53/DOMPurify/blob/main/LICENSE, https://github.com/cure53/DOMPurify/blob/main/LICENSE-MPL, https://github.com/csstree/csstree, https://github.com/csstree/csstree/blob/master/docs/parsing.md, https://github.com/csstree/csstree/blob/master/LICENSE, https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/css-tree.

## 2026-11-23 — Prefix-stable mesh pattern (R0-5)
- **Decision:** Generate pattern geometry per tile from `seed + tileIndex`; derive left/right crossing connectors independently from stable boundary indices. Never scale earlier node coordinates by whole-carousel width or use the total slide count to create a tile.
- **Conflict:** Baseline `Spec.md` §7.1 describes a whole-carousel-width graph and the current `generateCarouselNetwork()` uses `totalWidth` to distribute nodes. The newer `REVISION_PLAN.md` §5.1 requires per-tile prefix-stable generation; the revision amendment governs the R2-3 implementation. The current Network template remains untouched in this spike.
- **Evidence:** Vitest confirms tile models and SVG output for the first three slides remain identical when generated as a 3-slide or 5-slide prefix, and shared seam endpoints globalize to the same exact line. The current whole-width generator's first node changes when count increases from 1 to 2. A Playwright Chromium export test captures prior slide crops with `capture()` before/after append and compares all RGBA channels byte-for-byte; it also verifies line pixels meet across two adjacent crops. No dependency added.
- **Primary project sources checked (2026-11-23):** `docs/Spec.md` §7.1; `docs/REVISION_PLAN.md` §5.1; `src/core/network.ts`; `src/templates/NetworkBackground.tsx`; `src/export/capture.ts`.
- **Scope:** `tests/fixtures/meshPatternPrototype.ts` is spike-only; migrate the approach into the registry/generator architecture in R2-3 and cover all aspect classes, themes, and export cases there.

