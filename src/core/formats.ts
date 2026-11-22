import type { FormatDef, Orientation, AspectClass } from './schema';

export type FormatId = 'r_4_5' | 'r_1_1' | 'r_9_16' | 'r_16_9';

export interface FormatEntry extends FormatDef {
  id: FormatId;
  aspectRatio: string;
}

/**
 * Format registry per Spec §4.1.
 * All export sizes use a short side of 1080 px, exported at 1x.
 * Adding a format requires only one new entry in this registry.
 */
export const FORMAT_REGISTRY: Record<FormatId, FormatEntry> = {
  r_4_5: {
    id: 'r_4_5',
    label: '4:5 Portrait',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    orientable: false,
    platforms: ['instagram', 'linkedin', 'facebook', 'custom'],
    contentTypes: ['post', 'carousel'],
  },
  r_1_1: {
    id: 'r_1_1',
    label: '1:1 Square',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    orientable: false,
    platforms: ['instagram', 'linkedin', 'facebook', 'custom'],
    contentTypes: ['post', 'carousel'],
  },
  r_9_16: {
    id: 'r_9_16',
    label: '9:16 Story',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    orientable: false,
    platforms: ['instagram', 'facebook', 'custom'],
    contentTypes: ['story'],
  },
  r_16_9: {
    id: 'r_16_9',
    label: '16:9 Landscape / Portrait',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    orientable: true,
    platforms: ['instagram', 'linkedin', 'facebook', 'custom'],
    contentTypes: ['post', 'carousel'],
  },
};

export const FORMAT_LIST: FormatEntry[] = Object.values(FORMAT_REGISTRY);

export function getFormat(id: string): FormatEntry | undefined {
  return FORMAT_REGISTRY[id as FormatId];
}

/**
 * Returns canvas dimensions for a format, respecting orientation for orientable formats (16:9).
 */
export function getDimensions(
  formatOrId: FormatDef | string,
  orientation?: Orientation
): { width: number; height: number } {
  const format = typeof formatOrId === 'string' ? getFormat(formatOrId) : formatOrId;
  if (!format) {
    throw new Error(`Unknown format: "${formatOrId}"`);
  }

  if (format.orientable) {
    if (orientation === 'portrait') {
      return {
        width: Math.min(format.width, format.height),
        height: Math.max(format.width, format.height),
      };
    }
    // Default or landscape: 1920x1080
    return {
      width: Math.max(format.width, format.height),
      height: Math.min(format.width, format.height),
    };
  }

  return { width: format.width, height: format.height };
}

/**
 * Categorizes canvas dimensions into one of the 4 aspect classes per Spec §5.2:
 * - landscape: width / height > 1.2
 * - square: 0.9 <= width / height <= 1.2
 * - portrait: 0.65 <= width / height < 0.9
 * - tall: width / height < 0.65 (e.g. 9:16 = 0.5625)
 */
export function aspectClass(width: number, height: number): AspectClass {
  if (height <= 0 || width <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    return 'square';
  }
  const ratio = width / height;
  if (ratio > 1.2) {
    return 'landscape';
  }
  if (ratio >= 0.9) {
    return 'square';
  }
  if (ratio >= 0.65) {
    return 'portrait';
  }
  return 'tall';
}

/**
 * Convenience helper to get the aspectClass directly for a format and orientation.
 */
export function getAspectClassForFormat(
  formatOrId: FormatDef | string,
  orientation?: Orientation
): AspectClass {
  const { width, height } = getDimensions(formatOrId, orientation);
  return aspectClass(width, height);
}
