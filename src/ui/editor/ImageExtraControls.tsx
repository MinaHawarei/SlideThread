import React, { useRef } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { replaceUserUpload } from '../../core/uploads';

export const ImageExtraControls: React.FC = () => {
  const { t } = useT();
  const activeSlide = useActiveSlide();
  const updateExtraElement = useProjectStore((state) => state.updateExtraElement);
  const deleteExtraElement = useProjectStore((state) => state.deleteExtraElement);
  const selectedElementId = useSelectionStore((state) => state.selectedElementId);
  const selectElement = useSelectionStore((state) => state.selectElement);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  if (!activeSlide) return null;

  const selectedExtra = activeSlide.extras?.find(
    (extra) => extra.id === selectedElementId && extra.kind === 'image' && extra.media?.assetId
  );

  if (!selectedExtra) return null;

  const currentShape = selectedExtra.shape || 'rectangle';

  const handleMaskChange = (shape: 'rectangle' | 'ellipse' | 'line') => {
    updateExtraElement(activeSlide.id, {
      ...selectedExtra,
      shape: shape === 'line' ? undefined : shape,
    });
  };

  const handleFitChange = (fit: 'cover' | 'contain') => {
    if (!selectedExtra.media) return;
    updateExtraElement(activeSlide.id, {
      ...selectedExtra,
      media: {
        ...selectedExtra.media,
        fit,
      },
    });
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExtra.media?.assetId) return;

    try {
      await replaceUserUpload(selectedExtra.media.assetId, file);
      // Force trigger state update
      updateExtraElement(activeSlide.id, {
        ...selectedExtra,
        media: {
          ...selectedExtra.media,
        },
      });
    } catch (err) {
      console.error('Failed to replace image asset:', err);
    } finally {
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  const handleDelete = () => {
    deleteExtraElement(activeSlide.id, selectedExtra.id);
    selectElement(undefined);
  };

  return (
    <div
      data-testid="selected-image-controls"
      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 mt-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {t('assets.imageSettingsTitle')}
        </span>
        <button
          type="button"
          data-testid="delete-selected-image"
          onClick={handleDelete}
          className="text-xs text-rose-500 hover:text-rose-600 font-medium"
        >
          {t('assets.deleteAsset')}
        </button>
      </div>

      {/* Mask / Shape selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {t('assets.maskShape')}
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <button
            type="button"
            data-testid="mask-rounded"
            onClick={() => handleMaskChange('rectangle')}
            className={`py-1.5 px-2 rounded-lg border font-medium transition-colors ${
              currentShape === 'rectangle'
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t('assets.maskRounded')}
          </button>
          <button
            type="button"
            data-testid="mask-circle"
            onClick={() => handleMaskChange('ellipse')}
            className={`py-1.5 px-2 rounded-lg border font-medium transition-colors ${
              currentShape === 'ellipse'
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t('assets.maskCircle')}
          </button>
          <button
            type="button"
            data-testid="mask-none"
            onClick={() => handleMaskChange('line')}
            className={`py-1.5 px-2 rounded-lg border font-medium transition-colors ${
              !selectedExtra.shape
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t('assets.maskSquare')}
          </button>
        </div>
      </div>

      {/* Fit Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {t('assets.fitLabel')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            data-testid="fit-cover"
            onClick={() => handleFitChange('cover')}
            className={`py-1.5 px-2 rounded-lg border font-medium transition-colors ${
              selectedExtra.media?.fit === 'cover'
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Cover
          </button>
          <button
            type="button"
            data-testid="fit-contain"
            onClick={() => handleFitChange('contain')}
            className={`py-1.5 px-2 rounded-lg border font-medium transition-colors ${
              selectedExtra.media?.fit === 'contain'
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Contain
          </button>
        </div>
      </div>

      {/* Replace Image Action */}
      <div>
        <input
          type="file"
          ref={replaceInputRef}
          data-testid="replace-image-file-input"
          onChange={handleReplaceFile}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
        />
        <button
          type="button"
          data-testid="replace-image-btn"
          onClick={() => replaceInputRef.current?.click()}
          className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
        >
          {t('assets.replaceImage')}
        </button>
      </div>
    </div>
  );
};
