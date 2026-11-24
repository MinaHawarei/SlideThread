import { sanitizeSvg } from '../templates/security/sanitizers';
import type { AssetPack, AssetItem } from './types';
import iconsPackJson from '../../assets/packs/icons/pack.json';

// Eagerly bundle starter icons for zero-latency DOM render & export capture
const rawIconSvgs = import.meta.glob<string>('../../assets/packs/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const ICONS_PACK = iconsPackJson as unknown as AssetPack;
export const ICONS_ITEMS: readonly AssetItem[] = ICONS_PACK.items;

const iconsSvgCache: Record<string, string> = {};

for (const [path, raw] of Object.entries(rawIconSvgs)) {
  const filename = path.split('/').pop() ?? '';
  const id = filename.replace(/\.svg$/, '');
  iconsSvgCache[id] = sanitizeSvg(raw);
}

/**
 * Synchronous icon SVG getter.
 */
export function getIconSvg(id: string): string | undefined {
  return iconsSvgCache[id];
}

/**
 * Synchronous icon item metadata getter.
 */
export function getIconItem(id: string): AssetItem | undefined {
  return ICONS_ITEMS.find((item) => item.id === id);
}

/**
 * List all available starter icons.
 */
export function getAllIcons(): readonly AssetItem[] {
  return ICONS_ITEMS;
}

