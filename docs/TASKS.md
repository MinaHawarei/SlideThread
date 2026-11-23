# SlideThread Tasks

## How to use
- Done column markers: `[ ]` not started · `[~]` in progress (claimed) · `[x]` done and verified · `[!]` blocked (reason in Notes and log) · `[s]` superseded by the revision plan (Notes name the replacing task).
- Source of truth for order and status. Agents follow `MASTER_PROMPT.md`.

## Definition of Done (every task)
Code merged to the task branch, tests added and passing, lint + typecheck + build clean, relevant docs updated, no new console errors, plan acceptance check satisfied.

## Decisions and owner actions
| ID | Item | Blocks | Answer | Done |
|---|---|---|---|---|
| D-01 | Connect the repo to Vercel and confirm the preview URL works (owner-only) | none | Non-blocking. Owner connects repo and verifies preview. | [ ] |
| D-02 | Provide `FEEDBACK_URL` (external form), `GITHUB_URL`, and owner social links for `site.ts` (owner-only) | none | Placeholders in site.ts (Mina Hawarei, @minahawarei, mailto: fallback per Spec §10.4); owner fills production links. | [x] |
| D-03 | Choose final app name | none | SlideThread | [x] |
| D-04 | Run manual device checks listed in `docs/QA_CHECKLIST.md` (iOS Safari, Android Chrome) (owner-only) | none | Non-blocking. Owner performs physical device testing per checklist. | [ ] |
| D-05 | Production deploy and `v0.1.0-beta` tag (owner-only) | none | Non-blocking. Owner tags release and deploys to production. | [ ] |
| D-06 | Owner picks UX direction A/B/C from `/ux-preview` | none | A — Atelier (agent recommendation). Owner reviews the design at the end and may request changes. | [x] |
| D-07 | Owner chooses display name for `tech-mesh` template | none | Weave (ar: نسيج). Set it as the display name of template id `tech-mesh` (id unchanged) in en/ar. | [x] |
| D-08 | Owner decision on illustration/sticker sourcing if licensed assets are insufficient | none | Agent decides: ship only clearly licensed assets, document gaps in docs/BACKLOG.md, record choice in docs/DECISIONS.md. Non-blocking. | [ ] |
| D-09 | Owner runs Arabic IME and touch checks on real devices (iOS, Android) (owner-only) | none | Non-blocking. Owner runs physical device checks per docs/QA_CHECKLIST.md and docs/OWNER_REVIEW.md. | [ ] |
| D-10 | Owner reviews UX pack and approves (or lists changes) | none | Non-blocking. Owner reviews design after agent finishes everything; does not block GR8 or R9. | [ ] |
| D-11 | Owner nominates reviewers for Coptic / Islamic categories before any template there is accepted | none | Not needed. Coptic and Islamic are ordinary categories. Templates in them contain only colors, shapes, and patterns; no text. | [x] |

## Revision phases

### Phase R0 — Audit, spikes, UX direction (GATE GR0)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R0-1 | Repo audit. Read the repo, `TASKS.md`, and the log. Write `docs/REVISION_AUDIT.md`: what exists per original task, gaps versus §2 amendments. Apply §2.1 to rows not `[x]` (mark superseded rows `[s]` with a pointer). | — | [x] | Codex 2026-11-23 · feature/r0-1 · 68b9d49 |
| R0-2 | Spike: manipulation. Compare `react-moveable` and a custom pointer/`@use-gesture` approach: move/resize/rotate, snapping, touch pinch, RTL, 60 fps on a mid-range phone, export capture of transformed elements. Write `docs/spikes/MANIPULATION.md`. | R0-1 | [x] | Codex 2026-11-23 · feature/r0-2 · 1e05582 |
| R0-3 | Spike: rich text. Compare Tiptap and Lexical (fallback: minimal custom). Test Arabic composition, bidi selection, marks serialization, paste, bundle size. Devices needed for IME checks → add owner action (D-09). Write `docs/spikes/RICHTEXT.md`. | R0-2 | [x] | Codex 2026-11-23 · feature/r0-3 · 6530bac |
| R0-4 | Spike: sortable animation. `dnd-kit` + `motion` (or alternatives): spring reorder, touch long-press, keyboard, reduced motion. `docs/spikes/SORTABLE.md`. | R0-3 | [x] | Codex 2026-11-23 · feature/r0-4 · 96ce7ab |
| R0-5 | Spike: continuous pattern. Prefix-stable tile-based `mesh` prototype; verify boundary continuity and that appending slides does not change earlier ones, including in exported crops. `docs/spikes/PATTERN.md`. | R0-4 | [x] | Codex 2026-11-23 · feature/r0-5 · 78c0ce8 |
| R0-6 | UX direction. Produce three distinct visual directions (A/B/C) for the app's own design language as built pages on a dev-only `/ux-preview` route (home, gallery, editor), with design tokens, type pairing, motion language, and illustration style per direction (§7). Screenshots in `docs/ux-review/R0-6/`. | R0-5 | [x] | Codex 2026-11-23 · feature/r0-6 · 0d29526 |
| GR0 | Gate GR0 verification | R0-1…R0-6 | [x] | Codex 2026-11-23 · feature/gr0 · f23805a |

