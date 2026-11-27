import type { FormatDef, Orientation, AspectClass } from './schema';

export type FormatId = 'r_4_5' | 'r_1_1' | 'r_9_16' | 'r_16_9';

export interface FormatEntry extends FormatDef {
  id: string;
  aspectRatio: string;
}

/** Custom canvas size limits in px. Proposed limits; the export path is exercised at both edges in tests. */
export const CUSTOM_SIZE_MIN = 200;
export const CUSTOM_SIZE_MAX = 4096;
const CUSTOM_FORMAT_PATTERN = /^custom_(\d{3,4})x(\d{3,4})$/;

export function isValidCustomSize(width: number, height: number): boolean {
  return Number.isInteger(width) && Number.isInteger(height)
    && width >= CUSTOM_SIZE_MIN && width <= CUSTOM_SIZE_MAX
    && height >= CUSTOM_SIZE_MIN && height <= CUSTOM_SIZE_MAX;
}

/** Format id for a user-entered size, for example custom_1200x628. */
export function customFormatId(width: number, height: number): string {
  return `custom_${Math.round(width)}x${Math.round(height)}`;
}

export function isCustomFormatId(id: string): boolean {
  return CUSTOM_FORMAT_PATTERN.test(id);
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function parseCustomFormat(id: string): FormatEntry | undefined {
  const match = CUSTOM_FORMAT_PATTERN.exec(id);
  if (!match) return undefined;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!isValidCustomSize(width, height)) return undefined;
  const divisor = greatestCommonDivisor(width, height);
  return {
    id,
    label: `Custom ${width} × ${height}`,
    aspectRatio: `${width / divisor}:${height / divisor}`,
    width,
    height,
    orientable: false,
    platforms: ['custom'],
    contentTypes: ['post', 'carousel', 'story'],
  };
}

/**
 * Format registry per Spec §4.1.
 * All export sizes use a short side of 1080 px, exported at 1x.
 * Adding a format requires only one new entry in this registry.
 */
export const FORMAT_REGISTRY: Record<FormatId, FormatEntry> = {
  r_4_5: {
    id: 'r_4_5',
    label: '4:5',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    orientable: true,
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
    label: '9:16',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    orientable: true,
    platforms: ['instagram', 'facebook', 'custom'],
    contentTypes: ['story'],
  },
  r_16_9: {
    id: 'r_16_9',
    label: '16:9',
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
  return FORMAT_REGISTRY[id as FormatId] ?? parseCustomFormat(id);
}

/**
 * Returns canvas dimensions for a format, respecting an explicit orientation for orientable formats (4:5, 9:16, 16:9).
 */
export function getDimensions(
  formatOrId: FormatDef | string,
  orientation?: Orientation
): { width: number; height: number } {
  const format = typeof formatOrId === 'string' ? getFormat(formatOrId) : formatOrId;
  if (!format) {
    throw new Error(`Unknown format: "${formatOrId}"`);
  }

  if (format.orientable && orientation) {
    const longSide = Math.max(format.width, format.height);
    const shortSide = Math.min(format.width, format.height);
    return orientation === 'portrait'
      ? { width: shortSide, height: longSide }
      : { width: longSide, height: shortSide };
  }

  // Without an explicit orientation the registry's own width and height apply.
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
