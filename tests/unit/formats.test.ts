import { describe, it, expect } from 'vitest';
import {
  FORMAT_REGISTRY,
  FORMAT_LIST,
  getFormat,
  getDimensions,
  aspectClass,
  getAspectClassForFormat,
} from '../../src/core/formats';
import {
  PLATFORMS,
  PLATFORM_FORMAT_MATRIX,
  getAllowedFormatIds,
  getAllowedFormats,
  isFormatAllowed,
  getRecommendedExport,
  getCarouselSlideLimitWarning,
} from '../../src/core/platforms';
import type { PlatformId, ContentType } from '../../src/core/schema';

describe('Format Registry (Spec §4.1)', () => {
  it('contains the 4 required formats with short side 1080 px', () => {
    expect(FORMAT_LIST.length).toBe(4);
    const expectedIds = ['r_4_5', 'r_1_1', 'r_9_16', 'r_16_9'];
    for (const id of expectedIds) {
      const format = FORMAT_REGISTRY[id as keyof typeof FORMAT_REGISTRY];
      expect(format).toBeDefined();
      expect(format.id).toBe(id);
      const shortSide = Math.min(format.width, format.height);
      expect(shortSide).toBe(1080);
    }
  });

  it('getFormat retrieves format definition or undefined', () => {
    expect(getFormat('r_4_5')?.label).toBe('4:5 Portrait');
    expect(getFormat('r_1_1')?.label).toBe('1:1 Square');
    expect(getFormat('nonexistent')).toBeUndefined();
  });

  it('getDimensions returns exact sizes and handles orientation for 16:9', () => {
    expect(getDimensions('r_4_5')).toEqual({ width: 1080, height: 1350 });
    expect(getDimensions('r_1_1')).toEqual({ width: 1080, height: 1080 });
    expect(getDimensions('r_9_16')).toEqual({ width: 1080, height: 1920 });

    // 16:9 orientable
    expect(getDimensions('r_16_9', 'landscape')).toEqual({ width: 1920, height: 1080 });
    expect(getDimensions('r_16_9', 'portrait')).toEqual({ width: 1080, height: 1920 });
    // Default orientation when omitted is landscape (1920x1080)
    expect(getDimensions('r_16_9')).toEqual({ width: 1920, height: 1080 });

    // Passing FormatDef object
    const def = getFormat('r_4_5')!;
    expect(getDimensions(def)).toEqual({ width: 1080, height: 1350 });

    // Throws on unknown format
    expect(() => getDimensions('invalid_format')).toThrow('Unknown format');
  });
});

describe('Aspect Class Calculation (Spec §5.2)', () => {
  it('correctly classifies landscape (ratio > 1.2)', () => {
    expect(aspectClass(1920, 1080)).toBe('landscape'); // ~1.78
    expect(aspectClass(1201, 1000)).toBe('landscape'); // 1.201
  });

  it('correctly classifies square (0.9 <= ratio <= 1.2)', () => {
    expect(aspectClass(1200, 1000)).toBe('square'); // 1.2 (boundary)
    expect(aspectClass(1080, 1080)).toBe('square'); // 1.0
    expect(aspectClass(900, 1000)).toBe('square'); // 0.9 (boundary)
  });

  it('correctly classifies portrait (0.65 <= ratio < 0.9)', () => {
    expect(aspectClass(899, 1000)).toBe('portrait'); // 0.899
    expect(aspectClass(1080, 1350)).toBe('portrait'); // 0.8
    expect(aspectClass(650, 1000)).toBe('portrait'); // 0.65 (boundary)
  });

  it('correctly classifies tall (ratio < 0.65)', () => {
    expect(aspectClass(649, 1000)).toBe('tall'); // 0.649
    expect(aspectClass(1080, 1920)).toBe('tall'); // 0.5625
  });

  it('handles invalid/zero/negative dimensions safely by falling back to square', () => {
    expect(aspectClass(0, 1080)).toBe('square');
    expect(aspectClass(1080, 0)).toBe('square');
    expect(aspectClass(-100, 100)).toBe('square');
    expect(aspectClass(NaN, 1080)).toBe('square');
  });

  it('getAspectClassForFormat helper returns expected aspect class', () => {
    expect(getAspectClassForFormat('r_16_9', 'landscape')).toBe('landscape');
    expect(getAspectClassForFormat('r_16_9', 'portrait')).toBe('tall');
    expect(getAspectClassForFormat('r_1_1')).toBe('square');
    expect(getAspectClassForFormat('r_4_5')).toBe('portrait');
    expect(getAspectClassForFormat('r_9_16')).toBe('tall');
  });
});