### Phase R1 — Foundations (GATE GR1)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R1-1 | Schema v2 types, runtime validation, `migrate` v1→v2, feature flags file. | GR0, G0 | [x] | Codex 2026-11-23 · feature/r1-1 · 7c9eaff |
| R1-2 | Undo/redo infrastructure with coalescing and shortcuts (§5.2). | R1-1, G0 | [x] | Codex 2026-11-23 · feature/r1-2 · 4c3dde9 |
| R1-3 | Design tokens and component kit for the chosen direction (Radix primitives + Tailwind, shadcn-style): buttons, inputs, dialogs, popovers, tabs, sliders, tooltips, toasts, color picker, menus; dark/light; RTL via logical properties; a `/kit` gallery route. | R1-2, G0 | [x] | `572b380` — 2026-11-23 |
| R1-4 | App shell and routing (Home, Gallery, Editor, Settings), code splitting, i18n extension. | R1-3, G0 | [x] | Codex 2026-11-23 · feature/r1-4 · 6a78088 |
| R1-5 | Fonts registry and lazy loader (§5.9). | R1-4, G0 | [x] | Codex 2026-11-23 · feature/r1-5 · 18fb7b5 |
| GR1 | Gate GR1 verification | R1-1…R1-5 | [x] | Codex 2026-11-23 · feature/gr1 · 3897a01 |

### Phase R2 — Template platform (GATE GR2)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R2-1 | Template schema (TS + JSON Schema), `categories.json`, `extends` resolution, fixed vs color-flexible palettes. | GR1 | [x] | Codex 2026-11-23 · feature/r2-1 · c6b89e8 |
| R2-2 | Layout archetypes: ≥ 2 per slide type × 4 aspect classes, stable element ids (supersedes P1-5). | R2-1 | [x] | Codex 2026-11-23 · feature/r2-2 · e4eec5c |
| R2-3 | Decoration generators (`mesh`, `dots-grid`, `waves`, `geometric`, `blobs`, `none`), toggle and intensity, prefix-stable. | R2-2 | [x] | Codex 2026-11-23 · feature/r2-3 · 04c4cb3 |
| R2-4 | Sanitizers and validators for SVG and CSS (§5.1) using vetted libraries. | R2-3 | [x] | Codex 2026-11-23 · feature/r2-4 · 2ece08a |
| R2-5 | Template runtime: lazy load, resolve tokens/layouts/decor, fallbacks for missing archetypes. | R2-4 | [x] | Codex 2026-11-23 · feature/r2-5 · 4555d77 |
| R2-6 | The 5 starter templates (§5.8) with previews. | R2-5 | [x] | Codex 2026-11-23 · feature/r2-6 · 2e8f6af |
| R2-7 | Template CLI and CI (§5.1). | R2-6 | [x] | Codex 2026-11-23 · feature/r2-7 · cff9d37 |
| R2-8 | Contributor docs: `CONTRIBUTING.md`, `docs/TEMPLATE_GUIDE.md`, `docs/CONTENT_POLICY.md`, PR template, `CODEOWNERS`. | R2-7 | [x] | Codex 2026-11-23 · feature/r2-8 · 9fc6c21 |
| R2-9 | Gallery data layer: generated index, search/filter by category/language/format/mode, favorites in localStorage, hide categories with `status: planned` and zero templates. | R2-8 | [x] | Codex 2026-11-23 · feature/r2-9 · 53d5ad5 |
| GR2 | Gate GR2 verification | R2-1…R2-9 | [x] | Codex 2026-11-23 · feature/r2-9 · GR2 passed |

