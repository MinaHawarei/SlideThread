# R1-4 App shell and routing review

Date: 2026-11-23  
Route reviewed: `/settings` app shell at 360×800, 768×1024, and 1440×900. Captures cover light/dark and LTR/RTL.

## Review rubric

| Criterion | Score (1–5) | Review |
|---|---:|---|
| Hierarchy and focus | 4 | The localized title and short description lead into a single profile/preferences card. |
| Spacing and alignment | 4 | Header and content use consistent spacing; the card stays legible at the narrow mobile width. |
| Consistency with Atelier kit | 4 | Uses the paper, panel, ink, terracotta, radii, and border tokens; the shared language switcher follows the same palette. |
| Contrast and legibility | 4 | Light and dark surfaces retain readable text and clear borders; Arabic type remains legible at each size. |
| Motion quality | 4 | Navigation remains immediate with restrained 180 ms hover feedback; reduced-motion preference disables that transition. |
| Empty, loading, and error states | 4 | A translated route loading status is present; the settings route clearly describes its upcoming profile/default controls. |
| RTL parity | 4 | Arabic navigation, labels, and copy are translated and right-aligned; controls follow the page direction. |
| Mobile ergonomics | 4 | Navigation wraps below the brand on small screens and the language control remains comfortably tappable. |
| Deliberate delight | 4 | A small terracotta studio mark and warm serif headline give the otherwise quiet settings shell character. |

All scores meet the required minimum of 4.

## Screenshot matrix

Each image is saved as `shell-<width>x<height>-<theme>-<direction>.png` in this directory.

| Viewport | Light LTR | Light RTL | Dark LTR | Dark RTL |
|---|---|---|---|---|
| 360×800 | `shell-360x800-light-ltr.png` | `shell-360x800-light-rtl.png` | `shell-360x800-dark-ltr.png` | `shell-360x800-dark-rtl.png` |
| 768×1024 | `shell-768x1024-light-ltr.png` | `shell-768x1024-light-rtl.png` | `shell-768x1024-dark-ltr.png` | `shell-768x1024-dark-rtl.png` |
| 1440×900 | `shell-1440x900-light-ltr.png` | `shell-1440x900-light-rtl.png` | `shell-1440x900-dark-ltr.png` | `shell-1440x900-dark-rtl.png` |

The E2E capture sets the shell theme and direction attributes for the matrix; RTL captures also switch the interface language to Arabic.

## Verification and known scope

- Home, Gallery, Wizard, Editor, Settings, Kit, and dev-only preview/spike routes load through lazy route imports; browser history and direct path loads are supported.
- Home-to-Settings and Settings-to-Gallery navigation passed in Playwright.
- The initial production route loads about 150.15 KB gzip JavaScript (entry 16.06 KB, React/analytics 88.99 KB, core state 45.10 KB), under the 300 KB budget. Gallery adds its 5.02 KB route chunk when opened. The editor route is lazy; its main route chunk is 20.21 KB gzip.
- Settings currently provides the localized shell and profile/preferences placeholder. Editable defaults, photo handling, and data management remain scoped to R5-4.
- Legacy Home, Gallery, and Editor page content is retained; this task adds routing and code splitting around those screens.
