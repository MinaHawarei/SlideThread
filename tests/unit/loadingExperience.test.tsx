import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { LoadingScreen } from '../../src/ui/brand/LoadingScreen';
import { LogoMark } from '../../src/ui/brand/LogoMark';
import { useDelayedLoading } from '../../src/ui/common/useDelayedLoading';
import { useI18nStore } from '../../src/i18n';

describe('Loading Experience & LogoMark (R7 & Logo Integration)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useI18nStore.getState().setLocale('en');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders LoadingScreen with role="status", enlarged animated LogoMark and translated text', () => {
    const { container } = render(<LoadingScreen />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('Opening your studio…');
    expect(screen.getByTestId('app-loading-screen')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '128');
    expect(svg).toHaveAttribute('height', '128');
    expect(svg).toHaveClass('animate-pulse');
  });

  it('renders LoadingScreen in Arabic with translated status', () => {
    act(() => {
      useI18nStore.getState().setLocale('ar');
    });
    render(<LoadingScreen />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('جارٍ فتح الاستوديو…');
  });

  it('renders LogoMark inline SVG with valid structure and sizes', () => {
    const { container } = render(<LogoMark size={32} animated />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('animate-pulse');
  });

  it('useDelayedLoading ignores fast operations (<180ms) to avoid flicker', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoading(loading, { delayMs: 180, minDurationMs: 300 }),
      { initialProps: { loading: true } }
    );

    // Right after starting, should NOT show yet
    expect(result.current).toBe(false);

    // Advance 100ms (still < 180ms)
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);

    // Finish operation before 180ms
    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);
  });

  it('useDelayedLoading enforces minDuration (>=300ms) once shown to avoid flash', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useDelayedLoading(loading, { delayMs: 180, minDurationMs: 300 }),
      { initialProps: { loading: true } }
    );

    // Advance past delay
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(true);

    // Stop loading immediately
    rerender({ loading: false });

    // After 100ms, should STILL show to respect 300ms minimum display
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(true);

    // After remaining 200ms (total 300ms), should hide
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(false);
  });
});
