import { oklch, rgb, formatHex, wcagContrast } from 'culori';
import type { ThemeMode } from './schema';

export interface Palette {
  bg: string;
  bg2: string; // gradient pair
  ink: string;
  mute: string; // primary and secondary text
  acc: string;
  acc2: string; // accent and secondary accent (hue shifted ~ +60° in OKLCH)
  line: string; // accent at ~26% alpha
  card: string; // translucent card surface
  ok: string;
  bad: string; // semantic, fixed hues (~155° green, ~20° red) adjusted for the theme
  onAcc: string; // text color on accent fills
}

export const DEFAULT_DARK_PRIMARY = '#35D0E6';
export const DEFAULT_LIGHT_PRIMARY = '#0B7FA6';

/**
 * Reference prototype tokens for Network template per Spec §7.2.
 */
export const NETWORK_DARK_PALETTE: Palette = {
  bg: '#0C1624',
  bg2: '#13263F',
  ink: '#EAF2FB',
  mute: '#8FA3BC',
  acc: '#35D0E6',
  acc2: '#8B7CF6',
  line: 'rgba(53, 208, 230, 0.26)',
  card: 'rgba(19, 38, 63, 0.5)',
  ok: '#5EE6A8',
  bad: '#FF7A8A',
  onAcc: '#0C1624',
};

export const NETWORK_LIGHT_PALETTE: Palette = {
  bg: '#F2F6FB',
  bg2: '#DFEAF6',
  ink: '#0C1624',
  mute: '#52647C',
  acc: '#0B7FA6',
  acc2: '#5B49D6',
  line: 'rgba(11, 127, 166, 0.26)',
  card: 'rgba(255, 255, 255, 0.8)',
  ok: '#12875A',
  bad: '#C4374B',
  onAcc: '#FFFFFF',
};

/**
 * Calculates WCAG 2.1 contrast ratio between two colors (fg and bg).
 */
export function getContrastRatio(fg: string, bg: string): number {
  return wcagContrast(fg, bg);
}

