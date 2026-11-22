import type { PlatformId, ContentType } from './schema';
import { type FormatId, type FormatEntry, getFormat } from './formats';

export interface PlatformDef {
  id: PlatformId;
  label: string;
  supportedContentTypes: ContentType[];
}

export const PLATFORMS: Record<PlatformId, PlatformDef> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    supportedContentTypes: ['post', 'carousel', 'story'],
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    supportedContentTypes: ['post', 'carousel'],
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    supportedContentTypes: ['post', 'carousel', 'story'],
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    supportedContentTypes: ['post', 'carousel', 'story'],
  },
};

export const PLATFORM_LIST: PlatformDef[] = Object.values(PLATFORMS);

/**
 * Format matrix per Spec §4.2:
 * | Platform | post | carousel | story |
 * | Instagram | r_4_5, r_1_1, r_16_9 | r_4_5, r_1_1 | r_9_16 |
 * | LinkedIn | r_1_1, r_4_5, r_16_9 | r_4_5, r_1_1, r_16_9 | not offered |
 * | Facebook | r_4_5, r_1_1, r_16_9 | r_1_1, r_4_5 | r_9_16 |
 * | Custom | any format | any format | r_9_16 |
 */
export const PLATFORM_FORMAT_MATRIX: Record<
  PlatformId,
  Record<ContentType, readonly FormatId[]>
> = {
  instagram: {
    post: ['r_4_5', 'r_1_1', 'r_16_9'],
    carousel: ['r_4_5', 'r_1_1'],
    story: ['r_9_16'],
  },
  linkedin: {
    post: ['r_1_1', 'r_4_5', 'r_16_9'],
    carousel: ['r_4_5', 'r_1_1', 'r_16_9'],
    story: [],
  },
  facebook: {
    post: ['r_4_5', 'r_1_1', 'r_16_9'],
    carousel: ['r_1_1', 'r_4_5'],
    story: ['r_9_16'],
  },
  custom: {
    post: ['r_4_5', 'r_1_1', 'r_9_16', 'r_16_9'],
    carousel: ['r_4_5', 'r_1_1', 'r_9_16', 'r_16_9'],
    story: ['r_9_16'],
  },
};

/**
 * Returns allowed format IDs for the given platform and content type.
 */
export function getAllowedFormatIds(
  platform: PlatformId,
  contentType: ContentType
): readonly FormatId[] {
  return PLATFORM_FORMAT_MATRIX[platform]?.[contentType] ?? [];
}

/**
 * Returns allowed FormatDef instances for the given platform and content type.
 */
export function getAllowedFormats(platform: PlatformId, contentType: ContentType): FormatEntry[] {
  const ids = getAllowedFormatIds(platform, contentType);
  return ids.map((id) => getFormat(id)).filter((f): f is FormatEntry => f !== undefined);
}

/**
 * Checks whether a given format ID is allowed for a platform and content type.
 */
export function isFormatAllowed(
  platform: PlatformId,
  contentType: ContentType,
  formatId: string
): boolean {
  const allowed = getAllowedFormatIds(platform, contentType);
  return allowed.includes(formatId as FormatId);
}

export type RecommendedExportType = 'png' | 'zip' | 'pdf';

/**
 * Recommended export type per Spec §4.2:
 * - LinkedIn carousel -> PDF
 * - Instagram / Facebook / Custom carousel -> PNG ZIP
 * - Any post or story -> PNG
 */
export function getRecommendedExport(
  platform: PlatformId,
  contentType: ContentType
): RecommendedExportType {
  if (contentType === 'carousel') {
    if (platform === 'linkedin') {
      return 'pdf';
    }
    return 'zip';
  }
  return 'png';
}

/**
 * Soft warnings (non-blocking) per Spec §4.2:
 * - Instagram carousel above 20 slides
 * - Any carousel above 30 slides
 */
export function getCarouselSlideLimitWarning(
  platform: PlatformId,
  slideCount: number
): string | null {
  if (slideCount > 30) {
    return `Carousel has ${slideCount} slides (recommended maximum is 30).`;
  }
  if (platform === 'instagram' && slideCount > 20) {
    return `Instagram carousels support up to 20 slides (current: ${slideCount}).`;
  }
  return null;
}
