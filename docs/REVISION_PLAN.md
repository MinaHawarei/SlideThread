# REVISION PLAN (خطة التعديلات)

Working name: **PostForge** (placeholder; still lives only in `src/config/site.ts → APP_NAME`).

This plan **amends** `Spec.md` and re-plans work relative to `IMPLEMENTATION_PLAN.md`. It is executed by an agent following `MASTER_PROMPT_REVISION.md`. Progress is logged in the **same** `PROGRESS_LOG.md`.

**Precedence (highest first):** §2 Amendments in this file → `Spec.md` → `IMPLEMENTATION_PLAN.md`. Where a task here says it supersedes or modifies an original task, this file wins.

**Delivery decision (owner):** everything below ships in **one version** (no v1.1/v1.2 split). To keep that safe, every big feature sits behind a flag in `src/config/features.ts` so an unfinished or unstable feature can be hidden for the beta without a rewrite.

---

## 1. What is changing (requirement IDs)

| ID | Requirement |
|---|---|
| REQ-01 | **Template platform:** templates are data (JSON + small assets), organized by categories, shown in a gallery. Target is 1000+ templates over time; **v1 ships exactly 5**. Open-source contribution must be easy. |
| REQ-02 | **Categories** (multi-label) e.g. Coding, Marketing, Arabic & Heritage, Coptic, Islamic; all categories behave the same; a category with zero templates is hidden automatically. |
| REQ-03 | **Seamless patterns:** decorative patterns continue smoothly across carousel slides; patterns can be hidden (toggle) and dimmed (intensity). |
| REQ-04 | **Page numbering** for carousels: show/hide; 6 anchors (4 corners + top-center + bottom-center); styles: number, progress bar, dots (template declares which it supports); optional hide on first/last slide. |
| REQ-05 | **Direct manipulation:** click an element in the preview to move, resize (and rotate extras); snapping; reset to template layout. |
| REQ-06 | **Signature placement:** photo + name block placeable at top/bottom × left/center/right, arrangement inline or name-under-photo, size, photo shape; also freely movable. |
| REQ-07 | **Settings page** for default photo/name/handle/socials/defaults; the same data is editable **inside the design** per project, with "apply to defaults" and "reset". |
| REQ-08 | **Photo fix:** the photo must appear on the last (CTA) slide and everywhere; clicking any avatar opens the device file picker. |
| REQ-09 | **Animated drag-and-drop** slide reordering (plus keyboard and touch alternatives). |
| REQ-10 | **Assets:** add images, icons, shapes, stickers, illustrations; uploads allowed. |
| REQ-11 | **Rich text:** select part of a text and change size, color, font (and basic marks). |
| REQ-12 | **UX/UI redesign:** the current UI feels poor; the app must feel rich, creative, and polished on desktop and mobile, LTR and RTL. |
| REQ-13 | Undo/redo everywhere (needed once editing is free). |

---

## 2. Amendments to `Spec.md` (normative)

1. **§1.2 Non-goals.** Remove "No free-form drag-and-drop canvas editor". Replace with: *Templates define the default layout; users may move, resize, and extend elements through overrides. A "Reset layout" control always restores the template layout. Video/animation export, accounts, backend, and direct publishing remain non-goals.*
2. **§3 Data model.** `schemaVersion` becomes **2**. Changes:
   - Text fields become `RichText` (§5.3 below); plain strings migrate to rich text with no marks.
   - `Slide` gains `overrides` (per element, per aspect class) and `extras` (user-added elements).
   - `Project` gains `counter: CounterConfig`, `signature: SignatureConfig`, `brandOverride?: Partial<BrandSettings>`, `pattern: { enabled: boolean; intensity: number }`.
   - `templateId` becomes a string referencing any registered template (no longer `'network'|'clean'|'bold'`).
   - `BrandSettings` gains `defaultCounter`, `defaultSignature`.
   - Provide `migrate` v1→v2 with tests.
3. **§5.3 Text fitting.** If the user manually sets a size on a text run or element, auto-fit is disabled for that element and only the overflow warning applies.
4. **§6 Slide types.** Unchanged in number (9). Fields are rich text. The `cta` slide's large avatar is a normal avatar element (REQ-08).
5. **§6.2 Signature bar.** Replaced by the configurable signature (REQ-06). The slide counter is a separate configurable element (REQ-04).
6. **§7 Templates.** Replaced entirely by §5.1 of this plan (Template Platform). The three "starter templates" are replaced by the 5 in §5.8.
7. **§8.1 Brand settings.** Replaced by the Settings page and inline editing (REQ-07).
8. **§8.3 Paste-to-slides.** Parser output targets rich text; bullets (`- `) become list nodes.
9. **§10 UI/UX.** Replaced by §7 (UX direction and quality bar) of this plan. The earlier "neutral app chrome" decision is **reinterpreted**: the app chrome must not copy any template's identity, but it is **not** plain or generic; it has its own characterful design language.
10. **§12 Non-functional.** Bundle budget: initial route (home + gallery) ≤ 300 KB gzip JS; editor chunk loads lazily and should stay ≤ 600 KB gzip excluding fonts and asset packs; any deviation must be justified in `docs/DECISIONS.md`.
11. **§14 Acceptance criteria.** Add §10 of this plan.

