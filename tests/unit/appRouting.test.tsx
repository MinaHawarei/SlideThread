import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { App } from '../../src/App';
import { useI18nStore } from '../../src/i18n';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  useI18nStore.getState().setLocale('en');
});

describe('application routes', () => {
  it('loads the localized settings route and exposes primary navigation', async () => {
    window.history.replaceState({}, '', '/settings');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Make it yours' }, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute('href', '/gallery');
  });

  it('uses the Arabic dictionary for the shell route', async () => {
    useI18nStore.getState().setLocale('ar');
    window.history.replaceState({}, '', '/settings');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'اجعله يعبر عنك' }, { timeout: 6000 })).toBeInTheDocument();
    // Layout never mirrors on language switch.
    expect(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).not.toHaveAttribute('dir', 'rtl');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
