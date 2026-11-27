import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { loadTemplateProjectSnapshot } from '../../src/templates/projectSnapshot';
import type { TemplateProjectSnapshot } from '../../src/core/schema';
import {
  calculateSquareCrop,
  calculateInteractiveCrop,
  renderCroppedSquare,
} from '../../src/core/media';
import { PhotoCropDialog } from '../../src/ui/common/PhotoCropDialog';
import { SignatureBar } from '../../src/slides/SignatureBar';
import { CtaSlide } from '../../src/slides/CtaSlide';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { BrandInspector } from '../../src/ui/editor/BrandInspector';
import {
  SlideTypeSchema,
  AspectClassSchema,
  plainTextFieldsToRichText,
  type Slide,
  type BrandSettings,
} from '../../src/core/schema';
import { generatePalette } from '../../src/core/palette';

const createMockBrand = (overrides?: Partial<BrandSettings>): BrandSettings => ({
  displayName: 'Mina Test',
  handle: 'minatest',
  socials: [],
  showSignature: true,
  showSocials: false,
  showCounter: false,
  language: 'en',
  ...overrides,
});

describe('Photo Crop Math (Spec §5.5, §8.1)', () => {
  it('calculateSquareCrop crops center square for landscape and portrait', () => {
    // 1000 x 500 landscape -> side 500, srcX: 250, srcY: 0
    const cropLandscape = calculateSquareCrop(1000, 500);
    expect(cropLandscape).toEqual({ srcX: 250, srcY: 0, side: 500 });

    // 600 x 1200 portrait -> side 600, srcX: 0, srcY: 300
    const cropPortrait = calculateSquareCrop(600, 1200);
    expect(cropPortrait).toEqual({ srcX: 0, srcY: 300, side: 600 });

    // 800 x 800 square -> side 800, srcX: 0, srcY: 0
    const cropSquare = calculateSquareCrop(800, 800);
    expect(cropSquare).toEqual({ srcX: 0, srcY: 0, side: 800 });
  });

  it('calculateInteractiveCrop calculates default 1.0 zoom centered square', () => {
    // Container size: 280, Image: 1000 x 500
    const crop = calculateInteractiveCrop({
      panX: 0,
      panY: 0,
      zoom: 1.0,
      containerSize: 280,
      naturalWidth: 1000,
      naturalHeight: 500,
    });

    // With cover on 1000x500 into 280x280:
    // baseScale = 280/500 = 0.56
    // displayedWidth = 560, displayedHeight = 280
    // imgLeft = 140 - 280 = -140
    // srcX = 140 / 0.56 = 250, srcY = 0, srcSize = 500
    expect(crop.srcX).toBe(250);
    expect(crop.srcY).toBe(0);
    expect(crop.srcSize).toBe(500);
  });

  it('calculateInteractiveCrop scales crop area proportionally with zoom', () => {
    // Zoom 2x on 800x800 square image
    const crop = calculateInteractiveCrop({
      panX: 0,
      panY: 0,
      zoom: 2.0,
      containerSize: 280,
      naturalWidth: 800,
      naturalHeight: 800,
    });

    // Zooming 2x halves the captured source size: 800 / 2 = 400
    expect(crop.srcSize).toBe(400);
    expect(crop.srcX).toBe(200);
    expect(crop.srcY).toBe(200);
  });

  it('calculateInteractiveCrop clamps panning to prevent empty margins', () => {
    // Attempting extreme pan (10000px right and down)
    const crop = calculateInteractiveCrop({
      panX: 10000,
      panY: 10000,
      zoom: 1.0,
      containerSize: 280,
      naturalWidth: 1000,
      naturalHeight: 500,
    });

    // Panning is clamped within image boundaries
    expect(crop.srcX).toBeGreaterThanOrEqual(0);
    expect(crop.srcX + crop.srcSize).toBeLessThanOrEqual(1000);
    expect(crop.srcY).toBeGreaterThanOrEqual(0);
    expect(crop.srcY + crop.srcSize).toBeLessThanOrEqual(500);
  });

  it('handles invalid or zero dimensions safely', () => {
    const invalid = calculateInteractiveCrop({
      panX: 0,
      panY: 0,
      zoom: 1.0,
      containerSize: 0,
      naturalWidth: -100,
      naturalHeight: 0,
    });
    expect(invalid).toEqual({ srcX: 0, srcY: 0, srcSize: 0 });
  });

  it('renderCroppedSquare generates a JPEG data URL via canvas context', () => {
    const drawImageSpy = vi.fn();
    const toDataURLSpy = vi.fn().mockReturnValue('data:image/jpeg;base64,mockJpegData');

    const fakeCanvas = {
      width: 400,
      height: 400,
      getContext: vi.fn().mockReturnValue({
        drawImage: drawImageSpy,
      }),
      toDataURL: toDataURLSpy,
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return fakeCanvas as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });

    const fakeImg = {} as HTMLImageElement;
    const cropCoords = { srcX: 100, srcY: 50, srcSize: 300 };
    const result = renderCroppedSquare(fakeImg, cropCoords, 400);

    expect(drawImageSpy).toHaveBeenCalledWith(
      fakeImg,
      100,
      50,
      300,
      300,
      0,
      0,
      400,
      400
    );
    expect(toDataURLSpy).toHaveBeenCalledWith('image/jpeg', 0.9);
    expect(result).toBe('data:image/jpeg;base64,mockJpegData');

    vi.restoreAllMocks();
  });
});