### 2.1 Original task mapping (applies only to rows not already `[x]`)

| Original task | Revision handling |
|---|---|
| P0-* and G0 | **Unchanged and mandatory.** The export spike is still a hard gate. |
| P1-1 schema | Modified: extend via R1-1 (do not rewrite). |
| P1-2, P1-3, P1-4, P1-6, P1-9 | Keep as written. |
| P1-5 slide components | Superseded by R2-2 (layout archetypes). |
| P1-7 signature bar | Superseded by R5-1/R5-2. |
| P1-8 Network template | Superseded by R2-3 and R2-6. |
| P2-1…P2-4 | Superseded by R2-6. |
| P3-1 i18n, P3-2 state | Keep; extended by R1-4. |
| P3-3 start screen | Superseded by R8-1. |
| P3-4 wizard | Keep (restyled in R8). |
| P3-5, P3-6 editor | Superseded by R3-*, R7-*, R8-3, R8-4. |
| P3-7 design controls | Superseded by R2-*, R5-*. |
| P3-8 brand panel | Superseded by R5-4, R5-5. |
| P3-9 footer | Keep (restyled in R8-7). |
| P3-10 accessibility pass | Superseded by R9-3. |
| P4-1, P4-2, P4-6 | Keep. |
| P4-3 paste-to-slides | Modified by R4-4. |
| P4-4, P4-5 export | Keep; extended by R3-6, R4-5, R9-1. |
| P5-* | Keep; executed **after** GR9. P5-1 README is merged with R9-5. |

---

## 3. Product decisions (resolved; do not re-ask)

1. One release containing all REQ items; protected by feature flags.
2. 5 starter templates (§5.8). All categories behave the same; a category with zero templates is hidden automatically. Keep Coptic and Islamic in categories.json as ordinary categories. Templates in them contain only colors, shapes, and patterns; no text.
3. Counter anchors: top-left, top-right, bottom-left, bottom-right, top-center, bottom-center (the owner wrote "three of four corners"; implement all four unless the owner later excludes one).
4. The template previously named "Network" gets a neutral internal id `tech-mesh`; its **display name is data** and the owner will rename it. Until then: en "Mesh (working name)", ar "شبكة (اسم مؤقت)". The node-and-line pattern is a reusable generator with id `mesh`. Patterns are a separate layer that can be toggled off on any template.
5. Final tool name is still undecided; do not hardcode any name.
6. Physical left/right (not start/end) are used for anchor labels in the UI; the code stores `l|c|r`.
7. Photo: stored downscaled in localStorage (as before); click-to-replace anywhere.
8. Lib choices for manipulation, rich text, and sortable are decided by the R0 spikes, not in advance.

---

## 4. Working rules specific to this plan

- Every UI task produces screenshots (360×800, 768×1024, 1440×900; light and dark; LTR and RTL) saved in `docs/ux-review/<task-id>/`, and a short self-review against §7.3.
- Every feature task ships tests; every new user-visible string exists in both `en` and `ar`.
- No new dependency unless this plan names it or `docs/DECISIONS.md` justifies it (what, why, alternatives, gzip size, license).
- No asset (icon, sticker, font, illustration) is added without a license record (§5.6). Never claim provenance you did not verify.
- Templates, assets, and SVG/CSS from contributors are **untrusted input** (§5.1).
- Agents cannot judge taste reliably: UX gates require **owner review** (decisions D-06, D-10).

---

## 5. Technical design

### 5.1 Template Platform (REQ-01, REQ-02, REQ-03)

A template is a folder `templates/<category>/<slug>/` containing `template.json` and optional `assets/` (small SVG/WebP), plus a generated `preview.webp`. Contributors never touch app code.

Four contribution levels, each more powerful than the previous:

1. **Theme (JSON only):** palette (fixed or color-flexible), fonts (from the allowlist), type scale, radius, spacing, counter/signature style variants.
2. **Layouts (JSON references):** per slide type, choose an archetype from the engine's registry.
3. **Decorations (JSON + sanitized SVG):** background/overlay generators with parameters, or local SVG assets.
4. **Scoped CSS (advanced, optional):** one `style.css` validated by an allowlist.

`extends: "<template-id>"` lets a template inherit another and override tokens, so a variant is a few lines.

