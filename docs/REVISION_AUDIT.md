# Revision Audit

**Audited:** 2026-11-23  
**Repository root:** `.`  
**Project documentation:** `docs/`  
**Branch baseline:** `feature/p5-2` with revision setup and P5-2 completion; this audit is on `feature/r0-1`.

This audit compares the repository at the start of revision work with `REVISION_PLAN.md`, the baseline `Spec.md`, `IMPLEMENTATION_PLAN.md`, `TASKS.md`, and `PROGRESS_LOG.md`. Revision-plan amendments take precedence over the baseline spec.

## Original task status and repository evidence

| Original phase | Tracker status | What exists in the repository | Revision relevance |
|---|---|---|---|
| P0 — Foundation and export spike | P0-1…P0-8 and G0 `[x]` | Vite/React/TypeScript strict setup, Tailwind, Zustand, Vitest/Playwright, self-hosted fonts, `/spike`, capture candidates, PNG/ZIP/PDF export spike, `docs/EXPORT_SPIKE.md`. | Existing capture/export foundation is retained. G0 is marked done with owner verification pending for D-01; R1 tasks still explicitly depend on G0. |
| P1 — Core domain and engine | P1-1…P1-9 and G1 `[x]` | Schema/migration, format and platform registries, palette, text fit, nine slide renderers, media store, signature/counter bar, three-template TypeScript registry, story safe zones. | The v1 foundation remains, but schema, template, signature, and CTA behavior need revision work. |
| P2 — Templates 2 and 3 | P2-1…P2-4 and G2 `[x]` | `network`, `clean`, and `bold` template modules and gallery QA tests/snapshots. | Keep as baseline; R2 replaces this template implementation with the data-driven platform and five starter templates. |
| P3 — App shell, wizard, and editor | P3-1…P3-10 and G3 `[x]` | Typed English/Arabic dictionaries; Zustand project/settings stores; start screen, wizard, desktop/mobile editor, design and brand inspectors, footer, and accessibility work. | The shell is a starting point. It has no Home/Gallery/Settings routing architecture from the revision plan, direct canvas manipulation/history, or selected characterful redesign. |
| P4 — Persistence, paste-to-slides, export | P4-1…P4-6 and G4 `[x]` | Persistence/localStorage and IndexedDB, JSON import/export, plain-text paste parser/dialog, PNG/ZIP/PDF pipeline, E2E export coverage, performance chunk configuration. | Keep and extend the useful foundations. Paste currently targets plain strings; export must later use the new model and exclude editor chrome. |
| P5 — Beta release | P5-1 `[x]`, P5-2 `[x]`, P5-3…P5-6 and G5 `[ ]` | README, MIT `LICENSE`, font `NOTICE`, issue templates, `CONTRIBUTING.md`, GitHub Actions CI, QA checklist. | P5-3…P5-6 remain and are scheduled after GR9 by the revision plan. Owner actions D-03…D-05 remain open. |

Evidence is in `src/core/`, `src/templates/`, `src/slides/`, `src/store/`, `src/ui/`, `src/export/`, `tests/`, and the documents listed above. The tracker is authoritative for completion status; this audit does not change any completed original task.

## Supersession mapping for unfinished original tasks

Applying `REVISION_PLAN.md` §2.1 only to original rows not already `[x]`:

- No unfinished original task is marked `[s]`. The only unfinished original implementation tasks are P5-3 through P5-6; §2.1 keeps them and schedules them after GR9.
- P5-2 was already `[~]` when revision mode began. It was resumed under the revision prompt's resume-before-start procedure and completed on `feature/p5-2` (`1b6473e`). This conflicts with §2.1's sequencing note that P5 work runs after GR9; the precedence/order conflict is recorded in `PROGRESS_LOG.md`.
- Completed rows such as P1-5, P1-7, P1-8, P2-1…P2-4, and P3-10 remain `[x]` as required; the “superseded” wording in the mapping applies only to rows not already complete.

## Gaps against revision amendments (§2)

