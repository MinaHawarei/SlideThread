import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SHAPES_PACK,
  SHAPES_ITEMS,
  getShapeSvg,
  getShapeItem,
  validateCompleteAssetPack,
} from '../../src/assets';
import { ExtrasRenderer } from '../../src/slides/ExtrasRenderer';
import { ShapesPicker } from '../../src/ui/editor/ShapesPicker';
import { useProjectStore } from '../../src/store/projectStore';
import { useSelectionStore } from '../../src/store/selectionStore';
import { CURRENT_SCHEMA_VERSION, type ExtraElement } from '../../src/core/schema';

describe('Shapes, Lines & Arrows Pack (§5.6, Task R6-2)', () => {
  beforeEach(() => {
    useSelectionStore.getState().selectElement();

    useProjectStore.setState({
      project: {
        id: 'proj_shapes_test',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        title: 'Shapes Test Project',
        formatId: 'r_4_5',
        orientation: 'portrait',
        contentType: 'carousel',
        platform: 'linkedin',
        templateId: 'clean-minimal',
        primaryColor: '#0891b2',
        theme: 'dark',
        textDir: 'ltr',
        slides: [
          {
            id: 'slide_1',
            type: 'explain',
            fields: {},
            extras: [],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      activeSlideId: 'slide_1',
    });
  });

  describe('Pack Metadata & Vector Content Integrity', () => {
    it('contains at least 16 vector shapes, lines, and arrows', () => {
      expect(SHAPES_ITEMS.length).toBeGreaterThanOrEqual(16);
      expect(SHAPES_PACK.kind).toBe('shapes');
      expect(SHAPES_PACK.license).toBe('MIT');
    });

    it('every shape in the pack has valid SVG content and is recolorable via currentColor', () => {
      const allSvgs: Record<string, string> = {};

      for (const item of SHAPES_ITEMS) {
        expect(item.recolorable).toBe(true);
        expect(item.name.en).toBeTruthy();
        expect(item.name.ar).toBeTruthy();
        expect(item.tags.en.length).toBeGreaterThan(0);
        expect(item.tags.ar.length).toBeGreaterThan(0);

        const svg = getShapeSvg(item.id);
        expect(svg).toBeDefined();
        expect(svg).toContain('<svg');
        expect(svg).toMatch(/currentColor/); // Must use currentColor for recoloring
        allSvgs[item.file] = svg!;
      }

      // Validates against full asset pack validator
      const validation = validateCompleteAssetPack(SHAPES_PACK, allSvgs);
      expect(validation.success).toBe(true);
    });

    it('getShapeItem returns item metadata by id', () => {
      const item = getShapeItem('line-arrow');
      expect(item).toBeDefined();
      expect(item?.id).toBe('line-arrow');
      expect(item?.name.en).toBe('Straight Arrow');
    });
  });

  describe('ExtrasRenderer Vector Shape Rendering', () => {
    it('renders vector shape from asset pack with custom fill color', () => {
      const shapeExtra: ExtraElement = {
        id: 'extra_arrow_1',
        kind: 'shape',
        assetId: 'line-arrow',
        x: 0.2,
        y: 0.3,
        w: 0.4,
        h: 0.1,
        rotation: 0,
        z: 1,
        locked: false,
        fill: '#f59e0b',
      };

      render(<ExtrasRenderer extras={[shapeExtra]} />);

      const element = screen.getByTestId('extra-element-extra_arrow_1');
      expect(element).toBeInTheDocument();

      const shapeContainer = screen.getByTestId('shape-asset-extra_arrow_1');
      expect(shapeContainer).toBeInTheDocument();
      expect(shapeContainer).toHaveStyle({ color: '#f59e0b' });
      expect(shapeContainer.innerHTML).toContain('<svg');
      expect(shapeContainer.innerHTML).toContain('currentColor');
    });

    it('renders fallback rectangle when no assetId or shape type specified', () => {
      const rectExtra: ExtraElement = {
        id: 'extra_rect_1',
        kind: 'shape',
        x: 0.1,
        y: 0.1,
        w: 0.3,
        h: 0.2,
        rotation: 0,
        z: 1,
        locked: false,
      };

      render(<ExtrasRenderer extras={[rectExtra]} />);
      expect(screen.getByTestId('shape-rectangle-extra_rect_1')).toBeInTheDocument();
    });
  });

  describe('ShapesPicker Component & Panel Integration', () => {
    it('renders all shapes in the inspector grid with bilingual labels', () => {
      render(<ShapesPicker />);

      expect(screen.getByTestId('shapes-picker')).toBeInTheDocument();
      expect(screen.getByTestId('shapes-grid')).toBeInTheDocument();

      // Check buttons for essential shapes
      expect(screen.getByTestId('add-shape-line-straight')).toBeInTheDocument();
      expect(screen.getByTestId('add-shape-line-arrow')).toBeInTheDocument();
      expect(screen.getByTestId('add-shape-badge-star')).toBeInTheDocument();
      expect(screen.getByTestId('add-shape-circle-outline')).toBeInTheDocument();
    });

    it('clicking a shape button adds it to the active slide extras and selects it', () => {
      render(<ShapesPicker />);

      const arrowBtn = screen.getByTestId('add-shape-line-arrow');
      fireEvent.click(arrowBtn);

      const activeSlide = useProjectStore.getState().project.slides[0]!;
      expect(activeSlide.extras).toBeDefined();
      expect(activeSlide.extras).toHaveLength(1);
      expect(activeSlide.extras![0]!.kind).toBe('shape');
      expect(activeSlide.extras![0]!.assetId).toBe('line-arrow');
      expect(activeSlide.extras![0]!.fill).toBe('#0891b2');

      // Selection was set to the new shape
      expect(useSelectionStore.getState().selectedElementId).toBe(activeSlide.extras![0]!.id);
    });

    it('recolors selected shape via palette color button and custom color picker', () => {
      const shapeId = 'shape_recolor_1';
      useProjectStore.setState((state) => ({
        ...state,
        project: {
          ...state.project,
          slides: [
            {
              ...state.project.slides[0]!,
              extras: [
                {
                  id: shapeId,
                  kind: 'shape',
                  assetId: 'badge-star',
                  x: 0.3,
                  y: 0.3,
                  w: 0.2,
                  h: 0.2,
                  rotation: 0,
                  z: 1,
                  locked: false,
                  fill: '#0891b2',
                },
              ],
            },
          ],
        },
      }));
      useSelectionStore.getState().selectElement(shapeId);

      render(<ShapesPicker />);

      expect(screen.getByTestId('selected-shape-controls')).toBeInTheDocument();

      // Click rose preset
      const roseBtn = screen.getByTestId('shape-palette-color-#f43f5e');
      fireEvent.click(roseBtn);

      let slide = useProjectStore.getState().project.slides[0]!;
      expect(slide.extras![0]!.fill).toBe('#f43f5e');

      // Change custom color input
      const colorInput = screen.getByTestId('shape-color-input');
      fireEvent.change(colorInput, { target: { value: '#10b981' } });

      slide = useProjectStore.getState().project.slides[0]!;
      expect(slide.extras![0]!.fill).toBe('#10b981');
    });

    it('deleting selected shape removes it from extras and clears selection', () => {
      const shapeId = 'shape_to_delete';
      useProjectStore.setState((state) => ({
        ...state,
        project: {
          ...state.project,
          slides: [
            {
              ...state.project.slides[0]!,
              extras: [
                {
                  id: shapeId,
                  kind: 'shape',
                  assetId: 'cross-x',
                  x: 0.3,
                  y: 0.3,
                  w: 0.2,
                  h: 0.2,
                  rotation: 0,
                  z: 1,
                  locked: false,
                },
              ],
            },
          ],
        },
      }));
      useSelectionStore.getState().selectElement(shapeId);

      render(<ShapesPicker />);

      const deleteBtn = screen.getByTestId('delete-shape-btn');
      fireEvent.click(deleteBtn);

      const slide = useProjectStore.getState().project.slides[0]!;
      expect(slide.extras).toHaveLength(0);
      expect(useSelectionStore.getState().selectedElementId).toBeUndefined();
    });
  });
});
