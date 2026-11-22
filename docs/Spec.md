# SPEC — Free Carousel & Post Maker for Content Creators

> Working name: **SlideThread** (placeholder). The name MUST live in a single config constant (`src/config/site.ts → APP_NAME`) so it can be changed in one place. Do not hardcode it anywhere else.

This document is the source of truth for **what** to build. `IMPLEMENTATION_PLAN.md` says **in what order**. If they conflict, this Spec wins; if something is ambiguous, pick the stated default, record it in `docs/DECISIONS.md`, and continue.

A reference prototype, `reference/mina-brand-kit.html`, shows the original visual identity (single-file, vanilla JS). Use it as a **visual and behavioral reference only**. Do not copy its code structure.

---

## 1. Product overview

A free, client-side web app that lets non-designers create **carousels, single posts, and stories** for **Instagram, LinkedIn, and Facebook** from ready-made templates, with their own brand settings (name, photo, handle, color, social accounts) applied automatically. No AI, no accounts, no server costs.

### 1.1 Goals
1. A person with no design experience can produce a good-looking carousel in under 5 minutes.
2. Free to run: static hosting (Vercel), everything computed in the browser.
3. Arabic and English are both first-class (RTL and LTR), English is the default UI language.
4. Works on mobile and desktop.
5. Open source (MIT) on GitHub, to collect feedback and stars.

### 1.2 Non-goals (v1)
- No AI features, no accounts, no backend, no cloud sync.
- No direct publishing to social platforms.
- No free-form drag-and-drop canvas editor (templates are constrained on purpose, so users cannot break the design).
- No video/animation export.
- No user-uploaded templates (planned for later; keep the template format data-driven so it is possible).

### 1.3 Target users
Content creators from all fields (not only developers). Many have no design skills. Some are not technical. UI copy must be plain and short.

### 1.4 Beta success criteria
- A first-time user creates and exports a carousel without help.
- Export output looks the same as the preview, including Arabic text, in Chrome, Safari (iOS), and Android Chrome.
- Feedback arrives through the in-app feedback button.

---

## 2. Tech stack (fixed unless a spike fails)

| Concern | Choice |
|---|---|
| Framework | React 18+, Vite, TypeScript (`strict: true`) |
| App UI styling | Tailwind CSS (app chrome only). Slides use their own CSS (CSS modules or plain CSS with variables), NOT Tailwind, so slide rendering is deterministic. |
| State | Zustand with `persist` middleware |
| Images storage | IndexedDB via `idb-keyval` (see 8.2) |
| i18n | Lightweight typed dictionaries + a `useT()` hook. No heavy library. |
| Color math | `culori` (OKLCH) |
| Export to image | `html-to-image` as primary candidate; `modern-screenshot` as fallback. **Decided by the Phase 0 spike.** Do NOT use `html2canvas` unless both fail. |
| PDF | `jsPDF` built from the rendered PNGs |
| ZIP | `JSZip` |
| Fonts | `@fontsource/*` packages (self-hosted, bundled). No Google Fonts CDN. |
| Tests | Vitest (unit), Playwright (export smoke + wizard flow) |
| Lint/format | ESLint, Prettier |
| Hosting | Vercel (static). Vercel Analytics (cookieless). |
| License | MIT |

Keep dependencies minimal. Any new dependency must be justified in `docs/DECISIONS.md`.

---

## 3. Core concepts and data model

Content is **independent of format and template**. Switching format, orientation, template, color, or theme must never lose content.

