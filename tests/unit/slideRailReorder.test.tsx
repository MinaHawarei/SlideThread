import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SlideRail } from '../../src/ui/editor/SlideRail';
import { MobileThumbnailStrip } from '../../src/ui/editor/MobileThumbnailStrip';
import { useProjectStore } from '../../src/store/projectStore';
import type { Project } from '../../src/core/schema';

const sampleProject: Project = {
  id: 'test-reorder-proj',
  title: 'Reorder Test Project',
  schemaVersion: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  platform: 'instagram',
  formatId: 'r_1_1',
  orientation: 'portrait',
  theme: 'dark',
  primaryColor: '#0ea5e9',
  templateId: 'tech-mesh',
  contentType: 'carousel',
  textDir: 'ltr',
  pattern: { enabled: true, intensity: 0.5 },
  counter: {
    show: true,
    anchor: 'tr',
    style: 'number',
    format: 'nn/nn',
    hideOnFirst: false,
    hideOnLast: false,
  },
  signature: {
    show: true,
    anchor: 'bl',
    arrangement: 'inline',
    size: 'sm',
    photoShape: 'circle',
    showHandle: true,
    showSocials: false,
  },
  slides: [
    {
      id: 'slide-alpha',
      type: 'cover',
      fields: { title: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'Slide Alpha' }] }] } },
    },
    {
      id: 'slide-beta',
      type: 'explain',
      fields: { title: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'Slide Beta' }] }] } },
    },
    {
      id: 'slide-gamma',
      type: 'quote',
      fields: { title: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'Slide Gamma' }] }] } },
    },
  ],
};

describe('SlideRail & MobileThumbnailStrip Reordering (R7-1)', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: JSON.parse(JSON.stringify(sampleProject)),
      activeSlideId: 'slide-alpha',
    });
  });

  describe('SlideRail Animated Reorder Rail', () => {
    it('renders dedicated drag handles for each slide when contentType is carousel', () => {
      render(<SlideRail />);

      expect(screen.getByTestId('rail-drag-handle-slide-alpha')).toBeInTheDocument();
      expect(screen.getByTestId('rail-drag-handle-slide-beta')).toBeInTheDocument();
      expect(screen.getByTestId('rail-drag-handle-slide-gamma')).toBeInTheDocument();
    });

    it('has polite live-region for announcing reorder position changes', () => {
      render(<SlideRail />);

      const liveRegion = screen.getByTestId('rail-live-region');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('role', 'status');
    });

    it('updates live-region announcement when reordering via move-down button', () => {
      render(<SlideRail />);

      const moveDownBtn = screen.getByTestId('rail-move-down-slide-alpha');
      fireEvent.click(moveDownBtn);

      const slides = useProjectStore.getState().project.slides;
      expect(slides[0]!.id).toBe('slide-beta');
      expect(slides[1]!.id).toBe('slide-alpha');

      const liveRegion = screen.getByTestId('rail-live-region');
      expect(liveRegion.textContent).toContain('Slide 1 moved to position 2 of 3');
    });

    it('updates live-region announcement when reordering via move-up button', () => {
      render(<SlideRail />);

      const moveUpBtn = screen.getByTestId('rail-move-up-slide-gamma');
      fireEvent.click(moveUpBtn);

      const slides = useProjectStore.getState().project.slides;
      expect(slides[1]!.id).toBe('slide-gamma');
      expect(slides[2]!.id).toBe('slide-beta');

      const liveRegion = screen.getByTestId('rail-live-region');
      expect(liveRegion.textContent).toContain('Slide 3 moved to position 2 of 3');
    });

    it('reorders via keyboard shortcuts Alt+ArrowDown and Alt+ArrowUp on slide cards', () => {
      render(<SlideRail />);

      const slideCard = screen.getByTestId('rail-slide-slide-alpha');
      fireEvent.keyDown(slideCard, { key: 'ArrowDown', altKey: true });

      let slides = useProjectStore.getState().project.slides;
      expect(slides[0]!.id).toBe('slide-beta');
      expect(slides[1]!.id).toBe('slide-alpha');

      fireEvent.keyDown(slideCard, { key: 'ArrowUp', altKey: true });
      slides = useProjectStore.getState().project.slides;
      expect(slides[0]!.id).toBe('slide-alpha');
      expect(slides[1]!.id).toBe('slide-beta');
    });

    it('handles touch pointer delay on drag handles gracefully', () => {
      vi.useFakeTimers();
      render(<SlideRail />);

      const handle = screen.getByTestId('rail-drag-handle-slide-alpha');
      
      // Simulate touch pointer down
      fireEvent.pointerDown(handle, { pointerType: 'touch', clientX: 100, clientY: 100 });

      // Fast pointer cancel clears hold timer before 350ms
      act(() => {
        vi.advanceTimersByTime(100);
      });
      fireEvent.pointerCancel(handle, { pointerType: 'touch' });

      // Should not trigger error or state corruption
      expect(useProjectStore.getState().project.slides[0]!.id).toBe('slide-alpha');
      vi.useRealTimers();
    });
  });

  describe('MobileThumbnailStrip Mobile Reorder Strip', () => {
    it('renders polite live-region and updates announcement on mobile move', () => {
      render(<MobileThumbnailStrip />);

      const liveRegion = screen.getByTestId('mobile-live-region');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      const moveLaterBtn = screen.getByTestId('mobile-move-later-btn');
      fireEvent.click(moveLaterBtn);

      const slides = useProjectStore.getState().project.slides;
      expect(slides[0]!.id).toBe('slide-beta');
      expect(slides[1]!.id).toBe('slide-alpha');
      expect(liveRegion.textContent).toContain('Slide 1 moved to position 2 of 3');
    });

    it('handles touch pointer down and cancel on mobile thumbnails', () => {
      vi.useFakeTimers();
      render(<MobileThumbnailStrip />);

      const thumb = screen.getByTestId('mobile-thumb-slide-alpha');
      fireEvent.pointerDown(thumb, { pointerType: 'touch', clientX: 50, clientY: 50 });

      act(() => {
        vi.advanceTimersByTime(200);
      });
      fireEvent.pointerUp(thumb, { pointerType: 'touch' });

      expect(useProjectStore.getState().project.slides[0]!.id).toBe('slide-alpha');
      vi.useRealTimers();
    });
  });
});
