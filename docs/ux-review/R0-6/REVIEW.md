# R0-6 UX direction review

## Directions

- **A — Atelier:** warm oat and ink surfaces, persimmon accents, editorial Georgia headlines with the bundled IBM Plex Sans / IBM Plex Sans Arabic UI, soft paper lift, and cut-paper geometry.
- **B — Signal:** high-contrast modular controls, electric lime and coral accents, bundled IBM Plex plus JetBrains Mono details, hard edges, and grid-based glyphs.
- **C — Field Notes:** moss, clay, and linen palette, editorial headline pairing, gentle reveal, organic silhouettes, and botanical linework.

Each direction includes a built Home, Gallery, and Editor page. The Gallery's state selector previews populated, empty, loading, and error treatments. Direction, page, theme, and language controls are interactive. The product CTAs and editor controls are visual prototypes only.

## Self-review rubric

Scores are 1–5 per `REVISION_PLAN.md` §7.3.

| Area | Score | Notes |
|---|---:|---|
| Hierarchy and focus | 4 | Each direction leads with the canvas/story; primary and secondary actions have distinct weight. |
| Spacing and alignment | 4 | Page sections use a consistent spacing rhythm; compact controls wrap at mobile widths. |
| Consistency with the kit | 4 | Each direction keeps a consistent type, palette, surface, and shape language across all three pages. |
| Contrast and legibility | 4 | Reviewed in the captured light/dark screenshots; dedicated automated contrast analysis is not part of this direction spike. |
| Motion quality | 4 | Short ease-out interactions and restrained hero/skeleton motion; reduced-motion removes animation. |
| Empty/loading/error states | 4 | Gallery state selector provides a styled empty illustration, skeleton, and recovery message for each direction. |
| RTL parity | 4 | Arabic dictionaries, document RTL, logical spacing, and Arabic-capable local fonts used across the matrix. |
| Mobile ergonomics | 4 | At 360 px, tools and filters wrap or scroll without horizontal page overflow; touch controls remain comfortably sized. |
| Deliberate delight | 4 | A paper-led hero, a sharp modular Signal moment, and an organic Field Notes illustration give each direction a distinct accent. |

## Capture and checks

- **117 Chromium screenshots** under `screenshots/`: 108 required combinations (3 directions × 3 pages × 3 viewports × 2 themes × 2 directions), plus 9 Gallery state examples (empty/loading/error for each direction).
- Required viewport sizes: 360×800, 768×1024, and 1440×900. Screenshots use `light` / `dark` and `en` / `ar` suffixes; state examples are 1440×900 light English.
- Contact sheets: `contact-mobile.jpg`, `contact-desktop.jpg`, `contact-rtl-dark.jpg`, and `contact-states.jpg`.
- Browser pass: zero horizontal overflow across the 108 required combinations and no uncaught page errors.
- Reduced-motion behavior is implemented in CSS. Real-device feel, assistive-technology review, and automated contrast measurements remain unverified and are outside the direction preview evidence.

## Known limitations

- This route is development-only. The page selector, direction/theme/language controls, and Gallery state selector work; product actions and editor inputs are illustrative and do not edit a project.
- This review compares visual directions and is not the owner's taste review. D-06 remains open until the owner selects A, B, or C.
- No new external fonts, imagery, or dependencies were added. Type pairings use fonts already bundled by the app; illustrations are CSS-authored shapes.
