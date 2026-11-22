import { useRef, useState, useLayoutEffect, useCallback } from 'react';

export interface FitResult {
  scale: number;
  isOverflow: boolean;
}

export interface FitOptions {
  minScale?: number;
  maxScale?: number;
  step?: number;
  baseFontSize?: number;
}

export interface MeasurerResult {
  width: number;
  height: number;
}

export type Measurer = (scale: number) => MeasurerResult;

export const DEFAULT_MIN_SCALE = 0.6;
export const DEFAULT_MAX_SCALE = 1.0;
export const DEFAULT_FIT_STEP = 0.05;

/**
 * Pure math measurement-and-scale loop per Spec §5.3.
 * Iterates down from maxScale to minScale in deterministic steps.
 * Returns scale and overflow flag (true if text still overflows at minScale).
 */
export function calculateFitScale(
  availableWidth: number,
  availableHeight: number,
  measurer: Measurer,
  options?: FitOptions
): FitResult {
  const minScale = options?.minScale ?? DEFAULT_MIN_SCALE;
  const maxScale = options?.maxScale ?? DEFAULT_MAX_SCALE;
  const step = options?.step ?? DEFAULT_FIT_STEP;

  // First measure at maxScale (1.0)
  const initial = measurer(maxScale);
  // Subpixel tolerance (0.5px) for browser rendering rounding
  if (initial.width <= availableWidth + 0.5 && initial.height <= availableHeight + 0.5) {
    return { scale: maxScale, isOverflow: false };
  }

  // Step down from maxScale towards minScale
  let currentScale = maxScale - step;
  while (currentScale >= minScale - 0.001) {
    const roundedScale = Math.round(currentScale * 1000) / 1000;
    const measured = measurer(roundedScale);
    if (measured.width <= availableWidth + 0.5 && measured.height <= availableHeight + 0.5) {
      return { scale: roundedScale, isOverflow: false };
    }
    currentScale -= step;
  }

  // If it still overflows at minScale, clamp to minScale with isOverflow: true
  return { scale: minScale, isOverflow: true };
}

/**
 * Synchronously measures and fits a content element inside its container.
 * Callable from export pipeline before capture.
 */
export function fitElement(
  container: HTMLElement,
  content: HTMLElement,
  options?: FitOptions
): FitResult {
  const availableWidth = container.clientWidth || container.offsetWidth;
  const availableHeight = container.clientHeight || container.offsetHeight;

  if (availableWidth <= 0 || availableHeight <= 0) {
    return { scale: 1.0, isOverflow: false };
  }

  const computedFs = parseFloat(window.getComputedStyle(content).fontSize);
  const baseFontSize =
    options?.baseFontSize ??
    (Number.isFinite(computedFs) && computedFs > 0 ? computedFs : 16);

  const measurer: Measurer = (scale: number) => {
    content.style.fontSize = `${baseFontSize * scale}px`;
    return {
      width: content.scrollWidth,
      height: content.scrollHeight,
    };
  };

  const result = calculateFitScale(availableWidth, availableHeight, measurer, options);

  // Apply final fitted size and dataset attributes
  content.style.fontSize = `${baseFontSize * result.scale}px`;
  content.style.setProperty('--fit-scale', String(result.scale));
  content.dataset.fitScale = String(result.scale);
  content.dataset.overflow = String(result.isOverflow);

  return result;
}

/**
 * Synchronously fits all [data-fit-container] blocks within a root DOM subtree.
 * Used before offscreen capture in the export pipeline.
 */
export function fitAllTextInRoot(root: HTMLElement): FitResult[] {
  const containers = root.querySelectorAll<HTMLElement>('[data-fit-container]');
  const results: FitResult[] = [];

  containers.forEach((container) => {
    const content = container.querySelector<HTMLElement>('[data-fit-content]');
    if (content) {
      const baseFsAttr = content.getAttribute('data-base-font-size');
      const baseFontSize = baseFsAttr ? parseFloat(baseFsAttr) : undefined;
      const res = fitElement(container, content, { baseFontSize });
      results.push(res);
    }
  });

  return results;
}

/**
 * React hook for automatic text auto-fit per Spec §5.3.
 */
export function useFitText<
  TContainer extends HTMLElement = HTMLDivElement,
  TContent extends HTMLElement = HTMLDivElement,
>(options?: FitOptions & { deps?: unknown[] }) {
  const containerRef = useRef<TContainer | null>(null);
  const contentRef = useRef<TContent | null>(null);
  const [fit, setFit] = useState<FitResult>({ scale: 1.0, isOverflow: false });

  const minScale = options?.minScale;
  const maxScale = options?.maxScale;
  const step = options?.step;
  const baseFontSize = options?.baseFontSize;

  const refit = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const res = fitElement(containerRef.current, contentRef.current, {
      minScale,
      maxScale,
      step,
      baseFontSize,
    });
    setFit(res);
  }, [minScale, maxScale, step, baseFontSize]);

  useLayoutEffect(() => {
    refit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refit, ...(options?.deps ?? [])]);

  return {
    containerRef,
    contentRef,
    scale: fit.scale,
    isOverflow: fit.isOverflow,
    refit,
  };
}