```ts
// src/core/schema.ts
export type PlatformId = 'instagram' | 'linkedin' | 'facebook' | 'custom';
export type ContentType = 'post' | 'carousel' | 'story';
export type Orientation = 'landscape' | 'portrait';
export type ThemeMode = 'dark' | 'light';
export type TextDir = 'auto' | 'ltr' | 'rtl';
export type AspectClass = 'landscape' | 'square' | 'portrait' | 'tall';

export interface FormatDef {
  id: string;                 // e.g. 'ig_4_5'
  label: string;              // i18n key
  width: number;              // px, portrait/default orientation
  height: number;
  orientable: boolean;        // true only for 16:9
  platforms: PlatformId[];
  contentTypes: ContentType[];
}

export type SlideType =
  | 'cover' | 'explain' | 'rule' | 'code' | 'compare'
  | 'stat' | 'quote' | 'image' | 'cta';

export interface MediaRef {
  assetId: string;            // key in IndexedDB
  fit: 'cover' | 'contain';
  focal?: { x: number; y: number };        // 0..1, for cover cropping
  placement: 'background' | 'top' | 'side' | 'replace-text';
}

export interface Slide {
  id: string;
  type: SlideType;
  fields: Record<string, string>;          // keys per slide type (section 6)
  media?: MediaRef;                         // optional on cover/explain/stat/quote/cta; required on image
  hideSignature?: boolean;
}

export interface Project {
  schemaVersion: number;
  id: string;
  title: string;
  platform: PlatformId;
  contentType: ContentType;
  formatId: string;
  orientation: Orientation;     // only meaningful when format.orientable
  templateId: 'network' | 'clean' | 'bold';
  primaryColor: string;         // hex, any color
  theme: ThemeMode;
  textDir: TextDir;             // default 'auto'
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
}

export interface BrandSettings {
  displayName: string;
  handle: string;               // e.g. '@name'
  photoDataUrl?: string;        // downscaled, see 8.1
  showSignature: boolean;       // default true
  showSocials: boolean;         // default false
  socials: { platform: SocialPlatform; handle: string }[];
  language: 'en' | 'ar';        // UI language, default 'en'
  defaultTemplateId: string;
  defaultPrimaryColor: string;
  defaultTheme: ThemeMode;
}

export type SocialPlatform =
  | 'instagram' | 'linkedin' | 'facebook' | 'x' | 'github' | 'youtube' | 'tiktok' | 'website';
```

Every persisted object carries `schemaVersion`. Provide `migrate(project)` and unit tests for it from day one.

---

## 4. Platforms, content types, and formats

### 4.1 Format registry (`src/core/formats.ts`)
All export sizes use a **short side of 1080 px**, exported at 1x. Adding a format must require only one new entry in this registry.

| id | Size (W×H, default) | Orientable | Notes |
|---|---|---|---|
| `r_4_5` | 1080×1350 | no | Instagram/LinkedIn/Facebook portrait post and carousel |
| `r_1_1` | 1080×1080 | no | Square, all platforms |
| `r_9_16` | 1080×1920 | no | Stories |
| `r_16_9` | 1920×1080 landscape / 1080×1920 portrait | **yes** | Orientation toggle swaps width and height |

### 4.2 Platform → content type → allowed formats (`src/core/platforms.ts`)

| Platform | post | carousel | story |
|---|---|---|---|
| Instagram | `r_4_5`, `r_1_1`, `r_16_9` | `r_4_5`, `r_1_1` | `r_9_16` |
| LinkedIn | `r_1_1`, `r_4_5`, `r_16_9` | `r_4_5`, `r_1_1`, `r_16_9` (document/PDF) | not offered |
| Facebook | `r_4_5`, `r_1_1`, `r_16_9` | `r_1_1`, `r_4_5` (multi-image) | `r_9_16` |
| Custom (direct size) | any format | any format | `r_9_16` |

Platform specifications change over time. **At implementation time, the agent must re-verify these sizes and limits against each platform's current official documentation** and update the registry and this table if needed (record in `docs/DECISIONS.md`).

Recommended export per combination (preselected, user can override):
- LinkedIn carousel → PDF
- Instagram/Facebook carousel → PNG ZIP
- Any post/story → PNG

Soft warnings (non-blocking): Instagram carousel above 20 slides; any carousel above 30 slides.

### 4.3 Entry flow (wizard)
Two entry paths on the start screen:
1. **Guided:** pick platform → pick content type (post / carousel / story) → format is preselected (user may change among the allowed formats) → pick template → editor.
2. **Direct size:** pick a format directly (and orientation for 16:9) → pick content type → pick template → editor.

Content type is chosen at project start. A "Change format" control in the editor lets the user switch later without losing content.

### 4.4 Content type behavior
- **Carousel:** many slides, signature + counter on each slide (counter optional in settings).
- **Post:** exactly one slide. The "Add slide" control is hidden.
- **Story:** one or more 9:16 frames, same engine as carousel, with safe zones (section 5.4).

---

## 5. Rendering and layout engine

### 5.1 Coordinate system
Each slide renders in a fixed design canvas of the format's exact pixel size (e.g. 1080×1350), then is scaled with CSS `transform: scale()` for preview. Export renders the same DOM unscaled in an offscreen stage (section 9.1). Never use viewport units inside slides.

