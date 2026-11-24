import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SlideRail } from '../../src/ui/editor/SlideRail';
import { MobileThumbnailStrip } from '../../src/ui/editor/MobileThumbnailStrip';
import { SlideTypePicker } from '../../src/ui/editor/SlideTypePicker';
import { useProjectStore } from '../../src/store/projectStore';
import { useHistoryStore } from '../../src/store/history';
import type { Project, SlideType } from '../../src/core/schema';

const ALL_SLIDE_TYPES: SlideType[] = [
  'cover',
  'explain',
  'rule',
  'code',
  'compare',
  'stat',
  'quote',
  'image',
  'cta',
];

const testProject: Project = {
  id: 'test-slide-actions',
  title: 'Slide Actions Test',
  schemaVersion: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  platform: 'linkedin',
  formatId: 'r_4_5',
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
      id: 'slide-1',
      type: 'cover',
      fields: { title: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'Slide 1' }] }] } },
    },
    {
      id: 'slide-2',
      type: 'explain',
      fields: { title: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'Slide 2' }] }] } },
    },
  ],
};

describe('Slide Actions & Management (R7-2)', () => {
  beforeEach(() => {
    useHistoryStore.getState().clear();
    useProjectStore.setState({
      project: JSON.parse(JSON.stringify(testProject)),
      activeSlideId: 'slide-1',
    });
  });

  describe('SlideTypePicker Component', () => {
    it('renders all 9 standard slide types with labels and icons', () => {
      const onSelect = () => {};
      render(<SlideTypePicker onSelectType={onSelect} />);

      expect(screen.getByTestId('slide-type-picker')).toBeInTheDocument();
      for (const type of ALL_SLIDE_TYPES) {
        expect(screen.getByTestId(`type-option-${type}`)).toBeInTheDocument();
      }
    });

    it('triggers onSelectType with chosen slide type', () => {
      let selectedType = '';
      render(<SlideTypePicker onSelectType={(type) => { selectedType = type; }} />);

      const statOption = screen.getByTestId('type-option-stat');
      fireEvent.click(statOption);

      expect(selectedType).toBe('stat');
    });
  });

  describe('Desktop SlideRail Actions & Undo/Redo', () => {
    it('opens SlideTypePicker when clicking Add Slide button and adds chosen slide', () => {
      render(<SlideRail />);

      const addBtn = screen.getByTestId('rail-add-slide-type-btn');
      fireEvent.click(addBtn);

      const codeOption = screen.getByTestId('type-option-code');
      expect(codeOption).toBeInTheDocument();
      fireEvent.click(codeOption);

      const slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(3);
      expect(slides[2]!.type).toBe('code');
    });

    it('duplicates slide on clicking duplicate button and supports undo', () => {
      render(<SlideRail />);

      const dupBtn = screen.getByTestId('rail-duplicate-slide-1');
      fireEvent.click(dupBtn);

      let slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(3);
      expect(slides[1]!.type).toBe('cover');

      // Undo duplicate
      expect(useHistoryStore.getState().canUndo).toBe(true);
      act(() => {
        useHistoryStore.getState().undo();
      });

      slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(2);
    });

    it('deletes slide on clicking delete button and restores on undo', () => {
      render(<SlideRail />);

      const delBtn = screen.getByTestId('rail-delete-slide-2');
      fireEvent.click(delBtn);

      let slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(1);
      expect(slides[0]!.id).toBe('slide-1');

      // Undo deletion
      expect(useHistoryStore.getState().canUndo).toBe(true);
      act(() => {
        useHistoryStore.getState().undo();
      });

      slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(2);
      expect(slides[1]!.id).toBe('slide-2');
    });
  });

  describe('Mobile Thumbnail Strip Actions & Undo', () => {
    it('duplicates active slide and supports undo', () => {
      render(<MobileThumbnailStrip />);

      const dupBtn = screen.getByTestId('mobile-duplicate-slide-btn');
      fireEvent.click(dupBtn);

      let slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(3);

      act(() => {
        useHistoryStore.getState().undo();
      });
      slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(2);
    });

    it('deletes active slide and supports undo', () => {
      render(<MobileThumbnailStrip />);

      const delBtn = screen.getByTestId('mobile-delete-slide-btn');
      fireEvent.click(delBtn);

      let slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(1);

      act(() => {
        useHistoryStore.getState().undo();
      });
      slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(2);
    });

    it('opens bottom sheet type picker and adds slide', () => {
      render(<MobileThumbnailStrip />);

      const addBtn = screen.getByTestId('mobile-add-slide-type-btn');
      fireEvent.click(addBtn);

      const quoteOption = screen.getByTestId('type-option-quote');
      expect(quoteOption).toBeInTheDocument();
      fireEvent.click(quoteOption);

      const slides = useProjectStore.getState().project.slides;
      expect(slides.length).toBe(3);
      expect(slides[2]!.type).toBe('quote');
    });
  });

  describe('Performance with 20-slide project', () => {
    it('handles 20-slide project with memoized thumbnails smoothly', () => {
      const slides = Array.from({ length: 20 }, (_, i) => ({
        id: `slide-${i + 1}`,
        type: (ALL_SLIDE_TYPES[i % ALL_SLIDE_TYPES.length] || 'explain'),
        fields: { title: { type: 'doc' as const, blocks: [{ type: 'p' as const, runs: [{ text: `Slide ${i + 1}` }] }] } },
      }));

      useProjectStore.setState({
        project: {
          ...testProject,
          slides,
        },
        activeSlideId: 'slide-1',
      });

      const { unmount } = render(<SlideRail />);
      expect(screen.getByTestId('rail-slide-slide-20')).toBeInTheDocument();
      unmount();
    });
  });
});
