import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cleanTemplate } from '../../src/templates/clean';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { generatePalette } from '../../src/core/palette';
import { SAMPLE_SLIDES, SAMPLE_BRAND_EN } from '../../src/slides/sampleSlides';
import type { SlideType } from '../../src/core/schema';

describe('Clean Template (Spec §7.1, Task P2-1)', () => {
  it('cleanTemplate matches specification for minimal, whitespace-led design', () => {
    expect(cleanTemplate.id).toBe('clean');
    expect(cleanTemplate.nameKey).toBe('template.clean');
    expect(cleanTemplate.radius.card).toBe(12);
    expect(cleanTemplate.radius.chip).toBe(6);
    expect(cleanTemplate.typeScale.h1).toBe(96);
    expect(cleanTemplate.typeScale.h2).toBe(64);
    expect(cleanTemplate.typeScale.body).toBe(38);
    expect(cleanTemplate.typeScale.small).toBe(26);
    expect(cleanTemplate.typeScale.mono).toBe(30);

    // Background renders nothing (no background graphics)
    const { container } = render(
      cleanTemplate.Background({
        index: 0,
        count: 5,
        width: 1080,
        height: 1080,
        tokens: generatePalette('#35D0E6', 'dark'),
      }) as React.ReactElement
    );
    expect(container.firstChild).toBeNull();
  });

  it('SlideRenderer applies template-clean class and data-template-id', () => {
    const palette = generatePalette('#35D0E6', 'dark');
    const { container } = render(
      <SlideRenderer
        slide={SAMPLE_SLIDES.cover_en!}
        palette={palette}
        aspectClass="square"
        templateId="clean"
        brand={SAMPLE_BRAND_EN}
      />
    );

    const canvas = container.querySelector('.slide-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('template-clean');
    expect(canvas).toHaveAttribute('data-template-id', 'clean');

    // Network background SVG is absent in Clean template
    expect(screen.queryByTestId('network-bg-svg')).toBeNull();
  });

  it('renders all 9 slide types cleanly in Clean template without errors', () => {
    const palette = generatePalette('#0B7FA6', 'light');
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

    slideTypes.forEach((type) => {
      const slide = (SAMPLE_SLIDES[`${type}_en`] || SAMPLE_SLIDES[`${type}_ar`])!;
      const { unmount, container } = render(
        <SlideRenderer
          slide={slide}
          palette={palette}
          aspectClass="portrait"
          templateId="clean"
          brand={SAMPLE_BRAND_EN}
          slideIndex={1}
          totalSlides={9}
        />
      );

      const canvas = container.querySelector(`[data-slide-type="${type}"]`);
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('template-clean');
      unmount();
    });
  });

  it('sets template CSS variables for radius and type scale', () => {
    const palette = generatePalette('#35D0E6', 'dark');
    const { container } = render(
      <SlideRenderer
        slide={SAMPLE_SLIDES.explain_en!}
        palette={palette}
        aspectClass="landscape"
        templateId="clean"
        brand={SAMPLE_BRAND_EN}
      />
    );

    const canvas = container.querySelector('.slide-canvas') as HTMLElement;
    expect(canvas.style.getPropertyValue('--card-radius')).toBe('12px');
    expect(canvas.style.getPropertyValue('--chip-radius')).toBe('6px');
    expect(canvas.style.getPropertyValue('--ts-h1')).toBe('96px');
    expect(canvas.style.getPropertyValue('--ts-h2')).toBe('64px');
  });
});