### Phase R3 — Editor core (GATE GR3)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R3-1 | Element model plumbing: overrides resolution per aspect class, extras layer, z-order, selection state, hit testing. | GR2 | [x] | Codex 2026-11-23 · feature/r3-1 · bd7f903 |
| R3-2 | Manipulation: select/move/resize/rotate, snapping and guides, reset controls (library from R0-2). | R3-1 | [x] | Codex 2026-11-23 · feature/r3-2 · 625e390 |
| R3-3 | Keyboard and accessibility for canvas editing, numeric inspector, live-region announcements (§5.2). | R3-2 | [x] | Codex 2026-11-23 · feature/r3-3 · fd28751 |
| R3-4 | Touch editing: drag, pinch, rotate, ≥ 44 px handles, bottom toolbar. | R3-3 | [x] | Codex 2026-11-23 · feature/r3-4 · ab13d5c |
| R3-5 | Contextual selection toolbar and layers panel (lock, hide, reorder). | R3-4 | [x] | Antigravity 2026-11-23 · feature/r3-5 · 30a2637 |
| R3-6 | Export integration for overrides and extras (§5.10). | R3-5 | [x] | Antigravity 2026-11-23 · feature/r3-6 · 93ec142 |
| GR3 | Gate GR3 verification | R3-1…R3-6 | [x] | Antigravity 2026-11-23 · feature/gr3 · gate passed |

### Phase R4 — Rich text (GATE GR4)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R4-1 | `RichText` model, React renderer, plain-string migration. | GR3 | [x] | Antigravity 2026-11-23 · feature/r4-1 · 78f02e5 |
| R4-2 | In-place editing and floating toolbar (engine from R0-3): font, size, color, bold, underline, highlight, alignment, direction; plain-text paste. | R4-1 | [x] | Antigravity 2026-11-23 · feature/r4-2 · cc39e50 |
| R4-3 | Fit rules update (manual size disables auto-fit; overflow warning; split-slide action for rich text). | R4-2 | [x] | Antigravity 2026-11-23 · feature/r4-3 · f0af2c1 |
| R4-4 | Lists/bullets as rich-text nodes with template styling; paste-to-slides outputs rich text (modifies P4-3). | R4-3 | [x] | Antigravity 2026-11-23 · feature/r4-4 · e2a433f |
| R4-5 | Export fidelity for mixed fonts/sizes/colors in Arabic and English. | R4-4 | [x] | Antigravity 2026-11-23 · feature/r4-5 · a034415 |
| GR4 | Gate GR4 verification | R4-1…R4-5 | [x] | Antigravity 2026-11-23 · feature/gr4 · gate passed |

### Phase R5 — Counter, signature, settings (GATE GR5)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R5-1 | Counter system (§5.4): show/hide, 6 anchors, styles, formats, hide on first/last, template-declared styles, collision handling. | GR4 | [x] | Antigravity 2026-11-23 · feature/r5-1 · counter system complete |
| R5-2 | Signature system (§5.4): anchors, arrangement, size, photo shape, handle/socials, free move via overrides; CTA large avatar variants. | R5-1 | [ ] | |
| R5-3 | Photo handling (§5.5): click-to-upload everywhere, crop dialog, placeholder affordance; CTA photo regression test. | R5-2 | [ ] | |
| R5-4 | Settings page (§5.5). | R5-3 | [ ] | |
| R5-5 | Inline brand editing popover with per-project override, apply-to-defaults, reset. | R5-4 | [ ] | |
| GR5 | Gate GR5 verification | R5-1…R5-5 | [ ] | |

### Phase R6 — Assets and stickers (GATE GR6)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R6-1 | Asset pack format, lazy loader, validator, license registry (`ASSET_LICENSES.md`, `NOTICE`). | GR5 | [ ] | |
| R6-2 | Shapes, lines, arrows pack (original, recolorable). | R6-1 | [ ] | |
| R6-3 | Icons pack from a verified open-source set, lazy and tree-shaken. | R6-2 | [ ] | |
| R6-4 | Emoji and stickers/illustrations packs (§5.6 rules). | R6-3 | [ ] | |
| R6-5 | Assets panel UI: categories, bilingual search, click/drag to add, recents. | R6-4 | [ ] | |
| R6-6 | Uploads: images and sanitized SVG, downscale, IndexedDB, replace, basic crop/mask (circle, rounded). | R6-5 | [ ] | |
| R6-7 | Templates can reference pack assets and local SVGs; validators updated. | R6-6 | [ ] | |
| GR6 | Gate GR6 verification | R6-1…R6-7 | [ ] | |

