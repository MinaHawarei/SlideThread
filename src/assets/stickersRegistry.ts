import { sanitizeSvg } from '../templates/security/sanitizers';
import type { AssetPack, AssetItem } from './types';
import stickersPackJson from '../../assets/packs/stickers/pack.json';

const rawStickersSvgs = import.meta.glob<string>('../../assets/packs/stickers/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const STICKERS_PACK = stickersPackJson as unknown as AssetPack;
export const STICKERS_ITEMS: readonly AssetItem[] = STICKERS_PACK.items;

const stickersSvgCache: Record<string, string> = {};

for (const [path, raw] of Object.entries(rawStickersSvgs)) {
  const filename = path.split('/').pop() ?? '';
  const id = filename.replace(/\.svg$/, '');
  stickersSvgCache[id] = sanitizeSvg(raw);
}

export function getStickerSvg(id: string): string | undefined {
  return stickersSvgCache[id];
}

export function getStickerItem(id: string): AssetItem | undefined {
  return STICKERS_ITEMS.find((item) => item.id === id);
}

export function getAllStickers(): readonly AssetItem[] {
  return STICKERS_ITEMS;
}