describe('Platform Registry and Matrix (Spec §4.2)', () => {
  const platforms: PlatformId[] = ['instagram', 'linkedin', 'facebook', 'custom'];
  const contentTypes: ContentType[] = ['post', 'carousel', 'story'];

  it('defines all 4 platforms', () => {
    expect(Object.keys(PLATFORMS)).toEqual(['instagram', 'linkedin', 'facebook', 'custom']);
    expect(PLATFORMS.linkedin.supportedContentTypes).not.toContain('story');
    expect(PLATFORMS.instagram.supportedContentTypes).toContain('story');
  });

  it('verifies every single cell of the platform format matrix', () => {
    // Instagram
    expect(getAllowedFormatIds('instagram', 'post')).toEqual(['r_4_5', 'r_1_1', 'r_16_9']);
    expect(getAllowedFormatIds('instagram', 'carousel')).toEqual(['r_4_5', 'r_1_1']);
    expect(getAllowedFormatIds('instagram', 'story')).toEqual(['r_9_16']);

    // LinkedIn
    expect(getAllowedFormatIds('linkedin', 'post')).toEqual(['r_1_1', 'r_4_5', 'r_16_9']);
    expect(getAllowedFormatIds('linkedin', 'carousel')).toEqual(['r_4_5', 'r_1_1', 'r_16_9']);
    expect(getAllowedFormatIds('linkedin', 'story')).toEqual([]);

    // Facebook
    expect(getAllowedFormatIds('facebook', 'post')).toEqual(['r_4_5', 'r_1_1', 'r_16_9']);
    expect(getAllowedFormatIds('facebook', 'carousel')).toEqual(['r_1_1', 'r_4_5']);
    expect(getAllowedFormatIds('facebook', 'story')).toEqual(['r_9_16']);

    // Custom
    expect(getAllowedFormatIds('custom', 'post')).toEqual(['r_4_5', 'r_1_1', 'r_9_16', 'r_16_9']);
    expect(getAllowedFormatIds('custom', 'carousel')).toEqual(['r_4_5', 'r_1_1', 'r_9_16', 'r_16_9']);
    expect(getAllowedFormatIds('custom', 'story')).toEqual(['r_9_16']);
  });

  it('getAllowedFormats returns FormatDef objects matching matrix IDs', () => {
    for (const p of platforms) {
      for (const ct of contentTypes) {
        const expectedIds = PLATFORM_FORMAT_MATRIX[p][ct];
        const formats = getAllowedFormats(p, ct);
        expect(formats.map((f) => f.id)).toEqual(expectedIds);
      }
    }
  });

  it('isFormatAllowed checks whether format is valid for platform & content type', () => {
    expect(isFormatAllowed('instagram', 'carousel', 'r_4_5')).toBe(true);
    expect(isFormatAllowed('instagram', 'carousel', 'r_16_9')).toBe(false);
    expect(isFormatAllowed('linkedin', 'carousel', 'r_16_9')).toBe(true);
    expect(isFormatAllowed('linkedin', 'story', 'r_9_16')).toBe(false);
    expect(isFormatAllowed('custom', 'carousel', 'r_9_16')).toBe(true);
  });

  it('getRecommendedExport returns correct default export per Spec §4.2', () => {
    // LinkedIn carousel -> PDF
    expect(getRecommendedExport('linkedin', 'carousel')).toBe('pdf');
    // Instagram/Facebook/Custom carousel -> PNG ZIP
    expect(getRecommendedExport('instagram', 'carousel')).toBe('zip');
    expect(getRecommendedExport('facebook', 'carousel')).toBe('zip');
    expect(getRecommendedExport('custom', 'carousel')).toBe('zip');
    // Any post or story -> PNG
    expect(getRecommendedExport('instagram', 'post')).toBe('png');
    expect(getRecommendedExport('linkedin', 'post')).toBe('png');
    expect(getRecommendedExport('facebook', 'post')).toBe('png');
    expect(getRecommendedExport('custom', 'post')).toBe('png');
    expect(getRecommendedExport('instagram', 'story')).toBe('png');
    expect(getRecommendedExport('facebook', 'story')).toBe('png');
    expect(getRecommendedExport('custom', 'story')).toBe('png');
  });

  it('getCarouselSlideLimitWarning issues soft warnings per Spec §4.2', () => {
    // Instagram <= 20: no warning
    expect(getCarouselSlideLimitWarning('instagram', 10)).toBeNull();
    expect(getCarouselSlideLimitWarning('instagram', 20)).toBeNull();
    // Instagram > 20: warning
    expect(getCarouselSlideLimitWarning('instagram', 21)).toMatch(/Instagram carousels support up to 20 slides/);

    // LinkedIn <= 30: no warning
    expect(getCarouselSlideLimitWarning('linkedin', 25)).toBeNull();
    expect(getCarouselSlideLimitWarning('linkedin', 30)).toBeNull();
    // LinkedIn > 30: general warning
    expect(getCarouselSlideLimitWarning('linkedin', 31)).toMatch(/recommended maximum is 30/);

    // Instagram > 30: general warning triggers
    expect(getCarouselSlideLimitWarning('instagram', 35)).toMatch(/recommended maximum is 30/);
  });
});