| Amendment | Existing state | Required revision work / gap |
|---|---|---|
| 1. Free-form editor non-goal removed | Current editor is template-constrained; no element move/resize editing is implemented. | R3 adds overrides, extras, manipulation, snapping, reset, keyboard/touch alternatives, and undo/redo. |
| 2. Schema v2 and model changes | `src/core/schema.ts` has `CURRENT_SCHEMA_VERSION = 1`; slide fields are `Record<string, string>`; template IDs are the closed union `network|clean|bold`. | R1-1 must add v2 validation/migration, rich text, per-aspect overrides, extras, counter/signature config, brand override, pattern config, open template ID, and flags. |
| 3. Manual text size disables auto-fit | Current `src/core/textFit.ts` fits whole text content; there are no rich-text size marks. | R4-1…R4-3 must implement run/element manual size, disable auto-fit for manually sized content, and warn on overflow. |
| 4. Nine slide types and CTA avatar | All nine types exist, but `src/slides/CtaSlide.tsx` renders a letter placeholder and does not use the uploaded profile photo. | Keep the nine types; R5-3 must use a normal clickable/uploadable avatar element and test CTA/photo export coverage. |
| 5. Signature bar replaced by configurable signature and separate counter | `SignatureBar` combines signature/social row and counter; settings provide visibility toggles only. | R5-1 and R5-2 add independent style/anchor/format/arrangement/shape/size controls and collision behavior. |
| 6. Template platform replaced | `src/templates/` is a TypeScript component registry with three IDs, not contributor JSON; no categories, inheritance, archetype registry, validator, or previews exist. | R2 builds the template schema/runtime, categories, generators/sanitizers, five data templates, gallery data layer, CLI/CI, and contributor guide. |
| 7. Settings page and inline brand editing | `src/store/settingsStore.ts` persists defaults; controls are embedded in the editor Brand inspector. No `/settings` route or project-specific brand override exists. | R1-4/R5-4/R5-5 add the page, data management, per-project override, apply-to-defaults, and reset. |
| 8. Paste output becomes rich text and lists | `src/core/paste.ts` emits slide fields as plain strings; explain bullets remain text lines. | R4-4 converts parser results to rich-text blocks/list nodes while preserving plain-text paste behavior. |
| 9. UX direction changes | Existing app uses the original utility-style chrome and no A/B/C `/ux-preview` pages or approved direction. | R0-6 must create the three directions; D-06 requires owner selection before GR0 and R1-3. |
| 10. Route bundle budgets | `src/config/chunks.ts` and Vite chunking exist, but `src/App.tsx` imports the editor directly and no route-specific initial/editor gzip budget report is present. | R1-4 must lazy-load routes; R9-2 must measure against 300 KB initial and 600 KB editor gzip budgets or document a justified exception. |
| 11. New acceptance criteria | The baseline acceptance section covers the v1 flows; revision status lists GR0…GR9 all unchecked. | Complete the new acceptance criteria in `REVISION_PLAN.md` §10, with owner UX approval and export/security/performance evidence. |

## Broader implementation gaps that affect the amendments

- `src/config/features.ts` does not exist; unfinished revision features cannot yet be hidden behind the required flags.
- No global undo/redo history exists in the project store.
- The desktop slide rail uses native HTML drag/drop, while the revision requires animated spring reordering, touch long-press, and reduced-motion support.
- Media support and brand-photo upload exist, but there is no general asset pack registry/panel or sanitized SVG upload flow.
- There are no revision-only `/settings`, `/ux-preview`, or `/kit` routes, nor the template contributor documents/registries.
- No revision screenshots, rubric review pack, or revision gate verification is present yet.

## Document conflicts recorded

`REVISION_PLAN.md` §2 explicitly amends the baseline documents. The key baseline conflicts are:

1. `Spec.md` §1.2 forbids a free-form editor, while amendment 1 and REQ-05 allow moving/resizing through overrides.
2. `Spec.md` §3 and its implementation plan use v1 plain-string fields and a closed three-template union, while amendment 2 requires schema v2, rich text, overrides/extras, new project settings, and registered string template IDs.
3. Baseline `Spec.md` §6.2 uses a combined signature bar/counter; amendment 5 separates and configures them.
4. Baseline `Spec.md` §7 describes three code templates; amendment 6 replaces it with the data-only template platform and five templates.
5. Baseline `Spec.md` §8.1 describes a brand panel; amendment 7 requires `/settings` plus per-project inline editing.
6. Baseline paste and UI/UX requirements are amended by items 8–9; the revised bundle budgets and acceptance are added by items 10–11.
7. `IMPLEMENTATION_PLAN.md` schedules P5 before further work; `REVISION_PLAN.md` §2.1 schedules original P5 tasks after GR9. The active P5-2 exception is recorded in the log because it was already claimed before revision setup.

Where these differ, the revision plan wins. No code change is made by this audit.
