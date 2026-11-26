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
`tests/e2e/exportRegression.spec.ts` exports the current slide as PNG and compares it with these baselines
(pixel comparison in the browser, fails when more than 1% of pixels differ by more than 24 levels, or when the
export size changes). Actual exports are written to `test-results/export-actual/` for inspection.

| Baseline | Project | Export size |
| --- | --- | --- |
| `golden-demo-en-4x5.png` | English demo project, 4:5 | 1080x1350 |
| `golden-demo-ar-4x5.png` | Arabic (RTL) demo project, 4:5 | 1080x1350 |
| `golden-wizard-1x1-tech-mesh.png` | New 1:1 tech-mesh cover | 1080x1080 |
| `golden-wizard-16x9-bold-marketing.png` | New 16:9 bold-marketing cover | 1920x1080 |

Refresh baselines only after reviewing the visual change: `UPDATE_GOLDENS=1 npx playwright test tests/e2e/exportRegression.spec.ts`.
A normal run never writes into this folder.

Earlier baselines (five files named by format/theme/language) were all the same image: the test never changed
format, theme or language, and nothing compared against them. They were replaced by the files above.

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