### 5.2 Aspect classes and automatic relayout
`aspectClass(width, height)`:
- `landscape`: width/height > 1.2
- `square`: 0.9 ≤ width/height ≤ 1.2
- `portrait`: 0.65 ≤ width/height < 0.9
- `tall`: width/height < 0.65 (9:16)

Every slide component receives `aspectClass` and renders a layout variant. Changing format or orientation re-renders automatically with no manual adjustment. Required variants:

| Slide | landscape | square | portrait | tall |
|---|---|---|---|---|
| cover | title block start-aligned, media on the opposite side | stacked | stacked | stacked, content centered, safe zones |
| explain | title left column, body right column | stacked | stacked | stacked |
| rule (if/then) | IF and THEN side by side, horizontal connector | stacked, vertical connector | stacked | stacked |
| compare | two columns | two columns | stacked | stacked |
| code | title above, wide code block | same | same | same, smaller font |
| stat | number left, label right | stacked | stacked | stacked |
| quote | centered, large | centered | centered | centered |
| image | full-bleed, caption bar | same | same | same |
| cta | avatar left, text right | stacked | stacked | stacked |

Use CSS logical properties (`inline-start/end`, `margin-inline`, etc.) so layouts mirror correctly in RTL.

### 5.3 Text fitting
- Each text slot has a base font size from the template's type scale.
- Auto-fit: if text overflows its container, scale it down in steps (min scale 0.6 of base). Implement with a measure-then-adjust loop (hidden measurement or `useLayoutEffect`), deterministic and also run before export.
- If text still overflows at minimum scale, show a **non-blocking warning** on that slide ("Text is long — consider splitting this slide") with a one-click "Split into two slides" action when the slide is `explain` with bullets/paragraphs.
- No hard character limit.

### 5.4 Story safe zones
For `r_9_16` stories, keep primary content inside a safe area that reserves the top 14% and bottom 14% of the height (configurable constant; verify against platform UI at implementation time). The signature bar sits inside the safe area. Show an optional "safe zone" overlay toggle in the editor (not exported).

### 5.5 Direction (RTL/LTR)
- Slide text uses `dir="auto"` per text element by default; the project can force `ltr` or `rtl`.
- Code blocks are always LTR.
- Never apply `letter-spacing` to text that may contain Arabic (breaks letter joining).
- Numbers in slide counters stay LTR.

---

## 6. Slide types

All fields are plain strings (multi-line allowed). Missing optional fields render nothing (no empty boxes).

| Type | Fields | Notes |
|---|---|---|
| `cover` | `tag` (opt), `title`, `sub` (opt), `rule` (opt, monospace one-liner) | Title is the hook; suggest ≤ 8 words (hint only) |
| `explain` | `title`, `body` | In `body`: a line starting with `- ` becomes a bullet node (connected list); other lines are paragraphs; lines starting with `1. ` become numbered steps |
| `rule` | `title`, `cond`, `res`, `note` (opt), `condLabel` (default "if"), `resLabel` (default "then") | Two linked boxes with a connector/arrow |
| `code` | `title`, `code`, `note` (opt) | Monospace, LTR, preserved whitespace; no syntax-highlight library in v1 (plain, themed) |
| `compare` | `title`, `l1`, `t1`, `l2`, `t2` | Two cards; first uses "bad" semantic color, second "ok" |
| `stat` | `value`, `label`, `note` (opt) | Big number/short value, label beneath |
| `quote` | `text`, `author` (opt) | Large typographic quote |
| `image` | `caption` (opt) | Media required; full-bleed with optional caption bar |
| `cta` | `title`, `body`, `action` | Large avatar + name/handle, replaces the signature bar on this slide |

### 6.1 Media (images in place of text)
- Any of `cover`, `explain`, `stat`, `quote`, `cta` can attach an optional media block with placement `background | top | side | replace-text`.
- `replace-text` means the image occupies the body area instead of the text; the title stays.
- The `image` slide type is media-first.
- Image controls: upload, replace, remove, fit (cover/contain), focal point (click-to-set).
- Uploaded images are downscaled client-side to a max long side of 2400 px (JPEG/WebP, quality ~0.85) before storage. Preserve transparency by using PNG/WebP when the source has alpha.

### 6.2 Signature bar
Rendered at the bottom of every slide (except `cta`, or when `hideSignature` is set, or when `showSignature` is false in settings):
- Circular photo (placeholder = first letter of name on an accent gradient) with a ring in the accent color
- Display name and handle
- Slide counter `03/07` (carousel only; toggle in settings)
- If `showSocials` is on: a compact row of social icons + handles under or beside the signature (max 3 shown, the rest collapsed; never overflowing)

