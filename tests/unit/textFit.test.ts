import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  calculateFitScale,
  fitElement,
  fitAllTextInRoot,
  useFitText,
  DEFAULT_MIN_SCALE,
} from '../../src/core/textFit';

describe('Text Fit Math (calculateFitScale per Spec §5.3)', () => {
  it('returns scale 1.0 and isOverflow false when text fits within container', () => {
    const measurer = vi.fn().mockReturnValue({ width: 500, height: 200 });
    const result = calculateFitScale(800, 400, measurer);

    expect(result).toEqual({ scale: 1.0, isOverflow: false });
    expect(measurer).toHaveBeenCalledTimes(1);
    expect(measurer).toHaveBeenCalledWith(1.0);
  });

  it('scales down until content fits container', () => {
    // Content width is 1000 * scale, height is 300 * scale.
    // Container available width is 800, height is 400.
    // At scale 1.0: width 1000 > 800 (overflows).
    // At scale 0.95: width 950 > 800 (overflows).
    // At scale 0.8: width 800 <= 800 (fits).
    const measurer = vi.fn((scale: number) => ({
      width: Math.round(1000 * scale),
      height: Math.round(300 * scale),
    }));

    const result = calculateFitScale(800, 400, measurer);
    expect(result.scale).toBe(0.8);
    expect(result.isOverflow).toBe(false);
  });

  it('clamps to minScale (0.6) and sets isOverflow true if text still overflows at minScale', () => {
    // Even at scale 0.6, width is 900 > 500
    const measurer = vi.fn((scale: number) => ({
      width: Math.round(1500 * scale),
      height: Math.round(400 * scale),
    }));

    const result = calculateFitScale(500, 300, measurer);
    expect(result.scale).toBe(DEFAULT_MIN_SCALE);
    expect(result.isOverflow).toBe(true);
  });

  it('respects custom minScale and step options', () => {
    const measurer = vi.fn((scale: number) => ({
      width: Math.round(1000 * scale),
      height: 100,
    }));

    const result = calculateFitScale(750, 200, measurer, {
      minScale: 0.5,
      step: 0.1,
    });

    // 1.0 -> 1000 (no)
    // 0.9 -> 900 (no)
    // 0.8 -> 800 (no)
    // 0.7 -> 700 (fits!)
    expect(result.scale).toBe(0.7);
    expect(result.isOverflow).toBe(false);
  });

  it('is completely deterministic across repeated evaluations', () => {
    const measurer = (scale: number) => ({
      width: 1200 * scale,
      height: 250 * scale,
    });

    const results = Array.from({ length: 50 }, () =>
      calculateFitScale(900, 300, measurer)
    );

    const first = results[0];
    expect(first).toBeDefined();
    for (const res of results) {
      expect(res.scale).toBe(first!.scale);
      expect(res.isOverflow).toBe(first!.isOverflow);
    }
  });

  it('allows subpixel tolerance within 0.5px without scaling down', () => {
    const measurer = vi.fn().mockReturnValue({ width: 500.4, height: 200.3 });
    const result = calculateFitScale(500, 200, measurer);

    expect(result.scale).toBe(1.0);
    expect(result.isOverflow).toBe(false);
  });
});

describe('fitElement DOM helper', () => {
  it('applies fitted font size and attributes to DOM elements', () => {
    const container = document.createElement('div');
    const content = document.createElement('p');
    container.appendChild(content);

    // Mock layout dimensions
    Object.defineProperty(container, 'clientWidth', { value: 600, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true });

    // Mock scrollWidth to scale with font size
    Object.defineProperty(content, 'scrollWidth', {
      get() {
        const fs = parseFloat(content.style.fontSize) || 40;
        return fs > 30 ? 700 : 550;
      },
      configurable: true,
    });
    Object.defineProperty(content, 'scrollHeight', { value: 150, configurable: true });

    const result = fitElement(container, content, { baseFontSize: 40 });

    expect(result.scale).toBeLessThan(1.0);
    expect(content.style.fontSize).toBe(`${40 * result.scale}px`);
    expect(content.dataset.fitScale).toBe(String(result.scale));
    expect(content.dataset.overflow).toBe(String(result.isOverflow));
  });

  it('handles zero container dimensions gracefully without throwing', () => {
    const container = document.createElement('div');
    const content = document.createElement('p');
    container.appendChild(content);

    const result = fitElement(container, content);
    expect(result).toEqual({ scale: 1.0, isOverflow: false });
  });
});

describe('fitAllTextInRoot batch helper', () => {
  it('fits all [data-fit-container] blocks in subtree', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div data-fit-container id="c1">
        <div data-fit-content data-base-font-size="40" id="t1">Title</div>
      </div>
      <div data-fit-container id="c2">
        <div data-fit-content data-base-font-size="28" id="t2">Body</div>
      </div>
    `;

    const c1 = root.querySelector('#c1') as HTMLElement;
    const c2 = root.querySelector('#c2') as HTMLElement;
    Object.defineProperty(c1, 'clientWidth', { value: 500 });
    Object.defineProperty(c1, 'clientHeight', { value: 100 });
    Object.defineProperty(c2, 'clientWidth', { value: 500 });
    Object.defineProperty(c2, 'clientHeight', { value: 100 });

    const results = fitAllTextInRoot(root);
    expect(results.length).toBe(2);
    expect(results[0]?.scale).toBeDefined();
    expect(results[1]?.scale).toBeDefined();
  });
});

describe('useFitText React Hook', () => {
  it('initializes with default scale and exposes refs', () => {
    const { result } = renderHook(() => useFitText());

    expect(result.current.scale).toBe(1.0);
    expect(result.current.isOverflow).toBe(false);
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.contentRef).toBeDefined();
    expect(typeof result.current.refit).toBe('function');
  });

  it('refit updates scale based on element dimensions', () => {
    const container = document.createElement('div');
    const content = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 400 });
    Object.defineProperty(container, 'clientHeight', { value: 100 });
    Object.defineProperty(content, 'scrollWidth', {
      get: () => 300,
    });
    Object.defineProperty(content, 'scrollHeight', { value: 50 });

    const { result } = renderHook(() => useFitText({ baseFontSize: 32 }));

    act(() => {
      // Set refs
      (result.current.containerRef as { current: HTMLElement | null }).current = container;
      (result.current.contentRef as { current: HTMLElement | null }).current = content;
      result.current.refit();
    });

    expect(result.current.scale).toBe(1.0);
    expect(result.current.isOverflow).toBe(false);
  });
});
