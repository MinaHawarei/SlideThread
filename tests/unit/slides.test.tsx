import React from 'react';
import { beforeAll, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlideRenderer, type SlideRendererProps } from '../../src/slides/SlideRenderer';
import { SAMPLE_SLIDES } from '../../src/slides/sampleSlides';
import { NETWORK_DARK_PALETTE } from '../../src/core/palette';
import { loadTemplateProjectSnapshot } from '../../src/templates/projectSnapshot';
import { plainTextToRichText, type AspectClass, type SlideType, type TemplateProjectSnapshot } from '../../src/core/schema';

describe('Slide Components (Spec §5.2, §6)', () => {
  let defaultSnapshot: TemplateProjectSnapshot;

  beforeAll(async () => {
    defaultSnapshot = await loadTemplateProjectSnapshot('tech-mesh', '#35D0E6');
  });

  const renderSlide = (ui: React.ReactElement<SlideRendererProps>) =>
    render(React.cloneElement(ui, { templateSnapshot: ui.props.templateSnapshot ?? defaultSnapshot }));
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

        const { container } = renderSlide(
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
      renderSlide(
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
      const { container } = renderSlide(
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
      renderSlide(
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
      renderSlide(
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
      const { container } = renderSlide(
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
      renderSlide(
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
      renderSlide(
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
      renderSlide(
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

      const { container } = renderSlide(
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

      const { container } = renderSlide(
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

  describe('Overrides & Extras Rendering (R3-6, §5.10)', () => {
    it('applies slot overrides (translation, scale, z-index, visibility) to rendered slide elements', () => {
      const slideWithOverrides = {
        ...SAMPLE_SLIDES.cover_en!,
        overrides: {
          portrait: {
            title: {
              dx: 0.05,
              dy: 0.1,
              scale: 1.2,
              z: 4,
              locked: false,
              hidden: false,
            },
            body: {
              dx: 0,
              dy: 0,
              scale: 1,
              z: 2,
              locked: false,
              hidden: true,
            },
          },
        },
      };

      const { container } = renderSlide(
        <SlideRenderer
          slide={slideWithOverrides}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="portrait"
          dimensions={{ width: 1080, height: 1350 }}
        />
      );

      const titleNode = container.querySelector('.slide-title-h1') as HTMLElement;
      expect(titleNode).toBeTruthy();
      expect(titleNode.style.transform).toBe('translate(54px, 135px) scale(1.2)');
      expect(titleNode.style.zIndex).toBe('4');
      expect(titleNode.style.visibility).not.toBe('hidden');

      const bodyNode = container.querySelector('.slide-sub') as HTMLElement;
      expect(bodyNode).toBeTruthy();
      expect(bodyNode.style.visibility).toBe('hidden');
      expect(bodyNode.style.zIndex).toBe('2');
    });

    it('isolates overrides per aspect class and falls back cleanly on other formats', () => {
      const slideWithOverrides = {
        ...SAMPLE_SLIDES.cover_en!,
        overrides: {
          portrait: {
            title: {
              dx: 0.1,
              dy: 0.2,
              scale: 1.5,
              z: 5,
              locked: false,
              hidden: true,
            },
          },
        },
      };

      // Rendering on square (which has no overrides defined)
      const { container } = renderSlide(
        <SlideRenderer
          slide={slideWithOverrides}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="square"
          dimensions={{ width: 1080, height: 1080 }}
        />
      );

      const titleNode = container.querySelector('.slide-title-h1') as HTMLElement;
      expect(titleNode).toBeTruthy();
      // Should not have the portrait transform or visibility: hidden
      expect(titleNode.style.visibility).not.toBe('hidden');
      expect(titleNode.style.transform).toBe('');
    });

    it('renders user-added extra elements (shapes, text, media) with correct geometry and attributes', () => {
      const slideWithExtras = {
        ...SAMPLE_SLIDES.cover_en!,
        extras: [
          {
            id: 'extra-rect',
            kind: 'shape' as const,
            shape: 'rectangle' as const,
            fill: '#ff0055',
            x: 0.1,
            y: 0.15,
            w: 0.2,
            h: 0.1,
            rotation: 15,
            z: 8,
            locked: false,
          },
          {
            id: 'extra-ellipse',
            kind: 'shape' as const,
            shape: 'ellipse' as const,
            fill: '#00ffcc',
            x: 0.5,
            y: 0.5,
            w: 0.1,
            h: 0.1,
            rotation: 0,
            z: 9,
            locked: false,
          },
          {
            id: 'extra-text-label',
            kind: 'text' as const,
            text: plainTextToRichText('Custom Sticker Note'),
            fill: '#ffffff',
            x: 0.3,
            y: 0.7,
            w: 0.4,
            h: 0.08,
            rotation: -5,
            z: 10,
            locked: false,
          },
          {
            id: 'extra-hidden',
            kind: 'shape' as const,
            shape: 'rectangle' as const,
            x: 0.2,
            y: 0.2,
            w: 0.1,
            h: 0.1,
            rotation: 0,
            z: 1,
            locked: false,
            hidden: true,
          },
        ],
      };

      const { container } = renderSlide(
        <SlideRenderer
          slide={slideWithExtras}
          palette={NETWORK_DARK_PALETTE}
          aspectClass="portrait"
        />
      );

      const extrasContainer = container.querySelector('[data-testid="slide-extras-container"]');
      expect(extrasContainer).toBeTruthy();

      const rectEl = container.querySelector('[data-testid="extra-element-extra-rect"]') as HTMLElement;
      expect(rectEl).toBeTruthy();
      expect(rectEl.style.left).toBe('10%');
      expect(rectEl.style.top).toBe('15%');
      expect(rectEl.style.width).toBe('20%');
      expect(rectEl.style.height).toBe('10%');
      expect(rectEl.style.transform).toBe('rotate(15deg)');
      expect(rectEl.style.zIndex).toBe('8');
      expect(container.querySelector('[data-testid="shape-rectangle-extra-rect"]')).toBeTruthy();

      const ellipseEl = container.querySelector('[data-testid="extra-element-extra-ellipse"]') as HTMLElement;
      expect(ellipseEl).toBeTruthy();
      expect(container.querySelector('[data-testid="shape-ellipse-extra-ellipse"]')).toBeTruthy();

      const textEl = container.querySelector('[data-testid="extra-element-extra-text-label"]') as HTMLElement;
      expect(textEl).toBeTruthy();
      expect(screen.getByText('Custom Sticker Note')).toBeTruthy();

      // Hidden extra should not be rendered
      expect(container.querySelector('[data-testid="extra-element-extra-hidden"]')).toBeNull();
    });
  });
});
