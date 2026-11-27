import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { EMOJI_ITEMS, getEmojiSvg, STICKERS_ITEMS, getStickerSvg } from '../../assets';
import type { ExtraElement } from '../../core/schema';
import { ChevronDownIcon, ChevronRightIcon } from '../common/icons';

export const EmojiStickersPicker: React.FC = () => {
  const { t, locale } = useT();
  const activeSlide = useActiveSlide();
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const deleteExtraElement = useProjectStore((state) => state.deleteExtraElement);
  const selectedElementId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);

  const [tab, setTab] = useState<'emoji' | 'stickers'>('emoji');
  const [isOpen, setIsOpen] = useState(true);

  if (!activeSlide) return null;

  // Check if an emoji or sticker extra on this slide is selected
  const selectedExtra = activeSlide.extras?.find(
    (extra) =>
      extra.id === selectedElementId &&
      extra.kind === 'shape' &&
      extra.assetId &&
      (EMOJI_ITEMS.some((i) => i.id === extra.assetId) || STICKERS_ITEMS.some((i) => i.id === extra.assetId))
  );

  const handleAddAsset = (assetId: string, kind: 'emoji' | 'sticker') => {
    const isEmoji = kind === 'emoji';
    const item = isEmoji
      ? EMOJI_ITEMS.find((i) => i.id === assetId)
      : STICKERS_ITEMS.find((i) => i.id === assetId);
    if (!item) return;

    const baseWidth = isEmoji ? 0.12 : 0.28;
    const baseHeight = isEmoji ? 0.12 : 0.1;

    const newExtra: ExtraElement = {
      id: `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'shape',
      assetId: item.id,
      x: Math.max(0.05, 0.5 - baseWidth / 2),
      y: Math.max(0.05, 0.5 - baseHeight / 2),
      w: baseWidth,
      h: baseHeight,
      rotation: 0,
      z: (activeSlide.extras?.length ?? 0) + 1,
      locked: false,
    };

    addExtraElement(activeSlide.id, newExtra);
    selectElement(newExtra.id);
  };

  const handleDelete = () => {
    if (!selectedExtra) return;
    deleteExtraElement(activeSlide.id, selectedExtra.id);
    selectElement(undefined);
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4" data-testid="emoji-stickers-picker">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <span>{t('assets.emojiStickersTitle')}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({EMOJI_ITEMS.length + STICKERS_ITEMS.length})
          </span>
          <span className="text-[10px] text-slate-400">{isOpen ? <ChevronDownIcon size={10} /> : <ChevronRightIcon size={10} />}</span>
        </button>

        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
          {tab === 'emoji' ? 'CC-BY-4.0' : 'MIT'}
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {t('assets.emojiStickersDesc')}
      </p>

      {isOpen && (
        <div className="space-y-3">
          {/* Tabs: Emoji vs Stickers */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
            <button
              type="button"
              data-testid="tab-emoji"
              onClick={() => setTab('emoji')}
              className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                tab === 'emoji'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('assets.tabEmoji')}
            </button>
            <button
              type="button"
              data-testid="tab-stickers"
              onClick={() => setTab('stickers')}
              className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                tab === 'stickers'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('assets.tabStickers')}
            </button>
          </div>

          {/* Grid of items */}
          {tab === 'emoji' ? (
            <div className="grid grid-cols-4 gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              {EMOJI_ITEMS.map((item) => {
                const svg = getEmojiSvg(item.id);
                const isSelected = selectedExtra?.assetId === item.id;
                const name = locale === 'ar' ? item.name.ar : item.name.en;

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`add-emoji-${item.id}`}
                    title={name}
                    onClick={() => handleAddAsset(item.id, 'emoji')}
                    className={`flex items-center justify-center p-2 rounded transition-all hover:scale-110 ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-950/50 ring-1 ring-amber-500'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className="w-7 h-7 flex items-center justify-center pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: svg || '' }}
                    />
                    <span className="sr-only">{name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              {STICKERS_ITEMS.map((item) => {
                const svg = getStickerSvg(item.id);
                const isSelected = selectedExtra?.assetId === item.id;
                const name = locale === 'ar' ? item.name.ar : item.name.en;

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`add-sticker-${item.id}`}
                    title={name}
                    onClick={() => handleAddAsset(item.id, 'sticker')}
                    className={`flex items-center justify-center p-1.5 rounded transition-all hover:scale-105 ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-950/50 ring-1 ring-amber-500'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className="w-full h-8 flex items-center justify-center pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: svg || '' }}
                    />
                    <span className="sr-only">{name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Delete action when asset is selected */}
          {selectedExtra && (
            <div className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-800 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {t('assets.selectedSticker')}
              </span>
              <button
                type="button"
                data-testid="delete-selected-asset"
                onClick={handleDelete}
                className="text-rose-500 hover:text-rose-600 font-semibold"
              >
                {t('assets.deleteAsset')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
