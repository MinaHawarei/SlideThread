import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ICONS_PACK,
  ICONS_ITEMS,
  getIconSvg,
  getIconItem,
  validateCompleteAssetPack,
  loadAssetPack,
  getAssetPacksSummary,
} from '../../src/assets';
import { ExtrasRenderer } from '../../src/slides/ExtrasRenderer';
import { IconsPicker } from '../../src/ui/editor/IconsPicker';
import { useProjectStore } from '../../src/store/projectStore';
import { useSelectionStore } from '../../src/store/selectionStore';
import { CURRENT_SCHEMA_VERSION, type ExtraElement } from '../../src/core/schema';

describe('Icons Pack (§5.6, Task R6-3)', () => {
  beforeEach(() => {
    useSelectionStore.getState().selectElement();

    useProjectStore.setState({
      activeSlideId: 'slide_1',
      project: {
        id: 'proj_icons_test',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        title: 'Icons Test Project',
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

  describe('Pack Metadata & Validation', () => {
    it('contains at least 16 verified Lucide presentation icons', () => {
      expect(ICONS_PACK.id).toBe('icons');
      expect(ICONS_PACK.kind).toBe('icons');
      expect(ICONS_PACK.license).toBe('ISC');
      expect(ICONS_PACK.sourceUrl).toBe('https://lucide.dev');
      expect(ICONS_PACK.attribution).toBeDefined();
      expect(ICONS_ITEMS.length).toBeGreaterThanOrEqual(16);
    });

    it('validates compliant schema and file integrity with all SVGs', () => {
      const files: Record<string, string> = {};
      for (const item of ICONS_ITEMS) {
        const svg = getIconSvg(item.id);
        expect(svg).toBeDefined();
        files[item.file] = svg!;
      }

      const result = validateCompleteAssetPack(ICONS_PACK, files);
      expect(result.success).toBe(true);
    });

    it('each icon SVG uses currentColor for recoloring and contains vector paths', () => {
      for (const item of ICONS_ITEMS) {
        const svg = getIconSvg(item.id);
        expect(svg).toBeDefined();
        expect(svg).toContain('<svg');
        expect(svg).toContain('currentColor');
        expect(item.name.en).toBeTruthy();
        expect(item.name.ar).toBeTruthy();
        expect(item.tags.en.length).toBeGreaterThan(0);
        expect(item.tags.ar.length).toBeGreaterThan(0);
      }
    });

    it('can retrieve icon item metadata synchronously', () => {
      const item = getIconItem('rocket');
      expect(item).toBeDefined();
      expect(item?.name.en).toBe('Rocket');
      expect(item?.name.ar).toBe('انطلاق');
    });

    it('discovers icons pack via lazy loader and summaries', async () => {
      const summaries = await getAssetPacksSummary();
      const iconsSummary = summaries.find((s) => s.id === 'icons');
      expect(iconsSummary).toBeDefined();
      expect(iconsSummary?.kind).toBe('icons');
      expect(iconsSummary?.license).toBe('ISC');
      expect(iconsSummary?.itemCount).toBe(20);

      const loaded = await loadAssetPack('icons');
      expect(loaded.id).toBe('icons');
      expect(loaded.items).toHaveLength(20);
      expect(loaded.svgs['chart-bar']).toContain('<svg');
    });
  });

  describe('ExtrasRenderer Vector Icon Rendering', () => {
    it('renders vector icon extra with currentColor mapped to extra.fill', () => {
      const extras: ExtraElement[] = [
        {
          id: 'icon_extra_1',
          kind: 'shape',
          assetId: 'chart-bar',
          x: 0.1,
          y: 0.1,
          w: 0.2,
          h: 0.2,
          rotation: 0,
          z: 1,
          locked: false,
          fill: '#f43f5e',
        },
      ];

      const { container } = render(<ExtrasRenderer extras={extras} />);

      const iconEl = screen.getByTestId('shape-asset-icon_extra_1');
      expect(iconEl).toBeInTheDocument();
      expect(iconEl).toHaveStyle({ color: '#f43f5e' });

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('stroke')).toBe('currentColor');
    });
  });

  describe('IconsPicker Panel Interaction', () => {
    it('renders the icons picker button grid', () => {
      render(<IconsPicker />);

      expect(screen.getByTestId('icons-picker')).toBeInTheDocument();
      expect(screen.getByTestId('add-icon-trending-up')).toBeInTheDocument();
      expect(screen.getByTestId('add-icon-lightbulb')).toBeInTheDocument();
      expect(screen.getByTestId('add-icon-rocket')).toBeInTheDocument();
    });

    it('clicking an icon button adds it to active slide extras and selects it', () => {
      render(<IconsPicker />);

      const rocketBtn = screen.getByTestId('add-icon-rocket');
      fireEvent.click(rocketBtn);

      const activeSlide = useProjectStore.getState().project.slides[0]!;
      expect(activeSlide.extras).toBeDefined();
      expect(activeSlide.extras).toHaveLength(1);
      expect(activeSlide.extras![0]!.kind).toBe('shape');
      expect(activeSlide.extras![0]!.assetId).toBe('rocket');
      expect(activeSlide.extras![0]!.fill).toBe('#0891b2');

      expect(useSelectionStore.getState().selectedElementId).toBe(activeSlide.extras![0]!.id);
    });

    it('recolors selected icon via palette button and custom color picker', () => {
      const iconId = 'icon_recolor_1';
      useProjectStore.setState((state) => ({
        ...state,
        project: {
          ...state.project,
          slides: [
            {
              ...state.project.slides[0]!,
              extras: [
                {
                  id: iconId,
                  kind: 'shape',
                  assetId: 'sparkles',
                  x: 0.2,
                  y: 0.2,
                  w: 0.15,
                  h: 0.15,
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
      useSelectionStore.getState().selectElement(iconId);

      render(<IconsPicker />);

      expect(screen.getByTestId('selected-icon-controls')).toBeInTheDocument();

      // Click indigo preset
      const indigoBtn = screen.getByTestId('icon-palette-color-#6366f1');
      fireEvent.click(indigoBtn);

      let slide = useProjectStore.getState().project.slides[0]!;
      expect(slide.extras![0]!.fill).toBe('#6366f1');

      // Change custom color input
      const colorInput = screen.getByTestId('icon-color-input');
      fireEvent.change(colorInput, { target: { value: '#e11d48' } });

      slide = useProjectStore.getState().project.slides[0]!;
      expect(slide.extras![0]!.fill).toBe('#e11d48');
    });

    it('deletes selected icon and deselects', () => {
      const iconId = 'icon_to_del';
      useProjectStore.setState((state) => ({
        ...state,
        project: {
          ...state.project,
          slides: [
            {
              ...state.project.slides[0]!,
              extras: [
                {
                  id: iconId,
                  kind: 'shape',
                  assetId: 'target',
                  x: 0.2,
                  y: 0.2,
                  w: 0.15,
                  h: 0.15,
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
      useSelectionStore.getState().selectElement(iconId);

      render(<IconsPicker />);

      const deleteBtn = screen.getByTestId('delete-selected-icon');
      fireEvent.click(deleteBtn);

      const slide = useProjectStore.getState().project.slides[0]!;
      expect(slide.extras).toHaveLength(0);
      expect(useSelectionStore.getState().selectedElementId).toBeUndefined();
    });
  });
});
