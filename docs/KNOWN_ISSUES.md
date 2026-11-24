# SlideThread Known Issues & Verification Notes

This document catalogues open verification items, device-dependent behaviors, and non-blocking limitations tracked for post-release follow-up per `docs/REVISION_PLAN.md` §8 and `docs/TASKS.md` (D-08, D-09).

---

## 1. Real-Device Physical Hardware Checks (D-09)

The core application has been thoroughly tested with unit tests, Chromium Playwright automation, and mobile viewports (360×800 and 390×844). Because headless automation cannot emulate native operating system software keyboards or physical touch micro-timings, the following checks are designated for manual owner sign-off on physical devices:

### 1.1 Arabic Native Software IME Composition (iOS Safari & Android Chrome)
- **Status:** Automated bidi tests and sanitizer tests pass (100%).
- **Verification Need:** Real-device check using native Gboard / iOS Arabic virtual keyboards to verify composition events during multiline typing, auto-suggest completion, and caret positioning in mixed Arabic/English sentences.
- **Guidance:** Detailed step-by-step instructions are provided in `docs/QA_CHECKLIST.md` §2 and §5.

### 1.2 Physical Touch Drag & Frame Pacing on Mid-Range Android
- **Status:** Synthetic touch events, pointer tracking, and gesture simulations pass in automated Playwright tests.
- **Verification Need:** 5-second continuous element dragging on mid-range Android hardware (e.g. Pixel 'a' series, Samsung A-series) to verify frame rate stays smooth (~60 fps) and does not trigger accidental viewport scroll gestures.
- **Guidance:** Documented in `docs/QA_CHECKLIST.md` §4.

### 1.3 macOS Safari Visual Export Verification
- **Status:** Linux Chromium automated export regression suite passed 100% with golden image drift < 0.05%.
- **Verification Need:** Quick manual visual check on desktop macOS Safari to confirm WebKit font rasterization and SVG drop-shadow rendering matches expected output.

---

## 2. Asset Pack & Illustration Breadth (D-08)

- **Status:** Shipped 50 verified, permissively licensed assets:
  - 16 geometric shapes (MIT)
  - 20 presentation icons (ISC/Lucide)
  - 8 reaction emojis (CC-BY-4.0/Twemoji)
  - 6 badges and callout stickers (MIT)
- **Known Limitation:** Multi-figure narrative scene illustrations are not bundled to ensure strict copyright hygiene and zero legal risk. Users can upload their own brand graphics and SVG illustrations directly via the Uploads tool rail.
- **Tracking:** Documented in `docs/BACKLOG.md` §1 and `docs/DECISIONS.md` (D-08).

---

## 3. High-DPI Canvas Export Memory on Constrained Mobile Devices

- **Status:** 2x export scale produces sharp 2160×2700 images for Instagram carousels.
- **Known Limitation:** On low-memory mobile browsers (e.g. older iOS devices with strict 1.5 GB Safari tab memory caps), generating a 10-slide ZIP bundle at 2x scale in rapid succession may consume significant memory before browser garbage collection occurs.
- **Mitigation:** Sequential slide-by-slide export garbage collection and progressive memory release are implemented in `src/utils/export.ts`.

---

## 4. Browser Local Storage Quotas

- **Status:** Project metadata, custom templates, and user uploaded assets are persisted locally using standard browser storage with automatic downscaling of uploaded raster images.
- **Known Limitation:** Browsers enforce a standard origin quota (typically 5–10 MB for `localStorage`). Uploading dozens of uncompressed multi-megabyte photos in a single session will trigger the application's clean downscaling and compression pipeline to prevent storage overflow.
