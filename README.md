# SlideThread

> **Modern, client-side studio for multi-slide social carousels, posts, and stories.**  
> Crafted with React, TypeScript, Tailwind CSS, OKLCH color science, and strict zero-backend privacy.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6_Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5_Rolled-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-45ba4b?logo=playwright)](https://playwright.dev/)

---

## 🌟 Overview

**SlideThread** is a high-fidelity web application designed for technical creators, educators, designers, and founders to create beautiful social slide decks, carousels, and stories for LinkedIn, Instagram, Facebook, and X.

Unlike heavy design software or cloud-based slide apps, SlideThread is:
- **100% Client-Side:** Zero backend, zero database, zero external tracking. Your drafts, photos, and assets never leave your device.
- **Bi-directional & Multi-Lingual:** Native support for English (LTR) and Arabic (RTL) with automated typographic alignment and script-aware fonts (`IBM Plex Sans` and `IBM Plex Sans Arabic`).
- **Typographic & Layout Integrity:** Uses logical CSS properties, dynamic auto-fitting text calculations, and isolation layers to guarantee pixel-perfect exports.
- **Offline First:** Automatic local state persistence via versioned `localStorage` and IndexedDB for full-resolution media assets.

---

## ✨ Features

- **9 Structured Slide Types:**
  - `cover`: High-impact title, tag, subtitle, and author signature.
  - `explain`: Paragraph text with optional highlight pills and bullet cards.
  - `rule`: Structured "IF / THEN" logic cards for principles and takeaways.
  - `compare`: Side-by-side "Bad vs. OK" or "Don't vs. Do" comparisons.
  - `code`: Syntactically styled code snippet block with monospaced JetBrains Mono.
  - `stat`: Bold metric counter with context label and explanatory note.
  - `quote`: Blockquote presentation with attribution and accent borders.
  - `image`: Media-focused showcase with caption and placement modes.
  - `cta`: Final slide call-to-action with social handles and engagement triggers.

- **3 Distinct Design Templates:**
  - **Network (Default):** Technical, modern aesthetic with subtle dot-matrix grids and crisp accents.
  - **Clean:** Minimalist, editorial typography with generous whitespace and understated rules.
  - **Bold:** High-contrast graphic presentation with strong borders and striking header blocks.

- **4 Aspect Ratios & Formats:**
  - `1:1 Square (1080×1080)`: Universal feed posts and carousels.
  - `4:5 Portrait (1080×1350)`: Optimized for Instagram and LinkedIn mobile feeds.
  - `16:9 Landscape (1920×1080)`: Desktop presentations, web embeds, and Twitter landscape.
  - `9:16 Story (1080×1920)`: Vertical stories and reels with visual safe-zone indicators for platform UI overlays.

- **OKLCH Color Science Engine:**
  - Automated generation of accessible, perceptually uniform color palettes from a single primary brand hex color.
  - Built-in WCAG contrast validation ensuring AA and AAA legibility across ink, background, muted, and accent tokens.

- **Local Media Management:**
  - Client-side downscaling (max 2400px long side) with PNG transparency preservation.
  - IndexedDB binary caching with instant blob URL generation.
  - Flexible positioning: `background`, `top`, `side`, and `replace-text`.

- **Paste-to-Slides (Instant Carousel Creation):**
  - Smart heuristic parser transforming raw markdown, notes, or bullet lists into pre-configured slides separated by `---` or double blank lines.
  - Heuristic detection for code blocks, quotes, statistics, comparisons, and rule sets.
  - Live preview modal with slide-type override selectors and append/replace modes.

- **Multi-Format Export Pipeline:**
  - **PNG:** High-resolution raster capture of active slide.
  - **ZIP Archive:** Sequential, numbered PNG images (`project-name-01.png`, etc.) zipped on the client using JSZip.
  - **PDF Document:** Multi-page PDF matching exact slide dimensions using jsPDF.
  - **Web Share API:** Direct native mobile sharing sheet integration.

- **Dual Responsive Workspaces:**
  - **Desktop:** Professional 3-column layout (thumbnail rail, live interactive canvas, and inspector tabs).
  - **Mobile:** Touch-first studio with horizontal thumbnail strip, swipe gesture canvas, and slide-up inspector sheets.

---

## 🏗️ Architecture & Repository Structure

SlideThread is structured cleanly into modular layers:

```
src/
├── config/              # Application, site metadata, and chunk splitting rules
│   ├── chunks.ts        # Rollup manual vendor chunk configurations
│   └── site.ts          # Brand metadata, owner profile, and social links
├── core/                # Core business logic and pure data utilities
│   ├── assetStore.ts    # IndexedDB asset store with idb-keyval
│   ├── formats.ts       # Social formats, aspect ratios, and dimensions
│   ├── media.ts         # Image scaling, validation, and object URL management
│   ├── palette.ts       # OKLCH color calculations and WCAG contrast checks
│   ├── paste.ts         # Heuristic markdown and text-to-slides parser
│   ├── persistence.ts   # Versioned localStorage autosave and schema migrations
│   ├── projectIO.ts     # JSON project export, import, and size validation
│   ├── templates.ts     # Template registry (Network, Clean, Bold)
│   ├── textFit.ts       # Text measurement and dynamic auto-scale engine
│   └── types.ts         # Strict TypeScript schemas and interfaces
├── export/              # Client-side capture and document packaging
│   ├── capture.ts       # Headless DOM-to-image rasterization
│   ├── pdf.ts           # Client-side jsPDF multi-page raster generator
│   ├── pipeline.ts      # Unified export orchestrator and download trigger
│   └── zip.ts           # JSZip packaging and blob generation
├── i18n/                # Localization dictionaries (English & Arabic)
│   ├── ar.ts            # Arabic translations
│   ├── en.ts            # English translations
│   └── useT.ts          # Reactive translation hook with auto-RTL direction
├── slides/              # Slide component renderers and isolated CSS
│   ├── CompareSlide.tsx
│   ├── CoverSlide.tsx
│   ├── ExplainSlide.tsx
│   ├── ImageSlide.tsx
│   ├── RuleSlide.tsx
│   ├── SlideRenderer.tsx # Memoized polymorphic slide container
│   ├── slides.css       # Isolated logical CSS rules with variable scoping
│   └── ...
├── store/               # Zustand global state slices
│   ├── projectStore.ts  # Current project, slides, undo/redo, autosave
│   └── settingsStore.ts # Global user settings (author profile, brand kit)
└── ui/                  # User interface views and controls
    ├── common/          # Reusable UI widgets, color pickers, modals
    ├── editor/          # Desktop and mobile editors, rails, inspectors, dialogs
    ├── start/           # Start screen, format picker, wizard
    └── wizard/          # Step-by-step onboarding creation flow
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/minahawarei/SlideThread.git

# Navigate into the project directory
cd SlideThread

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available NPM Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Vite local development server with hot-module replacement |
| `npm run build` | Runs TypeScript type checking (`tsc --noEmit`) and compiles production assets into `dist/` |
| `npm run preview` | Serves the production build locally for testing |
| `npm run lint` | Lints all TypeScript and React files with ESLint |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm test` | Runs the Vitest unit and component test suite |
| `npm run test:e2e` | Executes Playwright end-to-end and fidelity tests across Chromium |
| `npm run template:new -- <slug>` | Scaffolds a data-only template in `src/templates/starters/<slug>/` |
| `npm run template:dev -- <id>` | Starts the hot-reloading template lab with English/Arabic, theme, and aspect controls |
| `npm run template:validate` | Checks JSON Schema, runtime schema, security, WCAG contrast, assets, licenses, previews, and stress renders |
| `npm run template:preview` | Regenerates committed WebP previews; pass `-- --check` in CI to compare with tolerant pixel drift |
| `npm run template:index` | Regenerates the template gallery data index; pass `-- --check` to verify it is current |

---

## 🛠️ Extending SlideThread

### Adding a New Slide Format
To add a new social platform format or custom aspect ratio:
1. Open `src/core/formats.ts`.
2. Add your format configuration to `FORMATS` array:
   ```typescript
   {
     id: 'r_4_3',
     labelKey: 'format.landscape43',
     aspect: '4:3',
     width: 1440,
     height: 1080,
     descriptionKey: 'format.landscape43Desc',
     platforms: ['custom'],
     orientation: 'landscape',
   }
   ```
3. Add corresponding localization keys in `src/i18n/en.ts` and `src/i18n/ar.ts`.

### Adding a New Design Template
To register a new design aesthetic:
1. Open `src/core/templates.ts`.
2. Define the template tokens, font pairings, and default signature layout in `TEMPLATES`.
3. Add specific template styling rules in `src/slides/slides.css` targeting `[data-template="your-template-id"]`.

---

## 🧪 QA & Verification Matrix

SlideThread is continuously tested across desktop and mobile form factors:
- **Unit & Component Testing:** 40 test suites covering >325 tests (Vitest + React Testing Library).
- **Export & Fidelity Tests:** Automated Playwright suites verifying pixel-perfect raster capture, multi-slide ZIP generation, and `%PDF-` document integrity.
- **Accessibility:** High-contrast color verification (WCAG AA/AAA), keyboard focus rings, and full screen-reader ARIA labeling.

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are warmly welcome!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes with clear messages (`git commit -m "Add amazing feature"`).
4. Verify all checks pass: `npm run lint && npm run typecheck && npm test && npm run build`.
5. Push to your branch and open a Pull Request.

---

## 📄 License & Attribution

- **Source Code:** Distributed under the [MIT License](LICENSE).
- **Fonts:** 
  - [IBM Plex Sans](https://github.com/IBM/plex) (Open Font License)
  - [IBM Plex Sans Arabic](https://github.com/IBM/plex) (Open Font License)
  - [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (Open Font License)

---

## ⭐ Star the Repo

If SlideThread helped you create better carousels and presentations, consider giving us a star on GitHub! It helps more creators discover this free, privacy-first tool.

👉 **[Star SlideThread on GitHub](https://github.com/minahawarei/SlideThread)**