describe('PhotoCropDialog Component (Spec §5.5)', () => {
  const sampleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  it('renders crop dialog when open with image, zoom slider, reset, cancel, and apply buttons', () => {
    render(
      <PhotoCropDialog
        isOpen={true}
        imageSrc={sampleImage}
        onCrop={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId('photo-crop-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('photo-crop-viewport')).toBeInTheDocument();
    expect(screen.getByTestId('photo-crop-zoom-slider')).toBeInTheDocument();
    expect(screen.getByTestId('photo-crop-reset-btn')).toBeInTheDocument();
    expect(screen.getByTestId('photo-crop-cancel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('photo-crop-confirm-btn')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PhotoCropDialog
        isOpen={false}
        imageSrc={sampleImage}
        onCrop={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onCancel when cancel button or close button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <PhotoCropDialog
        isOpen={true}
        imageSrc={sampleImage}
        onCrop={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByTestId('photo-crop-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('photo-crop-close-btn'));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('updates zoom state when slider or +/- buttons are adjusted', () => {
    render(
      <PhotoCropDialog
        isOpen={true}
        imageSrc={sampleImage}
        onCrop={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const slider = screen.getByTestId('photo-crop-zoom-slider') as HTMLInputElement;
    expect(slider.value).toBe('1');

    fireEvent.click(screen.getByTestId('photo-crop-zoom-in'));
    expect(Number(slider.value)).toBeGreaterThan(1);

    fireEvent.click(screen.getByTestId('photo-crop-reset-btn'));
    expect(slider.value).toBe('1');
  });
});

describe('Avatar Placeholder and Click-to-Upload Affordances (§5.5)', () => {
  it('SignatureBar renders placeholder with camera badge and hover overlay when no photo', () => {
    const brand = createMockBrand();

    render(<SignatureBar brand={brand} />);

    expect(screen.getByTestId('sig-avatar-placeholder')).toBeInTheDocument();
    expect(screen.getByTestId('sig-avatar-placeholder').textContent).toContain('M');
    expect(screen.getByTestId('sig-avatar-ring')).toHaveAttribute('role', 'button');
    expect(screen.getByTestId('signature-avatar-input')).toBeInTheDocument();
  });

  it('CtaSlide renders placeholder with camera badge and clickable avatar ring when no photo', () => {
    const slide: Slide = {
      id: 's_cta_1',
      type: 'cta',
      fields: plainTextFieldsToRichText({
        title: 'Join the Journey',
        body: 'Follow along for more design insights.',
        action: 'Follow Now',
      }),
      overrides: {},
      extras: [],
    };

    render(
      <CtaSlide
        slide={{
          ...slide,
          fields: {
            title: 'Join the Journey',
            body: 'Follow along for more design insights.',
            action: 'Follow Now',
          },
        }}
        palette={generatePalette('#0284c7', 'dark')}
        aspectClass="portrait"
        brand={createMockBrand()}
      />
    );

    expect(screen.getByTestId('cta-avatar-placeholder')).toBeInTheDocument();
    expect(screen.getByTestId('cta-avatar-ring')).toHaveAttribute('role', 'button');
    expect(screen.getByTestId('cta-avatar-input')).toBeInTheDocument();
  });

  it('BrandInspector provides clickable avatar preview/placeholder and file input', () => {
    render(<BrandInspector />);

    expect(screen.getByTestId('brand-upload-photo-btn')).toBeInTheDocument();
    expect(screen.getByTestId('brand-photo-input')).toBeInTheDocument();
  });
});

describe('CTA Photo Regression Test (§5.5)', () => {
  const testPhotoUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAD0lEQVR42mNk+M9QDwAEhgH95b9lEQAAAABJRU5ErkJggg==';

  const brandWithPhoto = createMockBrand({
    displayName: 'Mina Designer',
    handle: 'minadesign',
    photoDataUrl: testPhotoUrl,
  });

  const allSlideTypes = SlideTypeSchema.options;
  const allAspectClasses = AspectClassSchema.options;
  let defaultSnapshot: TemplateProjectSnapshot;

  beforeAll(async () => {
    defaultSnapshot = await loadTemplateProjectSnapshot('tech-mesh', '#0284c7');
  });

  it('asserts photoDataUrl renders in img element for every slide type', () => {
    const palette = generatePalette('#0284c7', 'dark');

    for (const slideType of allSlideTypes) {
      const slide: Slide = {
        id: `s_test_${slideType}`,
        type: slideType,
        fields: plainTextFieldsToRichText({
          title: `Slide ${slideType}`,
          body: `Body content for ${slideType}`,
          action: 'Get Started',
          name: 'Mina Designer',
          handle: 'minadesign',
        }),
        overrides: {},
        extras: [],
      };

      const { container, unmount } = render(
        <SlideRenderer
          slide={slide}
          palette={palette}
          aspectClass="portrait"
          templateSnapshot={defaultSnapshot}
          brand={brandWithPhoto}
          slideIndex={0}
          totalSlides={5}
        />
      );

      // Either in .cta-avatar-img (for CTA slide) or .sig-avatar-img (for signature bar on other slides)
      const avatarImg = container.querySelector('img.cta-avatar-img, img.sig-avatar-img');
      expect(avatarImg, `Slide type ${slideType} must render avatar img`).not.toBeNull();
      expect(avatarImg?.getAttribute('src')).toBe(testPhotoUrl);

      unmount();
    }
  });

  it('asserts CTA slide renders avatar image across all 4 aspect classes', () => {
    const palette = generatePalette('#0284c7', 'dark');
    const ctaSlide: Slide = {
      id: 's_cta_aspect_test',
      type: 'cta',
      fields: plainTextFieldsToRichText({
        title: 'CTA Title',
        body: 'CTA Body',
        action: 'Click Here',
      }),
      overrides: {},
      extras: [],
    };

    for (const aspect of allAspectClasses) {
      const { container, unmount } = render(
        <SlideRenderer
          slide={ctaSlide}
          palette={palette}
          aspectClass={aspect}
          templateSnapshot={defaultSnapshot}
          brand={brandWithPhoto}
          slideIndex={4}
          totalSlides={5}
        />
      );

      const ctaAvatarImg = container.querySelector('[data-testid="cta-avatar-img"]');
      expect(ctaAvatarImg, `CTA avatar must render in aspect ${aspect}`).not.toBeNull();
      expect(ctaAvatarImg?.getAttribute('src')).toBe(testPhotoUrl);

      unmount();
    }
  });
});