Schema sketch (`src/templates/schema.ts` + a JSON Schema file for external validation):

```ts
interface TemplateDef {
  schema: 1;
  id: string;                          // kebab-case, globally unique
  name: { en: string; ar: string };    // required in both
  description?: { en?: string; ar?: string };
  author: { name: string; url?: string };
  license: string;                     // SPDX id for the template + its assets
  categories: string[];                // ids from categories.json
  tags: string[];
  extends?: string;
  colorFlexible: boolean;              // true: palette generated from the user's color
  theme: {
    modes: Partial<Record<'dark'|'light', Partial<Palette>>>;  // fixed palettes or constraints
    fonts: { display: FontId; body: FontId; mono?: FontId };
    typeScale?: Partial<TypeScale>;
    radius?: { card: number; chip: number };
  };
  layouts: Partial<Record<SlideType, string>>;       // archetype ids
  decor?: { background?: DecorRef; overlay?: DecorRef[] };
  counter?: { styles: ('number'|'bar'|'dots')[]; defaultStyle: string };
  signature?: { variants: string[]; defaultVariant: string };
  formats: 'all' | string[];
  customCss?: string;                  // path to style.css (level 4)
}
```

**Layout archetypes** live in the engine (`src/templates/layouts/`): for each of the 9 slide types, at least 2 archetypes, each with variants for the 4 aspect classes (Spec §5.2), using logical CSS properties and stable element ids (`title`, `body`, `media`, `counter`, `signature`, …).

**Decoration generators** implement:

```ts
type Generator = (ctx: {
  tileIndex: number; tileCount: number; tileWidth: number; height: number;
  seed: number; params: Record<string, unknown>; palette: Palette; intensity: number;
}) => SvgFragment;
```

They must be **deterministic** and **prefix-stable**: appending a slide never changes how earlier slides look. Implement by generating per tile from `seed + tileIndex` and letting tile *i* read only tiles *i−1* and *i+1* data for edges that cross a boundary, so lines continue seamlessly across slides (REQ-03). Required generators: `mesh` (nodes and lines, the original identity), `dots-grid`, `waves`, `geometric` (original Arabic-heritage-inspired tessellation, authored by us), `blobs`, `none`.

**Security (untrusted input):**
- SVG: allowlist of elements and attributes; no `<script>`, `<foreignObject>`, event handlers, external `href`/`url()`; use a vetted sanitizer library rather than hand-rolled regex.
- CSS (level 4): selectors must be scoped to `.tpl-<id>`; allowlisted properties; no `@import`, no external `url()`, no `expression`, no `position: fixed`, size limits.
- Assets: per-template folder ≤ 300 KB; formats limited to SVG/WebP/PNG.
- Fonts only from the app's allowlist registry (§5.9). No remote loading (CSP).
- Add tests with malicious samples for each rule.

**Tooling and CI (contributor experience):**
- `npm run template:new` (scaffold), `template:dev <id>` (hot-reload preview of one template with sample content in both languages), `template:validate` (schema + security + contrast + size), `template:preview` (render webp previews), `template:index` (build gallery index).
- CI on every PR: JSON Schema, sanitizer, WCAG contrast of ink/bg and accent, stress renders (very long Arabic text, mixed bidi, RTL, all 4 aspect classes, light and dark), asset size, license field present, preview up to date (tolerant diff).
- For v1, `preview.webp` files (≤ 40 KB each) are committed. At scale this moves to CI-generated artifacts (record in `docs/BACKLOG.md`).
- Docs: `CONTRIBUTING.md`, `docs/TEMPLATE_GUIDE.md` (one worked example per level), `docs/CONTENT_POLICY.md`, PR template.

### 5.2 Element model, overrides, and manipulation (REQ-05, REQ-13)

- Every element in a layout has a stable id. A user edit is stored as an **override** `{ dx, dy, scale, w?, h? }` using fractions of the slide's width/height, **per aspect class**, so changing format falls back to the template layout when no override exists for that class.
- User-added content lives in `slide.extras[]`: `{ id, kind: 'image'|'icon'|'shape'|'sticker'|'text', x, y, w, h, rotation, z, locked, … }` in normalized coordinates.
- Capabilities: select, move, resize (aspect lock for images/stickers), rotate (extras only), z-order, lock, hide, duplicate, delete, copy/paste, "Reset element / slide / all".
- Snapping with visible guides to slide edges, safe margins, center lines, and other elements (threshold ≈ 6 px at design scale). Guides and handles are **never exported**.
- Keyboard: Tab to select, arrows nudge (1 px; Shift = 10 px), `+`/`-` scale, Delete, Duplicate, Enter to edit text, Esc to deselect, Ctrl/Cmd+Z / Shift+Z undo-redo. A numeric inspector (x, y, w, scale, rotation) is the precise alternative for touch and accessibility.
- Touch: drag, pinch to scale, two-finger rotate (extras), handles ≥ 44 px hit area.
- **Undo/redo:** global history (≥ 100 steps) with coalescing for continuous drags and typing; covers content, overrides, extras, template/theme/brand changes, and slide order.
- Library choice (e.g. `react-moveable` vs custom pointer handling) comes from spike R0-2. Elements are plain DOM with CSS transforms so export capture works.

