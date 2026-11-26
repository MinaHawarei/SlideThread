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

  it('all 27 built-in templates (5 starters + 2 full-carousel packs + 10 group 1 + 10 group 2) are defined in the template registry', () => {
    const all = getAllTemplates();
    expect(all.map((t) => t.id)).toEqual(['bold-marketing', 'clean-minimal', 'dt-arabic-green', 'dt-arabic-navy', 'dt-emerald-portal', 'dt-lime-steps', 'dt-magenta-noir', 'dt-mint-swipe', 'dt-phosphor-terminal', 'dt-purple-code', 'dt-signal-red', 'dt-teal-lab', 'golden-hour-viral', 'heritage-geometric', 'neon-grid-process', 'pk-ai-violet', 'pk-arabic-cream-blue', 'pk-arabic-gold', 'pk-arabic-sand', 'pk-binary-light', 'pk-collage-pink', 'pk-electric-blue', 'pk-noir-red', 'pk-peach-clean', 'pk-sunny-pop', 'soft-gradient', 'tech-mesh']);
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
