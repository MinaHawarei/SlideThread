# R8-1 Home Screen UX Review

## Overview & Direction

- **Direction:** A — Atelier (Warm oat/stone surfaces, amber/persimmon accents, Georgia/serif editorial headlines, clean typography, soft paper lift).
- **Scope:** Home screen redesign (`StartScreen.tsx`) featuring an interactive swipeable demo carousel (`HeroCarousel.tsx`), quick-start platform tiles (LinkedIn 4:5, Instagram 4:5, Story 9:16, Post 1:1), seed examples, recent projects list with empty/active states, and bilingual parity.

## Self-Review Rubric

Scores are 1–5 per `REVISION_PLAN.md` §7.3 (all ≥ 4 required).

| Area | Score | Notes |
|---|:---:|---|
| **Hierarchy and focus** | 5 | Strong visual hierarchy leading directly with the Atelier hero and interactive demo carousel. Platform quick-start tiles clearly distinct from creation pathways. Resume banner accents current work with high-contrast amber CTA. |
| **Spacing and alignment** | 5 | Built on strict 8-pt spacing rhythm (`gap-3`, `gap-4`, `gap-6`, `p-5`, `py-10`). Content aligns to a central 6xl grid with responsive padding across mobile and desktop. |
| **Consistency with the kit** | 5 | Faithful execution of Atelier design language: `stone-50` / `stone-950` backgrounds, `amber-600` / `amber-500` primary buttons and pill accents, serif headings, rounded-2xl cards, and subtle border framing. |
| **Contrast and legibility** | 5 | High text-to-background contrast in both light (`stone-900` on `stone-50`) and dark (`stone-50` on `stone-950`) modes. Platform badges and slide counters use stark contrasts (`bg-black/60` and `text-white`). |
| **Motion quality** | 4 | Interactive slide carousel with smooth 300ms transitions, dot indicators, and scale hover lift (`hover:scale-[1.02]`). Honors `prefers-reduced-motion` settings. |
| **Empty/loading/error states** | 5 | Distinct empty state for recents with warm illustration and CTA; inline import error banner for invalid JSON; smooth route loading placeholder. |
| **RTL parity** | 5 | Full Arabic mirroring with logical spacing (`ms-*`, `me-*`), start/end flex alignment, native Arabic typography (`font-arabic`), and localized demo content with RTL text direction. |
| **Mobile ergonomics** | 5 | At 360px viewport, hero stacks vertically with scaled preview stage (320px width), touch-friendly next/previous buttons (36px tap targets), and platform tiles wrapping cleanly into a 2x2 grid without horizontal overflow. |
| **Deliberate delight** | 5 | The interactive swipeable hero carousel allows prospective users to flip through a real 9-slide carousel project directly on the home page before entering the editor, with instant one-click "Open in Editor" jump. |

## Captured Screenshots

Screenshots captured under `docs/ux-review/R8-1/screenshots/`:
- **Desktop (1440×900):**
  - `1440x900-light-en.jpg`
  - `1440x900-light-ar.jpg`
  - `1440x900-dark-en.jpg`
  - `1440x900-dark-ar.jpg`
- **Tablet (768×1024):**
  - `768x1024-light-en.jpg`
  - `768x1024-light-ar.jpg`
  - `768x1024-dark-en.jpg`
  - `768x1024-dark-ar.jpg`
- **Mobile (360×800):**
  - `360x800-light-en.jpg`
  - `360x800-light-ar.jpg`
  - `360x800-dark-en.jpg`
  - `360x800-dark-ar.jpg`

## Verification Checks

- Tested zero horizontal scrollbar / overflow at 360px, 768px, and 1440px widths.
- Unit tests pass with 100% success rate:
  - `tests/unit/startScreen.test.tsx` (13 tests)
  - `tests/unit/heroCarousel.test.tsx` (5 tests)
- Clean lint and typecheck passes.
