import shapesPackJson from '../../assets/packs/shapes/pack.json';
import type { AssetPack, AssetItem } from './types';
import { sanitizeSvg } from '../templates/security/sanitizers';

// Synchronously eager-load all shapes pack SVGs
const rawSvgMap = import.meta.glob<string>(
  '../../assets/packs/shapes/*.svg',
  { query: '?raw', import: 'default', eager: true }
);

export const SHAPES_PACK: AssetPack = shapesPackJson as AssetPack;
export const SHAPES_ITEMS: AssetItem[] = SHAPES_PACK.items;

const sanitizedSvgCache = new Map<string, string>();

/**
 * Get sanitized SVG content for a given shape item ID
 */
export function getShapeSvg(shapeId: string): string | undefined {
  // Normalize if prefixed with pack id (e.g. "shapes/line-arrow" -> "line-arrow")
  const normalizedId = shapeId.includes('/') ? shapeId.split('/')[1]! : shapeId;

  if (sanitizedSvgCache.has(normalizedId)) {
    return sanitizedSvgCache.get(normalizedId);
  }

  const item = SHAPES_ITEMS.find((i) => i.id === normalizedId);
  if (!item) return undefined;

  const moduleKey = Object.keys(rawSvgMap).find((key) =>
    key.endsWith(`/${item.file}`)
  );

  if (!moduleKey || !rawSvgMap[moduleKey]) return undefined;

  try {
    const rawSvg = rawSvgMap[moduleKey] as string;
    const sanitized = sanitizeSvg(rawSvg);
    sanitizedSvgCache.set(normalizedId, sanitized);
    return sanitized;
  } catch (err) {
    console.warn(`Failed to sanitize SVG for shape '${normalizedId}':`, err);
    return undefined;
  }
}

/**
 * Get item metadata for a shape
 */
export function getShapeItem(shapeId: string): AssetItem | undefined {
  const normalizedId = shapeId.includes('/') ? shapeId.split('/')[1]! : shapeId;
  return SHAPES_ITEMS.find((i) => i.id === normalizedId);
}
