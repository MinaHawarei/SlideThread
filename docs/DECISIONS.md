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
