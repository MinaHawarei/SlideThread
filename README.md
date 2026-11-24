# SlideThread

> **The browser-first studio for high-impact social carousels, posts, and stories.**  
> Crafted with React 18, TypeScript, Direction A (Atelier) design tokens, and client-side privacy.

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6_Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-45ba4b?logo=playwright)](https://playwright.dev/)

---

## 🌟 Overview

**SlideThread** is a client-side visual design studio created for founders, creators, developers, and educators to design publication-grade social slide decks, multi-slide carousels, and stories for LinkedIn, Instagram, Facebook, and X.

- **100% Client-Side Privacy:** Zero backend, zero database, zero external tracking. All drafts, photos, and assets remain securely in browser storage (`localStorage` + IndexedDB).
- **Native Bilingual Support:** Comprehensive English (LTR) and Arabic (RTL) typography, microcopy, layout mirroring, and touch swipe gesture directionality.
- **Direction A (Atelier) Aesthetic:** Warm stone surfaces, serif headings, vibrant amber accents, and paper-lift shadow elevation.
- **Data-Driven Template Platform:** Extensible JSON templates, 5 canonical starter templates, seamless multi-slide continuous patterns, and archetype layouts.
- **Direct Canvas Manipulation:** Move, resize, and rotate elements with intelligent snap guides, safe zones, and one-click "Reset Layout" safety.
- **Rich Text & Typography:** In-place rich-text formatting with custom font size, weight, color highlights, and bullet lists.
- **Asset Ecosystem:** Curated canonical packs for shapes, presentation icons, reaction emojis, stickers, and sanitized SVG uploads.
- **Multi-Format Export Pipeline:** Generate crisp multi-page PDFs, high-resolution PNG sets, or ZIP archives right in the browser.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18.0.0
- npm ≥ 9.0.0

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/mina/slidethread.git
cd slidethread

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

---

## 🛠️ Scripts & Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Starts Vite development server with HMR. |
| `npm run build` | Builds strict production bundle into `dist/`. |
| `npm test` | Runs full Vitest unit & integration test suite (77 files, 650+ tests). |
| `npm run test:e2e` | Runs Playwright end-to-end browser tests across viewports. |
| `npm run lint` | Runs ESLint 9 with strict flat config. |
| `npm run typecheck` | Validates TypeScript types across the codebase. |

---

## 📄 Documentation

- [Consolidated Specification v2](docs/Spec.md) (Archived v1 in [docs/history/Spec.v1.md](docs/history/Spec.v1.md))
- [Template Contribution Guide](docs/TEMPLATE_GUIDE.md)
- [QA Matrix & Manual Checklist](docs/QA_CHECKLIST.md)
- [Owner Review Pack](docs/owner-review/OWNER_REVIEW_PACK.md)
- [Performance & Bundle Audit](docs/PERFORMANCE_AUDIT.md)
- [Accessibility Audit (WCAG AA)](docs/ACCESSIBILITY_AUDIT.md)
- [Security Review & CSP](docs/SECURITY_AUDIT.md)

---

## 📜 License & Provenance
SlideThread is open source under the [MIT License](LICENSE).  
Bundled open-source fonts are licensed under the SIL Open Font License (OFL).