### 5.3 Rich text (REQ-11)

```ts
type RichText = { type: 'doc'; blocks: Block[] };
type Block = { type: 'p'; runs: Run[] } | { type: 'li'; runs: Run[]; ordered?: boolean };
type Run = { text: string; marks?: { size?: number /* % of base, 50-300 */; color?: string /* token or hex */;
                                      font?: FontId; bold?: boolean; underline?: boolean; highlight?: string } };
```

- Stored as JSON, rendered by our own React renderer (no HTML strings, no `dangerouslySetInnerHTML`). The export path uses the same renderer, never the editor DOM.
- Editing: double-click a text element to edit in place; a floating toolbar appears on selection (font, size, color, bold, underline, highlight, alignment, direction). On mobile the toolbar docks above the keyboard.
- Paste is plain text only (strip formatting).
- Editor engine chosen by spike R0-3 (candidates: Tiptap, Lexical). Criteria: Arabic IME composition, bidi caret/selection, mixed-direction selection, bundle size, JSON serialization.
- Size marks are relative to the element's base size so templates and formats stay coherent.

### 5.4 Counter and signature (REQ-04, REQ-06)

```ts
type Anchor = 'tl'|'tc'|'tr'|'bl'|'bc'|'br';
interface CounterConfig { show: boolean; anchor: Anchor; style: 'number'|'bar'|'dots';
                          format: 'nn/nn'|'n'|'n/nn'; hideOnFirst: boolean; hideOnLast: boolean; }
interface SignatureConfig { show: boolean; anchor: Anchor | 'free'; arrangement: 'inline'|'stacked';
                            size: 'sm'|'md'|'lg'; photoShape: 'circle'|'rounded'|'square';
                            showHandle: boolean; showSocials: boolean; }
```

- Only the styles the template declares are selectable (e.g. a template without a progress bar hides that option).
- Collision rule: if counter and signature choose the same anchor, the UI warns and offers an automatic offset; layout never overlaps silently.
- RTL: anchors are physical (left/right); numbers stay LTR.
- Progress bar fills proportionally to slide index/count.

### 5.5 Settings and inline brand editing (REQ-07, REQ-08)

- `/settings` page: profile defaults (name, handle, photo with crop), socials, defaults (template, color, theme, counter, signature, language), data management (export/import all, clear data).
- In the canvas, selecting the signature opens a popover to edit name/handle/photo **for this project only** (`brandOverride`), with "Apply to defaults" and "Reset to defaults".
- Every avatar in the app (settings, canvas, CTA slide, wizard) is clickable and opens the file picker, then a square crop dialog; placeholder shows a clear "add photo" affordance.
- **Regression requirement:** a Playwright test uploads a photo and asserts it renders on **every slide type**, including `cta`, in all 4 aspect classes, and in exported PNGs.

### 5.6 Assets and licensing (REQ-10)

- Asset pack format: `assets/packs/<id>/pack.json` (name en/ar, license, source URL, items with bilingual tags) plus SVG files. Packs lazy-load; contributors add packs the same way as templates.
- Recolorable assets use `currentColor` or palette tokens; multi-color stickers are fixed.
- Kinds: shapes/lines/arrows (original, authored by us), icons (an open-source set with a verified permissive license), emoji, stickers/illustrations.
- **Licensing rules:** CC0, MIT, ISC, Apache-2.0, or CC-BY (attribution recorded) only; no scraping; no unverified sources. Every pack is listed in `ASSET_LICENSES.md` and `NOTICE`. If the agent cannot find enough legally clear illustrations or stickers, it ships what is clear, writes the gap in `docs/BACKLOG.md`, and raises a decision for the owner (D-08). It may author simple original SVG stickers itself (MIT) but must not present them as professional illustration work.
- User uploads: images (downscaled to max 2400 px) and SVG (sanitized), stored in IndexedDB; the user is responsible for rights.

### 5.7 Slide reordering (REQ-09)

Animated sortable rail (spring layout animation, drag ghost, drop animation) with keyboard reordering (move up/down) and touch long-press. `prefers-reduced-motion` disables animation but keeps all behavior. Library per spike R0-4 (candidates: `dnd-kit` + `motion`).

### 5.8 The 5 starter templates

