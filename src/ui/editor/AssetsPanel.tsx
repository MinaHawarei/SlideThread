import React, { useState, useMemo, useRef } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useRecentAssetsStore } from '../../store/recentAssetsStore';
import { processUserUpload } from '../../core/uploads';
import { plainTextToRichText } from '../../core/schema';
import {
  SHAPES_ITEMS,
  getShapeSvg,
  ICONS_ITEMS,
  getIconSvg,
  EMOJI_ITEMS,
  getEmojiSvg,
  STICKERS_ITEMS,
  getStickerSvg,
  type AssetItem,
} from '../../assets';
import type { ExtraElement } from '../../core/schema';

export type AssetCategory = 'all' | 'shapes' | 'icons' | 'emoji' | 'stickers' | 'recents';

interface UnifiedAssetItem extends AssetItem {
  packId: 'shapes' | 'icons' | 'emoji' | 'stickers';
}

export const AssetsPanel: React.FC = () => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlide = useActiveSlide();
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const selectElement = useSelectionStore((state) => state.selectElement);
  const { recents, addRecent, clearRecents } = useRecentAssetsStore();

  const [category, setCategory] = useState<AssetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = () => {
    if (!activeSlide) return;
    const newExtra: ExtraElement = {
      id: `text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'text',
      text: plainTextToRichText('Text'),
      fill: project.primaryColor || '#0f172a',
      x: 0.3,
      y: 0.4,
      w: 0.4,
      h: 0.12,
      rotation: 0,
      z: (activeSlide.extras?.length ?? 0) + 1,
      locked: false,
    };
    addExtraElement(activeSlide.id, newExtra);
    selectElement(newExtra.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlide) return;

    setUploadError(null);
    try {
      const processed = await processUserUpload(file);

      const newExtra: ExtraElement = {
        id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        kind: 'image',
        x: 0.2,
        y: 0.2,
        w: 0.35,
        h: 0.35,
        rotation: 0,
        z: (activeSlide.extras?.length ?? 0) + 1,
        locked: false,
        shape: 'rectangle', // Default rounded corners
        media: {
          assetId: processed.assetId,
          fit: 'cover',
          placement: 'background',
        },
      };

      addExtraElement(activeSlide.id, newExtra);
      selectElement(newExtra.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Assemble full item index
  const allItems: UnifiedAssetItem[] = useMemo(() => {
    const shapes: UnifiedAssetItem[] = SHAPES_ITEMS.map((item) => ({ ...item, packId: 'shapes' as const }));
    const icons: UnifiedAssetItem[] = ICONS_ITEMS.map((item) => ({ ...item, packId: 'icons' as const }));
    const emoji: UnifiedAssetItem[] = EMOJI_ITEMS.map((item) => ({ ...item, packId: 'emoji' as const }));
    const stickers: UnifiedAssetItem[] = STICKERS_ITEMS.map((item) => ({ ...item, packId: 'stickers' as const }));
    return [...shapes, ...icons, ...emoji, ...stickers];
  }, []);

  const getSvgForAsset = (packId: string, assetId: string): string | undefined => {
    switch (packId) {
      case 'shapes':
        return getShapeSvg(assetId);
      case 'icons':
        return getIconSvg(assetId);
      case 'emoji':
        return getEmojiSvg(assetId);
      case 'stickers':
        return getStickerSvg(assetId);
      default:
        return undefined;
    }
  };

  // Filter items by category & bilingual search
  const filteredItems: UnifiedAssetItem[] = useMemo(() => {
    let pool: UnifiedAssetItem[] = [];

    if (category === 'recents') {
      pool = recents
        .map((r) => allItems.find((item) => item.packId === r.packId && item.id === r.assetId))
        .filter((item): item is UnifiedAssetItem => Boolean(item));
    } else if (category === 'all') {
      pool = allItems;
    } else {
      pool = allItems.filter((item) => item.packId === category);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return pool;

    return pool.filter((item) => {
      const nameEn = item.name.en.toLowerCase();
      const nameAr = item.name.ar.toLowerCase();
      const tagsEn = item.tags.en.map((t) => t.toLowerCase()).join(' ');
      const tagsAr = item.tags.ar.map((t) => t.toLowerCase()).join(' ');
      return (
        nameEn.includes(query) ||
        nameAr.includes(query) ||
        tagsEn.includes(query) ||
        tagsAr.includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    });
  }, [category, searchQuery, allItems, recents]);

  const handleAddAsset = (packId: 'shapes' | 'icons' | 'emoji' | 'stickers', assetId: string) => {
    if (!activeSlide) return;

    let baseWidth = 0.2;
    let baseHeight = 0.2;

    if (packId === 'emoji') {
      baseWidth = 0.12;
      baseHeight = 0.12;
    } else if (packId === 'stickers') {
      baseWidth = 0.28;
      baseHeight = 0.1;
    } else if (packId === 'icons') {
      baseWidth = 0.15;
      baseHeight = 0.15;
    }

    const newExtra: ExtraElement = {
      id: `${packId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: 'shape',
      assetId,
      x: Math.max(0.05, 0.5 - baseWidth / 2),
      y: Math.max(0.05, 0.5 - baseHeight / 2),
      w: baseWidth,
      h: baseHeight,
      rotation: 0,
      z: (activeSlide.extras?.length ?? 0) + 1,
      locked: false,
      fill: packId === 'shapes' || packId === 'icons' ? (project.primaryColor || '#0891b2') : undefined,
    };

    addExtraElement(activeSlide.id, newExtra);
    selectElement(newExtra.id);
    addRecent(packId, assetId);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    packId: 'shapes' | 'icons' | 'emoji' | 'stickers',
    assetId: string
  ) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'slidethread-asset',
        packId,
        assetId,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4" data-testid="assets-panel">
      {/* Search Input and Upload button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            data-testid="assets-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('assets.searchPlaceholder')}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              data-testid="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          data-testid="asset-file-input"
          onChange={handleFileUpload}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
        />

        <button
          type="button"
          data-testid="add-text-btn"
          onClick={handleAddText}
          disabled={!activeSlide}
          title={t('assets.addText')}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-sm transition-colors whitespace-nowrap disabled:opacity-50"
        >
          <span>T</span>
          <span>{t('assets.addText')}</span>
        </button>

        <button
          type="button"
          data-testid="upload-asset-btn"
          onClick={() => fileInputRef.current?.click()}
          title={t('assets.uploadTitle')}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1 shadow-sm transition-colors whitespace-nowrap"
        >
          <span>↑</span>
          <span>{t('assets.uploadBtn')}</span>
        </button>
      </div>

      {uploadError && (
        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400" data-testid="upload-error-message">
          {uploadError}
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs" data-testid="asset-categories">
        <button
          type="button"
          data-testid="category-all"
          onClick={() => setCategory('all')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            category === 'all'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t('assets.catAll')}
        </button>
        <button
          type="button"
          data-testid="category-shapes"
          onClick={() => setCategory('shapes')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            category === 'shapes'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t('assets.catShapes')}
        </button>
        <button
          type="button"
          data-testid="category-icons"
          onClick={() => setCategory('icons')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            category === 'icons'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t('assets.catIcons')}
        </button>
        <button
          type="button"
          data-testid="category-emoji"
          onClick={() => setCategory('emoji')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            category === 'emoji'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t('assets.catEmoji')}
        </button>
        <button
          type="button"
          data-testid="category-stickers"
          onClick={() => setCategory('stickers')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            category === 'stickers'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t('assets.catStickers')}
        </button>
        <button
          type="button"
          data-testid="category-recents"
          onClick={() => setCategory('recents')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
            category === 'recents'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <span>{t('assets.catRecents')}</span>
          {recents.length > 0 && <span className="text-[10px] opacity-75 font-mono">({recents.length})</span>}
        </button>
      </div>

      {/* Recents banner with clear action */}
      {category === 'recents' && recents.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{t('assets.recentsTitle')}</span>
          <button
            type="button"
            data-testid="clear-recents-btn"
            onClick={clearRecents}
            className="text-slate-400 hover:text-rose-500 font-medium"
          >
            {t('assets.clearRecents')}
          </button>
        </div>
      )}

      {/* Grid of Results */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400" data-testid="assets-empty-state">
          {t('assets.noResults')}
        </div>
      ) : (
        <div
          className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[500px] p-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800"
          data-testid="assets-grid"
        >
          {filteredItems.map((item) => {
            const svg = getSvgForAsset(item.packId, item.id);
            const name = locale === 'ar' ? item.name.ar : item.name.en;
            const isSticker = item.packId === 'stickers';

            return (
              <button
                key={`${item.packId}-${item.id}`}
                type="button"
                draggable
                data-testid={`asset-item-${item.id}`}
                title={`${name} (${item.packId})`}
                onClick={() => handleAddAsset(item.packId, item.id)}
                onDragStart={(e) => handleDragStart(e, item.packId, item.id)}
                className={`flex items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-sm transition-all group cursor-grab active:cursor-grabbing ${
                  isSticker ? 'col-span-2 h-12' : 'h-14'
                }`}
              >
                <div
                  className={`flex items-center justify-center pointer-events-none ${
                    isSticker ? 'w-full h-8' : item.packId === 'emoji' ? 'w-8 h-8' : 'w-6 h-6 text-slate-700 dark:text-slate-200'
                  }`}
                  dangerouslySetInnerHTML={{ __html: svg || '' }}
                />
                <span className="sr-only">{name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
        {t('assets.dragTip')}
      </div>
    </div>
  );
};
