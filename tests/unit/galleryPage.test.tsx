import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useCreateDialogStore } from '../../src/store/createDialogStore';
import { GalleryPage } from '../../src/gallery/GalleryPage';
import { useI18nStore } from '../../src/i18n';

describe('GalleryPage component (Task R8-2)', () => {
  beforeEach(() => {
    useI18nStore.getState().setLocale('en');
    localStorage.clear();
  });

  it('renders gallery header, search, category chips, and starter template cards', () => {
    render(<GalleryPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Find your first frame/i })).toBeInTheDocument();
    expect(screen.getByTestId('gallery-search')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-template-choices')).toBeInTheDocument();

    const templateCards = screen.getAllByTestId('gallery-template-card');
    expect(templateCards.length).toBeGreaterThanOrEqual(5);
  });

  it('filters templates when searching by name or category', () => {
    render(<GalleryPage />);

    const searchInput = screen.getByTestId('gallery-search');
    fireEvent.change(searchInput, { target: { value: 'Weave' } });

    const cards = screen.getAllByTestId('gallery-template-card');
    expect(cards.length).toBe(1);
    expect(cards[0]).toHaveAttribute('data-template-id', 'tech-mesh');
  });

  it('shows empty state when no templates match search query, and resets on clicking clear filters', () => {
    render(<GalleryPage />);

    const searchInput = screen.getByTestId('gallery-search');
    fireEvent.change(searchInput, { target: { value: 'xyz-no-match-template-string' } });

    expect(screen.getByTestId('gallery-empty-state')).toBeInTheDocument();

    // Click clear filters
    fireEvent.click(screen.getByTestId('clear-filters-btn'));
    expect(screen.queryByTestId('gallery-empty-state')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('gallery-template-card').length).toBeGreaterThanOrEqual(5);
  });

  it('has no brand-preview toggle: templates carry their own colors', () => {
    render(<GalleryPage />);
    expect(screen.queryByTestId('preview-brand-toggle')).not.toBeInTheDocument();
  });

  it('toggles template favorites and filters by favorites only', () => {
    render(<GalleryPage />);

    const favBtn = screen.getByTestId('favorite-tech-mesh');
    expect(favBtn).toHaveAttribute('aria-pressed', 'false');

    // Toggle favorite on
    fireEvent.click(favBtn);
    expect(favBtn).toHaveAttribute('aria-pressed', 'true');

    // Filter by favorites only
    const filterBtn = screen.getByTestId('favorites-filter');
    fireEvent.click(filterBtn);
    expect(filterBtn).toHaveAttribute('aria-pressed', 'true');

    const visibleCards = screen.getAllByTestId('gallery-template-card');
    expect(visibleCards.length).toBe(1);
    expect(visibleCards[0]).toHaveAttribute('data-template-id', 'tech-mesh');
  });

  it('renders simulated states: loading skeleton, empty, and error', () => {
    render(<GalleryPage />);

    // Switch to Loading
    fireEvent.click(screen.getByRole('button', { name: /^loading$/i }));
    expect(screen.getByTestId('gallery-skeleton')).toBeInTheDocument();

    // Switch to Error
    fireEvent.click(screen.getByRole('button', { name: /^error$/i }));
    expect(screen.getByTestId('gallery-error-state')).toBeInTheDocument();

    // Switch to Empty
    fireEvent.click(screen.getByRole('button', { name: /^empty$/i }));
    expect(screen.getByTestId('gallery-empty-state')).toBeInTheDocument();

    // Switch back to Templates
    fireEvent.click(screen.getByRole('button', { name: /^templates$/i }));
    expect(screen.getByTestId('gallery-template-choices')).toBeInTheDocument();
  });

  it('R1: Use opens the create dialog with the template, a card tap only reveals actions, and Preview opens preview', async () => {
    const onNavigate = vi.fn();
    render(<GalleryPage onNavigate={onNavigate} />);

    const techMeshCard = screen.getAllByTestId('gallery-template-card').find(
      (c) => c.getAttribute('data-template-id') === 'tech-mesh'
    )!;
    // Tapping the card only reveals the overlay. It never navigates or opens the dialog.
    expect(techMeshCard).toHaveAttribute('data-active', 'false');
    fireEvent.click(techMeshCard);
    expect(techMeshCard).toHaveAttribute('data-active', 'true');
    expect(onNavigate).not.toHaveBeenCalled();
    expect(useCreateDialogStore.getState().open).toBe(false);

    fireEvent.click(screen.getByTestId('use-template-tech-mesh'));
    expect(useCreateDialogStore.getState().open).toBe(true);
    expect(useCreateDialogStore.getState().request.templateId).toBe('tech-mesh');
    expect(onNavigate).not.toHaveBeenCalled();

    // Click the Preview button specifically
    const previewBtn = screen.getByTestId('preview-template-tech-mesh');
    expect(previewBtn).toHaveTextContent('Preview');
    fireEvent.click(previewBtn);
    expect(onNavigate).toHaveBeenCalledWith('/preview?template=tech-mesh');

    // In Arabic
    act(() => {
      useI18nStore.getState().setLocale('ar');
    });
    expect(screen.getByTestId('preview-template-tech-mesh')).toHaveTextContent('معاينة');
  });
});
