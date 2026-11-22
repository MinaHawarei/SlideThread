import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EditorMobile } from '../../src/ui/editor/EditorMobile';
import { MobileThumbnailStrip } from '../../src/ui/editor/MobileThumbnailStrip';
import { useProjectStore } from '../../src/store/projectStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getDemoProjectEn } from '../../src/store/seedProjects';

describe('Editor Mobile Layout (Spec §10.2, Task P3-6)', () => {
  beforeEach(() => {
    // Reset stores with a fresh demo project
    const demo = getDemoProjectEn();
    useProjectStore.getState().setProject(demo);
    useSettingsStore.getState().resetSettings();
  });

  it('renders top navigation header with home button, project title, and bottom tabs', () => {
    render(<EditorMobile onHome={vi.fn()} />);

    expect(screen.getByTestId('editor-mobile')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-editor-home-btn')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-editor-project-title')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-bottom-tabs')).toBeInTheDocument();

    // 4 tabs per Spec §10.2
    expect(screen.getByTestId('mobile-tab-slides')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-edit')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-design')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-export')).toBeInTheDocument();
  });

  it('updates project title when edited in mobile header', () => {
    render(<EditorMobile />);
    const titleInput = screen.getByTestId('mobile-editor-project-title') as HTMLInputElement;

    fireEvent.change(titleInput, { target: { value: 'My Mobile Presentation' } });

    expect(useProjectStore.getState().project.title).toBe('My Mobile Presentation');
  });

  it('renders horizontal thumbnail strip with slides and active slide indicator', () => {
    render(<EditorMobile />);

    expect(screen.getByTestId('mobile-thumbnail-strip')).toBeInTheDocument();

    const slides = useProjectStore.getState().project.slides;
    expect(slides.length).toBeGreaterThanOrEqual(2);

    // First slide thumbnail exists
    const firstThumb = screen.getByTestId(`mobile-thumb-${slides[0]!.id}`);
    expect(firstThumb).toBeInTheDocument();

    // Tapping second thumbnail selects it
    const secondThumb = screen.getByTestId(`mobile-thumb-${slides[1]!.id}`);
    fireEvent.click(secondThumb);

    expect(useProjectStore.getState().activeSlideId).toBe(slides[1]!.id);
  });

  it('navigates slides using floating bottom canvas navigation buttons', () => {
    render(<EditorMobile />);
    const slides = useProjectStore.getState().project.slides;

    // Initially at slide 0
    expect(useProjectStore.getState().activeSlideId).toBe(slides[0]!.id);

    // Next slide button advances to slide 1
    const nextBtn = screen.getByTestId('mobile-next-slide-btn');
    fireEvent.click(nextBtn);
    expect(useProjectStore.getState().activeSlideId).toBe(slides[1]!.id);

    // Prev slide button returns to slide 0
    const prevBtn = screen.getByTestId('mobile-prev-slide-btn');
    fireEvent.click(prevBtn);
    expect(useProjectStore.getState().activeSlideId).toBe(slides[0]!.id);
  });

  it('navigates slides on horizontal touch swipe gesture', () => {
    render(<EditorMobile />);
    const canvas = screen.getByTestId('mobile-canvas');
    const slides = useProjectStore.getState().project.slides;

    expect(useProjectStore.getState().activeSlideId).toBe(slides[0]!.id);

    // Swipe left (finger moves from clientX: 250 to clientX: 100) -> Next slide
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 250, clientY: 300 }],
    });
    fireEvent.touchEnd(canvas, {
      changedTouches: [{ clientX: 100, clientY: 300 }],
    });

    expect(useProjectStore.getState().activeSlideId).toBe(slides[1]!.id);

    // Swipe right (finger moves from clientX: 100 to clientX: 250) -> Prev slide
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 100, clientY: 300 }],
    });
    fireEvent.touchEnd(canvas, {
      changedTouches: [{ clientX: 250, clientY: 300 }],
    });

    expect(useProjectStore.getState().activeSlideId).toBe(slides[0]!.id);
  });

  it('opens bottom-sheet inspector when Edit tab is clicked, and closes on backdrop click', () => {
    render(<EditorMobile />);

    // Initially bottom sheet is closed
    expect(screen.queryByTestId('mobile-bottom-sheet')).not.toBeInTheDocument();

    // Click Edit tab
    fireEvent.click(screen.getByTestId('mobile-tab-edit'));

    // Bottom sheet is now open and contains SlideInspector
    expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('slide-inspector')).toBeInTheDocument();

    // Click backdrop to close
    fireEvent.click(screen.getByTestId('mobile-bottom-sheet-backdrop'));
    expect(screen.queryByTestId('mobile-bottom-sheet')).not.toBeInTheDocument();
  });

  it('opens bottom-sheet inspector when Design tab is clicked, with subtab toggle for Design/Brand', () => {
    render(<EditorMobile />);

    // Click Design tab
    fireEvent.click(screen.getByTestId('mobile-tab-design'));

    expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('design-inspector')).toBeInTheDocument();

    // Switch to Brand subtab
    const brandSubtab = screen.getByTestId('mobile-design-subtab-brand');
    fireEvent.click(brandSubtab);

    expect(screen.getByTestId('brand-inspector')).toBeInTheDocument();

    // Close button closes sheet
    const closeBtn = screen.getByTestId('mobile-sheet-close-btn');
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('mobile-bottom-sheet')).not.toBeInTheDocument();
  });

  it('opens export sheet and calls onOpenExport', () => {
    const onOpenExport = vi.fn();
    render(<EditorMobile onOpenExport={onOpenExport} />);

    fireEvent.click(screen.getByTestId('mobile-tab-export'));

    expect(screen.getByTestId('mobile-export-sheet')).toBeInTheDocument();

    const startExportBtn = screen.getByTestId('mobile-start-export-btn');
    fireEvent.click(startExportBtn);

    expect(onOpenExport).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('mobile-bottom-sheet')).not.toBeInTheDocument();
  });

  it('allows adding, duplicating, deleting, and reordering slides in MobileThumbnailStrip', () => {
    render(<MobileThumbnailStrip />);
    const initialCount = useProjectStore.getState().project.slides.length;

    // Add slide
    const addBtn = screen.getByTestId('mobile-add-slide-btn');
    fireEvent.click(addBtn);
    expect(useProjectStore.getState().project.slides.length).toBe(initialCount + 1);

    // Duplicate active slide
    const dupBtn = screen.getByTestId('mobile-duplicate-slide-btn');
    fireEvent.click(dupBtn);
    expect(useProjectStore.getState().project.slides.length).toBe(initialCount + 2);

    // Delete slide
    const delBtn = screen.getByTestId('mobile-delete-slide-btn');
    fireEvent.click(delBtn);
    expect(useProjectStore.getState().project.slides.length).toBe(initialCount + 1);

    // Reorder earlier
    const moveEarlierBtn = screen.getByTestId('mobile-move-earlier-btn');
    fireEvent.click(moveEarlierBtn);
  });

  it('hides add and duplicate buttons for single-slide posts per Spec §4.4', () => {
    act(() => {
      useProjectStore.getState().updateProjectMeta({ contentType: 'post' });
    });

    render(<MobileThumbnailStrip />);

    expect(screen.queryByTestId('mobile-add-slide-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-duplicate-slide-btn')).not.toBeInTheDocument();
  });

  it('enforces touch targets >= 44px on tabs and buttons', () => {
    render(<EditorMobile />);

    // Bottom tabs have min-h-[44px] and min-w-[44px]
    const tabs = [
      screen.getByTestId('mobile-tab-slides'),
      screen.getByTestId('mobile-tab-edit'),
      screen.getByTestId('mobile-tab-design'),
      screen.getByTestId('mobile-tab-export'),
    ];

    for (const tab of tabs) {
      expect(tab).toHaveClass('min-h-[44px]');
      expect(tab).toHaveClass('min-w-[44px]');
    }

    // Navigation buttons have min-h-[44px] and min-w-[44px]
    expect(screen.getByTestId('mobile-prev-slide-btn')).toHaveClass('min-h-[44px]');
    expect(screen.getByTestId('mobile-prev-slide-btn')).toHaveClass('min-w-[44px]');
    expect(screen.getByTestId('mobile-next-slide-btn')).toHaveClass('min-h-[44px]');
    expect(screen.getByTestId('mobile-next-slide-btn')).toHaveClass('min-w-[44px]');
  });

  it('renders story safe zones toggle button on 9:16 story formats', () => {
    act(() => {
      useProjectStore.getState().updateProjectMeta({
        contentType: 'story',
        formatId: 'r_9_16',
      });
    });

    render(<EditorMobile />);

    const safeZonesBtn = screen.getByTestId('mobile-safe-zones-btn');
    expect(safeZonesBtn).toBeInTheDocument();

    fireEvent.click(safeZonesBtn);
    expect(safeZonesBtn).toHaveClass('border-red-500');
  });

  it('renders cleanly in 360x640 and 390x844 viewports', () => {
    // Test 360x640
    const { container, rerender } = render(
      <div style={{ width: '360px', height: '640px' }}>
        <EditorMobile />
      </div>
    );
    expect(screen.getByTestId('editor-mobile')).toBeInTheDocument();

    // Test 390x844
    rerender(
      <div style={{ width: '390px', height: '844px' }}>
        <EditorMobile />
      </div>
    );
    expect(screen.getByTestId('editor-mobile')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="mobile-canvas"]')).toBeInTheDocument();
  });
});
