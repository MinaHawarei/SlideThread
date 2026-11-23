# R1-3 Atelier component kit review

Date: 2026-11-23  
Route: `/kit`  
Capture: Playwright Chromium full-page screenshots at 360×800, 768×1024, and 1440×900.

## Rubric

| Criterion | Score (1–5) | Review |
|---|---:|---|
| Brand character | 5 | Warm paper, ink, and terracotta tokens, serif-led headline, and small studio marks create a distinct Atelier identity. |
| Layout and hierarchy | 4 | The intro leads into clearly grouped component cards; responsive columns become a readable single-column stack on mobile. |
| Component consistency | 4 | Buttons, fields, tabs, slider, dialogs, popovers, menu, tooltip, and toast share consistent surfaces, borders, radii, and focus treatment. |
| Responsive behavior | 4 | The controls remain usable at all three target widths; full-page mobile captures show the complete component gallery without horizontal clipping. |
| RTL support | 4 | RTL direction and logical spacing are applied to the page and card layout; controls remain aligned and usable. |
| Theme contrast | 4 | Light and dark tokens preserve clear text, field, border, and action contrast. |
| Accessibility and interaction | 4 | Radix primitives provide keyboard-aware interactions for overlays, tabs, slider, menus, tooltips, and toast; basic interaction tests pass. |

All rubric scores meet the required minimum of 4.

## Screenshot matrix

Each combination below is saved as `kit-<width>x<height>-<theme>-<direction>.png` in this directory.

| Viewport | Light LTR | Light RTL | Dark LTR | Dark RTL |
|---|---|---|---|---|
| 360×800 | `kit-360x800-light-ltr.png` | `kit-360x800-light-rtl.png` | `kit-360x800-dark-ltr.png` | `kit-360x800-dark-rtl.png` |
| 768×1024 | `kit-768x1024-light-ltr.png` | `kit-768x1024-light-rtl.png` | `kit-768x1024-dark-ltr.png` | `kit-768x1024-dark-rtl.png` |
| 1440×900 | `kit-1440x900-light-ltr.png` | `kit-1440x900-light-rtl.png` | `kit-1440x900-dark-ltr.png` | `kit-1440x900-dark-rtl.png` |

## Verification

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm test -- --reporter=dot` — 342 tests across 45 files passed
- `npm run build` — pass
- Playwright E2E — 28 tests passed, including all 12 `/kit` screenshots

The full dependency audit reports 6 findings (3 moderate, 1 high, 2 critical) in the existing Vite/Vitest toolchain dependency tree. Production dependencies report 0 findings. No audit remediation was included in this UI task.

## Visual observations

- At 360px, the top controls wrap into two compact groups and the cards stack without horizontal overflow.
- At 768px and 1440px, the card grid uses two columns with a clear reading order.
- RTL reverses the card and control alignment while preserving the English demo copy as direction-preview content.
- Dark mode switches to charcoal surfaces and muted borders while retaining terracotta emphasis.
