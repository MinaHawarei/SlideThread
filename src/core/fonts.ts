export interface FontRequirement {
  family: string;
  weight: number | string;
  style?: string;
  sampleText?: string;
}

export const REQUIRED_FONTS: FontRequirement[] = [
  { family: 'IBM Plex Sans', weight: 400 },
  { family: 'IBM Plex Sans', weight: 500 },
  { family: 'IBM Plex Sans', weight: 700 },
  { family: 'IBM Plex Sans Arabic', weight: 400, sampleText: 'مرحبا' },
  { family: 'IBM Plex Sans Arabic', weight: 500, sampleText: 'مرحبا' },
  { family: 'IBM Plex Sans Arabic', weight: 700, sampleText: 'مرحبا' },
  { family: 'JetBrains Mono', weight: 400 },
  { family: 'JetBrains Mono', weight: 700 },
];

/**
 * Awaits document.fonts.ready and explicitly triggers load for all required font/weight combinations.
 */
export async function fontsReady(
  fonts: FontRequirement[] = REQUIRED_FONTS,
  timeoutMs: number = 3000
): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) {
    return true;
  }

  try {
    await document.fonts.ready;
  } catch (err) {
    console.warn('document.fonts.ready failed', err);
  }

  const fontLoadPromises = fonts.map(async (font) => {
    try {
      const style = font.style || 'normal';
      const weight = font.weight;
      const text = font.sampleText || 'SlideThread';
      const fontDesc = `${style} ${weight} 16px "${font.family}"`;
      if (typeof document.fonts.load === 'function') {
        await document.fonts.load(fontDesc, text);
      }
    } catch (e) {
      console.warn(`Failed to load font: ${font.family} ${font.weight}`, e);
    }
  });

  const loadAll = Promise.all(fontLoadPromises);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));

  await Promise.race([loadAll, timeout]);
  return true;
}