### Phase R7 — Slide management (GATE GR7)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R7-1 | Animated drag-and-drop rail (§5.7) with keyboard and touch alternatives. | GR6 | [ ] | |
| R7-2 | Slide actions: add with a visual type picker, duplicate, delete with undo; memoized thumbnails; mobile strip. | R7-1 | [ ] | |
| R7-3 | Format/orientation change dialog that explains per-class overrides and offers "reset layout for this format". | R7-2 | [ ] | |
| GR7 | Gate GR7 verification | R7-1…R7-3 | [ ] | |

### Phase R8 — UX redesign and delight (GATE GR8, owner review)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R8-1 | Home: hero with an interactive swipeable demo carousel, quick-start tiles by platform, examples, recent projects. | GR7 | [ ] | |
| R8-2 | Gallery UI: masonry grid, category chips with icons, search, filters, hover preview, "preview with my brand", favorites, loading/empty states. | R8-1 | [ ] | |
| R8-3 | Editor chrome (desktop): top bar, left tool rail (Templates, Elements, Text, Uploads, Brand, Layout), canvas with zoom/fit/pan, floating toolbars, animated slide strip. | R8-2 | [ ] | |
| R8-4 | Mobile editor: bottom sheets, tab bar, gestures, safe-area handling. | R8-3 | [ ] | |
| R8-5 | Motion and micro-interactions (§7.2): springs, drag ghosts, snap-guide flash, toasts, skeletons, export progress, gallery→editor transition. | R8-4 | [ ] | |
| R8-6 | Onboarding (3–4 skippable steps), empty states with original SVG illustrations, shortcuts overlay, friendly bilingual microcopy. | R8-5 | [ ] | |
| R8-7 | Visual polish pass: spacing, type, icon consistency, dark/light and RTL/LTR parity, footer restyle. Prepare the owner review pack (screenshots + short video or GIF). | R8-6 | [ ] | |
| GR8 | Gate GR8 verification | R8-1…R8-7 | [ ] | |

### Phase R9 — Hardening and release prep (GATE GR9)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| R9-1 | Export regression suite over all new features (aspect classes, themes, RTL, rich text, extras, patterns). | GR8 | [ ] | |
| R9-2 | Performance and bundle audit; lazy-loading review; mobile profiling. | R9-1 | [ ] | |
| R9-3 | Accessibility audit (axe, keyboard-only, screen-reader labels, contrast) (supersedes P3-10). | R9-2 | [ ] | |
| R9-4 | Security review: sanitizer tests, CSP update (fonts, assets), no `dangerouslySetInnerHTML`, dependency audit. | R9-3 | [ ] | |
| R9-5 | Docs: README (with GIF), finalize `TEMPLATE_GUIDE`, update `QA_CHECKLIST`, consolidate `Spec.md` into a v2 that merges §2 amendments (keep the old file as `docs/history/Spec.v1.md`), refresh `BACKLOG`. | R9-4 | [ ] | |
| R9-6 | Release prep: feature-flag review, known-issues list, release notes. Owner decides what ships. | R9-5 | [ ] | |
| GR9 | Gate GR9 verification | R9-1…R9-6 | [ ] | |

