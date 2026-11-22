import { describe, it, expect } from 'vitest';
import {
  generatePalette,
  getContrastRatio,
  NETWORK_DARK_PALETTE,
  NETWORK_LIGHT_PALETTE,
  DEFAULT_DARK_PRIMARY,
  DEFAULT_LIGHT_PRIMARY,
} from '../../src/core/palette';
import type { ThemeMode } from '../../src/core/schema';

describe('Palette Generation (Spec §7.2)', () => {
  it('reproduces Network default reference tokens for default primary colors', () => {
    const darkPalette = generatePalette(DEFAULT_DARK_PRIMARY, 'dark');
    expect(darkPalette).toEqual(NETWORK_DARK_PALETTE);

    const lightPalette = generatePalette(DEFAULT_LIGHT_PRIMARY, 'light');
    expect(lightPalette).toEqual(NETWORK_LIGHT_PALETTE);
  });

  it('Network default tokens satisfy all WCAG contrast requirements', () => {
    // Dark mode
    expect(getContrastRatio(NETWORK_DARK_PALETTE.ink, NETWORK_DARK_PALETTE.bg)).toBeGreaterThanOrEqual(7.0);
    expect(getContrastRatio(NETWORK_DARK_PALETTE.mute, NETWORK_DARK_PALETTE.bg)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(NETWORK_DARK_PALETTE.acc, NETWORK_DARK_PALETTE.bg)).toBeGreaterThanOrEqual(3.0);
    expect(getContrastRatio(NETWORK_DARK_PALETTE.onAcc, NETWORK_DARK_PALETTE.acc)).toBeGreaterThanOrEqual(4.5);

    // Light mode
    expect(getContrastRatio(NETWORK_LIGHT_PALETTE.ink, NETWORK_LIGHT_PALETTE.bg)).toBeGreaterThanOrEqual(7.0);
    expect(getContrastRatio(NETWORK_LIGHT_PALETTE.mute, NETWORK_LIGHT_PALETTE.bg)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(NETWORK_LIGHT_PALETTE.acc, NETWORK_LIGHT_PALETTE.bg)).toBeGreaterThanOrEqual(3.0);
    expect(getContrastRatio(NETWORK_LIGHT_PALETTE.onAcc, NETWORK_LIGHT_PALETTE.acc)).toBeGreaterThanOrEqual(4.5);
  });

  const edgeColors = [
    '#000000',
    '#ffffff',
    '#808080',
    '#ffff00',
    '#ff0000',
    '#00ffff',
    '#000',
    '#fff',
  ];

  const themes: ThemeMode[] = ['dark', 'light'];

  for (const theme of themes) {
    describe(`Edge color contrast checks (${theme} mode)`, () => {
      for (const hex of edgeColors) {
        it(`satisfies all contrast requirements for ${hex} in ${theme} mode`, () => {
          const palette = generatePalette(hex, theme);

          // ink vs bg >= 7:1
          const inkBg = getContrastRatio(palette.ink, palette.bg);
          expect(inkBg).toBeGreaterThanOrEqual(7.0);

          // mute vs bg >= 4.5:1
          const muteBg = getContrastRatio(palette.mute, palette.bg);
          expect(muteBg).toBeGreaterThanOrEqual(4.5);

          // acc vs bg >= 3:1
          const accBg = getContrastRatio(palette.acc, palette.bg);
          expect(accBg).toBeGreaterThanOrEqual(3.0);

          // onAcc vs acc >= 4.5:1
          const onAccAcc = getContrastRatio(palette.onAcc, palette.acc);
          expect(onAccAcc).toBeGreaterThanOrEqual(4.5);

          // acc2 vs bg >= 3:1
          const acc2Bg = getContrastRatio(palette.acc2, palette.bg);
          expect(acc2Bg).toBeGreaterThanOrEqual(3.0);

          // line token includes 0.26 alpha
          expect(palette.line).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*0\.26\)$/);

          // card surface is defined
          expect(palette.card).toBeTruthy();

          // semantic tokens exist
          expect(palette.ok).toMatch(/^#[0-9a-fA-F]{6}$/);
          expect(palette.bad).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
      }
    });
  }

  it('handles invalid or empty color input with safe fallback', () => {
    const fallbackDark = generatePalette('invalid-color', 'dark');
    expect(getContrastRatio(fallbackDark.ink, fallbackDark.bg)).toBeGreaterThanOrEqual(7.0);
    expect(getContrastRatio(fallbackDark.mute, fallbackDark.bg)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(fallbackDark.acc, fallbackDark.bg)).toBeGreaterThanOrEqual(3.0);
    expect(getContrastRatio(fallbackDark.onAcc, fallbackDark.acc)).toBeGreaterThanOrEqual(4.5);

    const fallbackLight = generatePalette('', 'light');
    expect(getContrastRatio(fallbackLight.ink, fallbackLight.bg)).toBeGreaterThanOrEqual(7.0);
    expect(getContrastRatio(fallbackLight.mute, fallbackLight.bg)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(fallbackLight.acc, fallbackLight.bg)).toBeGreaterThanOrEqual(3.0);
    expect(getContrastRatio(fallbackLight.onAcc, fallbackLight.acc)).toBeGreaterThanOrEqual(4.5);
  });
});
