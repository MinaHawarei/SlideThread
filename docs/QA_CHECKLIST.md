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

## Arabic rich-text IME and bidi check — needs manual check by owner (D-09)

Run on a physical iPhone in Safari with the Arabic keyboard and a physical mid-range Android phone in Chrome with the Arabic keyboard. Use the rich-text editor in the revision build when available; until then, this item remains pending and must not be inferred from desktop automation.

1. Record device model, OS version, browser version, and keyboard/input method. Start with an empty text field and type `مرحبا بالعالم` using the Arabic keyboard. Type a word at a time, accept any keyboard composition/suggestion, and confirm the text appears once with no missing or duplicated characters after each composition ends.
2. Type a mixed-direction line: `مرحبا Slide 2 رقم 42`. Move the caret between Arabic words, the English word, and the number using taps and the arrow keys where available. Insert and delete characters at each boundary; confirm the caret remains at the intended visual position and the text order is correct.
3. Select an Arabic word, then a selection spanning Arabic and English. Apply bold, underline, size, and color; confirm only the selected text changes and the selection does not jump to another bidi run.
4. Copy formatted mixed Arabic/English text from another app and paste it into the editor. Confirm only plain text is inserted and that no source formatting or unsafe markup is applied. Also type Arabic directly after a formatted run and confirm the new characters render correctly.
5. Undo and redo the typing and formatting. Confirm completed Arabic words remain intact and the editor does not commit intermediate composition text as duplicated characters.
6. Repeat the checks after switching the project between LTR and RTL, then reload and confirm the saved rich text still renders in the correct order.

Attach notes with the device/browser/keyboard and pass/fail result to the D-09 owner verification record. Do not treat Chromium desktop or WebKit automation as proof of native Arabic IME behavior.
