import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fontsReady, getFontRequirementsForText, REQUIRED_FONTS } from '@/core/fonts';

describe('fontsReady helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defines all required fonts and weights per Spec §7.3', () => {
    expect(REQUIRED_FONTS.length).toBe(8);

    const plexSans = REQUIRED_FONTS.filter((f) => f.family === 'IBM Plex Sans');
    expect(plexSans.map((f) => f.weight)).toEqual([400, 500, 700]);

    const plexSansArabic = REQUIRED_FONTS.filter((f) => f.family === 'IBM Plex Sans Arabic');
    expect(plexSansArabic.map((f) => f.weight)).toEqual([400, 500, 700]);

    const jetbrainsMono = REQUIRED_FONTS.filter((f) => f.family === 'JetBrains Mono');
    expect(jetbrainsMono.map((f) => f.weight)).toEqual([400, 700]);
  });

  it('returns true when document.fonts is undefined (e.g. unsupported environment)', async () => {
    const originalFonts = (document as unknown as { fonts?: unknown }).fonts;
    try {
      Object.defineProperty(document, 'fonts', {
        value: undefined,
        configurable: true,
      });

      const ready = await fontsReady();
      expect(ready).toBe(true);
    } finally {
      Object.defineProperty(document, 'fonts', {
        value: originalFonts,
        configurable: true,
      });
    }
  });

  it('awaits document.fonts.ready and calls document.fonts.load for all items', async () => {
    const loadMock = vi.fn().mockResolvedValue([]);
    const readyPromise = Promise.resolve();

    Object.defineProperty(document, 'fonts', {
      value: {
        ready: readyPromise,
        load: loadMock,
      },
      configurable: true,
    });

    const ready = await fontsReady();
    expect(ready).toBe(true);
    expect(loadMock).toHaveBeenCalledTimes(REQUIRED_FONTS.length);
    expect(loadMock).toHaveBeenCalledWith('normal 400 16px "IBM Plex Sans"', 'SlideThread');
    expect(loadMock).toHaveBeenCalledWith('normal 400 16px "IBM Plex Sans Arabic"', 'مرحبا');
    expect(loadMock).toHaveBeenCalledWith('normal 400 16px "JetBrains Mono"', 'SlideThread');
  });

  it('loads Coptic glyphs before measurement can run', async () => {
    const order: string[] = [];
    Object.defineProperty(document, 'fonts', {
      value: {
        ready: Promise.resolve(),
        load: vi.fn(async () => {
          order.push('face');
          return [];
        }),
      },
      configurable: true,
    });
    const coptic = getFontRequirementsForText('Ϣⲉⲛⲟⲩϩ');
    const ready = await fontsReady(coptic);
    order.push('measure');
    expect(ready).toBe(true);
    expect(order).toEqual(['face', 'measure']);
    expect(coptic[0]?.sampleText).toBe('Ϣⲉⲛⲟⲩϩ');
  });

  it('returns false when a requested browser font face does not finish loading in time', async () => {
    const loadMock = vi.fn(() => new Promise<FontFace[]>((resolve) => setTimeout(() => resolve([]), 25)));
    Object.defineProperty(document, 'fonts', {
      value: { ready: Promise.resolve(), load: loadMock },
      configurable: true,
    });

    await expect(fontsReady([REQUIRED_FONTS[0]!], 1)).resolves.toBe(false);
  });
});
