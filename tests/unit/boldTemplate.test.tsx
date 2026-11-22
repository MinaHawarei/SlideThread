import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { boldTemplate } from '../../src/templates/bold';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { generatePalette } from '../../src/core/palette';
import { SAMPLE_SLIDES, SAMPLE_BRAND_EN } from '../../src/slides/sampleSlides';
import type { SlideType } from '../../src/core/schema';

describe('Bold Template (Spec §7.1, Task P2-2)', () => {
  it('boldTemplate matches specification for large type, color blocks, thick borders, high contrast', () => {
    expect(boldTemplate.id).toBe('bold');
    expect(boldTemplate.nameKey).toBe('template.bold');
    expect(boldTemplate.radius.card).toBe(0);
    expect(boldTemplate.radius.chip).toBe(0);
    expect(boldTemplate.typeScale.h1).toBe(124);
    expect(boldTemplate.typeScale.h2).toBe(80);
    expect(boldTemplate.typeScale.body).toBe(44);
    expect(boldTemplate.typeScale.small).toBe(30);
    expect(boldTemplate.typeScale.mono).toBe(34);

    // Background renders nothing (no background graphics)
    const { container } = render(
      boldTemplate.Background({
        index: 0,
        count: 5,
        width: 1080,
        height: 1080,
        tokens: generatePalette('#35D0E6', 'dark'),
      }) as React.ReactElement
    );
    expect(container.firstChild).toBeNull();
  });

  it('SlideRenderer applies template-bold class and data-template-id', () => {
    const palette = generatePalette('#35D0E6', 'dark');
    const { container } = render(
      <SlideRenderer
        slide={SAMPLE_SLIDES.cover_en!}
        palette={palette}
        aspectClass="square"
        templateId="bold"
        brand={SAMPLE_BRAND_EN}
      />
    );

    const canvas = container.querySelector('.slide-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('template-bold');
    expect(canvas).toHaveAttribute('data-template-id', 'bold');

    // Network background SVG is absent in Bold template
    expect(screen.queryByTestId('network-bg-svg')).toBeNull();
  });

  it('renders all 9 slide types in Bold template without errors', () => {
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
          templateId="bold"
          brand={SAMPLE_BRAND_EN}
          slideIndex={1}
          totalSlides={9}
        />
      );

      const canvas = container.querySelector(`[data-slide-type="${type}"]`);
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('template-bold');
      unmount();
    });
  });

  it('sets template CSS variables for radius 0 and bold type scale', () => {
    const palette = generatePalette('#35D0E6', 'dark');
    const { container } = render(
      <SlideRenderer
        slide={SAMPLE_SLIDES.explain_en!}
        palette={palette}
        aspectClass="landscape"
        templateId="bold"
        brand={SAMPLE_BRAND_EN}
      />
    );

    const canvas = container.querySelector('.slide-canvas') as HTMLElement;
    expect(canvas.style.getPropertyValue('--card-radius')).toBe('0px');
    expect(canvas.style.getPropertyValue('--chip-radius')).toBe('0px');
    expect(canvas.style.getPropertyValue('--ts-h1')).toBe('124px');
    expect(canvas.style.getPropertyValue('--ts-h2')).toBe('80px');
  });
});
