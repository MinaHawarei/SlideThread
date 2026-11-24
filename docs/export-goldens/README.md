# Export Regression Suite & Proxy Run Log (Task R9-1)

## Summary
The export regression suite verifies that high-resolution offscreen canvas captures faithfully render slides across:
- Aspect classes (`4:5`, `1:1`, `9:16`, `16:9`)
- Themes (Light, Dark in Atelier warm stone palette)
- Directionality (English LTR, Arabic RTL)
- Rich text, typography, and badges
- Layout overrides and extras

---

## 1. Export Goldens Matrix
Golden PNGs captured and committed in `docs/export-goldens/`:
1. `golden-r_4_5-light-en.png`: LinkedIn 4:5 document carousel cover slide in light Atelier palette.
2. `golden-r_4_5-dark-ar.png`: LinkedIn 4:5 slide in dark Atelier palette with Arabic RTL typography.
3. `golden-r_1_1-light-ar.png`: Instagram 1:1 square post in light theme with Arabic design system demo.
4. `golden-r_9_16-dark-en.png`: Vertical Story 9:16 format with 14% safe zone margins respected.
5. `golden-r_16_9-light-en.png`: Standard landscape presentation 16:9 slide.

---

## 2. Browser & Engine Compatibility Verification
- **Chromium / Playwright:** All automated export tests green (`tests/e2e/exportFidelity.spec.ts` & `tests/e2e/exportRegression.spec.ts`, 11/11 passed).
- **WebKit Proxy Run:** Verified offscreen DOM rasterization using headless WebKit context; HTML-to-canvas rendering operates without cross-origin tainted canvas issues.
- **Firefox Proxy Run:** Verified standard Canvas2D blob export and jsPDF coordinate scaling.

---

## 3. Physical Device Verification Checklist (D-09)
Physical mobile and touch checks tracked for owner sign-off:
- [ ] iOS Safari (iPhone 14/15/16) - Native Arabic keyboard IME text editing in `RichTextEditor`.
- [ ] iOS Safari - Horizontal touch swipe slide transitions and pinch-to-zoom.
- [ ] Android Chrome (Pixel / Samsung) - Arabic text rendering and virtual keyboard safe area.
- [ ] Android Chrome - Long-press drag-to-reorder thumbnails in `MobileThumbnailStrip`.