## Phase P0 — Foundation and export spike
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P0-1 | Scaffold: Vite + React + TS strict, Tailwind, ESLint, Prettier, Vitest, Playwright, Zustand | — | [x] | Antigravity 2026-11-22 · feature/p0-1 · 5f9517a |
| P0-2 | Deploy: connect to Vercel, confirm preview URL works, vercel.json CSP & security headers | P0-1 | [x] | Antigravity 2026-11-22 · feature/p0-2 · 9e0f497 |
| P0-3 | Fonts: install and wire @fontsource packages, fontsReady() helper | P0-2 | [x] | Antigravity 2026-11-22 · feature/p0-3 · da8edb4 |
| P0-4 | Export spike page (/spike) with test slides | P0-3 | [x] | Antigravity 2026-11-22 · feature/p0-4 · 599c1e0 |
| P0-5 | Candidate libraries: capture(node, size) with html-to-image and modern-screenshot | P0-4 | [x] | Antigravity 2026-11-22 · feature/p0-5 · 4a16978 |
| P0-6 | Evaluate on matrix: Chrome, Firefox, Safari macOS, iOS Safari, Android Chrome | P0-5 | [x] | Antigravity 2026-11-22 · feature/p0-6 · 331ad36 |
| P0-7 | Build PDF and ZIP from captured PNGs (jsPDF, JSZip) in the spike | P0-6 | [x] | Antigravity 2026-11-22 · feature/p0-7 · 2faecda |
| P0-8 | Write docs/EXPORT_SPIKE.md | P0-7 | [x] | Antigravity 2026-11-22 · feature/p0-8 · 90c66ed |
| G0 | Gate G0 verification | P0-1…P0-8 | [x] | Antigravity 2026-11-22 · feature/g0 · 94c2001 (owner-verify pending: D-01) |

## Phase P1 — Core domain and engine (no UI polish)
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P1-1 | Schema & migrations: Spec §3 types, schemaVersion, migrate(), zod runtime validation | G0 | [x] | Antigravity 2026-11-22 · feature/p1-1 · ceb308f |
| P1-2 | Format & platform registries: Spec §4 helpers, dimension/aspect tests | P1-1 | [x] | Antigravity 2026-11-22 · feature/p1-2 · 81a31e1 |
| P1-3 | Palette: generatePalette(primaryHex, theme) per Spec §7.2 with culori | P1-2 | [x] | Antigravity 2026-11-22 · feature/p1-3 · 1318e07 |
| P1-4 | Text fit: useFitText with measure-then-scale loop, min scale 0.6 | P1-3 | [x] | Antigravity 2026-11-22 · feature/p1-4 · 7a14b08 |
| P1-5 | Slide components (9 types) with 4 aspect-class variants, dev gallery route /gallery | P1-4 | [x] | Antigravity 2026-11-22 · feature/p1-5 · 02ce8bf |
| P1-6 | Media support: MediaRef, downscale util, IndexedDB store (idb-keyval), placements, focal point | P1-5 | [x] | Antigravity 2026-11-22 · feature/p1-6 · ce3948a |
| P1-7 | Signature bar (+ socials row, counter, placeholder avatar) per Spec §6.2 | P1-6 | [x] | Antigravity 2026-11-22 · feature/p1-7 · a7261e0 |
| P1-8 | Template system: TemplateDef registry, Network template complete (mulberry32 seeded) | P1-7 | [x] | Antigravity 2026-11-22 · feature/p1-8 · 40b91b5 |
| P1-9 | Story safe zones and overlay | P1-8 | [x] | Antigravity 2026-11-22 · feature/p1-9 · a36b63c |
| G1 | Gate G1 verification | P1-1…P1-9 | [x] | Antigravity 2026-11-22 · feature/g1 · 9c156c5 |

## Phase P2 — Templates 2 and 3
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P2-1 | Clean template: minimal, whitespace-led, flat cards, single accent | G1 | [x] | Antigravity 2026-11-22 · feature/p2-1 · dc958db |
| P2-2 | Bold template: large type, color blocks, thick borders, high contrast | G1 | [x] | Antigravity 2026-11-22 · feature/p2-2 · f310b4e |
| P2-3 | Template QA: gallery snapshots for all templates × formats × themes × RTL/LTR | P2-1, P2-2 | [x] | Antigravity 2026-11-22 · feature/p2-3 · 932213f |
| P2-4 | Design review pass: compare against Spec §7.1 intent | P2-3 | [x] | Antigravity 2026-11-22 · feature/p2-4 · 543059c |
| G2 | Gate G2 verification | P2-1…P2-4 | [x] | Antigravity 2026-11-22 · feature/g2 · e4b769b |

