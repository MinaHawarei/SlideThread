import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EMOJI_PACK,
  EMOJI_ITEMS,
  getEmojiSvg,
  getEmojiItem,
  STICKERS_PACK,
  STICKERS_ITEMS,
  getStickerSvg,
  getStickerItem,
  validateCompleteAssetPack,
  getAssetPacksSummary,
  loadAssetPack,
} from '../../src/assets';
import { ExtrasRenderer } from '../../src/slides/ExtrasRenderer';
import { EmojiStickersPicker } from '../../src/ui/editor/EmojiStickersPicker';
import { useProjectStore } from '../../src/store/projectStore';
import { useSelectionStore } from '../../src/store/selectionStore';
import { CURRENT_SCHEMA_VERSION, type ExtraElement } from '../../src/core/schema';

describe('Emoji and Stickers Packs (§5.6, Task R6-4)', () => {
  beforeEach(() => {
    useSelectionStore.getState().selectElement();

    useProjectStore.setState({
      activeSlideId: 'slide_1',
      project: {
        id: 'proj_emoji_stickers_test',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        title: 'Emoji & Stickers Test Project',
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
    it('validates compliant Emoji pack with CC-BY-4.0 license and required attribution', () => {
      expect(EMOJI_PACK.id).toBe('emoji');
      expect(EMOJI_PACK.kind).toBe('emoji');
      expect(EMOJI_PACK.license).toBe('CC-BY-4.0');
      expect(EMOJI_PACK.attribution).toBeTruthy();
      expect(EMOJI_ITEMS.length).toBeGreaterThanOrEqual(8);

      const files: Record<string, string> = {};
      for (const item of EMOJI_ITEMS) {
        const svg = getEmojiSvg(item.id);
        expect(svg).toBeDefined();
        files[item.file] = svg!;
      }

      const result = validateCompleteAssetPack(EMOJI_PACK, files);
      expect(result.success).toBe(true);
    });

    it('validates compliant Stickers pack with MIT license', () => {
      expect(STICKERS_PACK.id).toBe('stickers');
      expect(STICKERS_PACK.kind).toBe('stickers');
      expect(STICKERS_PACK.license).toBe('MIT');
      expect(STICKERS_ITEMS.length).toBeGreaterThanOrEqual(6);

      const files: Record<string, string> = {};
      for (const item of STICKERS_ITEMS) {
        const svg = getStickerSvg(item.id);
        expect(svg).toBeDefined();
        files[item.file] = svg!;
      }

      const result = validateCompleteAssetPack(STICKERS_PACK, files);
      expect(result.success).toBe(true);
    });

    it('synchronous item getters retrieve emoji and sticker metadata', () => {
      const emoji = getEmojiItem('fire');
      expect(emoji).toBeDefined();
      expect(emoji?.name.en).toBe('Fire');
      expect(emoji?.name.ar).toBe('نار وشغف');

      const sticker = getStickerItem('sticker-pro-tip');
      expect(sticker).toBeDefined();
      expect(sticker?.name.en).toBe('Pro Tip Badge');
      expect(sticker?.name.ar).toBe('شارة نصيحة احترافية');
    });

    it('lazy loader discovers both packs and loads items with sanitized SVGs', async () => {
      const summaries = await getAssetPacksSummary();
      const emojiSummary = summaries.find((s) => s.id === 'emoji');
      const stickersSummary = summaries.find((s) => s.id === 'stickers');

      expect(emojiSummary).toBeDefined();
      expect(emojiSummary?.kind).toBe('emoji');
      expect(emojiSummary?.itemCount).toBe(8);

      expect(stickersSummary).toBeDefined();
      expect(stickersSummary?.kind).toBe('stickers');
      expect(stickersSummary?.itemCount).toBe(6);

      const loadedEmoji = await loadAssetPack('emoji');
      expect(loadedEmoji.items).toHaveLength(8);
      expect(loadedEmoji.svgs['fire']).toContain('<svg');

      const loadedStickers = await loadAssetPack('stickers');
      expect(loadedStickers.items).toHaveLength(6);
      expect(loadedStickers.svgs['sticker-pro-tip']).toContain('<svg');
    });
  });

  describe('ExtrasRenderer Rendering for Emoji & Stickers', () => {
    it('renders multi-color emoji preserving full vector colors without forced recoloring', () => {
      const extras: ExtraElement[] = [
        {
          id: 'emoji_fire_1',
          kind: 'shape',
          assetId: 'fire',
          x: 0.1,
          y: 0.1,
          w: 0.15,
          h: 0.15,
          rotation: 0,
          z: 1,
          locked: false,
        },
      ];

      render(<ExtrasRenderer extras={extras} />);

      const emojiEl = screen.getByTestId('shape-asset-emoji_fire_1');
      expect(emojiEl).toBeInTheDocument();
      // Should not force color override on multi-color emoji
      expect(emojiEl.style.color).toBe('');
      expect(emojiEl.querySelector('svg')).toBeInTheDocument();
    });

    it('renders presentation sticker badge correctly', () => {
      const extras: ExtraElement[] = [
        {
          id: 'sticker_tip_1',
          kind: 'shape',
          assetId: 'sticker-pro-tip',
          x: 0.2,
          y: 0.2,
          w: 0.3,
          h: 0.1,
          rotation: 0,
          z: 2,
          locked: false,
        },
      ];

      render(<ExtrasRenderer extras={extras} />);

      const stickerEl = screen.getByTestId('shape-asset-sticker_tip_1');
      expect(stickerEl).toBeInTheDocument();
      expect(stickerEl.querySelector('svg')).toBeInTheDocument();
      expect(stickerEl.innerHTML).toContain('PRO TIP');
    });
  });

  describe('EmojiStickersPicker Panel Interaction', () => {
    it('renders emoji grid and allows switching to stickers tab', () => {
      render(<EmojiStickersPicker />);

      expect(screen.getByTestId('emoji-stickers-picker')).toBeInTheDocument();
      expect(screen.getByTestId('add-emoji-fire')).toBeInTheDocument();
      expect(screen.getByTestId('add-emoji-sparkles')).toBeInTheDocument();

      // Switch to stickers tab
      fireEvent.click(screen.getByTestId('tab-stickers'));

      expect(screen.getByTestId('add-sticker-sticker-pro-tip')).toBeInTheDocument();
      expect(screen.getByTestId('add-sticker-sticker-verified')).toBeInTheDocument();
    });

    it('clicking an emoji adds it to active slide extras and selects it', () => {
      render(<EmojiStickersPicker />);

      const fireBtn = screen.getByTestId('add-emoji-fire');
      fireEvent.click(fireBtn);

      const activeSlide = useProjectStore.getState().project.slides[0]!;
      expect(activeSlide.extras).toBeDefined();
      expect(activeSlide.extras).toHaveLength(1);
      expect(activeSlide.extras![0]!.assetId).toBe('fire');
      expect(useSelectionStore.getState().selectedElementId).toBe(activeSlide.extras![0]!.id);
    });

    it('clicking a sticker adds it to active slide extras', () => {
      render(<EmojiStickersPicker />);

      fireEvent.click(screen.getByTestId('tab-stickers'));
      const proTipBtn = screen.getByTestId('add-sticker-sticker-pro-tip');
      fireEvent.click(proTipBtn);

      const activeSlide = useProjectStore.getState().project.slides[0]!;
      expect(activeSlide.extras).toHaveLength(1);
      expect(activeSlide.extras![0]!.assetId).toBe('sticker-pro-tip');
    });

    it('allows deleting selected emoji/sticker', () => {
      const extraId = 'sticker_delete_target';
      useProjectStore.setState((state) => ({
        ...state,
        project: {
          ...state.project,
          slides: [
            {
              ...state.project.slides[0]!,
              extras: [
                {
                  id: extraId,
                  kind: 'shape',
                  assetId: 'sticker-verified',
                  x: 0.2,
                  y: 0.2,
                  w: 0.2,
                  h: 0.1,
                  rotation: 0,
                  z: 1,
                  locked: false,
                },
              ],
            },
          ],
        },
      }));
      useSelectionStore.getState().selectElement(extraId);

      render(<EmojiStickersPicker />);

      const deleteBtn = screen.getByTestId('delete-selected-asset');
      expect(deleteBtn).toBeInTheDocument();
      fireEvent.click(deleteBtn);

      const activeSlide = useProjectStore.getState().project.slides[0]!;
      expect(activeSlide.extras).toHaveLength(0);
      expect(useSelectionStore.getState().selectedElementId).toBeUndefined();
    });
  });
});