---

## 7. Templates and design system

A template is **data + components**: tokens, a background renderer, and slide variants. Templates are registered in `src/templates/index.ts`. Adding a template must not require changes to the engine.

```ts
export interface TemplateDef {
  id: 'network' | 'clean' | 'bold';
  nameKey: string;
  fonts: { display: string; body: string; mono: string };
  typeScale: Record<'h1'|'h2'|'body'|'small'|'mono', number>; // px at 1080 short side
  radius: { card: number; chip: number };
  Background: React.FC<{ index: number; count: number; width: number; height: number; tokens: Palette }>;
  // slide components may be shared and read tokens; per-template overrides allowed
}
```

### 7.1 Starter templates
1. **Network** (the original identity, reference prototype)
   - Background: a seeded, deterministic node-and-line network drawn over the **whole carousel width** (canvas width = slideCount × slideWidth); each slide shows its own window, so lines continue across slides when swiped.
   - Algorithm: PRNG mulberry32 with seed 7; 8 nodes per slide width; each node connects to its 2 nearest neighbors if distance < 560 px (scaled with slide size); every 5th node is an accent ring node (secondary color); other nodes small, accent color at 50% opacity; lines use the "line" token at 2.5 px.
   - Motifs: `if/then` rule boxes with a connector; bullet lists as connected nodes; pill tags; monospace one-liners.
   - Default look: deep ink-blue background with cyan and violet accents (dark), cool-white with teal-blue and indigo (light).
2. **Clean:** minimal, lots of whitespace, one accent, flat cards, no background graphics.
3. **Bold:** large type, strong color blocks, thick borders, high contrast.

Templates 2 and 3 must feel clearly different from Network and from each other (not recolors). Design them deliberately; avoid generic stock-looking defaults.

### 7.2 Palette generation from one color (`src/core/palette.ts`)
Input: `primaryColor` (any hex) + `theme`. Output tokens:

```ts
export interface Palette {
  bg: string; bg2: string;       // gradient pair
  ink: string; mute: string;     // primary and secondary text
  acc: string; acc2: string;     // accent and secondary accent (hue shifted ~ +60° in OKLCH)
  line: string;                  // accent at ~26% alpha
  card: string;                  // translucent card surface
  ok: string; bad: string;       // semantic, fixed hues (~155° green, ~20° red) adjusted for the theme
  onAcc: string;                 // text color on accent fills
}
```

Rules (use OKLCH via `culori`):
- Dark: `bg` L≈0.17, `bg2` L≈0.22, chroma low (≤ 0.04) with the primary's hue. Light: `bg` L≈0.97, `bg2` L≈0.93.
- `acc` derived from the primary: adjust lightness until contrast against `bg` ≥ 3:1; if the primary is extremely dark/light/low-chroma, nudge it rather than fail.
- `ink` vs `bg` contrast ≥ 7:1; `mute` vs `bg` ≥ 4.5:1; `onAcc` chosen for ≥ 4.5:1 against `acc`.
- Pure functions, fully unit-tested, including edge colors (`#000000`, `#ffffff`, `#808080`, saturated yellow).

Reference prototype tokens for Network (use as default presets when the primary is the default cyan/violet):
- Dark: bg `#0C1624`, bg2 `#13263F`, ink `#EAF2FB`, mute `#8FA3BC`, acc `#35D0E6`, acc2 `#8B7CF6`, ok `#5EE6A8`, bad `#FF7A8A`
- Light: bg `#F2F6FB`, bg2 `#DFEAF6`, ink `#0C1624`, mute `#52647C`, acc `#0B7FA6`, acc2 `#5B49D6`, ok `#12875A`, bad `#C4374B`

### 7.3 Typography
Bundled via `@fontsource` (all open licenses): **IBM Plex Sans** (Latin), **IBM Plex Sans Arabic**, **JetBrains Mono** (code/handles). Templates may add 1–2 more fonts later; each added font must support both scripts or specify a fallback pair. Loading must be awaited before measuring/exporting (`document.fonts.ready` + explicit `document.fonts.load` for used weights).

Base type scale at 1080 short side (Network, in px): h1 112, h2 76, body 44, small 30, mono 34–36. Minimum rendered text on any slide: 28 px at 1080 short side (readability on phones).

---

## 8. Settings, persistence, and projects

