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
- **CSP Policy:** Restricts scripts and connections to self and Vercel Analytics (`va.vercel-scripts.com`, `vitals.vercel-insights.com`). Allows `data:` and `blob:` for images and client-side canvas/download generation.
- **Security Headers:** Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **SPA Rewrites:** Added rewrite for client-side routing on Vercel.
- **Owner Action:** Vercel deployment connection requires repository owner permissions (tracked under D-01 in `docs/TASKS.md` for Gate G0).
