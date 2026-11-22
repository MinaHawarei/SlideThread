# SlideThread — Architecture & Design Decisions

Records rationale, alternatives, sizes, and platform verifications per `Spec.md` and `IMPLEMENTATION_PLAN.md`.

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