| # | Template (id) | Categories | Direction |
|---|---|---|---|
| 1 | `tech-mesh` (display name: "Weave" / "نسيج") | Coding | Dark/light; continuous `mesh` pattern; rule (if/then), connected bullets, code-window motifs; color-flexible. The original identity. |
| 2 | `clean-minimal` | Personal brand, General | Whitespace-led, flat cards, single accent, thin progress bar, no pattern by default; color-flexible. |
| 3 | `bold-marketing` | Marketing | Huge type, color blocks, thick borders, sticker-friendly, high contrast; partially color-flexible. |
| 4 | `soft-gradient` | Lifestyle, Education | Soft gradient fields, rounded shapes, `blobs` decor, friendly type; color-flexible. |
| 5 | `heritage-geometric` | Arabic & Heritage | Arabic-first typography, original `geometric` tessellation (not religious iconography), warm palette; fixed palettes. |

Each template must look like a different product, not a recolor, and must survive the stress renders (long Arabic text, RTL, all aspect classes).

### 5.9 Fonts

Registry `src/fonts/registry.ts`: id, family, scripts (latin/arabic/coptic), weights, license (OFL or similar), npm source (`@fontsource/*`). All bundled locally, lazy-loaded per use, `fontsReady()` before measuring and exporting. The picker lists only fonts that cover the script of the selected text, with Arabic-capable fonts clearly marked. Coptic-capable fonts are registered but only used by templates that need them.

### 5.10 Export implications

`ExportStage` renders slides from the **model** (overrides, extras, rich text, pattern layer) in an unscaled offscreen container; never from the interactive editor DOM. Selection handles, guides, safe-zone overlays, and hover states are not part of the model rendering. Re-verify fidelity for transforms, mixed rich-text runs, patterns clipped per slide, and SVG stickers.

---

## 6. Phases and tasks

Task IDs use `R<phase>-<n>`; gates are `GR<phase>`. Dependencies default to the previous task in the same phase; the first task of a phase depends on the previous gate. R0-1 has no dependencies. R1 additionally depends on **G0** (export spike) being `[x]`.

### Phase R0 — Audit, spikes, UX direction (GATE GR0)

| ID | Task | Done when |
|---|---|---|
| R0-1 | **Repo audit.** Read the repo, `TASKS.md`, and the log. Write `docs/REVISION_AUDIT.md`: what exists per original task, gaps versus §2 amendments. Apply §2.1 to rows not `[x]` (mark superseded rows `[s]` with a pointer). | Audit committed; tracker updated. |
| R0-2 | **Spike: manipulation.** Compare `react-moveable` and a custom pointer/`@use-gesture` approach: move/resize/rotate, snapping, touch pinch, RTL, 60 fps on a mid-range phone, export capture of transformed elements. Write `docs/spikes/MANIPULATION.md`. | Decision recorded with evidence. |
| R0-3 | **Spike: rich text.** Compare Tiptap and Lexical (fallback: minimal custom). Test Arabic composition, bidi selection, marks serialization, paste, bundle size. Devices needed for IME checks → add owner action (D-09). Write `docs/spikes/RICHTEXT.md`. | Decision recorded; IME checks listed as owner-verify. |
| R0-4 | **Spike: sortable animation.** `dnd-kit` + `motion` (or alternatives): spring reorder, touch long-press, keyboard, reduced motion. `docs/spikes/SORTABLE.md`. | Decision recorded. |
| R0-5 | **Spike: continuous pattern.** Prefix-stable tile-based `mesh` prototype; verify boundary continuity and that appending slides does not change earlier ones, including in exported crops. `docs/spikes/PATTERN.md`. | Test proves both properties. |
| R0-6 | **UX direction.** Produce three distinct visual directions (A/B/C) for the app's own design language as built pages on a dev-only `/ux-preview` route (home, gallery, editor), with design tokens, type pairing, motion language, and illustration style per direction (§7). Screenshots in `docs/ux-review/R0-6/`. | Owner picks one (D-06). |

**GR0:** all spike docs decided; owner approved a direction (D-06); audit done.

### Phase R1 — Foundations (GATE GR1)

| ID | Task | Done when |
|---|---|---|
| R1-1 | Schema v2 types, runtime validation, `migrate` v1→v2, feature flags file. | Tests cover migration and invalid input. |
| R1-2 | Undo/redo infrastructure with coalescing and shortcuts (§5.2). | Tests for coalescing and history limits. |
| R1-3 | Design tokens and component kit for the chosen direction (Radix primitives + Tailwind, shadcn-style): buttons, inputs, dialogs, popovers, tabs, sliders, tooltips, toasts, color picker, menus; dark/light; RTL via logical properties; a `/kit` gallery route. | Kit renders in LTR/RTL/dark/light with screenshots. |
| R1-4 | App shell and routing (Home, Gallery, Editor, Settings), code splitting, i18n extension. | Initial route within budget. |
| R1-5 | Fonts registry and lazy loader (§5.9). | Registry tests; fonts load before measure/export. |

