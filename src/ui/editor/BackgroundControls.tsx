import React, { useState, useRef } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { processUserUpload } from '../../core/uploads';
import type { SlideBackground } from '../../core/schema';
import { SHAPES_ITEMS, getShapeSvg, ICONS_ITEMS, getIconSvg } from '../../assets';
import { CameraIcon, CloseIcon, SparkleIcon } from '../common/icons';

export const BackgroundControls: React.FC = () => {
  const { t } = useT();
  const activeSlide = useActiveSlide();
  const project = useProjectStore((s) => s.project);
  const setSlideBackground = useProjectStore((s) => s.setSlideBackground);
  const setProjectBackground = useProjectStore((s) => s.setProjectBackground);
  const applyBackgroundToAll = useProjectStore((s) => s.applyBackgroundToAll);

  const [scope, setScope] = useState<'slide' | 'all'>('slide');
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeSlide) return null;

  const currentBg: SlideBackground | undefined =
    scope === 'slide' ? activeSlide.background : project.background;

  const slideOverrideCount = project.slides.filter((s) => Boolean(s.background)).length;
  const isSlideOverridden = Boolean(activeSlide.background);

  const handleUpdate = (updates: Partial<SlideBackground>) => {
    const next: SlideBackground = {
      mode: 'fill',
      opacity: 1,
      ...currentBg,
      ...updates,
    };
    if (scope === 'slide') {
      setSlideBackground(activeSlide.id, next);
    } else {
      setProjectBackground(next);
    }
  };

  const handleRemove = () => {
    if (scope === 'slide') {
      setSlideBackground(activeSlide.id, undefined);
    } else {
      setProjectBackground(undefined);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      const processed = await processUserUpload(file);
      handleUpdate({
        assetId: processed.assetId,
        symbolId: undefined,
        symbolPack: undefined,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectSymbol = (symbolId: string, pack: 'shapes' | 'icons') => {
    handleUpdate({
      symbolId,
      symbolPack: pack,
      assetId: undefined,
      mode: currentBg?.mode || 'repeat',
    });
    setShowSymbolPicker(false);
  };

  return (
    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3" data-testid="background-controls">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('editor.background')}
        </h4>
        {currentBg && (
          <button
            type="button"
            data-testid="remove-bg-btn"
            onClick={handleRemove}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
          >
            {t('editor.background.remove')}
          </button>
        )}
      </div>

      {/* Scope Selector */}
      <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
        <button
          type="button"
          data-testid="bg-scope-slide"
          onClick={() => setScope('slide')}
          className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors ${
            scope === 'slide'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('editor.background.slide')}
        </button>
        <button
          type="button"
          data-testid="bg-scope-all"
          onClick={() => setScope('all')}
          className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors ${
            scope === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('editor.background.all')}
        </button>
      </div>

      {/* Status banner */}
      {scope === 'slide' && isSlideOverridden && (
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-700 dark:text-cyan-300 flex items-center justify-between">
          <span>{t('editor.background.hasSlideOverride')}</span>
          <button
            type="button"
            onClick={() => setSlideBackground(activeSlide.id, undefined)}
            className="underline font-semibold ml-2 hover:opacity-80"
          >
            {t('editor.background.clearOverride')}
          </button>
        </div>
      )}

      {scope === 'all' && slideOverrideCount > 0 && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
          <div>
            {slideOverrideCount} slide{slideOverrideCount > 1 ? 's have' : ' has'} custom backgrounds.
          </div>
          <button
            type="button"
            onClick={() => {
              if (currentBg) applyBackgroundToAll(currentBg, true);
            }}
            className="underline font-semibold hover:opacity-80 block"
          >
            Apply to all slides (overwrite custom)
          </button>
        </div>
      )}

      {uploadError && (
        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          {uploadError}
        </div>
      )}

      {/* Actions: Upload Image or Pick Symbol */}
      <div className="grid grid-cols-2 gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileUpload}
          className="hidden"
          data-testid="bg-file-input"
        />
        <button
          type="button"
          data-testid="bg-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
        >
          <CameraIcon size={16} />
          <span>{t('editor.background.upload')}</span>
        </button>

        <button
          type="button"
          data-testid="bg-symbol-picker-btn"
          onClick={() => setShowSymbolPicker((prev) => !prev)}
          className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
        >
          <SparkleIcon size={16} />
          <span>{t('editor.background.symbol')}</span>
        </button>
      </div>

      {/* Symbol Picker Popover */}
      {showSymbolPicker && (
        <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Pick a symbol</span>
            <button
              type="button"
              onClick={() => setShowSymbolPicker(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <CloseIcon size={16} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            {SHAPES_ITEMS.slice(0, 18).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSymbol(item.id, 'shapes')}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: getShapeSvg(item.id) || '' }}
              />
            ))}
            {ICONS_ITEMS.slice(0, 18).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSymbol(item.id, 'icons')}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: getIconSvg(item.id) || '' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mode and Display Settings (if background is set) */}
      {currentBg && (currentBg.assetId || currentBg.symbolId || currentBg.fillColor) && (
        <div className="space-y-3 pt-2">
          {/* Display Mode: Fill, Fit, Repeat */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Display Mode
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['fill', 'fit', 'repeat'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  data-testid={`bg-mode-${m}`}
                  onClick={() => handleUpdate({ mode: m })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                    (currentBg.mode || 'fill') === m
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t(`editor.background.${m}` as const)}
                </button>
              ))}
            </div>
          </div>

          {/* Focal Point (for Fill mode) */}
          {(currentBg.mode || 'fill') === 'fill' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t('editor.background.focalPoint')}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono">X:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentBg.focal?.x ?? 0.5}
                    onChange={(e) =>
                      handleUpdate({
                        focal: {
                          x: parseFloat(e.target.value),
                          y: currentBg.focal?.y ?? 0.5,
                        },
                      })
                    }
                    className="flex-1"
                  />
                  <span className="font-mono text-[10px] w-7">
                    {Math.round((currentBg.focal?.x ?? 0.5) * 100)}%
                  </span>
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono">Y:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentBg.focal?.y ?? 0.5}
                    onChange={(e) =>
                      handleUpdate({
                        focal: {
                          x: currentBg.focal?.x ?? 0.5,
                          y: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="flex-1"
                  />
                  <span className="font-mono text-[10px] w-7">
                    {Math.round((currentBg.focal?.y ?? 0.5) * 100)}%
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Fill Color (for Fit or Repeat mode) */}
          {((currentBg.mode === 'fit') || (currentBg.mode === 'repeat')) && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t('editor.background.color')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentBg.fillColor || '#000000'}
                  onChange={(e) => handleUpdate({ fillColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 p-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={currentBg.fillColor || ''}
                  onChange={(e) => handleUpdate({ fillColor: e.target.value })}
                  placeholder="#000000 or transparent"
                  className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {/* Tile Size (for Repeat mode) */}
          {currentBg.mode === 'repeat' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>{t('editor.background.tileSize')}</span>
                <span className="font-mono">{currentBg.tileSize ?? 120}px</span>
              </div>
              <input
                type="range"
                min="30"
                max="400"
                step="10"
                value={currentBg.tileSize ?? 120}
                onChange={(e) => handleUpdate({ tileSize: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </div>
          )}

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>{t('editor.background.opacity')}</span>
              <span className="font-mono">{Math.round((currentBg.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              data-testid="bg-opacity-slider"
              min="0"
              max="1"
              step="0.05"
              value={currentBg.opacity ?? 1}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
