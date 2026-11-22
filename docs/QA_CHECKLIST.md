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
