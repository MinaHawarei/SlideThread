# SlideThread Tasks

## How to use
- Done column markers: `[ ]` not started · `[~]` in progress (claimed) · `[x]` done and verified · `[!]` blocked.
- Source of truth for order and status. Agents follow `MASTER_PROMPT.md`.

## Definition of Done (every task)
Code merged to the task branch, tests added and passing, lint + typecheck + build clean, relevant docs updated, no new console errors, plan acceptance check satisfied.

## Decisions and owner actions
| ID | Item | Blocks | Answer | Done |
|---|---|---|---|---|
| D-01 | Connect the repo to Vercel and confirm the preview URL works | G0 | | [ ] |
| D-02 | Provide `FEEDBACK_URL` (external form), `GITHUB_URL`, and owner social links for `site.ts` (placeholders are used until then) | P3-9 | Placeholders in site.ts (Mina Hawarei, @minahawarei, mailto: fallback per Spec §10.4) | [x] |
| D-03 | Choose the final app name from the 5 candidates (agent checks repo-name and domain availability first) | P5-5 | | [ ] |
| D-04 | Run the manual device checks listed in `docs/QA_CHECKLIST.md` (iOS Safari, Android Chrome) | P5-3 | | [ ] |
| D-05 | Production deploy and the `v0.1.0-beta` tag | P5-6 | | [ ] |

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
| G3 | Gate G3 verification | P3-1…P3-10 | [ ] | |

## Phase P4 — Persistence, paste-to-slides, export
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P4-1 | Persistence: autosave, versioned localStorage, IndexedDB assets, graceful quota UI | G3 | [ ] | |
| P4-2 | Project JSON export/import: images embedded base64, size warning, validation & migration | P4-1 | [ ] | |
| P4-3 | Paste-to-slides: parser per Spec §8.3, dialog with preview list, append/replace | P4-2 | [ ] | |
| P4-4 | Export dialog and pipeline: candidate library, PNG, ZIP, PDF, Web Share API | P4-3 | [ ] | |
| P4-5 | Export fidelity tests: Playwright exports project, golden compare, PDF & ZIP assertions | P4-4 | [ ] | |
| P4-6 | Performance pass: memoization, code-splitting, typing latency check, bundle size check | P4-5 | [ ] | |
| G4 | Gate G4 verification | P4-1…P4-6 | [ ] | |

## Phase P5 — Beta release
| ID | Task | Depends on | Done | Notes |
|---|---|---|---|---|
| P5-1 | README: overview, screenshots, features, quick start, scripts, architecture, contributing | G4 | [ ] | |
| P5-2 | Repo hygiene: LICENSE (MIT), NOTICE, issue templates, CONTRIBUTING.md, GitHub Actions CI | P5-1 | [ ] | |
| P5-3 | QA pass: execute docs/QA_CHECKLIST.md on matrix, fix blockers, list known issues | P5-2 | [ ] | |
| P5-4 | Lighthouse + accessibility: mobile Accessibility ≥ 90, fix findings | P5-3 | [ ] | |
| P5-5 | Name and domain: present 5 name candidates, apply chosen name via APP_NAME | P5-4 | [ ] | |
| P5-6 | Release: tag v0.1.0-beta, production deploy on Vercel, verify analytics and feedback | P5-5 | [ ] | |
| G5 | Gate G5 verification (release) | P5-1…P5-6 | [ ] | |
