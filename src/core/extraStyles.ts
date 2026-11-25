import type { ExtraElement } from './schema';

/** A stable CSS filter chain. Returning undefined preserves the original image style. */
export function buildExtraImageFilter(filters?: ExtraElement['filters']): string | undefined {
  if (!filters) return undefined;
  const defaults = ['brightness(100%)', 'contrast(100%)', 'saturate(100%)', 'grayscale(0%)', 'blur(0px)'];
  const parts = [
    `brightness(${filters.brightness ?? 100}%)`,
    `contrast(${filters.contrast ?? 100}%)`,
    `saturate(${filters.saturation ?? 100}%)`,
    `grayscale(${filters.grayscale ?? 0}%)`,
    `blur(${filters.blur ?? 0}px)`,
  ];
  return parts.some((part, index) => part !== defaults[index]) ? parts.join(' ') : undefined;
}