### 8.1 Brand settings
- Stored in `localStorage` (key `app:settings:v1`), versioned.
- Photo: file input → center-crop to square → downscale to 400×400 → JPEG/WebP data URL stored with settings. A "Remove photo" action exists. Photo is optional (placeholder shown otherwise).
- Settings are editable at any time from a settings panel; changes apply to all slides immediately.

### 8.2 Projects
- Current and recent projects: project JSON (text + settings of the project, no image bytes) in `localStorage` (`app:projects:v1`), image bytes in **IndexedDB** keyed by `assetId`.
- *Deviation from the owner's "localStorage" preference, deliberately:* localStorage has a ~5 MB quota that images would exhaust quickly. Text and settings stay in localStorage as requested; only image binaries use IndexedDB. Record this in `docs/DECISIONS.md`.
- Autosave (debounced ~500 ms). Handle quota/IndexedDB failures gracefully with a visible, non-blocking message; never lose in-memory work.
- Keep up to 10 recent projects with a simple list on the start screen (open, duplicate, delete).
- **Export project** → `.json` file with images embedded as base64 (warn about file size). **Import project** → validates schema, migrates, rejects malformed files with a clear message.
- "Clear all my data" in settings removes localStorage keys and IndexedDB assets.

### 8.3 Paste text → slides (no AI)
Input: a textarea in a dialog. Heuristic parser (`src/core/paste.ts`, pure and unit-tested):
1. If the text contains lines that are exactly `---`, split into slides on them. Otherwise split on blank lines (2+ newlines).
2. First block → `cover`: first line = `title`, remaining lines = `sub`.
3. A block starting with a code fence (```) → `code` slide.
4. A block whose lines mostly start with `> ` → `quote`.
5. A block with both a line starting `if:` (or `IF`) and a line starting `then:` → `rule`.
6. A block that is only a number/short value followed by a line of text (e.g. `85%\nof users ...`) → `stat`.
7. Last block containing words like follow/save/share/subscribe or marked `cta:` → `cta`; otherwise no automatic CTA.
8. Everything else → `explain`: first line = `title` if it is short (< 60 chars) and followed by more lines; rest = `body`.
Show a preview list of generated slides with type selectors before applying. Applying appends to (or replaces) the current slides after confirmation.

---

## 9. Export

### 9.1 Export stage
Rendering for export happens in a hidden, **unscaled** offscreen container at exact format size (not by cloning the scaled preview). Before capturing: await fonts, decode all images (`img.decode()`), run text-fit, then capture. Run one warm-up capture before the real one (works around first-render glitches on Safari). Capture at pixelRatio 1 (size is already final).

### 9.2 Outputs
- **PNG** (single slide or all): files named `{project-title-slug}-{nn}.png`.
- **ZIP:** all slide PNGs in one archive.
- **PDF:** one page per slide, page size exactly the slide's pixel size, built from the PNGs. (PDF is raster; this is acceptable and must be stated in the UI help text.)
- Export dialog: pick output (PNG / ZIP / PDF), range (all / current), progress bar, cancel button. On mobile, offer the Web Share API (files) when supported, and fall back to downloads.
- No watermark.

### 9.3 Quality bar
Export must match the on-screen preview for: Arabic joined letters and ligatures, mixed bidi text, gradients, border radius, box-shadows, SVG backgrounds, CSS variables, bundled fonts, and large uploaded images. Verified by the Phase 0 spike matrix and Playwright smoke tests.

---

## 10. UI / UX

### 10.1 General
- Neutral app chrome (not the slide identity), follows system light/dark, independent of the slide theme.
- Plain-language labels; sentence case; each button says what it does.
- UI languages: English (default) and Arabic; Arabic flips the app UI to RTL. Language switcher is always visible.
- Keyboard accessible; visible focus; labelled controls; respects `prefers-reduced-motion`; contrast ≥ 4.5:1.

### 10.2 Screens
1. **Start:** two entry paths (guided / direct size), recent projects, import project.
2. **Wizard steps:** platform → type → format (+ orientation if orientable) → template. Each step shows a short explanation and a live mini-preview.
3. **Editor:**
   - **Desktop:** left = slide rail (thumbnails, drag to reorder, add/duplicate/delete); center = large live canvas; right = inspector (slide type selector, fields, media controls) with tabs for Slide / Design (template, color, theme, direction) / Brand (settings).
   - **Mobile:** single-slide canvas with swipe; bottom tab bar (Slides / Edit / Design / Export); slides as a horizontal thumbnail strip; inspector as a bottom sheet. Touch targets ≥ 44 px.
4. **Settings/Brand panel,** **Paste-text dialog,** **Export dialog,** **Change-format dialog.**

### 10.3 Footer (all screens, unobtrusive)
- Owner's name and social links (configured in `src/config/site.ts → OWNER`; use placeholders: name "Mina Hawarei", handle "@minahawarei", and URLs for LinkedIn / Instagram / GitHub to be filled by the owner).
- "Star on GitHub" link, feedback button, and a one-line privacy note ("Your content stays in your browser. We use cookieless analytics.").

### 10.4 Feedback
A "Send feedback" button opens `FEEDBACK_URL` (configurable external form, in `site.ts`) in a new tab, with a `mailto:` fallback if the URL is empty. No in-app data collection beyond Vercel Analytics.

### 10.5 Empty/error states
Every empty or failure state says what happened and what to do next (e.g. export failed → "Try a smaller number of slides or another browser", import invalid → which part of the file is wrong). No raw stack traces in the UI.

---

## 11. Seed content
Ship demo projects (English and Arabic, one each) shown on the start screen as "Try an example". Each demonstrates all 9 slide types in the Network template. Use neutral generic topics (not personal data).

---

## 12. Non-functional requirements
- **Browsers:** latest Chrome, Edge, Firefox, Safari (macOS), iOS Safari 16+, Android Chrome.
- **Performance:** typing in a field updates the preview in < 100 ms for projects up to 20 slides (memoize slide components, re-render only the changed slide, debounce autosave). First load < 250 KB JS gzip excluding fonts where practical (code-split export libraries and the paste dialog).
- **Privacy:** no network calls besides static assets, Vercel Analytics, and the external feedback link. Add a CSP in `vercel.json`. All user text is rendered through React (no `dangerouslySetInnerHTML`).
- **Offline:** works offline after first load if feasible (optional PWA stretch goal, not required in v1).
- **Licensing:** MIT for the code; include `NOTICE`/third-party license list (fonts under OFL). Users are responsible for rights to images they upload (note in the footer/help).

---

## 13. Repository layout (target)

```
/
  README.md  LICENSE  NOTICE  vercel.json
  Spec.md  IMPLEMENTATION_PLAN.md
  docs/ DECISIONS.md  EXPORT_SPIKE.md  QA_CHECKLIST.md
  reference/ mina-brand-kit.html
  src/
    config/site.ts            # APP_NAME, OWNER links, FEEDBACK_URL, GITHUB_URL
    core/ formats.ts platforms.ts schema.ts migrate.ts palette.ts aspect.ts fit.ts paste.ts
    store/ projectStore.ts settingsStore.ts assets.ts
    templates/ index.ts network/ clean/ bold/
    slides/ Cover.tsx Explain.tsx Rule.tsx Code.tsx Compare.tsx Stat.tsx Quote.tsx ImageSlide.tsx Cta.tsx
    render/ SlideCanvas.tsx ExportStage.tsx SignatureBar.tsx
    export/ capture.ts png.ts pdf.ts zip.ts share.ts
    i18n/ en.ts ar.ts index.ts
    ui/ wizard/ editor/ dialogs/ footer/ common/
    main.tsx App.tsx
  tests/ unit/ e2e/
```

---

## 14. Acceptance criteria (definition of done for v1)
1. All wizard paths work and produce the correct format for every platform/type combination in 4.2.
2. All 9 slide types render correctly in all 4 aspect classes, LTR and RTL, dark and light, in all 3 templates.
3. Changing format/orientation/template/color/theme never loses content and relayouts automatically.
4. Palette generator passes unit tests for contrast rules on edge colors.
5. Paste-to-slides parser passes unit tests for every rule in 8.3 and shows a preview before applying.
6. Export (PNG, ZIP, PDF) matches the preview in Chrome, Safari (macOS + iOS), and Android Chrome; Arabic text joins correctly.
7. Settings, photo, and projects persist across reloads; import/export JSON round-trips losslessly; schema migration tested.
8. Works and is comfortable on a 360 px wide phone and on desktop.
9. English and Arabic UI complete with no missing keys (CI check that both dictionaries have identical keys).
10. Footer, feedback button, GitHub star link, and analytics present; README documents setup, scripts, and contribution notes.
11. Lighthouse (mobile) Accessibility ≥ 90 and no console errors in a normal flow.
12. Deployed on Vercel from the main branch with a working preview URL.
