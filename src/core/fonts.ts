import { FONT_REGISTRY, getScriptsInText, type FontId, type FontStyle, type FontWeight } from '../fonts/registry';
import { loadFont } from '../fonts/loader';

export interface FontRequirement {
  id: FontId;
  family: string;
  weight: FontWeight;
  style?: FontStyle;
  sampleText?: string;
}

function sampleFor(id: FontId): string | undefined {
  const font = FONT_REGISTRY[id];
  if (font.scripts.includes('coptic')) return 'Ϣⲉⲛⲟⲩϩ';
  if (font.scripts.includes('arabic')) return 'مرحبا';
  return undefined;
}

function requirementsFor(id: FontId): FontRequirement[] {
  const font = FONT_REGISTRY[id];
  const sampleText = sampleFor(id);
  return font.weights.map((weight) => ({
    id,
    family: font.family,
    weight: weight as FontWeight,
    ...(sampleText ? { sampleText } : {}),
  }));
}

export const REQUIRED_FONTS: FontRequirement[] = [
  ...requirementsFor('ibm-plex-sans'),
  ...requirementsFor('ibm-plex-sans-arabic'),
  ...requirementsFor('jetbrains-mono'),
];

export function getFontRequirementsForText(text: string): FontRequirement[] {
  const scripts = getScriptsInText(text);
  const requirements: FontRequirement[] = [];
  if (scripts.includes('latin') && !scripts.includes('arabic')) {
    requirements.push(...requirementsFor('ibm-plex-sans'));
  }
  if (scripts.includes('arabic')) requirements.push(...requirementsFor('ibm-plex-sans-arabic'));
  if (scripts.includes('coptic')) requirements.push(...requirementsFor('noto-sans-coptic'));
  return requirements;
}

/**
 * Loads local font CSS on demand, then waits for the browser faces used by the
 * requested families. Export capture calls this before measuring or drawing.
 */
export async function fontsReady(
  fonts: FontRequirement[] = REQUIRED_FONTS,
  timeoutMs = 3000
): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) return true;

  await Promise.all(fonts.map((font) => loadFont(font.id, font.weight)));

  try {
    await document.fonts.ready;
  } catch (err) {
    console.warn('document.fonts.ready failed', err);
  }

  const fontLoadPromises = fonts.map(async (font) => {
    const style = font.style || 'normal';
    const sample = font.sampleText || 'SlideThread';
    const fontDesc = `${style} ${font.weight} 16px "${font.family}"`;
    try {
      if (typeof document.fonts.load === 'function') {
        await document.fonts.load(fontDesc, sample);
      }
      return true;
    } catch (err) {
      console.warn(`Failed to load font: ${font.family} ${font.weight}`, err);
      return false;
    }
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<boolean>((resolve) => {
    timeoutId = setTimeout(() => resolve(false), timeoutMs);
  });
  const loaded = Promise.all(fontLoadPromises).then((results) => results.every(Boolean));
  try {
    return await Promise.race([loaded, timedOut]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export function getScriptsForText(text: string) {
  return getScriptsInText(text);
}
