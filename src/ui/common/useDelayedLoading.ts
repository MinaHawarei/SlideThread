import { useState, useEffect, useRef } from 'react';

export interface DelayedLoadingOptions {
  delayMs?: number;
  minDurationMs?: number;
}

/**
 * Hook for smooth, flicker-free loading states (R7):
 * - If operation takes < delayMs (default 180ms), does not show loader at all.
 * - Once shown, remains visible for at least minDurationMs (default 300ms) to prevent jarring flashes.
 */
export function useDelayedLoading(
  isLoading: boolean,
  options: DelayedLoadingOptions = {}
): boolean {
  const { delayMs = 180, minDurationMs = 300 } = options;
  const [shouldShow, setShouldShow] = useState(false);
  const showStartTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start delayed trigger
      timerRef.current = setTimeout(() => {
        showStartTimeRef.current = Date.now();
        setShouldShow(true);
      }, delayMs);
    } else {
      // Clear pending delay timer if finished before delayMs
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (showStartTimeRef.current !== null) {
        // Enforce minDurationMs
        const elapsed = Date.now() - showStartTimeRef.current;
        const remaining = Math.max(0, minDurationMs - elapsed);

        if (remaining > 0) {
          const timeout = setTimeout(() => {
            setShouldShow(false);
            showStartTimeRef.current = null;
          }, remaining);
          return () => clearTimeout(timeout);
        } else {
          setShouldShow(false);
          showStartTimeRef.current = null;
        }
      } else {
        setShouldShow(false);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isLoading, delayMs, minDurationMs]);

  return shouldShow;
}