**GR1:** schema v2 and history tested; kit and shell in place; budgets measured.

### Phase R2 — Template platform (GATE GR2)

| ID | Task | Done when |
|---|---|---|
| R2-1 | Template schema (TS + JSON Schema), `categories.json`, `extends` resolution, fixed vs color-flexible palettes. | Unit tests incl. inheritance and invalid templates. |
| R2-2 | Layout archetypes: ≥ 2 per slide type × 4 aspect classes, stable element ids (supersedes P1-5). | Gallery route renders every archetype; snapshots committed. |
| R2-3 | Decoration generators (`mesh`, `dots-grid`, `waves`, `geometric`, `blobs`, `none`), toggle and intensity, prefix-stable. | Determinism and continuity tests. |
| R2-4 | Sanitizers and validators for SVG and CSS (§5.1) using vetted libraries. | Malicious-sample tests all rejected. |
| R2-5 | Template runtime: lazy load, resolve tokens/layouts/decor, fallbacks for missing archetypes. | Switching templates never loses content. |
| R2-6 | The 5 starter templates (§5.8) with previews. | All pass validation and stress renders. |
| R2-7 | Template CLI and CI (§5.1). | CI green on a sample PR; commands documented. |
| R2-8 | Contributor docs: `CONTRIBUTING.md`, `docs/TEMPLATE_GUIDE.md`, `docs/CONTENT_POLICY.md`, PR template. | A new contributor can add a theme-only template following only the docs (agent verifies by doing it as a dry run). |
| R2-9 | Gallery data layer: generated index, search/filter by category/language/format/mode, favorites in localStorage; all categories behave the same; a category with zero templates is hidden automatically. Keep Coptic and Islamic in categories.json as ordinary categories. | Unit tests for filtering and empty-category hiding rules. |

**GR2:** 5 templates pass CI; dry-run contribution succeeds; patterns seamless across slides in exported crops.

### Phase R3 — Editor core (GATE GR3)

| ID | Task | Done when |
|---|---|---|
| R3-1 | Element model plumbing: overrides resolution per aspect class, extras layer, z-order, selection state, hit testing. | Unit tests; format change falls back correctly. |
| R3-2 | Manipulation: select/move/resize/rotate, snapping and guides, reset controls (library from R0-2). | Playwright drag/resize tests; undo works. |
| R3-3 | Keyboard and accessibility for canvas editing, numeric inspector, live-region announcements (§5.2). | Keyboard-only run passes. |
| R3-4 | Touch editing: drag, pinch, rotate, ≥ 44 px handles, bottom toolbar. | Tested at 360×800 and 390×844 emulation; real-device check added to owner list. |
| R3-5 | Contextual selection toolbar and layers panel (lock, hide, reorder). | Works for slot elements and extras. |
| R3-6 | Export integration for overrides and extras (§5.10). | Golden screenshots match preview. |

### Phase R4 — Rich text (GATE GR4)

| ID | Task | Done when |
|---|---|---|
| R4-1 | `RichText` model, React renderer, plain-string migration. | Tests incl. Arabic and mixed bidi. |
| R4-2 | In-place editing and floating toolbar (engine from R0-3): font, size, color, bold, underline, highlight, alignment, direction; plain-text paste. | E2E tests; undo integrates. |
| R4-3 | Fit rules update (manual size disables auto-fit; overflow warning; split-slide action for rich text). | Unit and E2E tests. |
| R4-4 | Lists/bullets as rich-text nodes with template styling; paste-to-slides outputs rich text (modifies P4-3). | Parser tests for all Spec §8.3 rules. |
| R4-5 | Export fidelity for mixed fonts/sizes/colors in Arabic and English. | Golden screenshots in Chromium; WebKit proxy run. |

### Phase R5 — Counter, signature, settings (GATE GR5)

| ID | Task | Done when |
|---|---|---|
| R5-1 | Counter system (§5.4): show/hide, 6 anchors, styles, formats, hide on first/last, template-declared styles, collision handling. | Tests for every anchor and style, RTL included. |
| R5-2 | Signature system (§5.4): anchors, arrangement, size, photo shape, handle/socials, free move via overrides; CTA large avatar variants. | Visual snapshots for all combinations (sampled matrix). |
| R5-3 | Photo handling (§5.5): click-to-upload everywhere, crop dialog, placeholder affordance; **CTA photo regression test**. | Photo renders on every slide type and in export. |
| R5-4 | Settings page (§5.5). | Persists across reload; import/export all data. |
| R5-5 | Inline brand editing popover with per-project override, apply-to-defaults, reset. | E2E covers the three actions. |

