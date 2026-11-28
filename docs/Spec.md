# SlideThread Specification v2

> Consolidated functional and technical specification incorporating all amendments from Revision Plan §2 (REQ-01 through REQ-13).  
> Archived v1 baseline is preserved in [`docs/history/Spec.v1.md`](history/Spec.v1.md).

---

## 1. Vision & Core Principles

SlideThread is a client-side visual design studio for creators, developers, educators, and founders to create high-impact multi-slide social carousels and posts for LinkedIn, Instagram, Facebook, and X.

### 1.1 Guiding Principles
1. **Canvas First:** Chrome recedes; the design is the hero.
2. **Characterful, Not Generic:** Direction A (Atelier) visual identity with warm stone surfaces, serif headings, and warm amber accents.
3. **Bilingual Parity:** English (LTR) and Arabic (RTL) typography, microcopy, text direction, and touch swipe direction have equal status. The page layout does not mirror when the language switches to Arabic (a deliberate decision); only text direction and swipe direction follow the language.
4. **Data-Driven Templates:** Templates are structured data (JSON + assets); adding templates requires zero app code.
5. **Direct Manipulation with Guardrails:** Elements can be freely moved, resized, and rotated, with snapping and one-click "Reset Layout".
6. **Zero-Backend Privacy:** All project data, images, and brand settings reside strictly in the user's browser.

---

## 2. Data Model (Schema v2)

All persisted projects conform to Schema v2 (`schemaVersion: 2`):

```ts
export interface Project {
  schemaVersion: 2;
  id: string;
  title: string;
  platform: PlatformId;
  contentType: ContentType;
  formatId: FormatId;
  orientation: Orientation;
  templateId: string;
  primaryColor: string;
  theme: ThemeMode;
  textDir: TextDirection;
  slides: Slide[];
  counter?: CounterConfig;
  signature?: SignatureConfig;
  brandOverride?: Partial<BrandSettings>;
  pattern?: { enabled: boolean; intensity: number };
  createdAt: number;
  updatedAt: number;
}

export interface Slide {
  id: string;
  type: SlideType;
  fields: Record<string, RichTextDoc>;
  overrides?: Record<string, AspectClassOverrides>;
  extras?: ExtraElement[];
}
```

---

## 3. Formats & Platforms

Four supported aspect ratios with pre-tuned dimension presets:
- `4:5 Portrait (1080×1350)`: LinkedIn document carousel & Instagram carousel.
- `1:1 Square (1080×1080)`: Feed posts and square carousels.
- `9:16 Story (1080×1920)`: Vertical stories and reels with 14% header/footer safe zones.
- `16:9 Landscape (1920×1080)`: Desktop presentations and web landscape graphics.

---

## 4. Template Platform & Archetypes
- **Starter Templates:** The gallery currently ships 107 starter templates, each a folder in `src/templates/starters/<id>/` (see the [Template contribution guide](TEMPLATE_GUIDE.md)). The original starters are `tech-mesh`, `bold-marketing`, `clean-minimal`, `golden-hour-viral`, `heritage-geometric`, `neon-grid-process` and `soft-gradient`. Later additions are released in groups of ten (`dt-*`, `pk-*`, then `g3-*` to `g10-*`).
- **Gallery Order:** Each template may set an optional numeric `priority`. Higher numbers show first, ties fall back to the template id, and a template without `priority` counts as 1. Group priority equals the group number (`dt-*` 1, `pk-*` 2, `g3-*` 3 and so on up to `g10-*` 10), so newer groups show first.
- **Continuous Patterns:** Reusable mathematical SVG generators (e.g. `mesh`, `geometric`) that flow smoothly across consecutive carousel slides.
- **Archetype Layouts:** Distinct archetype layouts per slide type (`cover`, `explain`, `rule`, `compare`, `code`, `stat`, `quote`, `image`, `cta`) across all four aspect classes.

---

## 5. Direct Canvas Manipulation
- **Interactive Layers:** Move, resize, and rotate elements with pointer and multi-touch pinch gestures.
- **Snapping Guides:** Real-time alignment guide flash in warm amber when objects align with canvas centers or boundaries.
- **Reset Safety:** Every modified element provides an accessible "Reset" action to immediately restore the template archetype default.
- **Undo / Redo:** Full 100-step coalesced history shared across project modifications and brand adjustments (`Ctrl+Z`, `Ctrl+Shift+Z`).

---

## 6. Typography & Rich Text
- **In-Place Rich Text Editing:** Tiptap-powered editor supporting inline font sizes, colors, font weights, italic, underline, and list bullets.
- **Script-Aware Font Allowlist:** Bundled local font families, all under the SIL Open Font License (licenses in `src/fonts/licenses`). The registry in `src/fonts/registry.ts` is the source of truth and currently has 20 families:
  - `IBM Plex Sans` and `IBM Plex Serif` (Latin)
  - `IBM Plex Sans Arabic` (Arabic)
  - `JetBrains Mono` (Monospace code snippets)
  - `Noto Sans Coptic` (Coptic script)
  - Additional display and Arabic families (for example `Anton`, `Amiri`, `Changa`, `Vazirmatn`), listed in the registry. Template themes may only use font ids from the registry.

---

## 7. Assets, Stickers, and Uploads
- **Asset Packs:** Tree-shaken canonical packs for Shapes (16 items), Presentation Icons (20 items), Reaction Emojis (8 items), and Badges/Stickers (6 items).
- **Sanitized Uploads:** Custom raster downscaling (`≤ 1600px`) and SVG uploads validated against XSS payloads and sanitized through DOMPurify.

---

## 8. Export & Rendering Fidelity
- **Multi-Format Export Pipeline:** High-resolution offscreen DOM rasterization outputting:
  - Multi-page document PDFs with vector coordinates (`jsPDF`).
  - Single high-res PNG slide captures.
  - Full-deck ZIP archives (`JSZip`).
- **Offscreen Staging:** Offscreen render stage ensures export snapshots are completely free of editor handles, selection rings, and UI chrome.
