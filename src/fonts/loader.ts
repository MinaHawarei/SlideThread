import { FONT_REGISTRY, type FontId, type FontScript, type FontStyle, type FontWeight } from './registry';

type Loader = () => Promise<unknown>;
type FontLoaders = Record<FontId, Partial<Record<FontWeight, Partial<Record<FontStyle, Loader>>>>>;

const FONT_LOADERS: FontLoaders = {
  'ibm-plex-sans': {
    400: { normal: () => import('@fontsource/ibm-plex-sans/400.css'), italic: () => import('@fontsource/ibm-plex-sans/400-italic.css') },
    500: { normal: () => import('@fontsource/ibm-plex-sans/500.css'), italic: () => import('@fontsource/ibm-plex-sans/500-italic.css') },
    700: { normal: () => import('@fontsource/ibm-plex-sans/700.css'), italic: () => import('@fontsource/ibm-plex-sans/700-italic.css') },
  },
  'ibm-plex-sans-arabic': {
    400: { normal: () => import('@fontsource/ibm-plex-sans-arabic/400.css') },
    500: { normal: () => import('@fontsource/ibm-plex-sans-arabic/500.css') },
    700: { normal: () => import('@fontsource/ibm-plex-sans-arabic/700.css') },
  },
  'jetbrains-mono': {
    400: { normal: () => import('@fontsource/jetbrains-mono/400.css'), italic: () => import('@fontsource/jetbrains-mono/400-italic.css') },
    700: { normal: () => import('@fontsource/jetbrains-mono/700.css'), italic: () => import('@fontsource/jetbrains-mono/700-italic.css') },
  },
  'noto-sans-coptic': {
    400: { normal: () => import('@fontsource/noto-sans-coptic/coptic-400.css') },
  },
  'ibm-plex-serif': {
    400: { normal: () => import('@fontsource/ibm-plex-serif/400.css'), italic: () => import('@fontsource/ibm-plex-serif/400-italic.css') },
    500: { normal: () => import('@fontsource/ibm-plex-serif/500.css'), italic: () => import('@fontsource/ibm-plex-serif/500-italic.css') },
    600: { normal: () => import('@fontsource/ibm-plex-serif/600.css'), italic: () => import('@fontsource/ibm-plex-serif/600-italic.css') },
    700: { normal: () => import('@fontsource/ibm-plex-serif/700.css'), italic: () => import('@fontsource/ibm-plex-serif/700-italic.css') },
  },
  anton: { 400: { normal: () => import('@fontsource/anton/400.css') } },
  'marhey': { 400: { normal: () => import('@fontsource/marhey/400.css') }, 500: { normal: () => import('@fontsource/marhey/500.css') }, 600: { normal: () => import('@fontsource/marhey/600.css') }, 700: { normal: () => import('@fontsource/marhey/700.css') } },
  'noto-naskh-arabic': { 400: { normal: () => import('@fontsource/noto-naskh-arabic/400.css') }, 500: { normal: () => import('@fontsource/noto-naskh-arabic/500.css') }, 600: { normal: () => import('@fontsource/noto-naskh-arabic/600.css') }, 700: { normal: () => import('@fontsource/noto-naskh-arabic/700.css') } },
  'amiri': { 400: { normal: () => import('@fontsource/amiri/400.css') }, 700: { normal: () => import('@fontsource/amiri/700.css') } },
  'markazi-text': { 400: { normal: () => import('@fontsource/markazi-text/400.css') }, 500: { normal: () => import('@fontsource/markazi-text/500.css') }, 600: { normal: () => import('@fontsource/markazi-text/600.css') }, 700: { normal: () => import('@fontsource/markazi-text/700.css') } },
  'el-messiri': { 400: { normal: () => import('@fontsource/el-messiri/400.css') }, 500: { normal: () => import('@fontsource/el-messiri/500.css') }, 600: { normal: () => import('@fontsource/el-messiri/600.css') }, 700: { normal: () => import('@fontsource/el-messiri/700.css') } },
  'scheherazade-new': { 400: { normal: () => import('@fontsource/scheherazade-new/400.css') }, 500: { normal: () => import('@fontsource/scheherazade-new/500.css') }, 600: { normal: () => import('@fontsource/scheherazade-new/600.css') }, 700: { normal: () => import('@fontsource/scheherazade-new/700.css') } },
  'harmattan': { 400: { normal: () => import('@fontsource/harmattan/400.css') }, 500: { normal: () => import('@fontsource/harmattan/500.css') }, 600: { normal: () => import('@fontsource/harmattan/600.css') }, 700: { normal: () => import('@fontsource/harmattan/700.css') } },
  'aref-ruqaa': { 400: { normal: () => import('@fontsource/aref-ruqaa/400.css') }, 700: { normal: () => import('@fontsource/aref-ruqaa/700.css') } },
  'rakkas': { 400: { normal: () => import('@fontsource/rakkas/400.css') } },
  'lalezar': { 400: { normal: () => import('@fontsource/lalezar/400.css') } },
  'lemonada': { 400: { normal: () => import('@fontsource/lemonada/400.css') }, 500: { normal: () => import('@fontsource/lemonada/500.css') }, 600: { normal: () => import('@fontsource/lemonada/600.css') }, 700: { normal: () => import('@fontsource/lemonada/700.css') } },
  'changa': { 400: { normal: () => import('@fontsource/changa/400.css') }, 500: { normal: () => import('@fontsource/changa/500.css') }, 600: { normal: () => import('@fontsource/changa/600.css') }, 700: { normal: () => import('@fontsource/changa/700.css') } },
  'reem-kufi': { 400: { normal: () => import('@fontsource/reem-kufi/400.css') }, 500: { normal: () => import('@fontsource/reem-kufi/500.css') }, 600: { normal: () => import('@fontsource/reem-kufi/600.css') }, 700: { normal: () => import('@fontsource/reem-kufi/700.css') } },
  'vazirmatn': { 400: { normal: () => import('@fontsource/vazirmatn/400.css') }, 500: { normal: () => import('@fontsource/vazirmatn/500.css') }, 600: { normal: () => import('@fontsource/vazirmatn/600.css') }, 700: { normal: () => import('@fontsource/vazirmatn/700.css') } },
};

