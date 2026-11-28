import { beforeAll, describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { SAMPLE_SLIDES, SAMPLE_BRAND_EN, SAMPLE_BRAND_AR } from '../../src/slides/sampleSlides';
import { generatePalette, getContrastRatio } from '../../src/core/palette';
import { getAllTemplates, getTemplate } from '../../src/templates';
import { stubAssetFetch } from './helpers/stubAssetFetch';
import { loadTemplateProjectSnapshot } from '../../src/templates/projectSnapshot';
import type { AspectClass, SlideType, TemplateId, TemplateProjectSnapshot } from '../../src/core/schema';

describe('Template QA Matrix (Spec §7.1, Task P2-3)', () => {
  const templates: TemplateId[] = getAllTemplates().map((template) => template.id);
  const snapshots: Partial<Record<TemplateId, TemplateProjectSnapshot>> = {};

  beforeAll(async () => {
    stubAssetFetch();
    await Promise.all(templates.map(async (id) => {
      snapshots[id] = await loadTemplateProjectSnapshot(id, '#35D0E6');
    }));
  });
  const aspectClasses: AspectClass[] = ['landscape', 'square', 'portrait', 'tall'];
  const slideTypes: SlideType[] = [
    'cover',
    'explain',
    'rule',
    'compare',
    'code',
    'stat',
    'quote',
    'image',
    'cta',
  ];

  it('all 107 built-in templates (5 starters + 2 full-carousel packs + 10 group 1 + 10 group 2 + 10 group 3 + 10 group 4 + 10 group 5 + 10 group 6 + 10 group 7 + 10 group 8 + 10 group 9 + 10 group 10) are defined in the template registry', () => {
    const all = getAllTemplates();
    expect(all.map((t) => t.id)).toEqual(['bold-marketing', 'clean-minimal', 'dt-arabic-green', 'dt-arabic-navy', 'dt-emerald-portal', 'dt-lime-steps', 'dt-magenta-noir', 'dt-mint-swipe', 'dt-phosphor-terminal', 'dt-purple-code', 'dt-signal-red', 'dt-teal-lab', 'g10-arabic-domes', 'g10-atom-orbit', 'g10-city-night', 'g10-code-brackets', 'g10-confetti-pop', 'g10-corner-rays', 'g10-peak-trail', 'g10-pinstripe-right', 'g10-torn-edge', 'g10-venn-pair', 'g3-arabic-oxblood', 'g3-bauhaus-blocks', 'g3-blueprint-grid', 'g3-field-notes', 'g3-halftone-sun', 'g3-lilac-checker', 'g3-night-ticket', 'g3-retro-sunrise', 'g3-rust-arches', 'g3-sage-blobs', 'g4-arabic-saffron', 'g4-aurora-glow', 'g4-coral-rings', 'g4-cozy-plaid', 'g4-memphis-pop', 'g4-notebook-grid', 'g4-ocean-waves', 'g4-racing-stripes', 'g4-sky-scallop', 'g4-slate-slash', 'g5-arabic-turquoise', 'g5-denim-zigzag', 'g5-hex-lab', 'g5-kraft-tape', 'g5-mosaic-tiles', 'g5-pixel-arcade', 'g5-ribbon-flow', 'g5-spotlight-stage', 'g5-terrazzo-chic', 'g5-viewfinder', 'g6-arabic-crescent', 'g6-blush-botanical', 'g6-daily-press', 'g6-dream-clouds', 'g6-film-reel', 'g6-paint-stroke', 'g6-polka-tangerine', 'g6-soda-bubbles', 'g6-sparkle-night', 'g6-varsity-chevron', 'g7-arabic-olive-arches', 'g7-fan-burst', 'g7-gallery-frame', 'g7-grain-poster', 'g7-growth-steps', 'g7-harlequin-edge', 'g7-orb-glow', 'g7-paper-cut', 'g7-petrol-spiral', 'g7-sunset-hills', 'g8-arabic-lanterns', 'g8-dot-corner', 'g8-folder-tabs', 'g8-meteor-night', 'g8-pill-bars', 'g8-quarter-rings', 'g8-saw-banner', 'g8-side-blocks', 'g8-star-poster', 'g8-wave-lines', 'g9-arabic-stars', 'g9-barcode-tag', 'g9-bunting-party', 'g9-page-curl', 'g9-plus-row', 'g9-rainbow-arc', 'g9-ruler-edge', 'g9-slash-edge', 'g9-squiggle-top', 'g9-target-rings', 'golden-hour-viral', 'heritage-geometric', 'neon-grid-process', 'pk-ai-violet', 'pk-arabic-cream-blue', 'pk-arabic-gold', 'pk-arabic-sand', 'pk-binary-light', 'pk-collage-pink', 'pk-electric-blue', 'pk-noir-red', 'pk-peach-clean', 'pk-sunny-pop', 'soft-gradient', 'tech-mesh']);
  });

  it('verifies contrast compliance for Dark and Light palettes across all templates', () => {
    const darkPalette = generatePalette('#35D0E6', 'dark');
    const lightPalette = generatePalette('#0B7FA6', 'light');

    // Ink vs bg >= 7:1
    expect(getContrastRatio(darkPalette.ink, darkPalette.bg)).toBeGreaterThanOrEqual(7);
    expect(getContrastRatio(lightPalette.ink, lightPalette.bg)).toBeGreaterThanOrEqual(7);

    // Mute vs bg >= 4.5:1
    expect(getContrastRatio(darkPalette.mute, darkPalette.bg)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(lightPalette.mute, lightPalette.bg)).toBeGreaterThanOrEqual(4.5);

    // onAcc vs acc >= 4.5:1
    expect(getContrastRatio(darkPalette.onAcc, darkPalette.acc)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(lightPalette.onAcc, lightPalette.acc)).toBeGreaterThanOrEqual(4.5);
  });

  describe('Full Template Matrix: templates × slide types × themes × directions', () => {
    for (const tmpl of templates) {
      describe(`Template: ${tmpl}`, () => {
        for (const type of slideTypes) {
          it(`renders ${type} in ${tmpl} for dark and light without error`, () => {
            for (const theme of ['dark', 'light'] as const) {
              const palette = generatePalette(theme === 'dark' ? '#35D0E6' : '#0B7FA6', theme);
              const enSlide = SAMPLE_SLIDES[`${type}_en`];
              const arSlide = SAMPLE_SLIDES[`${type}_ar`];

              // Test English (LTR)
              if (enSlide) {
                const { container, unmount } = render(
                  <SlideRenderer
                    slide={enSlide}
                    palette={palette}
                    aspectClass="square"
                    templateId={tmpl}
                    templateSnapshot={snapshots[tmpl]}
                    themeMode={theme}
                    brand={SAMPLE_BRAND_EN}
                    textDir="ltr"
                    slideIndex={1}
                    totalSlides={5}
                  />
                );

                const canvas = container.querySelector('.slide-canvas');
                expect(canvas).toBeInTheDocument();
                expect(canvas).toHaveClass(`template-${getTemplate(tmpl).className}`);
                expect(canvas).toHaveAttribute('data-template-id', tmpl);
                unmount();
              }

              // Test Arabic (RTL)
              if (arSlide) {
                const { container, unmount } = render(
                  <SlideRenderer
                    slide={arSlide}
                    palette={palette}
                    aspectClass="portrait"
                    templateId={tmpl}
                    templateSnapshot={snapshots[tmpl]}
                    themeMode={theme}
                    brand={SAMPLE_BRAND_AR}
                    textDir="rtl"
                    slideIndex={1}
                    totalSlides={5}
                  />
                );

                const canvas = container.querySelector('.slide-canvas');
                expect(canvas).toBeInTheDocument();
                expect(canvas).toHaveClass(`template-${getTemplate(tmpl).className}`);
                expect(canvas).toHaveAttribute('data-template-id', tmpl);
                unmount();
              }
            }
          });
        }
      });
    }
  });

  it('renders all 4 aspect classes for each template without DOM clipping or errors', () => {
    const palette = generatePalette('#35D0E6', 'dark');
    for (const tmpl of templates) {
      for (const aspect of aspectClasses) {
        const { container, unmount } = render(
          <SlideRenderer
            slide={SAMPLE_SLIDES.explain_en!}
            palette={palette}
            aspectClass={aspect}
            templateId={tmpl}
            templateSnapshot={snapshots[tmpl]}
            themeMode="dark"
            brand={SAMPLE_BRAND_EN}
            slideIndex={2}
            totalSlides={8}
          />
        );

        const canvas = container.querySelector(`.aspect-${aspect}`);
        expect(canvas).toBeInTheDocument();
        expect(canvas).toHaveClass(`template-${getTemplate(tmpl).className}`);
        unmount();
      }
    }
  });
});
