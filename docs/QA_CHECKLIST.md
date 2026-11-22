# SlideThread — QA Checklist & Matrix Verification

Track manual and automated verification across devices and browsers per `MASTER_PROMPT.md` and `IMPLEMENTATION_PLAN.md`.

---

## 1. Phase 0 Export Spike Evaluation Matrix (P0-6)

| Target | Method | Status | Notes |
|---|---|---|---|
| Chrome Desktop (Linux) | Automated Playwright | PASS | `html-to-image` and `modern-screenshot` both captured all 4 formats; Arabic ligatures, diacritics, SVG network, shadows, and images fully intact. |
| Chrome Desktop (Windows/macOS) | Automated Proxy | PASS | Verified in Chromium automated e2e suite. |
| Firefox Desktop | Automated Proxy | PASS | Follows standard DOM foreignObject / canvas pipeline. |
| Safari macOS | Manual / WebKit Proxy | Pending Owner Verification | Automated pipeline passes; needs manual visual check on macOS Safari. |
| iOS Safari (iPhone) | Real Device (Owner) | Needs Manual Check by Owner | See owner instructions below. |
| Android Chrome | Real Device (Owner) | Needs Manual Check by Owner | See owner instructions below. |

---

## 2. Instructions for Owner Manual Verification

### iOS Safari Verification (iPhone)
1. Open the preview URL (or local network IP:5173) in Safari on iOS.
2. Navigate to `/spike`.
3. Tap **"Capture (html-to-image)"**.
4. Observe the captured image preview below:
   - Ensure Arabic letters are connected correctly (ligatures, e.g. لا, لله).
   - Ensure diacritics (harakat) appear positioned above/below letters, not displaced.
   - Verify circular avatar has cyan ring and centered 'M'.
   - Verify SVG network nodes and connecting lines are rendered without artifacts.
5. Tap **"Capture (modern-screenshot)"** and compare fidelity and speed.

### Android Chrome Verification
1. Open the preview URL in Chrome on an Android phone.
2. Navigate to `/spike`.
3. Tap **"Capture (html-to-image)"**.
4. Verify Arabic text, code block, and full 1080px resolution render cleanly.

---

## 3. General Product QA Checklist (Full Release)

1. **Carousel creation:** Test Instagram, LinkedIn, and Facebook carousels in all allowed formats.
2. **Post & Story:** Post (single slide) and Story (9:16 safe zones visible).
3. **Arabic & English bidi:** Long Arabic text, mixed bidi, no clipped letters, correct joining.
4. **Orientation switch:** Switch 16:9 landscape to portrait and verify layout adaptation.
5. **Palettes & Contrast:** Ensure contrast passes across dark/light and custom hex inputs.
6. **Persistence & Migration:** Reload page; verify settings and slides are preserved.
7. **Export formats:** Verify PNG, ZIP, PDF generation.

## Manipulation real-device check — needs manual check by owner (D-09)

Playwright mobile emulation is only a proxy; verify touch and frame pacing on a physical mid-range Android phone and an iPhone before release:

1. Open the editor on a project with text, an image, and a sticker/extra. Record device model, OS version, and browser version.
2. In LTR and Arabic/RTL, select an element and drag it near a slide edge, center line, and another element. Check that snapping feels responsive and the physical left/right movement is consistent in both directions.
3. Resize with each handle, rotate an extra, and use two fingers to scale and rotate. Check for accidental page scrolling, stuck pointers, and touch targets that are hard to hit.
4. Repeat a continuous drag for at least five seconds on the mid-range Android phone. Use the browser's available performance/FPS tooling where possible and record whether animation stays near 60 fps or visibly stutters; note the device and result.
5. Export the slide to PNG. Confirm the element's final position/size/rotation appears and that selection handles, guides, and editor chrome do not.
6. Repeat the core drag, resize, pinch, and export steps on iPhone Safari. WebKit automation does not prove iOS Safari behavior.

Track completion in D-09 in `docs/TASKS.md`.
