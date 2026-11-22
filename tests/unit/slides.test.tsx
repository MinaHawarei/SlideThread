import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { SAMPLE_SLIDES } from '../../src/slides/sampleSlides';
import { NETWORK_DARK_PALETTE } from '../../src/core/palette';
import type { AspectClass, SlideType } from '../../src/core/schema';

describe('Slide Components (Spec §5.2, §6)', () => {
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

  it('renders all 9 slide types across all 4 aspect classes without error', () => {
    for (const type of slideTypes) {
      for (const aspect of aspectClasses) {
        const slide = SAMPLE_SLIDES[`${type}_en`] || SAMPLE_SLIDES[`${type}_ar`];
        expect(slide).toBeDefined();

        const { container } = render(
          <SlideRenderer
            slide={slide!}
            palette={NETWORK_DARK_PALETTE}
            aspectClass={aspect}
            textDir="auto"
          />
        );

        const canvas = container.querySelector('.slide-canvas');
        expect(canvas).toBeTruthy();
        expect(canvas?.classList.contains(`aspect-${aspect}`)).toBe(true);
        expect(canvas?.getAttribute('data-slide-type')).toBe(type);
      }
    }
  });

  describe('CoverSlide', () => {
    it('renders tag, title, sub, and rule correctly', () => {
      render(
        <SlideRenderer
          slide={SAMPLE_SLIDES.cover_en!}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="portrait"
        />
      );
      expect(screen.getByText('ARCHITECTURE')).toBeTruthy();
      expect(screen.getByText(/Building Modern React Web Apps/)).toBeTruthy();
      expect(screen.getByText(/npx create-slidethread/)).toBeTruthy();
    });
  });

  describe('ExplainSlide', () => {
    it('parses bullet nodes and paragraphs correctly', () => {
      const { container } = render(
        <SlideRenderer
          slide={SAMPLE_SLIDES.explain_en!}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="square"
        />
      );
      const bullets = container.querySelectorAll('.explain-bullet-item');
      expect(bullets.length).toBe(3);
      expect(screen.getByText(/Deterministic pure rendering/)).toBeTruthy();
    });
  });

  describe('RuleSlide', () => {
    it('renders IF and THEN cards with appropriate labels', () => {
      render(
        <SlideRenderer
          slide={SAMPLE_SLIDES.rule_en!}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="landscape"
        />
      );
      expect(screen.getByText('IF')).toBeTruthy();
      expect(screen.getByText('THEN')).toBeTruthy();
      expect(screen.getByText(/State can be derived purely/)).toBeTruthy();
    });
  });

  describe('CompareSlide', () => {
    it('renders bad and ok comparison cards with distinct badges', () => {
      render(
        <SlideRenderer
          slide={SAMPLE_SLIDES.compare_en!}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="square"
        />
      );
      expect(screen.getByText('✗ Viewport Units (vw / vh)')).toBeTruthy();
      expect(screen.getByText('✓ Fixed Coordinate Scaling')).toBeTruthy();
    });
  });

  describe('CodeSlide', () => {
    it('forces LTR direction for code blocks even in Arabic or RTL slides', () => {
      const { container } = render(
        <SlideRenderer
          slide={SAMPLE_SLIDES.code_ar!}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="landscape"
          textDir="rtl"
        />
      );
      const codeBlock = container.querySelector('.code-container');
      expect(codeBlock).toBeTruthy();
      expect(codeBlock?.getAttribute('dir')).toBe('ltr');
      expect(codeBlock?.textContent).toContain('generatePalette');
    });
  });

  describe('StatSlide', () => {
    it('renders big stat value and label', () => {
      render(
        <SlideRenderer
          slide={SAMPLE_SLIDES.stat_en!}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="portrait"
        />
      );
      expect(screen.getByText('100%')).toBeTruthy();
      expect(screen.getByText('Client-side processing')).toBeTruthy();
    });
  });

  describe('QuoteSlide', () => {
    it('renders quotation text, mark, and author', () => {
      render(
        <SlideRenderer
          slide={SAMPLE_SLIDES.quote_en!}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="tall"
        />
      );
      expect(screen.getByText('“')).toBeTruthy();
      expect(screen.getByText(/Simplicity is about subtracting/)).toBeTruthy();
      expect(screen.getByText(/John Maeda/)).toBeTruthy();
    });
  });

  describe('CtaSlide', () => {
    it('renders profile avatar initial and action button', () => {
      render(
        <SlideRenderer
          slide={SAMPLE_SLIDES.cta_en!}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="portrait"
        />
      );
      expect(screen.getByText('M')).toBeTruthy(); // initial for Mina
      expect(screen.getByText('Mina')).toBeTruthy();
      expect(screen.getByText('@mina_tech')).toBeTruthy();
      expect(screen.getByText('Launch SlideThread →')).toBeTruthy();
    });
  });

  describe('Media Placements (Spec §6.1)', () => {
    it('renders background placement overlay behind content', () => {
      const slideWithBg = {
        ...SAMPLE_SLIDES.cover_en!,
        media: {
          assetId: 'ast_test_bg',
          fit: 'cover' as const,
          placement: 'background' as const,
          focal: { x: 0.3, y: 0.7 },
        },
      };

      const { container } = render(
        <SlideRenderer
          slide={slideWithBg}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="portrait"
        />
      );

      const bgMedia = container.querySelector('.slide-bg-media');
      expect(bgMedia).toBeTruthy();
    });

    it('renders replace-text placement in explain slide', () => {
      const slideWithReplace = {
        ...SAMPLE_SLIDES.explain_en!,
        media: {
          assetId: 'ast_test_replace',
          fit: 'contain' as const,
          placement: 'replace-text' as const,
        },
      };

      const { container } = render(
        <SlideRenderer
          slide={slideWithReplace}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="square"
        />
      );

      expect(screen.getByText('Three Pillars of Modern Frontend Architecture')).toBeTruthy();
      // Body list should be replaced
      expect(container.querySelector('.explain-bullet-item')).toBeFalsy();
    });
  });
});
