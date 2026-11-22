import { describe, it, expect } from 'vitest';
import {
  calculateDownscaleDimensions,
  generateAssetId,
  base64ToBlob,
  blobToBase64,
  MAX_IMAGE_LONG_SIDE,
} from '../../src/core/media';

describe('Media Downscaling Math (Spec §6.1)', () => {
  it('does not scale images within maxLongSide (2400px)', () => {
    const res1 = calculateDownscaleDimensions(1080, 1350);
    expect(res1).toEqual({ width: 1080, height: 1350, scaled: false });

    const res2 = calculateDownscaleDimensions(2400, 1600);
    expect(res2).toEqual({ width: 2400, height: 1600, scaled: false });

    const res3 = calculateDownscaleDimensions(1600, 2400);
    expect(res3).toEqual({ width: 1600, height: 2400, scaled: false });
  });

  it('scales wide images so width = 2400 and preserves ratio', () => {
    // 4000 x 3000 -> 2400 x 1800
    const res = calculateDownscaleDimensions(4000, 3000);
    expect(res.width).toBe(MAX_IMAGE_LONG_SIDE);
    expect(res.height).toBe(1800);
    expect(res.scaled).toBe(true);
  });

  it('scales tall images so height = 2400 and preserves ratio', () => {
    // 3000 x 6000 -> 1200 x 2400
    const res = calculateDownscaleDimensions(3000, 6000);
    expect(res.height).toBe(MAX_IMAGE_LONG_SIDE);
    expect(res.width).toBe(1200);
    expect(res.scaled).toBe(true);
  });

  it('handles square images larger than 2400', () => {
    const res = calculateDownscaleDimensions(3200, 3200);
    expect(res.width).toBe(MAX_IMAGE_LONG_SIDE);
    expect(res.height).toBe(MAX_IMAGE_LONG_SIDE);
    expect(res.scaled).toBe(true);
  });

  it('handles invalid or zero dimensions safely', () => {
    expect(calculateDownscaleDimensions(0, 1000)).toEqual({ width: 0, height: 0, scaled: false });
    expect(calculateDownscaleDimensions(1000, 0)).toEqual({ width: 0, height: 0, scaled: false });
    expect(calculateDownscaleDimensions(-100, 200)).toEqual({ width: 0, height: 0, scaled: false });
  });
});

describe('Media Helpers (Spec §6.1, §8.2)', () => {
  it('generateAssetId returns collision-resistant ID starting with ast_', () => {
    const id1 = generateAssetId();
    const id2 = generateAssetId();
    expect(id1).toMatch(/^ast_[0-9a-z]+_[0-9a-z]+$/);
    expect(id2).toMatch(/^ast_[0-9a-z]+_[0-9a-z]+$/);
    expect(id1).not.toBe(id2);
  });

  it('base64ToBlob and blobToBase64 round-trip binary data', async () => {
    const originalText = 'Hello SlideThread Image Binary Data!';
    const rawBase64 = btoa(originalText);
    const dataUrl = `data:image/png;base64,${rawBase64}`;

    const blob = base64ToBlob(dataUrl);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);

    const convertedBack = await blobToBase64(blob);
    expect(convertedBack).toBe(dataUrl);
  });
});
