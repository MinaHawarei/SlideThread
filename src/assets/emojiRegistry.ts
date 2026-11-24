import { sanitizeSvg } from '../templates/security/sanitizers';
import type { AssetPack, AssetItem } from './types';
import emojiPackJson from '../../assets/packs/emoji/pack.json';

const rawEmojiSvgs = import.meta.glob<string>('../../assets/packs/emoji/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const EMOJI_PACK = emojiPackJson as unknown as AssetPack;
export const EMOJI_ITEMS: readonly AssetItem[] = EMOJI_PACK.items;

const emojiSvgCache: Record<string, string> = {};

for (const [path, raw] of Object.entries(rawEmojiSvgs)) {
  const filename = path.split('/').pop() ?? '';
  const id = filename.replace(/\.svg$/, '');
  emojiSvgCache[id] = sanitizeSvg(raw);
}

export function getEmojiSvg(id: string): string | undefined {
  return emojiSvgCache[id];
}

export function getEmojiItem(id: string): AssetItem | undefined {
  return EMOJI_ITEMS.find((item) => item.id === id);
}

export function getAllEmoji(): readonly AssetItem[] {
  return EMOJI_ITEMS;
}
