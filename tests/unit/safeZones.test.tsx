import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  getStorySafeZoneInsets,
  isWithinStorySafeZone,
  STORY_SAFE_ZONE_PERCENT,
} from '../../src/core/storySafeZones';
import { StorySafeZoneOverlay } from '../../src/slides/StorySafeZoneOverlay';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { generatePalette } from '../../src/core/palette';
import type { Slide } from '../../src/core/schema';

describe('Story Safe Zones Logic & Calculations (Spec §5.4)', () => {
  it('uses 14% top and bottom safe zone constant per Spec §5.4', () => {
    expect(STORY_SAFE_ZONE_PERCENT).toBe(0.14);
  });

  it('calculates insets correctly for standard 1080x1920 story format', () => {
    const insets = getStorySafeZoneInsets(1920);
    expect(insets.top).toBe(269);
    expect(insets.bottom).toBe(269);
    expect(insets.safeHeight).toBe(1920 - 269 * 2); // 1382
    expect(insets.safeTop).toBe(269);
    expect(insets.safeBottom).toBe(1651);
  });

  it('calculates insets correctly for arbitrary heights', () => {
    const insets1000 = getStorySafeZoneInsets(1000);
    expect(insets1000.top).toBe(140);
    expect(insets1000.bottom).toBe(140);
    expect(insets1000.safeHeight).toBe(720);
  });

  it('isWithinStorySafeZone correctly checks vertical coordinates', () => {
    // Unsafe in top 14% (0..268)
    expect(isWithinStorySafeZone(50, 20, 1920)).toBe(false);
    expect(isWithinStorySafeZone(200, 50, 1920)).toBe(false);

    // Safe in central region (269..1651)
    expect(isWithinStorySafeZone(300, 100, 1920)).toBe(true);
    expect(isWithinStorySafeZone(1000, 200, 1920)).toBe(true);
    expect(isWithinStorySafeZone(1500, 100, 1920)).toBe(true);

    // Unsafe in bottom 14% (1652..1920)
    expect(isWithinStorySafeZone(1600, 100, 1920)).toBe(false); // 1600 + 100 = 1700 > 1651
    expect(isWithinStorySafeZone(1700, 20, 1920)).toBe(false);
  });
});

describe('StorySafeZoneOverlay Component', () => {
  it('renders visual guide markers with labels and data-no-export', () => {
    render(<StorySafeZoneOverlay height={1920} />);

    const overlay = screen.getByTestId('story-safe-zone-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('data-no-export', 'true');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');

    expect(screen.getByText(/Top Safe Zone/i)).toBeInTheDocument();
    expect(screen.getByText(/Bottom Safe Zone/i)).toBeInTheDocument();
  });
});

describe('SlideRenderer Safe Zone Integration', () => {
  const palette = generatePalette('#0A84FF', 'dark');
  const slide: Slide = {
    id: 's_story_test',
    type: 'cover',
    fields: { title: 'Story Test' },
  };

  it('renders StorySafeZoneOverlay when showSafeZones is true on tall aspect slide', () => {
    render(
      <SlideRenderer
        slide={slide}
        palette={palette}
        aspectClass="tall"
        showSafeZones={true}
      />
    );

    expect(screen.getByTestId('story-safe-zone-overlay')).toBeInTheDocument();
  });

  it('does NOT render StorySafeZoneOverlay when showSafeZones is false on tall aspect slide', () => {
    render(
      <SlideRenderer
        slide={slide}
        palette={palette}
        aspectClass="tall"
        showSafeZones={false}
      />
    );

    expect(screen.queryByTestId('story-safe-zone-overlay')).not.toBeInTheDocument();
  });

  it('does NOT render StorySafeZoneOverlay on landscape or portrait when not isStory', () => {
    render(
      <SlideRenderer
        slide={slide}
        palette={palette}
        aspectClass="portrait"
        showSafeZones={true}
      />
    );

    expect(screen.queryByTestId('story-safe-zone-overlay')).not.toBeInTheDocument();
  });
});
