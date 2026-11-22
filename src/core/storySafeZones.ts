/**
 * Story safe zone calculations and constants per Spec §5.4.
 *
 * For r_9_16 stories (1080x1920), platform UI elements (profile header, close button,
 * story progress bars at top; reply bar, stickers, like/send buttons at bottom)
 * cover the top ~14% and bottom ~14% of the vertical screen area.
 */

export const STORY_SAFE_ZONE_PERCENT = 0.14; // 14% per Spec §5.4

export interface StorySafeZoneInsets {
  top: number;
  bottom: number;
  safeHeight: number;
  safeTop: number;
  safeBottom: number;
}

/**
 * Calculates the exact pixel insets for story safe zones given canvas height.
 */
export function getStorySafeZoneInsets(height: number): StorySafeZoneInsets {
  const safeInset = Math.round(height * STORY_SAFE_ZONE_PERCENT);
  return {
    top: safeInset,
    bottom: safeInset,
    safeHeight: height - safeInset * 2,
    safeTop: safeInset,
    safeBottom: height - safeInset,
  };
}

/**
 * Checks if a given Y coordinate (and optional height) falls entirely within the safe zone.
 */
export function isWithinStorySafeZone(y: number, elementHeight: number = 0, totalHeight: number = 1920): boolean {
  const insets = getStorySafeZoneInsets(totalHeight);
  return y >= insets.safeTop && y + elementHeight <= insets.safeBottom;
}
