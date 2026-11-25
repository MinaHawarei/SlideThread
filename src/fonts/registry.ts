export const FONT_SCRIPTS = ['latin', 'arabic', 'coptic'] as const;
export type FontScript = (typeof FONT_SCRIPTS)[number];
export type FontWeight = 400 | 500 | 600 | 700;
export type FontStyle = 'normal' | 'italic';

export interface FontDefinition {
  id: string;
  family: string;
  scripts: readonly FontScript[];
  weights: readonly number[];
  styles: readonly FontStyle[];
  license: 'OFL-1.1';
  npmSource: string;
  version: string;
  attribution: string;
}

export type FontId = 'ibm-plex-sans' | 'ibm-plex-sans-arabic' | 'jetbrains-mono' | 'noto-sans-coptic' | 'ibm-plex-serif' | 'anton';

export const FONT_REGISTRY: Record<FontId, FontDefinition> = {
  'ibm-plex-sans': {
    id: 'ibm-plex-sans',
    family: 'IBM Plex Sans',
    scripts: ['latin'],
    weights: [400, 500, 700],
    styles: ['normal', 'italic'],
    license: 'OFL-1.1',
    npmSource: '@fontsource/ibm-plex-sans',
    version: '5.3.0',
    attribution: 'Copyright 2019 IBM Corp.',
  },
  'ibm-plex-sans-arabic': {
    id: 'ibm-plex-sans-arabic',
    family: 'IBM Plex Sans Arabic',
    scripts: ['arabic', 'latin'],
    weights: [400, 500, 700],
    styles: ['normal'],
    license: 'OFL-1.1',
    npmSource: '@fontsource/ibm-plex-sans-arabic',
    version: '5.3.0',
    attribution: 'Copyright 2019 IBM Corp.',
  },
  'jetbrains-mono': {
    id: 'jetbrains-mono',
    family: 'JetBrains Mono',
    scripts: ['latin'],
    weights: [400, 700],
    styles: ['normal', 'italic'],
    license: 'OFL-1.1',
    npmSource: '@fontsource/jetbrains-mono',
    version: '5.3.0',
    attribution: 'Copyright 2020 The JetBrains Mono Project Authors.',
  },
  'noto-sans-coptic': {
    id: 'noto-sans-coptic',
    family: 'Noto Sans Coptic',
    scripts: ['coptic'],
    weights: [400],
    styles: ['normal'],
    license: 'OFL-1.1',
    npmSource: '@fontsource/noto-sans-coptic',
    version: '5.3.0',
    attribution: 'Copyright 2022 The Noto Project Authors.',
  },
  'ibm-plex-serif': {
    id: 'ibm-plex-serif', family: 'IBM Plex Serif', scripts: ['latin'], weights: [400, 500, 600, 700], styles: ['normal', 'italic'],
    license: 'OFL-1.1', npmSource: '@fontsource/ibm-plex-serif', version: '5.3.0', attribution: 'Copyright 2017 IBM Corp.',
  },
  anton: {
    id: 'anton', family: 'Anton', scripts: ['latin'], weights: [400], styles: ['normal'],
    license: 'OFL-1.1', npmSource: '@fontsource/anton', version: '5.3.0', attribution: 'Copyright 2020 The Anton Project Authors.',
  },
};

export function getFontsForScript(script: FontScript): FontDefinition[] {
  return Object.values(FONT_REGISTRY).filter((font) => font.scripts.includes(script));
}

export function getScriptsInText(text: string): FontScript[] {
  const scripts = new Set<FontScript>();
  if (/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u.test(text)) scripts.add('arabic');
  if (/[\u03e2-\u03ef\u2c80-\u2cff]/u.test(text)) scripts.add('coptic');
  if (/[A-Za-z\u00c0-\u024f]/u.test(text)) scripts.add('latin');
  return scripts.size > 0 ? [...scripts] : ['latin'];
}

export function getFontsForText(text: string): FontDefinition[] {
  const scripts = getScriptsInText(text);
  const ids = new Set<FontId>();
  if (scripts.includes('arabic')) ids.add('ibm-plex-sans-arabic');
  else if (scripts.includes('latin')) ids.add('ibm-plex-sans');
  if (scripts.includes('coptic')) ids.add('noto-sans-coptic');
  return [...ids].map((id) => FONT_REGISTRY[id]);
}

export function fontCoversScript(font: FontDefinition, script: FontScript): boolean {
  if (script === 'latin') return font.scripts.includes('latin') || font.scripts.includes('arabic');
  return font.scripts.includes(script);
}

export function isArabicCapable(font: FontDefinition): boolean {
  return font.scripts.includes('arabic');
}

/** Fonts a picker may offer for this text: each covers at least one detected script. */
export function listFontsForText(text: string): Array<{ font: FontDefinition; arabicCapable: boolean }> {
  const scripts = getScriptsInText(text);
  return Object.values(FONT_REGISTRY)
    .filter((font) => scripts.some((script) => fontCoversScript(font, script)))
    .map((font) => ({ font, arabicCapable: isArabicCapable(font) }));
}
