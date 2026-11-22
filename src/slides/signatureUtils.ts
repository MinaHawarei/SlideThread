/**
 * Utility functions for SlideThread signature bar and slide counter per Spec §5.5 & §6.2.
 */

/**
 * Formats slide counter with 2-digit zero-padding: e.g. 03/07
 */
export function formatSlideCounter(current: number, total: number): string {
  const currentStr = String(Math.max(1, current)).padStart(2, '0');
  const totalStr = String(Math.max(1, total)).padStart(2, '0');
  return `${currentStr}/${totalStr}`;
}
