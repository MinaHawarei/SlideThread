# IMPLEMENTATION PLAN

Read `Spec.md` fully before starting. This plan defines **order, tasks, and gates**. Spec = what; this file = how and when.

---

## 0. Working agreement for the agent

1. **Follow the phases in order.** Do not start a phase until the previous phase's gate passes. Phase 0 is a gate for the whole project.
2. **Small steps, small commits.** One task = one commit (Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`). Keep `main` deployable.
3. **Tests with the code.** Pure logic (palette, aspect, fit math, paste parser, migrations, format registry, platform matrix) must ship with Vitest tests in the same commit.
4. **No new dependency without a note** in `docs/DECISIONS.md` (what, why, alternatives, size).
5. **Ambiguity rule:** use the Spec default, write a line in `docs/DECISIONS.md`, move on. Stop and ask the owner only when a decision is expensive to reverse (name, license, domain, data format).
6. **Verify platform facts** (image sizes, limits) against current official documentation before hardcoding. Record sources and dates in `docs/DECISIONS.md`.
7. **Never fake results.** If a check can't be run (e.g. no iOS device available), say so in `docs/QA_CHECKLIST.md` and mark it "needs manual check by owner".
8. **Quality bar:** TypeScript strict, ESLint clean, no `any` without a comment, no console errors, accessible controls.
9. At the end of each phase, update `README.md` status and tick the gate checklist below.

Commands the repo must provide (document in README): `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:e2e`.

---

## Phase 0 — Foundation and export spike (GATE)

**Goal:** prove that export fidelity is achievable (especially Arabic text) before building features on top of it.

### Tasks
- **P0-1 Scaffold:** Vite + React + TypeScript strict, Tailwind, ESLint, Prettier, Vitest, Playwright, Zustand. Folder layout from Spec §13. `src/config/site.ts` with `APP_NAME`, `OWNER`, `FEEDBACK_URL`, `GITHUB_URL` (placeholders).
- **P0-2 Deploy:** connect to Vercel, confirm preview URL works. Add `vercel.json` with a CSP (allow self, Vercel Analytics, data: images, blob:), and security headers.
- **P0-3 Fonts:** install and wire `@fontsource` packages (IBM Plex Sans, IBM Plex Sans Arabic, JetBrains Mono) for the needed weights (400/500/700; mono 400/700). Add a `fontsReady()` helper that awaits `document.fonts.load()` for each used font + weight.
- **P0-4 Export spike page** (`/spike`, dev-only route or separate HTML entry): render a test slide set at 1080×1350, 1080×1080, 1080×1920, and 1920×1080 containing:
  - Arabic paragraph with ligatures and diacritics; mixed Arabic/English/number text; RTL and LTR blocks
  - Monospace code block (LTR) inside an RTL slide
  - CSS variables, linear gradients, border radius, box-shadow, `rgba` borders
  - Inline SVG background with ~100 nodes/lines (the Network background)
  - A large uploaded image (e.g. 4000×3000 JPEG) and a PNG with transparency, as `data:` URLs
  - Circular avatar with ring (box-shadow) and a gradient fallback
- **P0-5 Candidate libraries:** implement `capture(node, size)` with `html-to-image` and with `modern-screenshot` behind the same interface. Add the warm-up capture, font/image-readiness waits, and unscaled offscreen stage.
- **P0-6 Evaluate** on the matrix: Chrome desktop, Firefox, Safari macOS, iOS Safari, Android Chrome. For each: pixel-compare to the on-screen render (visual inspection + automated diff in Playwright for Chromium), time per slide, memory behavior exporting 10 slides on a phone.
- **P0-7 Build PDF and ZIP** from captured PNGs (`jsPDF`, `JSZip`) in the spike; verify page size equals slide size and files open correctly.
- **P0-8 Write `docs/EXPORT_SPIKE.md`:** results table, chosen library, known limitations, workarounds, and any fallback decision.

### Gate G0 (must all be true)
- [x] Deployed preview URL works (owner-verify pending: D-01).
- [x] A chosen capture library produces output matching the preview for Arabic text, gradients, SVG, shadows, images, in Chromium (automated) and manually verified on at least one Safari/iOS target, or explicitly flagged "owner must verify" (flagged in docs/QA_CHECKLIST.md).
- [x] PNG, ZIP, PDF all generate correctly in the spike.
- [x] `docs/EXPORT_SPIKE.md` written. If both libraries fail, document a fallback plan (e.g. canvas-based renderer for text) and **stop to ask the owner** before continuing.

---

## Phase 1 — Core domain and engine (no UI polish)

**Goal:** all pure logic and the slide rendering engine, testable without the wizard.

### Tasks
- **P1-1 Schema & migrations:** types from Spec §3, `schemaVersion`, `migrate()`, zod (or hand-written) runtime validation for imports. Tests: valid, missing fields, unknown version, malformed.
- **P1-2 Format & platform registries:** Spec §4. Helper `getAllowedFormats(platform, contentType)`, `getDimensions(format, orientation)`, `aspectClass(w,h)`. Tests for every cell of the platform matrix and the aspect class thresholds.
- **P1-3 Palette:** `generatePalette(primaryHex, theme)` per Spec §7.2 with `culori`. Tests: contrast ratios (ink/bg ≥ 7, mute/bg ≥ 4.5, onAcc/acc ≥ 4.5, acc/bg ≥ 3) across edge colors (`#000`, `#fff`, `#808080`, `#ffff00`, `#ff0000`, `#00ffff`), dark and light. Include presets that reproduce the Network reference tokens for the default color.
- **P1-4 Text fit:** `useFitText` (or equivalent) with measure-then-scale loop, min scale 0.6, overflow flag; deterministic; callable from export before capture. Unit-test the math with a mocked measurer.
- **P1-5 Slide components (9 types)** under `src/slides/`, each with the 4 aspect-class layout variants (Spec §5.2), logical CSS properties, `dir="auto"` handling, code always LTR. Storybook is optional; instead create a dev gallery route `/gallery` rendering every slide type × aspect class × theme × direction × template.
- **P1-6 Media support:** `MediaRef`, image downscale util (max long side 2400, preserves alpha), IndexedDB asset store with `idb-keyval`, object-URL lifecycle management, placements (`background | top | side | replace-text`), focal point.
- **P1-7 Signature bar** (+ socials row, counter, placeholder avatar) per Spec §6.2, including no-overflow behavior when names/handles are long.
- **P1-8 Template system:** `TemplateDef` + registry. Implement **Network** completely (continuous seeded network across slides, rule motifs, connected bullets) using the algorithm in Spec §7.1; unit-test the generator for determinism and cross-slide continuity.
- **P1-9 Story safe zones** and overlay.

### Gate G1
- [x] `/gallery` shows all 9 slide types in all 4 aspect classes, dark/light, LTR/RTL, with no overflow or clipped content (check visually; Playwright screenshot snapshots committed).
- [x] All unit tests green; typecheck and lint clean.
- [x] Network background is identical across re-renders and continuous across adjacent slides.

---

## Phase 2 — Templates 2 and 3

- **P2-1 Clean template:** minimal, whitespace-led, flat cards, single accent, no background graphics. Distinct typography and spacing (not a recolor).
- **P2-2 Bold template:** large type, color blocks, thick borders, high contrast. Distinct from both others.
- **P2-3 Template QA:** gallery snapshots for all templates × formats × themes × RTL/LTR; fix overflow and contrast problems found.
- **P2-4 Design review pass:** compare against Spec §7.1 intent; ensure each template has a clear point of view and holds up with long Arabic text and with image-heavy slides.

### Gate G2
- [x] 3 templates, all 9 slide types each, no visual regressions in snapshots, contrast verified by tests where applicable.

---

## Phase 3 — App shell, wizard, and editor

### Tasks
- **P3-1 i18n:** typed dictionaries `en.ts`/`ar.ts`, `useT()`, language switch, app-level RTL flip. CI/test: both dictionaries have identical key sets.
- **P3-2 State:** Zustand stores for settings, current project, recent projects list; selectors that avoid re-rendering all slides on each keystroke.
- **P3-3 Start screen:** guided path, direct-size path, recent projects (open/duplicate/delete), import project, demo projects (Spec §11).
- **P3-4 Wizard:** platform → content type → format (+ orientation) → template, with live mini-previews; enforce the matrix from Spec §4.2; post type = single slide.
- **P3-5 Editor desktop:** slide rail (reorder via drag, add, duplicate, delete), main canvas with scaled preview, inspector tabs (Slide / Design / Brand). Type switch keeps compatible fields. Overflow warning + "Split into two slides" action.
- **P3-6 Editor mobile:** single-slide swipe canvas, bottom tab bar, bottom-sheet inspector, horizontal thumbnail strip, ≥ 44 px touch targets. Test at 360×640 and 390×844.
- **P3-7 Design controls:** template picker, **free color picker** (any color → generated palette), dark/light toggle, text direction (auto/ltr/rtl), change format/orientation dialog with automatic relayout.
- **P3-8 Brand panel:** name, handle, photo upload (crop to square, downscale 400 px), remove photo, signature on/off, socials list and on/off, counter toggle, language. Persist to localStorage.
- **P3-9 Footer:** owner name + social links from `site.ts`, GitHub star link, feedback button (`FEEDBACK_URL` with `mailto:` fallback), privacy note, Vercel Analytics.
- **P3-10 Accessibility pass:** focus order, labels, keyboard operation for rail reorder (alternate buttons), reduced motion, contrast on app chrome.

### Gate G3
- [x] A new user can go from start → export-ready carousel on desktop and on a phone viewport using only the UI.
- [x] Switching format/orientation/template/color/theme never loses content (Playwright test).
- [x] No console errors; keyboard navigation works for the main flow.

---

## Phase 4 — Persistence, paste-to-slides, export

### Tasks
- **P4-1 Persistence:** autosave (debounced), versioned localStorage keys, IndexedDB assets, graceful quota/IDB failure messages, "Clear all my data".
- **P4-2 Project JSON export/import:** images embedded as base64, size warning, validation + migration on import, round-trip test (export → import → deep-equal, including images).
- **P4-3 Paste-to-slides:** parser per Spec §8.3 (pure, unit-tested for each rule and for Arabic input), dialog with preview list and per-slide type selectors, append/replace confirmation.
- **P4-4 Export dialog and pipeline:** use the library chosen in Phase 0. Outputs: single PNG, all PNG, ZIP, PDF. Range (all/current), progress, cancel, error handling, Web Share API on mobile when supported, recommended default per platform/type (Spec §4.2). Export stage per Spec §9.1 with font/image readiness, text-fit, warm-up capture.
- **P4-5 Export fidelity tests:** Playwright (Chromium) exports a project covering all slide types in Arabic and English and compares against golden screenshots with a small tolerance; assert PDF page size and ZIP file count.
- **P4-6 Performance pass:** memoization, code-splitting (export libs, paste dialog), measure typing latency on a 20-slide project, bundle size check.

### Gate G4
- [ ] Reload restores settings and the current project including images.
- [ ] JSON round-trip is lossless; malformed imports are rejected with clear messages.
- [ ] Export output matches preview for Arabic and English in Chromium (automated) and passes the manual Safari/iOS/Android checks (or is explicitly flagged for the owner).
- [ ] Typing latency and bundle size targets from Spec §12 met or deviations documented.

---

## Phase 5 — Beta release

- **P5-1 README:** what it is, screenshots/GIF, features, quick start, scripts, architecture overview, how to add a format, how to add a template, contributing, license, "Star the repo" call to action.
- **P5-2 Repo hygiene:** `LICENSE` (MIT), `NOTICE` (font licenses), issue templates (bug, feature, feedback), `CONTRIBUTING.md`, `.github/workflows/ci.yml` (lint, typecheck, unit tests, build; e2e optional).
- **P5-3 QA pass:** execute `docs/QA_CHECKLIST.md` (below) on desktop Chrome, Firefox, Safari, iOS Safari, Android Chrome; fix blockers; list remaining known issues in README.
- **P5-4 Lighthouse + accessibility:** mobile Accessibility ≥ 90; fix findings.
- **P5-5 Name and domain:** present 5 name candidates to the owner (check repo name and domain availability, avoid existing trademarks), then apply the chosen name via `APP_NAME` and update README, page title, and OG tags.
- **P5-6 Release:** tag `v0.1.0-beta`, production deploy on Vercel, share the URL, confirm analytics and feedback button work.

### Gate G5 (release)
- [ ] All Spec §14 acceptance criteria met or each deviation documented with owner sign-off.
- [ ] `v0.1.0-beta` deployed; feedback form reachable.

---

## `docs/QA_CHECKLIST.md` (create in Phase 5, run per browser)

1. Create a **carousel** on each platform (Instagram, LinkedIn, Facebook) with every allowed format; confirm the dimensions of exported files.
2. Create a **post** (single slide) and a **story** (9:16, safe zones visible).
3. Use every slide type in English, then in Arabic (long text, mixed bidi, numbers). Confirm no clipped text and correct letter joining in export.
4. Switch `16:9` between landscape and portrait with content in place; verify automatic relayout.
5. Change template, color (try very dark, very light, saturated yellow), theme; confirm readable contrast.
6. Add images: large photo, transparent PNG; each placement; focal point; replace-text mode.
7. Settings: photo upload/remove, signature off, socials on (1, 3, 5 accounts), long name/handle.
8. Paste text (with `---`, without, with code fence, quote, if/then, stat); preview and apply.
9. Reload page: everything restored. Export project JSON, clear data, import: everything restored.
10. Export PNG / ZIP / PDF for 1, 10, and 20 slides; check progress, cancel, and file sizes; on mobile check share sheet.
11. Switch UI to Arabic: layout flips correctly, no missing strings.
12. Offline reload (if PWA implemented), and slow-network behavior of first load.
13. Keyboard-only run of the main flow; screen-reader labels on key controls.
14. Footer links, GitHub link, feedback button, analytics request present, no other third-party requests in the network panel.

---

## Risk register and fallbacks

| Risk | Mitigation / fallback |
|---|---|
| Export library breaks Arabic joining or fonts on Safari | Phase 0 spike decides; fallback to second library; last resort: render text to canvas manually, only after asking the owner |
| iOS memory/canvas limits on long carousels | Export sequentially (one slide at a time), release canvases, cap concurrent work; warn above 20 slides |
| localStorage quota | Images in IndexedDB; text-only in localStorage; graceful error UI |
| Platform specs change | Single registry file; re-verify at implementation time; note date in decisions |
| Auto-fit text looks inconsistent | Min scale 0.6, overflow warning, split-slide action; snapshot tests |
| Generated palettes look dull or low-contrast | Contrast tests on edge colors; allow user to switch theme; manual review of 10 sample colors in the gallery |
| Scope creep | Anything not in Spec §14 goes to `docs/BACKLOG.md`, not into v1 |

---

## Backlog (explicitly after v1)
More slide types, more templates, user-uploaded templates (JSON), shareable project links, PWA/offline polish, syntax highlighting for code slides, extra fonts per template, saved brand kits (multiple), direct scheduling/publishing integrations.

---

## Definition of done per task
Code merged, tests added/updated and passing, lint + typecheck clean, relevant docs updated, no new console errors, and the gate checklist for the phase updated in this file (tick boxes in a short `## Status` section appended at the end as phases complete).

## Status
- [x] G0 (owner-verify pending: D-01)  - [x] G1  - [x] G2  - [x] G3  - [ ] G4  - [ ] G5
