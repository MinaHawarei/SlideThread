import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MobileNavDrawer } from '../../src/ui/common/MobileNavDrawer';
import { useI18nStore } from '../../src/i18n';

describe('MobileNavDrawer component (R6)', () => {
  beforeEach(() => {
    useI18nStore.getState().setLocale('en');
    document.body.style.overflow = '';
  });

  it('renders hamburger button with accessible attributes', () => {
    render(<MobileNavDrawer currentPath="/" />);

    const toggle = screen.getByTestId('mobile-nav-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-label', 'Open navigation menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('mobile-nav-drawer')).not.toBeInTheDocument();
  });

  it('opens drawer on hamburger click, locks scroll, and renders navigation items', () => {
    const onNavigate = vi.fn();
    render(<MobileNavDrawer currentPath="/" onNavigate={onNavigate} />);

    const toggle = screen.getByTestId('mobile-nav-toggle');
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('mobile-nav-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-overlay')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    // Navigation links present
    expect(screen.getByTestId('mobile-drawer-home')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-drawer-gallery')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-drawer-settings')).toBeInTheDocument();

    // Clicking a link navigates and closes drawer
    fireEvent.click(screen.getByTestId('mobile-drawer-gallery'));
    expect(onNavigate).toHaveBeenCalledWith('/gallery');
    expect(screen.queryByTestId('mobile-nav-drawer')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes drawer on Escape key and restores body overflow', () => {
    render(<MobileNavDrawer currentPath="/" />);

    fireEvent.click(screen.getByTestId('mobile-nav-toggle'));
    expect(screen.getByTestId('mobile-nav-drawer')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('mobile-nav-drawer')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes drawer on overlay click', () => {
    render(<MobileNavDrawer currentPath="/" />);

    fireEvent.click(screen.getByTestId('mobile-nav-toggle'));
    expect(screen.getByTestId('mobile-nav-drawer')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mobile-nav-overlay'));
    expect(screen.queryByTestId('mobile-nav-drawer')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('supports Arabic RTL layout and labels', () => {
    act(() => {
      useI18nStore.getState().setLocale('ar');
    });
    render(<MobileNavDrawer currentPath="/" />);

    const toggle = screen.getByTestId('mobile-nav-toggle');
    expect(toggle).toHaveAttribute('aria-label', 'فتح قائمة التنقل');

    fireEvent.click(toggle);
    const drawer = screen.getByTestId('mobile-nav-drawer');
    expect(drawer).toHaveAttribute('dir', 'rtl');
    expect(drawer).toHaveClass('right-0');
  });
});
