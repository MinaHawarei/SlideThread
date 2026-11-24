import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EditorDesktop } from '../../src/ui/editor/EditorDesktop';
import { EditorMobile } from '../../src/ui/editor/EditorMobile';
import { useProjectStore } from '../../src/store/projectStore';
import { useSelectionStore } from '../../src/store/selectionStore';
import { parsePlainTextToRichText } from '../../src/core/richText';
import type { RichText } from '../../src/core/schema';

function plainTextFieldsToRichText(fields: Record<string, string>): Record<string, RichText> {
  const result: Record<string, RichText> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = parsePlainTextToRichText(val);
  }
  return result;
}

describe('Round 4 Features: Properties Panel & Layers Migration', () => {
  beforeEach(() => {
    useSelectionStore.getState().selectElement(undefined);
    const baseProject = useProjectStore.getState().project;
    useProjectStore.getState().setProject({
      ...baseProject,
      slides: [
        {
          id: 'slide-cover',
          type: 'cover',
          fields: plainTextFieldsToRichText({
            title: 'Welcome to SlideThread',
            body: 'A visual storytelling tool',
          }),
          overrides: {},
          extras: [],
        },
        {
          id: 'slide-cta',
          type: 'cta',
          fields: plainTextFieldsToRichText({
            title: 'Connect With Me',
            body: 'Follow for daily design tips',
            name: 'Jane Doe',
            handle: '@janedoe',
          }),
          overrides: {},
          extras: [],
        },
        {
          id: 'slide-img',
          type: 'image',
          fields: plainTextFieldsToRichText({
            caption: 'Sunset in the valley',
          }),
          overrides: {},
          extras: [],
        },
      ],
    });
    useProjectStore.getState().setActiveSlideId('slide-cover');
  });

  describe('P1: Text Editing in Properties Panel', () => {
    it('renders text formatting section and embedded rich text editor when text element is selected', () => {
      render(<EditorDesktop />);
      const titleHit = screen.getByTestId('element-hit-title');
      fireEvent.click(titleHit);

      // Properties panel opened
      expect(screen.getByTestId('element-properties-panel')).toBeInTheDocument();

      // Text formatting section exists inside Properties panel
      const textSection = screen.getByTestId('sidebar-text-formatting-section');
      expect(textSection).toBeInTheDocument();

      // Contains toolbar with formatting tools (bold, underline, highlight, align, lists, font family, font size, dir)
      expect(screen.getByTestId('toolbar-bold')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-underline')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-font-family')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-font-size')).toBeInTheDocument();
    });
  });

  describe('P2: Delete Element with Confirmation in Properties', () => {
    it('shows delete button with confirmation dialog for slots, hiding slot on confirm', () => {
      render(<EditorDesktop />);
      fireEvent.click(screen.getByTestId('element-hit-title'));

      const deleteBtn = screen.getByTestId('sidebar-delete-btn');
      expect(deleteBtn).toBeInTheDocument();

      // Click delete button -> shows confirmation dialog
      fireEvent.click(deleteBtn);
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-confirm-delete-btn')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-cancel-delete-btn')).toBeInTheDocument();

      // Click cancel -> confirmation dismisses, element is not deleted/hidden
      fireEvent.click(screen.getByTestId('sidebar-cancel-delete-btn'));
      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
      expect(useProjectStore.getState().project.slides[0]?.overrides?.portrait?.title?.hidden).not.toBe(true);

      // Click delete again and confirm
      fireEvent.click(screen.getByTestId('sidebar-delete-btn'));
      fireEvent.click(screen.getByTestId('sidebar-confirm-delete-btn'));
      expect(useProjectStore.getState().project.slides[0]?.overrides?.portrait?.title?.hidden).toBe(true);
    });

    it('deletes extra elements permanently upon confirmation', () => {
      const baseProject = useProjectStore.getState().project;
      useProjectStore.getState().setProject({
        ...baseProject,
        slides: [
          {
            ...baseProject.slides[0]!,
            extras: [
              { id: 'star-1', kind: 'shape', x: 0.2, y: 0.2, w: 0.1, h: 0.1, rotation: 0, z: 1, locked: false, shape: 'ellipse' },
            ],
          },
        ],
      });
      render(<EditorDesktop />);
      fireEvent.click(screen.getByTestId('element-hit-star-1'));

      fireEvent.click(screen.getByTestId('sidebar-delete-btn'));
      fireEvent.click(screen.getByTestId('sidebar-confirm-delete-btn'));

      const extras = useProjectStore.getState().project.slides[0]?.extras;
      expect(extras?.find((e) => e.id === 'star-1')).toBeUndefined();
    });
  });

  describe('P3: Redundant Three-Dot Trigger Removed', () => {
    it('has no element-menu-toggle or floating context toolbar on the canvas', () => {
      render(<EditorDesktop />);
      fireEvent.click(screen.getByTestId('element-hit-title'));

      expect(screen.queryByTestId('element-menu-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('element-context-toolbar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('element-numeric-inspector')).not.toBeInTheDocument();
    });
  });

  describe('P4: Images Selectable with Replace and Opacity in Properties', () => {
    it('allows selecting CTA image element, showing Replace Image and Opacity in Properties panel', () => {
      useProjectStore.getState().setActiveSlideId('slide-cta');
      render(<EditorDesktop />);

      // Clicking CTA media hit on canvas selects it
      const mediaHit = screen.getByTestId('element-hit-media');
      expect(mediaHit).toBeInTheDocument();
      fireEvent.click(mediaHit);

      // Properties panel displays Image Settings
      const imageControls = screen.getByTestId('sidebar-image-controls');
      expect(imageControls).toBeInTheDocument();

      // Shows Replace image button and file input
      expect(screen.getByTestId('sidebar-replace-image-btn')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-image-file-input')).toBeInTheDocument();

      // Opacity input and slider are available
      const opacitySlider = screen.getByTestId('sidebar-opacity-slider');
      expect(opacitySlider).toBeInTheDocument();
      act(() => fireEvent.change(opacitySlider, { target: { value: '75' } }));

      expect(useProjectStore.getState().project.slides[1]?.overrides?.portrait?.media?.opacity).toBeCloseTo(0.75);
    });

    it('allows selecting empty image placeholder in Image slide and shows Add Image', () => {
      useProjectStore.getState().setActiveSlideId('slide-img');
      render(<EditorDesktop />);

      const mediaHit = screen.getByTestId('element-hit-media');
      expect(mediaHit).toBeInTheDocument();
      fireEvent.click(mediaHit);

      expect(screen.getByTestId('sidebar-image-controls')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-image-placeholder-badge')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-replace-image-btn')).toBeInTheDocument();
    });
  });

  describe('P5: Layers in Side Panel before Brand', () => {
    it('renders Layers tab before Brand in desktop Inspector', () => {
      render(<EditorDesktop />);

      const tabLayers = screen.getByTestId('tab-layers');
      const tabBrand = screen.getByTestId('tab-brand');
      expect(tabLayers).toBeInTheDocument();
      expect(tabBrand).toBeInTheDocument();

      // Click layers tab -> renders LayersPanel
      fireEvent.click(tabLayers);
      expect(screen.getByTestId('layers-panel')).toBeInTheDocument();
      expect(screen.getByTestId('layer-row-title')).toBeInTheDocument();
      expect(screen.getByTestId('layer-row-body')).toBeInTheDocument();

      // Old floating canvas layers button is removed
      expect(screen.queryByTestId('layers-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('canvas-layers-panel')).not.toBeInTheDocument();
    });

    it('provides Layers bottom tab on mobile opening half-height sheet', () => {
      render(<EditorMobile />);

      const mobileLayersTab = screen.getByTestId('mobile-tab-layers');
      expect(mobileLayersTab).toBeInTheDocument();

      fireEvent.click(mobileLayersTab);
      expect(screen.getByTestId('layers-panel')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-bottom-sheet')).toHaveAttribute('data-half-height', 'true');
    });
  });
});
