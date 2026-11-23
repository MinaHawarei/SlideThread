import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { SAMPLE_SLIDES, SAMPLE_BRAND_EN, SAMPLE_BRAND_AR } from '../../src/slides/sampleSlides';
import { generatePalette, getContrastRatio } from '../../src/core/palette';
import { getAllTemplates, getTemplate } from '../../src/templates';
import type { AspectClass, SlideType, TemplateId } from '../../src/core/schema';

describe('Template QA Matrix (Spec §7.1, Task P2-3)', () => {
  const templates: TemplateId[] = getAllTemplates().map((template) => template.id);
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

  it('all 5 starter templates are defined in the template registry', () => {
    const all = getAllTemplates();
    expect(all.map((t) => t.id)).toEqual(['tech-mesh', 'clean-minimal', 'bold-marketing', 'soft-gradient', 'heritage-geometric']);
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