### Phase R6 — Assets and stickers (GATE GR6)

| ID | Task | Done when |
|---|---|---|
| R6-1 | Asset pack format, lazy loader, validator, license registry (`ASSET_LICENSES.md`, `NOTICE`). | Invalid or unlicensed packs rejected by validation. |
| R6-2 | Shapes, lines, arrows pack (original, recolorable). | Usable from the panel and in export. |
| R6-3 | Icons pack from a verified open-source set, lazy and tree-shaken. | License text copied and verified. |
| R6-4 | Emoji and stickers/illustrations packs (§5.6 rules). | Owner decision D-08 recorded if gaps remain. |
| R6-5 | Assets panel UI: categories, bilingual search, click/drag to add, recents. | E2E add-to-canvas test. |
| R6-6 | Uploads: images and sanitized SVG, downscale, IndexedDB, replace, basic crop/mask (circle, rounded). | Malicious SVG upload rejected; round-trip via project JSON. |
| R6-7 | Templates can reference pack assets and local SVGs; validators updated. | A sample template uses both. |

### Phase R7 — Slide management (GATE GR7)

| ID | Task | Done when |
|---|---|---|
| R7-1 | Animated drag-and-drop rail (§5.7) with keyboard and touch alternatives. | E2E reorder test; reduced-motion variant tested. |
| R7-2 | Slide actions: add with a visual type picker, duplicate, delete with undo; memoized thumbnails; mobile strip. | 20-slide project stays smooth. |
| R7-3 | Format/orientation change dialog that explains per-class overrides and offers "reset layout for this format". | No content loss; clear messaging. |

### Phase R8 — UX redesign and delight (GATE GR8, owner review)

| ID | Task | Done when |
|---|---|---|
| R8-1 | Home: hero with an interactive swipeable demo carousel, quick-start tiles by platform, examples, recent projects. | Screenshots and rubric pass. |
| R8-2 | Gallery UI: masonry grid, category chips with icons, search, filters, hover preview, "preview with my brand", favorites, loading/empty states. | Rubric pass; 5 templates presented well. |
| R8-3 | Editor chrome (desktop): top bar, left tool rail (Templates, Elements, Text, Uploads, Brand, Layout), canvas with zoom/fit/pan, floating toolbars, animated slide strip. | Rubric pass. |
| R8-4 | Mobile editor: bottom sheets, tab bar, gestures, safe-area handling. | Rubric pass at 360×800 and 390×844. |
| R8-5 | Motion and micro-interactions (§7.2): springs, drag ghosts, snap-guide flash, toasts, skeletons, export progress, gallery→editor transition. | Reduced-motion variant verified. |
| R8-6 | Onboarding (3–4 skippable steps), empty states with original SVG illustrations, shortcuts overlay, friendly bilingual microcopy. | Strings in both languages. |
| R8-7 | Visual polish pass: spacing, type, icon consistency, dark/light and RTL/LTR parity, footer restyle. Prepare the owner review pack (screenshots + short video or GIF). | Owner review pack prepared. |

**GR8:** owner review pack prepared. (Owner reviews the design after agent completion; does not block R9).

### Phase R9 — Hardening and release prep (GATE GR9)

| ID | Task | Done when |
|---|---|---|
| R9-1 | Export regression suite over all new features (aspect classes, themes, RTL, rich text, extras, patterns). | Goldens committed; WebKit/Firefox proxy runs recorded; device checks listed. |
| R9-2 | Performance and bundle audit; lazy-loading review; mobile profiling. | Budgets in §2 item 10 met or justified. |
| R9-3 | Accessibility audit (axe, keyboard-only, screen-reader labels, contrast) (supersedes P3-10). | No critical findings; Lighthouse mobile A11y ≥ 90. |
| R9-4 | Security review: sanitizer tests, CSP update (fonts, assets), no `dangerouslySetInnerHTML`, dependency audit. | Findings fixed or documented. |
| R9-5 | Docs: README (with GIF), finalize `TEMPLATE_GUIDE`, update `QA_CHECKLIST`, **consolidate `Spec.md` into a v2 that merges §2 amendments** (keep the old file as `docs/history/Spec.v1.md`), refresh `BACKLOG`. | Spec v2 has no contradictions with the code. |
| R9-6 | Release prep: feature-flag review, known-issues list, release notes. Owner decides what ships. | Then continue original P5 rows (name, QA, Lighthouse, release). |

---

## 7. UX direction and quality bar (REQ-12)

