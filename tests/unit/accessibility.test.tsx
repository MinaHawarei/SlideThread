import { plainTextFieldsToRichText } from '../../src/core/schema';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlideRail } from '../../src/ui/editor/SlideRail';
import { MobileThumbnailStrip } from '../../src/ui/editor/MobileThumbnailStrip';
import { MainCanvas } from '../../src/ui/editor/MainCanvas';
import { Inspector } from '../../src/ui/editor/Inspector';
import { EditorMobile } from '../../src/ui/editor/EditorMobile';
import { ChangeFormatDialog } from '../../src/ui/editor/ChangeFormatDialog';
import { MobileBottomSheet } from '../../src/ui/editor/MobileBottomSheet';
import { useProjectStore } from '../../src/store/projectStore';
import type { Project } from '../../src/core/schema';
import fs from 'fs';
import path from 'path';

const makeTestProject = (): Project => ({
  schemaVersion: 2,
  id: 'a11y-test-project',
  title: 'Accessibility Test Project',
  platform: 'linkedin',
  contentType: 'carousel',
  formatId: 'r_4_5',
  orientation: 'portrait',
  templateId: 'network',
  primaryColor: '#0077B5',
  theme: 'dark',
  textDir: 'auto',
  slides: [
    {
      id: 'slide-1',
      type: 'cover',
      fields: plainTextFieldsToRichText({ title: 'First Slide Cover', tag: 'A11Y' }),
    },
    {
      id: 'slide-2',
      type: 'explain',
      fields: plainTextFieldsToRichText({ title: 'Second Slide Explain', body: 'Bullet 1\nBullet 2' }),
    },
    {
      id: 'slide-3',
      type: 'cta',
      fields: plainTextFieldsToRichText({ title: 'Third Slide CTA', action: 'Follow for more' }),
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe('Accessibility Pass (Task P3-10, Spec §10.1)', () => {
  beforeEach(() => {
    useProjectStore.getState().setProject(makeTestProject());
  });

  describe('Global CSS Accessibility: Focus Rings & Reduced Motion', () => {
    it('defines visible focus indicator (:focus-visible) and prefers-reduced-motion media query in index.css', () => {
      const cssPath = path.resolve(__dirname, '../../src/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('prefers-reduced-motion: reduce');
      expect(cssContent).toContain('animation-duration: 0.01ms');
      expect(cssContent).toContain('transition-duration: 0.01ms');
    });
  });

  describe('SlideRail Keyboard Navigation & Reordering', () => {
    it('renders slide thumbnails with role="button", tabIndex=0, and aria-label', () => {
      render(<SlideRail />);

      const slide1 = screen.getByTestId('rail-slide-slide-1');
      expect(slide1).toHaveAttribute('role', 'button');
      expect(slide1).toHaveAttribute('tabIndex', '0');
      expect(slide1).toHaveAttribute('aria-label');
      expect(slide1).toHaveAttribute('aria-current', 'true');
    });

    it('allows selecting a slide using Enter or Space key', () => {
      render(<SlideRail />);

      const slide2 = screen.getByTestId('rail-slide-slide-2');
      fireEvent.keyDown(slide2, { key: 'Enter' });
      expect(useProjectStore.getState().activeSlideId).toBe('slide-2');

      const slide1 = screen.getByTestId('rail-slide-slide-1');
      fireEvent.keyDown(slide1, { key: ' ' });
      expect(useProjectStore.getState().activeSlideId).toBe('slide-1');
    });

    it('reorders slides via keyboard with Alt+ArrowDown and Alt+ArrowUp', () => {
      render(<SlideRail />);

      const slide1 = screen.getByTestId('rail-slide-slide-1');
      // Alt+ArrowDown to move slide-1 down
      fireEvent.keyDown(slide1, { key: 'ArrowDown', altKey: true });

      const slidesAfterDown = useProjectStore.getState().project.slides;
      expect(slidesAfterDown[1]!.id).toBe('slide-1');
      expect(slidesAfterDown[0]!.id).toBe('slide-2');

      // Now move slide-1 back up with Alt+ArrowUp
      const slide1Moved = screen.getByTestId('rail-slide-slide-1');
      fireEvent.keyDown(slide1Moved, { key: 'ArrowUp', altKey: true });

      const slidesAfterUp = useProjectStore.getState().project.slides;
      expect(slidesAfterUp[0]!.id).toBe('slide-1');
      expect(slidesAfterUp[1]!.id).toBe('slide-2');
    });

    it('provides accessible aria-label on all rail action buttons', () => {
      render(<SlideRail />);

      expect(screen.getByTestId('rail-add-slide-btn')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('rail-move-up-slide-2')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('rail-move-down-slide-1')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('rail-duplicate-slide-1')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('rail-delete-slide-1')).toHaveAttribute('aria-label');
    });
  });

  describe('MobileThumbnailStrip Keyboard Reordering & Labels', () => {
    it('reorders slides via keyboard with Alt+ArrowRight and Alt+ArrowLeft', () => {
      render(<MobileThumbnailStrip />);

      const thumb1 = screen.getByTestId('mobile-thumb-slide-1');
      expect(thumb1).toHaveAttribute('role', 'button');
      expect(thumb1).toHaveAttribute('tabIndex', '0');

      // Reorder later via Alt+ArrowRight
      fireEvent.keyDown(thumb1, { key: 'ArrowRight', altKey: true });
      let slides = useProjectStore.getState().project.slides;
      expect(slides[1]!.id).toBe('slide-1');
      expect(slides[0]!.id).toBe('slide-2');

      // Reorder earlier via Alt+ArrowLeft
      const thumb1Moved = screen.getByTestId('mobile-thumb-slide-1');
      fireEvent.keyDown(thumb1Moved, { key: 'ArrowLeft', altKey: true });
      slides = useProjectStore.getState().project.slides;
      expect(slides[0]!.id).toBe('slide-1');
      expect(slides[1]!.id).toBe('slide-2');
    });

    it('provides accessible labels on mobile thumbnail action buttons', () => {
      render(<MobileThumbnailStrip />);

      expect(screen.getByTestId('mobile-move-earlier-btn')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('mobile-move-later-btn')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('mobile-duplicate-slide-btn')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('mobile-add-slide-btn')).toHaveAttribute('aria-label');
    });
  });

  describe('MainCanvas Keyboard Navigation & Accessible Controls', () => {
    it('navigates slides using ArrowLeft and ArrowRight keyboard events', () => {
      render(<MainCanvas />);

      expect(useProjectStore.getState().activeSlideId).toBe('slide-1');

      // ArrowRight advances to slide-2
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(useProjectStore.getState().activeSlideId).toBe('slide-2');

      // ArrowLeft goes back to slide-1
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(useProjectStore.getState().activeSlideId).toBe('slide-1');
    });

    it('has accessible labels on navigation and zoom buttons', () => {
      render(<MainCanvas />);

      expect(screen.getByTestId('canvas-prev-btn')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('canvas-next-btn')).toHaveAttribute('aria-label');
      expect(screen.getByTitle('Zoom in')).toHaveAttribute('aria-label', 'Zoom in');
      expect(screen.getByTitle('Zoom out')).toHaveAttribute('aria-label', 'Zoom out');
    });
  });

  describe('Inspector ARIA Tabs & Panels', () => {
    it('implements tablist and tab roles with aria-selected and aria-controls', () => {
      render(<Inspector />);

      const tablist = screen.getByTestId('inspector-tabs');
      expect(tablist).toHaveAttribute('role', 'tablist');

      const tabSlide = screen.getByTestId('tab-slide');
      const tabDesign = screen.getByTestId('tab-design');
      const tabBrand = screen.getByTestId('tab-brand');

      expect(tabSlide).toHaveAttribute('role', 'tab');
      expect(tabSlide).toHaveAttribute('aria-selected', 'true');
      expect(tabSlide).toHaveAttribute('aria-controls', 'panel-slide');

      expect(tabDesign).toHaveAttribute('role', 'tab');
      expect(tabDesign).toHaveAttribute('aria-selected', 'false');

      expect(tabBrand).toHaveAttribute('role', 'tab');
      expect(tabBrand).toHaveAttribute('aria-selected', 'false');

      // Active panel has role="tabpanel" and matches aria-labelledby
      const activePanel = screen.getByRole('tabpanel');
      expect(activePanel).toHaveAttribute('id', 'panel-slide');
      expect(activePanel).toHaveAttribute('aria-labelledby', 'tab-slide');
    });

    it('switches tabs and updates aria-selected and active tabpanel', () => {
      render(<Inspector />);

      const tabDesign = screen.getByTestId('tab-design');
      fireEvent.click(tabDesign);

      expect(tabDesign).toHaveAttribute('aria-selected', 'true');
      const activePanel = screen.getByRole('tabpanel');
      expect(activePanel).toHaveAttribute('id', 'panel-design');
      expect(activePanel).toHaveAttribute('aria-labelledby', 'tab-design');
    });
  });

  describe('EditorMobile Bottom Tabs Navigation', () => {
    it('has role="tablist" on bottom tab bar and role="tab" with aria-selected on tabs', () => {
      render(<EditorMobile onHome={vi.fn()} />);

      const nav = screen.getByTestId('mobile-bottom-tabs');
      expect(nav).toHaveAttribute('role', 'tablist');

      const slidesTab = screen.getByTestId('mobile-tab-slides');
      expect(slidesTab).toHaveAttribute('role', 'tab');
      expect(slidesTab).toHaveAttribute('aria-selected', 'true');

      const editTab = screen.getByTestId('mobile-tab-edit');
      expect(editTab).toHaveAttribute('role', 'tab');
      expect(editTab).toHaveAttribute('aria-selected', 'false');

      fireEvent.click(editTab);
      expect(editTab).toHaveAttribute('aria-selected', 'true');
      expect(slidesTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Modal Dialog Accessibility: Escape Key & ARIA Attributes', () => {
    it('MobileBottomSheet has role="dialog", aria-modal="true", and closes on Escape', () => {
      const onClose = vi.fn();
      render(
        <MobileBottomSheet isOpen={true} onClose={onClose} title="Test Sheet">
          <div>Sheet Content</div>
        </MobileBottomSheet>
      );

      const dialog = screen.getByTestId('mobile-bottom-sheet');
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Test Sheet');

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ChangeFormatDialog has role="dialog", aria-modal="true", and closes on Escape', () => {
      const onClose = vi.fn();
      render(<ChangeFormatDialog isOpen={true} onClose={onClose} />);

      const dialog = screen.getByTestId('change-format-dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
