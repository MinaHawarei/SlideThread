import { plainTextFieldsToRichText } from '../../src/core/schema';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignatureBar, SocialIcon } from '../../src/slides/SignatureBar';
import { formatSlideCounter } from '../../src/slides/signatureUtils';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { generatePalette } from '../../src/core/palette';
import type { BrandSettings, Slide, SocialPlatform } from '../../src/core/schema';

describe('SignatureBar Component (Spec §6.2)', () => {
  const mockBrand: BrandSettings = {
    displayName: 'Mina Rezk',
    handle: '@minarezk',
    showSignature: true,
    showSocials: false,
    socials: [],
    language: 'en',
  };

  it('formats slide counter with 2-digit zero-padding', () => {
    expect(formatSlideCounter(1, 10)).toBe('01/10');
    expect(formatSlideCounter(3, 7)).toBe('03/07');
    expect(formatSlideCounter(12, 15)).toBe('12/15');
  });

  it('renders circular placeholder avatar with initial letter when no photoDataUrl', () => {
    render(
      <SignatureBar
        brand={mockBrand}
        slideIndex={0}
        totalSlides={5}
      />
    );

    const signature = screen.getByTestId('signature-bar');
    expect(signature).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('Mina Rezk')).toBeInTheDocument();
    expect(screen.getByText('@minarezk')).toBeInTheDocument();
  });

  it('renders photo image when photoDataUrl is provided', () => {
    const brandWithPhoto: BrandSettings = {
      ...mockBrand,
      photoDataUrl: 'data:image/png;base64,mockImageData',
    };

    render(
      <SignatureBar
        brand={brandWithPhoto}
        slideIndex={0}
        totalSlides={5}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,mockImageData');
    expect(img).toHaveAttribute('alt', 'Mina Rezk');
  });

  it('renders counter with dir="ltr" and exact 03/07 format', () => {
    render(
      <SignatureBar
        brand={mockBrand}
        slideIndex={2}
        totalSlides={7}
        showCounter={true}
      />
    );

    const counter = screen.getByTestId('slide-counter');
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveTextContent('03/07');
    expect(counter).toHaveAttribute('dir', 'ltr');
  });

  it('does not render counter when showCounter is false', () => {
    render(
      <SignatureBar
        brand={mockBrand}
        slideIndex={2}
        totalSlides={7}
        showCounter={false}
      />
    );

    expect(screen.queryByTestId('slide-counter')).not.toBeInTheDocument();
  });

  it('renders up to 3 socials and collapses extra with +count', () => {
    const brandWithSocials: BrandSettings = {
      ...mockBrand,
      showSocials: true,
      socials: [
        { platform: 'x', handle: '@minatw' },
        { platform: 'linkedin', handle: 'in/minarezk' },
        { platform: 'github', handle: 'minagh' },
        { platform: 'instagram', handle: 'minainsta' },
        { platform: 'youtube', handle: 'minayt' },
      ],
    };

    render(
      <SignatureBar
        brand={brandWithSocials}
        slideIndex={0}
        totalSlides={5}
      />
    );

    expect(screen.getByText('@minatw')).toBeInTheDocument();
    expect(screen.getByText('in/minarezk')).toBeInTheDocument();
    expect(screen.getByText('minagh')).toBeInTheDocument();
    // Extra 2 socials collapsed
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('handles extremely long names and handles without breaking', () => {
    const longBrand: BrandSettings = {
      ...mockBrand,
      displayName: 'Very Very Long Display Name That Could Cause An Overflow In Naive Layouts 1234567890',
      handle: '@extremely_long_handle_name_that_should_be_truncated_properly_with_ellipsis',
    };

    render(
      <SignatureBar
        brand={longBrand}
        slideIndex={0}
        totalSlides={5}
      />
    );

    expect(screen.getByText(longBrand.displayName)).toBeInTheDocument();
    expect(screen.getByText(longBrand.handle)).toBeInTheDocument();
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('01/05');
  });

  it('renders nothing when brand.showSignature is false', () => {
    const hiddenBrand: BrandSettings = {
      ...mockBrand,
      showSignature: false,
    };

    const { container } = render(
      <SignatureBar
        brand={hiddenBrand}
        slideIndex={0}
        totalSlides={5}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders all 8 social icons correctly', () => {
    const platforms: SocialPlatform[] = [
      'instagram',
      'linkedin',
      'facebook',
      'x',
      'github',
      'youtube',
      'tiktok',
      'website',
    ];

    const { container } = render(
      <div>
        {platforms.map((p) => (
          <SocialIcon key={p} platform={p} />
        ))}
      </div>
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(8);
  });
});

describe('SlideRenderer Signature Integration', () => {
  const palette = generatePalette('#0A84FF', 'dark');
  const mockBrand: BrandSettings = {
    displayName: 'Mina',
    handle: '@mina',
    showSignature: true,
    showSocials: false,
    socials: [],
    language: 'en',
  };

  it('renders signature bar on cover slide', async () => {
    const slide: Slide = {
      id: 's_test_cover',
      type: 'cover',
      fields: plainTextFieldsToRichText({ title: 'Test Cover' }),
    };

    render(
      <SlideRenderer
        slide={slide}
        palette={palette}
        aspectClass="portrait"
        brand={mockBrand}
        slideIndex={0}
        totalSlides={4}
      />
    );

    expect(await screen.findByTestId('signature-bar')).toBeInTheDocument();
    expect(screen.getByText('Mina')).toBeInTheDocument();
    expect(screen.getByTestId('slide-counter')).toHaveTextContent('01/04');
  });

  it('does NOT render signature bar on CTA slide (replaces signature bar per Spec §6.2)', () => {
    const slide: Slide = {
      id: 's_test_cta',
      type: 'cta',
      fields: plainTextFieldsToRichText({ title: 'Call To Action', name: 'Mina' }),
    };

    render(
      <SlideRenderer
        slide={slide}
        palette={palette}
        aspectClass="portrait"
        brand={mockBrand}
        slideIndex={3}
        totalSlides={4}
      />
    );

    expect(screen.queryByTestId('signature-bar')).not.toBeInTheDocument();
  });

  it('does NOT render signature bar when slide.hideSignature is true', () => {
    const slide: Slide = {
      id: 's_test_hide',
      type: 'explain',
      fields: plainTextFieldsToRichText({ title: 'Hidden Signature' }),
      hideSignature: true,
    };

    render(
      <SlideRenderer
        slide={slide}
        palette={palette}
        aspectClass="portrait"
        brand={mockBrand}
        slideIndex={1}
        totalSlides={4}
      />
    );

    expect(screen.queryByTestId('signature-bar')).not.toBeInTheDocument();
  });
});
