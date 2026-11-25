import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignatureBar } from '../../src/slides/SignatureBar';
import { CtaSlide } from '../../src/slides/CtaSlide';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { BrandInspector } from '../../src/ui/editor/BrandInspector';
import { useProjectStore } from '../../src/store/projectStore';
import { useSettingsStore, DEFAULT_BRAND_SETTINGS } from '../../src/store/settingsStore';
import { generatePalette } from '../../src/core/palette';
import {
  DEFAULT_SIGNATURE_CONFIG,
  type Anchor,
  type Slide,
  plainTextFieldsToRichText,
} from '../../src/core/schema';

describe('Signature System (Spec §5.4 & Revision Plan §3.6)', () => {
  const mockPalette = generatePalette('#0A84FF', 'dark');

  const baseBrand = {
    ...DEFAULT_BRAND_SETTINGS,
    displayName: 'Mina Hawarei',
    handle: '@minahawarei',
    showSignature: true,
  };

  describe('SignatureBar Component Options', () => {
    it('returns null when signatureConfig.show is false', () => {
      const { container } = render(
        <SignatureBar
          brand={baseBrand}
          signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, show: false }}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    describe('Photo Shapes: circle, rounded, square', () => {
      (['circle', 'rounded', 'square'] as const).forEach((shape) => {
        it(`renders with data-shape="${shape}" and class "sig-shape-${shape}"`, () => {
          render(
            <SignatureBar
              brand={baseBrand}
              signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, photoShape: shape }}
            />
          );
          const bar = screen.getByTestId('signature-bar');
          expect(bar).toHaveAttribute('data-shape', shape);
          expect(bar).toHaveClass(`sig-shape-${shape}`);
        });
      });
    });

    describe('Sizes: sm, md, lg', () => {
      (['sm', 'md', 'lg'] as const).forEach((size) => {
        it(`renders with data-size="${size}" and class "sig-size-${size}"`, () => {
          render(
            <SignatureBar
              brand={baseBrand}
              signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, size }}
            />
          );
          const bar = screen.getByTestId('signature-bar');
          expect(bar).toHaveAttribute('data-size', size);
          expect(bar).toHaveClass(`sig-size-${size}`);
        });
      });
    });

    describe('Arrangements: inline, stacked', () => {
      (['inline', 'stacked'] as const).forEach((arr) => {
        it(`renders with data-arrangement="${arr}" and class "sig-arr-${arr}"`, () => {
          render(
            <SignatureBar
              brand={baseBrand}
              signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, arrangement: arr }}
            />
          );
          const bar = screen.getByTestId('signature-bar');
          expect(bar).toHaveAttribute('data-arrangement', arr);
          expect(bar).toHaveClass(`sig-arr-${arr}`);
        });
      });
    });

    describe('Handle and Socials visibility', () => {
      it('hides handle when showHandle is false', () => {
        render(
          <SignatureBar
            brand={baseBrand}
            signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, showHandle: false }}
          />
        );
        expect(screen.getByText('Mina Hawarei')).toBeInTheDocument();
        expect(screen.queryByText('@minahawarei')).not.toBeInTheDocument();
      });

      it('shows handle when showHandle is true', () => {
        render(
          <SignatureBar
            brand={baseBrand}
            signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, showHandle: true }}
          />
        );
        expect(screen.getByText('@minahawarei')).toBeInTheDocument();
      });

      it('hides socials when showSocials is false', () => {
        render(
          <SignatureBar
            brand={{
              ...baseBrand,
              showSocials: true,
              socials: [{ platform: 'x', handle: '@minatw' }],
            }}
            signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, showSocials: false }}
          />
        );
        expect(screen.queryByText('@minatw')).not.toBeInTheDocument();
      });
    });

    describe('Anchors: tl, tc, tr, bl, bc, br, free', () => {
      const anchors: Array<Anchor | 'free'> = ['tl', 'tc', 'tr', 'bl', 'bc', 'br', 'free'];

      anchors.forEach((anchor) => {
        it(`sets data-anchor="${anchor}" on signature bar`, () => {
          render(
            <SignatureBar
              brand={baseBrand}
              signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, anchor }}
            />
          );
          const bar = screen.getByTestId('signature-bar');
          expect(bar).toHaveAttribute('data-anchor', anchor);
        });
      });
    });
  });

  describe('SlideRenderer Positioning & Free Move via Overrides', () => {
    const slide: Slide = {
      id: 's_test_1',
      type: 'explain',
      fields: plainTextFieldsToRichText({ title: 'Title', body: 'Body' }),
    };

    it('positions container at physical anchor "tl" (top: 40px, left: 48px)', async () => {
      render(
        <SlideRenderer
          slide={slide}
          palette={mockPalette}
          aspectClass="portrait"
          brand={baseBrand}
          signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, anchor: 'tl' }}
        />
      );

      const container = (await screen.findByTestId('signature-bar')).closest('.slide-signature-container');
      expect(container).toHaveClass('sig-anchor-tl');
      const style = (container as HTMLElement).style;
      expect(style.top).toBe('40px');
      expect(style.left).toBe('48px');
    });

    it('positions container at physical anchor "br" (bottom: 40px, right: 48px)', async () => {
      render(
        <SlideRenderer
          slide={slide}
          palette={mockPalette}
          aspectClass="portrait"
          brand={baseBrand}
          signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, anchor: 'br' }}
        />
      );

      const container = (await screen.findByTestId('signature-bar')).closest('.slide-signature-container');
      expect(container).toHaveClass('sig-anchor-br');
      const style = (container as HTMLElement).style;
      expect(style.bottom).toBe('40px');
      expect(style.right).toBe('48px');
    });

    it('applies free movement override (dx, dy, scale) when anchor is free', async () => {
      const slideWithOverride: Slide = {
        ...slide,
        overrides: {
          portrait: {
            signature: { dx: 0.1, dy: 0.2, scale: 1.2 },
          },
        },
      };

      render(
        <SlideRenderer
          slide={slideWithOverride}
          palette={mockPalette}
          aspectClass="portrait"
          brand={baseBrand}
          signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, anchor: 'free' }}
          dimensions={{ width: 1080, height: 1350 }}
        />
      );

      const container = (await screen.findByTestId('signature-bar')).closest('.slide-signature-container');
      expect(container).toHaveClass('sig-anchor-free');
      // Overrides apply transform translate and scale
      expect((container as HTMLElement).style.transform).toContain('scale(1.2)');
    });
  });

  describe('CTA Slide Large Avatar Variants (§5.4 & REQ-08)', () => {
    const ctaSlideData = {
      id: 'cta_1',
      type: 'cta' as const,
      fields: { title: 'Ready to build?', action: 'Follow me' },
      richFields: plainTextFieldsToRichText({ title: 'Ready to build?', action: 'Follow me' }),
    };

    it('renders avatar placeholder with initial and respects photoShape', () => {
      const { rerender } = render(
        <CtaSlide
          slide={ctaSlideData}
          palette={mockPalette}
          aspectClass="square"
          brand={baseBrand}
          signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, photoShape: 'circle' }}
        />
      );

      const ring = screen.getByTestId('cta-avatar-ring');
      expect(ring).toHaveAttribute('data-shape', 'circle');
      expect(screen.getByTestId('cta-avatar-placeholder')).toHaveTextContent('M');

      rerender(
        <CtaSlide
          slide={ctaSlideData}
          palette={mockPalette}
          aspectClass="square"
          brand={baseBrand}
          signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, photoShape: 'square' }}
        />
      );
      expect(screen.getByTestId('cta-avatar-ring')).toHaveAttribute('data-shape', 'square');
    });

    it('renders avatar image on CTA slide when photoDataUrl is provided', () => {
      render(
        <CtaSlide
          slide={ctaSlideData}
          palette={mockPalette}
          aspectClass="square"
          brand={{
            ...baseBrand,
            photoDataUrl: 'data:image/png;base64,sampleFakeAvatarBytes',
          }}
          signatureConfig={{ ...DEFAULT_SIGNATURE_CONFIG, photoShape: 'rounded' }}
        />
      );

      const img = screen.getByTestId('cta-avatar-img') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('data:image/png;base64,sampleFakeAvatarBytes');
    });
  });

  describe('BrandInspector Controls Integration', () => {
    beforeEach(() => {
      useProjectStore.getState().createProject({
        signature: { ...DEFAULT_SIGNATURE_CONFIG, show: true, anchor: 'bc', arrangement: 'inline' },
      });
      useSettingsStore.getState().updateSettings({
        ...DEFAULT_BRAND_SETTINGS,
        showSignature: true,
      });
    });

    it('toggles signature visibility', () => {
      render(<BrandInspector />);
      const toggle = screen.getByTestId('brand-signature-toggle') as HTMLInputElement;
      expect(toggle.checked).toBe(true);

      fireEvent.click(toggle);
      expect(useProjectStore.getState().project.signature?.show).toBe(false);

      fireEvent.click(toggle);
      expect(useProjectStore.getState().project.signature?.show).toBe(true);
    });

    it('updates anchor when clicking anchor buttons', () => {
      render(<BrandInspector />);
      const trBtn = screen.getByTestId('sig-anchor-tr');
      fireEvent.click(trBtn);
      expect(useProjectStore.getState().project.signature?.anchor).toBe('tr');

      const freeBtn = screen.getByTestId('sig-anchor-free');
      fireEvent.click(freeBtn);
      expect(useProjectStore.getState().project.signature?.anchor).toBe('free');
    });

    it('updates arrangement, size, and photo shape', () => {
      render(<BrandInspector />);
      // Arrangement
      const stackedBtn = screen.getByTestId('sig-arrangement-stacked');
      fireEvent.click(stackedBtn);
      expect(useProjectStore.getState().project.signature?.arrangement).toBe('stacked');

      // Size
      const lgBtn = screen.getByTestId('sig-size-lg');
      fireEvent.click(lgBtn);
      expect(useProjectStore.getState().project.signature?.size).toBe('lg');

      // Photo shape
      const roundedBtn = screen.getByTestId('sig-shape-rounded');
      fireEvent.click(roundedBtn);
      expect(useProjectStore.getState().project.signature?.photoShape).toBe('rounded');

      // Handle toggle
      const handleToggle = screen.getByTestId('sig-handle-toggle') as HTMLInputElement;
      expect(handleToggle.checked).toBe(true);
      fireEvent.click(handleToggle);
      expect(useProjectStore.getState().project.signature?.showHandle).toBe(false);
    });
  });
});
