import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroCarousel } from '../../src/ui/start/HeroCarousel';
import { useI18nStore } from '../../src/i18n';
import type { Project } from '../../src/core/schema';

describe('HeroCarousel component', () => {
  beforeEach(() => {
    useI18nStore.getState().setLocale('en');
  });

  it('renders hero carousel with stage, dots, and navigation buttons', () => {
    render(<HeroCarousel />);

    expect(screen.getByTestId('hero-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('hero-slide-stage')).toBeInTheDocument();
    expect(screen.getByTestId('hero-prev-btn')).toBeInTheDocument();
    expect(screen.getByTestId('hero-next-btn')).toBeInTheDocument();
    expect(screen.getByTestId('hero-dots')).toBeInTheDocument();
  });

  it('navigates next and previous slides correctly', () => {
    render(<HeroCarousel />);

    // Initial badge indicates 1 / 9
    expect(screen.getByText('1 / 9')).toBeInTheDocument();

    // Click next
    fireEvent.click(screen.getByTestId('hero-next-btn'));
    expect(screen.getByText('2 / 9')).toBeInTheDocument();

    // Click next again
    fireEvent.click(screen.getByTestId('hero-next-btn'));
    expect(screen.getByText('3 / 9')).toBeInTheDocument();

    // Click prev
    fireEvent.click(screen.getByTestId('hero-prev-btn'));
    expect(screen.getByText('2 / 9')).toBeInTheDocument();

    // Click prev back to 1
    fireEvent.click(screen.getByTestId('hero-prev-btn'));
    expect(screen.getByText('1 / 9')).toBeInTheDocument();

    // Wrap around backward to 9
    fireEvent.click(screen.getByTestId('hero-prev-btn'));
    expect(screen.getByText('9 / 9')).toBeInTheDocument();
  });

  it('jumps to slide when dot indicator is clicked', () => {
    render(<HeroCarousel />);

    // Click dot 4 (0-indexed dot-3)
    fireEvent.click(screen.getByTestId('hero-dot-3'));
    expect(screen.getByText('4 / 9')).toBeInTheDocument();

    // Click dot 1 (0-indexed dot-0)
    fireEvent.click(screen.getByTestId('hero-dot-0'));
    expect(screen.getByText('1 / 9')).toBeInTheDocument();
  });

  it('calls onOpenProject with demo project when stage is clicked', () => {
    const handleOpenProject = vi.fn();
    render(<HeroCarousel onOpenProject={handleOpenProject} />);

    fireEvent.click(screen.getByTestId('hero-slide-stage'));
    expect(handleOpenProject).toHaveBeenCalledTimes(1);

    const opened = handleOpenProject.mock.calls[0]![0] as Project;
    expect(opened.title).toBe('Modern Frontend Architecture');
    expect(opened.slides.length).toBe(9);
  });

  it('switches to Arabic demo project when locale is Arabic', () => {
    useI18nStore.getState().setLocale('ar');
    const handleOpenProject = vi.fn();
    render(<HeroCarousel onOpenProject={handleOpenProject} />);

    fireEvent.click(screen.getByTestId('hero-slide-stage'));
    expect(handleOpenProject).toHaveBeenCalledTimes(1);

    const opened = handleOpenProject.mock.calls[0]![0] as Project;
    expect(opened.title).toBe('أنظمة التصميم والواجهات الحديثة');
    expect(opened.textDir).toBe('rtl');
  });
});