const pendingLoads = new Map<string, Promise<unknown>>();

export async function loadFont(id: FontId, weight: number, style: FontStyle = 'normal'): Promise<void> {
  const font = FONT_REGISTRY[id];
  if (!(font.weights as readonly number[]).includes(weight)) {
    throw new Error(`Font ${id} does not include weight ${weight}`);
  }

  if (!font.styles.includes(style)) throw new Error(`Font ${id} does not include style ${style}`);
  const loader = FONT_LOADERS[id][weight as FontWeight]?.[style];
  if (!loader) throw new Error(`No bundled CSS loader for ${id} weight ${weight} ${style}`);

  const cacheKey = `${id}:${weight}:${style}`;
  let load = pendingLoads.get(cacheKey);
  if (!load) {
    load = loader();
    pendingLoads.set(cacheKey, load);
    load.catch(() => pendingLoads.delete(cacheKey));
  }
  await load;
}

export async function loadFontForScript(script: FontScript): Promise<void> {
  const preferredFont: Record<FontScript, FontId> = {
    latin: 'ibm-plex-sans',
    arabic: 'ibm-plex-sans-arabic',
    coptic: 'noto-sans-coptic',
  };
  const id = preferredFont[script];
  const font = FONT_REGISTRY[id];
  await Promise.all(font.weights.map(async (weight) => {
    await loadFont(id, weight);
    if (typeof document !== 'undefined' && document.fonts?.load) {
      const sample = script === 'arabic' ? 'العربية' : script === 'coptic' ? 'Ϣⲉⲛⲟⲩϩ' : 'SlideThread';
      await document.fonts.load(`normal ${weight} 16px "${font.family}"`, sample);
    }
  }));
}

export function resetFontLoaderCacheForTests(): void {
  pendingLoads.clear();
}