function hexToRgba(hexColor: string, alpha: number): string {
  const parsed = rgb(hexColor);
  if (!parsed) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = Math.round(Math.min(Math.max(parsed.r ?? 0, 0), 1) * 255);
  const g = Math.round(Math.min(Math.max(parsed.g ?? 0, 0), 1) * 255);
  const b = Math.round(Math.min(Math.max(parsed.b ?? 0, 0), 1) * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generates a full design token palette from a primary color hex and theme mode per Spec §7.2.
 * Uses OKLCH color space via culori.
 *
 * Requirements:
 * - ink vs bg >= 7:1
 * - mute vs bg >= 4.5:1
 * - onAcc vs acc >= 4.5:1
 * - acc vs bg >= 3:1
 */
export function generatePalette(primaryHex: string, theme: ThemeMode): Palette {
  const normalizedInput = primaryHex.trim().toLowerCase();

  // Return default Network presets for default colors
  if (
    normalizedInput === DEFAULT_DARK_PRIMARY.toLowerCase() ||
    normalizedInput === DEFAULT_LIGHT_PRIMARY.toLowerCase()
  ) {
    return theme === 'dark' ? { ...NETWORK_DARK_PALETTE } : { ...NETWORK_LIGHT_PALETTE };
  }

  // Parse color or fallback to default cyan
  let parsed = oklch(primaryHex);
  if (!parsed) {
    parsed = oklch(DEFAULT_DARK_PRIMARY)!;
  }

  const hue = parsed.h !== undefined && !Number.isNaN(parsed.h) ? parsed.h : 210;
  const chroma = parsed.c !== undefined && !Number.isNaN(parsed.c) ? parsed.c : 0;

  // Background gradient pair: Spec §7.2
  // Dark: bg L≈0.17, bg2 L≈0.22, chroma low (<= 0.04) with primary hue.
  // Light: bg L≈0.97, bg2 L≈0.93.
  const isDark = theme === 'dark';
  const bgL = isDark ? 0.17 : 0.97;
  const bg2L = isDark ? 0.22 : 0.93;
  const bgChroma = isDark ? Math.min(chroma * 0.2, 0.035) : Math.min(chroma * 0.1, 0.015);

  const bg = formatHex({ mode: 'oklch', l: bgL, c: bgChroma, h: hue });
  const bg2 = formatHex({ mode: 'oklch', l: bg2L, c: bgChroma, h: hue });

  // Accent: adjust lightness and chroma to ensure acc vs bg >= 3:1
  // If primary has very low chroma (neutral like #000, #fff, #808080), boost chroma to ~0.14
  const accChroma = Math.max(chroma, 0.14);
  let accL = parsed.l;

  let acc = formatHex({ mode: 'oklch', l: accL, c: accChroma, h: hue });
  if (isDark) {
    while (wcagContrast(acc, bg) < 3.0 && accL < 0.92) {
      accL += 0.02;
      acc = formatHex({ mode: 'oklch', l: accL, c: accChroma, h: hue });
    }
  } else {
    while (wcagContrast(acc, bg) < 3.0 && accL > 0.18) {
      accL -= 0.02;
      acc = formatHex({ mode: 'oklch', l: accL, c: accChroma, h: hue });
    }
  }

  // Secondary accent: hue shifted ~ +60° in OKLCH
  const acc2Hue = (hue + 60) % 360;
  let acc2L = accL;
  let acc2 = formatHex({ mode: 'oklch', l: acc2L, c: accChroma, h: acc2Hue });
  if (isDark) {
    while (wcagContrast(acc2, bg) < 3.0 && acc2L < 0.92) {
      acc2L += 0.02;
      acc2 = formatHex({ mode: 'oklch', l: acc2L, c: accChroma, h: acc2Hue });
    }
  } else {
    while (wcagContrast(acc2, bg) < 3.0 && acc2L > 0.18) {
      acc2L -= 0.02;
      acc2 = formatHex({ mode: 'oklch', l: acc2L, c: accChroma, h: acc2Hue });
    }
  }

  // Ink text: contrast vs bg >= 7:1
  let inkL = isDark ? 0.95 : 0.16;
  let ink = formatHex({ mode: 'oklch', l: inkL, c: 0.015, h: hue });
  if (isDark) {
    while (wcagContrast(ink, bg) < 7.0 && inkL < 0.99) {
      inkL += 0.01;
      ink = formatHex({ mode: 'oklch', l: inkL, c: 0.01, h: hue });
    }
  } else {
    while (wcagContrast(ink, bg) < 7.0 && inkL > 0.03) {
      inkL -= 0.01;
      ink = formatHex({ mode: 'oklch', l: inkL, c: 0.01, h: hue });
    }
  }

  // Mute text: contrast vs bg >= 4.5:1
  let muteL = isDark ? 0.70 : 0.44;
  let mute = formatHex({ mode: 'oklch', l: muteL, c: 0.02, h: hue });
  if (isDark) {
    while (wcagContrast(mute, bg) < 4.5 && muteL < inkL - 0.05) {
      muteL += 0.01;
      mute = formatHex({ mode: 'oklch', l: muteL, c: 0.02, h: hue });
    }
  } else {
    while (wcagContrast(mute, bg) < 4.5 && muteL > inkL + 0.05) {
      muteL -= 0.01;
      mute = formatHex({ mode: 'oklch', l: muteL, c: 0.02, h: hue });
    }
  }

  // onAcc text: chosen for >= 4.5:1 against acc
  const contrastWhite = wcagContrast('#ffffff', acc);
  const contrastBlack = wcagContrast('#000000', acc);
  const onAcc = contrastWhite >= contrastBlack ? '#ffffff' : '#000000';

  // Line: accent at ~26% alpha
  const line = hexToRgba(acc, 0.26);

  // Card surface
  const card = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.75)';

  // Semantic ok (green, ~155° in OKLCH) and bad (red, ~20° in OKLCH)
  const ok = isDark
    ? formatHex({ mode: 'oklch', l: 0.82, c: 0.16, h: 155 })
    : formatHex({ mode: 'oklch', l: 0.48, c: 0.14, h: 155 });
  const bad = isDark
    ? formatHex({ mode: 'oklch', l: 0.76, c: 0.16, h: 20 })
    : formatHex({ mode: 'oklch', l: 0.48, c: 0.18, h: 25 });

  return {
    bg,
    bg2,
    ink,
    mute,
    acc,
    acc2,
    line,
    card,
    ok,
    bad,
    onAcc,
  };
}
