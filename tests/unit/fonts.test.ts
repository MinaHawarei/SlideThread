import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fontsReady, REQUIRED_FONTS } from '@/core/fonts';

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
});