### 7.1 Principles
1. **Canvas first:** chrome recedes; the design is the hero.
2. **Characterful, not generic:** avoid default Tailwind/shadcn look, gray-blue SaaS sameness, and purple-gradient-on-white clichés. The app has its own palette, type pairing, shape language, and illustration style (chosen via R0-6).
3. **Bilingual parity:** Arabic and English typography, spacing, and icons are designed equally; nothing feels like a translation.
4. **Delight in detail:** springy motion, satisfying snapping, meaningful empty states, warm short microcopy.
5. **Confidence for non-designers:** guardrails (snap, safe margins, reset) feel helpful, not restrictive.
6. **Touch is first-class:** mobile editing is designed, not squeezed.

### 7.2 Motion language
Standard transitions 150–250 ms ease-out; springs for drag/drop and panel entrances; shared-element transition from a gallery card into the editor; subtle snap-guide flash; skeleton loaders; export progress with a restrained completion moment. Everything honors `prefers-reduced-motion`.

### 7.3 Review rubric (self-review per UI task, scored 1–5, all ≥ 4 before owner review)
Hierarchy and focus; spacing and alignment (8-pt grid); consistency with the kit; contrast and legibility; motion quality; empty/loading/error states; RTL parity; mobile ergonomics (touch targets, thumb reach); one deliberate "delight" moment per screen. Record scores and defects in the task's `docs/ux-review/<task-id>/REVIEW.md`.

### 7.4 Screens to design
Home, Gallery, Wizard, Editor (desktop and mobile), Settings, Export dialog, Paste dialog, Assets panel, onboarding, empty/error states.

---

## 8. Risks and fallbacks

| Risk | Mitigation |
|---|---|
| Rich-text editing with Arabic IME and bidi is fragile | Spike R0-3, owner device checks (D-09); keep plain text editing path behind a flag as fallback |
| Free manipulation fights auto-relayout | Per-aspect-class overrides + Reset layout + clear messaging (R7-3) |
| Touch precision and performance | Numeric inspector, handle sizing, profiling in R9-2 |
| Untrusted SVG/CSS in templates and uploads | Vetted sanitizers, allowlists, malicious-sample tests, CSP |
| Asset licensing | License registry, verified sources only, gaps documented not hidden |
| Template schema churn after contributors arrive | `schema: 1` field, validators, documented migration policy; freeze rules at release |
| Scope (everything in one release) | Feature flags, gates, ordered phases, owner decides what ships at R9-6 |
| UX quality depends on taste | Three directions + owner approval gates (D-06, D-10) |
| 1000+ templates repo growth | Previews committed for v1; revisit separate repo/CI artifacts when > 100 templates (`BACKLOG`) |

## 9. New decisions and owner actions (append to the tracker; IDs continue after D-05)

| ID | Item | Blocks | Answer |
|---|---|---|---|
| D-06 | Owner picks UX direction A/B/C from `/ux-preview` | none | A — Atelier (agent recommendation). Owner reviews the design at the end and may request changes. |
| D-07 | Display name for `tech-mesh` template | none | Weave (ar: نسيج). Set as display name of template id `tech-mesh` in en/ar. |
| D-08 | Decision on illustration/sticker sourcing if licensed assets are insufficient | none | Agent decides: ship only clearly licensed assets, document gaps in docs/BACKLOG.md, record in docs/DECISIONS.md. Non-blocking. |
| D-09 | Owner runs Arabic IME and touch checks on real devices (iOS, Android) (owner-only) | none | Non-blocking. Owner runs physical device checks per docs/QA_CHECKLIST.md and docs/OWNER_REVIEW.md. |
| D-10 | Owner reviews UX pack and approves (or lists changes) | none | Non-blocking. Owner reviews design after agent finishes everything; does not block GR8 or R9. |

## 10. Acceptance criteria for this revision
1. Templates are data-only to add (levels 1–3 need no app code); a dry-run contribution passes CI; 5 starter templates ship.
2. Categories and gallery work with search/filters; categories with zero templates are hidden automatically.
3. Patterns are seamless across slides, prefix-stable, toggleable, and survive export.
4. Counter and signature meet §5.4 for every anchor/style, in LTR and RTL; the photo appears on every slide type including CTA; clicking any avatar uploads a photo.
5. Elements can be moved/resized/rotated with snapping, keyboard, and touch; Reset works; undo/redo covers all changes.
6. Rich text supports per-selection size/color/font in Arabic and English and exports faithfully.
7. Assets (shapes, icons, emoji, stickers/illustrations, uploads) can be added; every shipped asset has a recorded license.
8. Slide reordering is animated with keyboard and touch alternatives and a reduced-motion mode.
9. Settings page and inline project overrides work and persist.
10. Owner review pack prepared; rubric scores ≥ 4 on all main screens.
11. Spec v2 consolidated; export regression suite green; budgets and accessibility targets met or justified.

## Status
- [x] GR0  - [x] GR1  - [x] GR2  - [x] GR3  - [x] GR4  - [x] GR5  - [x] GR6  - [x] GR7  - [ ] GR8  - [ ] GR9
