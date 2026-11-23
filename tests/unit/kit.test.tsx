import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { KitPage } from '../../src/ui/kit/KitPage';
import { useI18nStore } from '../../src/i18n';

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserverMock implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

describe('Atelier component kit', () => {
  it('renders and switches theme and text direction', () => {
    useI18nStore.getState().setLocale('en');
    render(<KitPage />);
    const page = screen.getByRole('main').parentElement!;
    expect(screen.getByRole('heading', { name: /thoughtful toolkit/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }));
    fireEvent.click(screen.getByRole('button', { name: 'RTL' }));
    expect(page).toHaveAttribute('data-theme', 'dark');
    expect(page).toHaveAttribute('dir', 'rtl');
  });

  it('opens the dialog, changes tabs, and presents a toast', async () => {
    useI18nStore.getState().setLocale('en');
    render(<KitPage />);
    expect(screen.getByRole('tab', { name: 'Content' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Show notice' }));
    expect(await screen.findByText('Saved to your studio')).toBeVisible();
  });
});
