# R2-6 starter template review

Date: 2026-11-23

The 12 screenshots show the `/gallery` live renderer with the Weave cover slide at the required viewports, themes, and text directions. The committed WebP previews show one cover from each starter template.

## Review rubric

| Criterion (§7.3) | Score (1–5) | Review |
|---|---:|---|
| Hierarchy and focus | 4 | Each starter cover keeps the headline and supporting line dominant while preserving its own visual signature. |
| Spacing and alignment | 4 | Text and signature align to deliberate margins; cards and code frames have consistent internal spacing. |
| Consistency with the kit | 4 | Template cards use each template's own palette, typography, and radius system without changing app chrome. |
| Contrast and legibility | 4 | Light and dark palettes pass the manifest contrast checks; cover text remains legible in both modes. |
| Motion quality | 4 | The review screens are static; decorations are deterministic and do not animate or distract. |
| Empty, loading, and error states | 4 | This task adds template renders and previews, not gallery states; gallery empty/loading/error design remains in R8-2 scope. |
| RTL parity | 4 | Arabic cover text uses RTL flow and keeps code and counters LTR; the long-Arabic matrix covers every template and aspect class. |
| Mobile ergonomics | 4 | The cover remains legible at 360 px and the rendered slide fits within the preview frame. |
| Deliberate delight | 4 | Each starter has a distinct identifying detail: connected mesh, quiet whitespace, campaign blocks, soft blobs, or warm tessellation. |

All scores meet the required minimum of 4.

## Screenshot matrix

Images are saved as `templates-<width>x<height>-<theme>-<direction>.png`.

| Viewport | Light LTR | Light RTL | Dark LTR | Dark RTL |
|---|---|---|---|---|
| 360×800 | `templates-360x800-light-ltr.png` | `templates-360x800-light-rtl.png` | `templates-360x800-dark-ltr.png` | `templates-360x800-dark-rtl.png` |
| 768×1024 | `templates-768x1024-light-ltr.png` | `templates-768x1024-light-rtl.png` | `templates-768x1024-dark-ltr.png` | `templates-768x1024-dark-rtl.png` |
| 1440×900 | `templates-1440x900-light-ltr.png` | `templates-1440x900-light-rtl.png` | `templates-1440x900-dark-ltr.png` | `templates-1440x900-dark-rtl.png` |

## Known scope

The gallery route is an engineering preview, not the finished template browsing experience. Search, category filters, and empty/loading/error states belong to R2-9 and R8-2. Real-device Arabic IME and touch checks remain owner-only per the project checklist.
