import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetsPanel } from '../../src/ui/editor/AssetsPanel';
import { useProjectStore } from '../../src/store/projectStore';
import { useSelectionStore } from '../../src/store/selectionStore';
import { useRecentAssetsStore } from '../../src/store/recentAssetsStore';
import { CURRENT_SCHEMA_VERSION } from '../../src/core/schema';

describe('AssetsPanel UI (§5.6, Task R6-5)', () => {
  beforeEach(() => {
    useSelectionStore.getState().selectElement();
    useRecentAssetsStore.getState().clearRecents();

    useProjectStore.setState({
      activeSlideId: 'slide_1',
      project: {
        id: 'proj_assets_test',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        title: 'Assets Test',
        formatId: 'r_4_5',
        orientation: 'portrait',
        contentType: 'carousel',
        platform: 'linkedin',
        templateId: 'clean-minimal',
        primaryColor: '#0891b2',
        theme: 'dark',
        textDir: 'ltr',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        slides: [
          {
            id: 'slide_1',
            type: 'explain',
            fields: {},
            extras: [],
          },
        ],
      },
    });
  });

  it('renders search input, category pills, and full items grid', () => {
    render(<AssetsPanel />);

    expect(screen.getByTestId('assets-panel')).toBeInTheDocument();
    expect(screen.getByTestId('assets-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('asset-categories')).toBeInTheDocument();

    // Verify category pills
    expect(screen.getByTestId('category-all')).toBeInTheDocument();
    expect(screen.getByTestId('category-shapes')).toBeInTheDocument();
    expect(screen.getByTestId('category-icons')).toBeInTheDocument();
    expect(screen.getByTestId('category-emoji')).toBeInTheDocument();
    expect(screen.getByTestId('category-stickers')).toBeInTheDocument();
    expect(screen.getByTestId('category-recents')).toBeInTheDocument();

    // Verify grid is populated
    expect(screen.getByTestId('assets-grid')).toBeInTheDocument();
  });

  it('filters items by category pill', () => {
    render(<AssetsPanel />);

    // Click Emoji category
    fireEvent.click(screen.getByTestId('category-emoji'));

    expect(screen.getByTestId('asset-item-fire')).toBeInTheDocument();
    expect(screen.queryByTestId('asset-item-line-arrow')).not.toBeInTheDocument();

    // Click Shapes category
    fireEvent.click(screen.getByTestId('category-shapes'));
    expect(screen.getByTestId('asset-item-line-arrow')).toBeInTheDocument();
    expect(screen.queryByTestId('asset-item-fire')).not.toBeInTheDocument();
  });

  it('filters items by bilingual search query in English and Arabic', () => {
    render(<AssetsPanel />);

    const searchInput = screen.getByTestId('assets-search-input');

    // Search English tag "rocket"
    fireEvent.change(searchInput, { target: { value: 'rocket' } });
    expect(screen.getByTestId('asset-item-rocket')).toBeInTheDocument();
    expect(screen.queryByTestId('asset-item-fire')).not.toBeInTheDocument();

    // Clear search
    fireEvent.click(screen.getByTestId('clear-search-btn'));

    // Search Arabic tag "نار"
    fireEvent.change(searchInput, { target: { value: 'نار' } });
    expect(screen.getByTestId('asset-item-fire')).toBeInTheDocument();
    expect(screen.queryByTestId('asset-item-rocket')).not.toBeInTheDocument();
  });

  it('click to add creates extra on slide and adds to recents store', () => {
    render(<AssetsPanel />);

    const arrowItem = screen.getByTestId('asset-item-line-arrow');
    fireEvent.click(arrowItem);

    const slide = useProjectStore.getState().project.slides[0]!;
    expect(slide.extras).toHaveLength(1);
    expect(slide.extras![0]!.assetId).toBe('line-arrow');

    // Recent assets store recorded it
    const recents = useRecentAssetsStore.getState().recents;
    expect(recents).toHaveLength(1);
    expect(recents[0]!.assetId).toBe('line-arrow');
    expect(recents[0]!.packId).toBe('shapes');
  });

  it('recents category displays recently added assets with clear action', () => {
    useRecentAssetsStore.getState().addRecent('emoji', 'sparkles');
    useRecentAssetsStore.getState().addRecent('stickers', 'sticker-pro-tip');

    render(<AssetsPanel />);

    // Click recents pill
    fireEvent.click(screen.getByTestId('category-recents'));

    expect(screen.getByTestId('asset-item-sparkles')).toBeInTheDocument();
    expect(screen.getByTestId('asset-item-sticker-pro-tip')).toBeInTheDocument();

    // Click clear recents
    const clearBtn = screen.getByTestId('clear-recents-btn');
    fireEvent.click(clearBtn);

    expect(useRecentAssetsStore.getState().recents).toHaveLength(0);
    expect(screen.getByTestId('assets-empty-state')).toBeInTheDocument();
  });

  it('sets drag dataTransfer for HTML5 drag-and-drop', () => {
    render(<AssetsPanel />);

    const fireItem = screen.getByTestId('asset-item-fire');
    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    };

    fireEvent.dragStart(fireItem, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'application/json',
      JSON.stringify({
        type: 'slidethread-asset',
        packId: 'emoji',
        assetId: 'fire',
      })
    );
  });
});