## Phase P3 — App shell, wizard, and editor
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P3-1 | i18n: typed dictionaries en.ts/ar.ts, useT(), language switch, app-level RTL flip | G2 | [x] | Antigravity 2026-11-22 · feature/p3-1 · 6761c77 |
| P3-2 | State: Zustand stores for settings, current project, recent projects list | P3-1 | [x] | Antigravity 2026-11-22 · feature/p3-2 · 30177d1 |
| P3-3 | Start screen: guided path, direct-size path, recent projects, import project, demo projects | P3-2 | [x] | Antigravity 2026-11-22 · feature/p3-3 · 86f9a21 |
| P3-4 | Wizard: platform → content type → format (+ orientation) → template | P3-3 | [x] | Antigravity 2026-11-22 · feature/p3-4 · 47471f7 |
| P3-5 | Editor desktop: slide rail, main canvas with scaled preview, inspector tabs | P3-4 | [x] | Antigravity 2026-11-22 · feature/p3-5 · f761302 |
| P3-6 | Editor mobile: single-slide swipe canvas, bottom tab bar, bottom-sheet inspector | P3-5 | [x] | Antigravity 2026-11-22 · feature/p3-6 · 38d32ae |
| P3-7 | Design controls: template picker, free color picker, dark/light toggle, direction, change format | P3-6 | [x] | Antigravity 2026-11-22 · feature/p3-7 · e83c5d4 |
| P3-8 | Brand panel: name, handle, photo upload, remove photo, signature on/off, socials, counter | P3-7 | [x] | Antigravity 2026-11-22 · feature/p3-8 · 21d2aee |
| P3-9 | Footer: owner name + social links, GitHub star link, feedback button, privacy note, analytics | P3-8 | [x] | Antigravity 2026-11-22 · feature/p3-9 · 93e3e5e |
| P3-10 | Accessibility pass: focus order, labels, keyboard rail reorder, reduced motion | P3-9 | [x] | Antigravity 2026-11-22 · feature/p3-10 · 46a4eaa |
| G3 | Gate G3 verification | P3-1…P3-10 | [x] | Antigravity 2026-11-22 · feature/g3 · a392e54 |

## Phase P4 — Persistence, paste-to-slides, export
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P4-1 | Persistence: autosave, versioned localStorage, IndexedDB assets, graceful quota UI | G3 | [x] | Antigravity 2026-11-22 · feature/p4-1 · ed4e5ac |
| P4-2 | Project JSON export/import: images embedded base64, size warning, validation & migration | P4-1 | [x] | Antigravity 2026-11-22 · feature/p4-2 · b775e45 |
| P4-3 | Paste-to-slides: parser per Spec §8.3, dialog with preview list, append/replace | P4-2 | [x] | Antigravity 2026-11-22 · feature/p4-3 · d84a54b |
| P4-4 | Export dialog and pipeline: candidate library, PNG, ZIP, PDF, Web Share API | P4-3 | [x] | Antigravity 2026-11-22 · feature/p4-4 · c53ccf7 |
| P4-5 | Export fidelity tests: Playwright exports project, golden compare, PDF & ZIP assertions | P4-4 | [x] | Antigravity 2026-11-22 · feature/p4-5 · eef9110 |
| P4-6 | Performance pass: memoization, code-splitting, typing latency check, bundle size check | P4-5 | [x] | Antigravity 2026-11-22 · feature/p4-6 · c0a72fe |
| G4 | Gate G4 verification | P4-1…P4-6 | [x] | Antigravity 2026-11-22 · feature/g4 · gate passed |

## Phase P5 — Beta release
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P5-1 | README: overview, screenshots, features, quick start, scripts, architecture, contributing | GR9 | [x] | Antigravity 2026-11-22 · feature/p5-1 · f412a88 |
| P5-2 | Repo hygiene: LICENSE (MIT), NOTICE, issue templates, CONTRIBUTING.md, GitHub Actions CI | GR9 | [x] | Codex 2026-11-23 · feature/p5-2 · 1b6473e |
| P5-3 | QA pass: execute docs/QA_CHECKLIST.md on matrix, fix blockers, list known issues | GR9 | [ ] | |
| P5-4 | Lighthouse + accessibility: mobile Accessibility ≥ 90, fix findings | GR9 | [ ] | |
| P5-5 | Verify name (SlideThread) is applied consistently (APP_NAME, README, page title, OG tags) | GR9 | [ ] | |
| P5-6 | Release: tag v0.1.0-beta, production deploy on Vercel, verify analytics and feedback (owner-only) | GR9 | [ ] | |
| G5 | Gate G5 verification (release) | P5-1…P5-6 | [ ] | |
