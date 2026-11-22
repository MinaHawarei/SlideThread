import React, { useState, useEffect } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { FORMAT_LIST, getDimensions, aspectClass as calcAspectClass, type FormatId } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import type { Orientation } from '../../core/schema';
import type { TranslationKey } from '../../i18n';

const FORMAT_LABELS: Record<FormatId, TranslationKey> = {
  r_4_5: 'wizard.format.portrait',
  r_1_1: 'wizard.format.square',
  r_16_9: 'wizard.format.landscape',
  r_9_16: 'wizard.format.tall',
};

export interface ChangeFormatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangeFormatDialog: React.FC<ChangeFormatDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const updateProjectMeta = useProjectStore((state) => state.updateProjectMeta);
  const activeSlide = useActiveSlide();
  const settings = useSettingsStore((state) => state.settings);

  const [selectedFormatId, setSelectedFormatId] = useState<FormatId>((project.formatId as FormatId) || 'r_4_5');
  const [selectedOrientation, setSelectedOrientation] = useState<Orientation>(project.orientation);

  useEffect(() => {
    if (isOpen) {
      setSelectedFormatId((project.formatId as FormatId) || 'r_4_5');
      setSelectedOrientation(project.orientation);
    }
  }, [isOpen, project.formatId, project.orientation]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allFormats = FORMAT_LIST;
  const dims = getDimensions(selectedFormatId, selectedOrientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const palette = generatePalette(project.primaryColor, project.theme);
  const isStory = selectedFormatId === 'r_9_16' || project.contentType === 'story';

  // Preview scaling (fit within 260px wide box)
  const maxPreviewWidth = 240;
  const maxPreviewHeight = 280;
  const previewScale = Math.min(maxPreviewWidth / dims.width, maxPreviewHeight / dims.height);
  const scaledWidth = dims.width * previewScale;
  const scaledHeight = dims.height * previewScale;

  const previewSlide = activeSlide || project.slides[0];

  const handleApply = () => {
    updateProjectMeta({
      formatId: selectedFormatId,
      orientation: selectedOrientation,
    });
    onClose();
  };

  return (
    <div
      data-testid="change-format-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        data-testid="change-format-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('design.changeFormat')}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('design.changeFormat')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('design.changeFormat.desc')}
            </p>
          </div>

          <button
            type="button"
            data-testid="close-change-format-btn"
            onClick={onClose}
            aria-label={t('design.changeFormat.cancel')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content: Formats List + Live Relayout Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Format Options & Orientation */}
          <div className="md:col-span-7 space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('design.changeFormat')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allFormats.map((fmt) => {
                const isSelected = selectedFormatId === fmt.id;
                const ratioLabel = t(FORMAT_LABELS[fmt.id]);
                const formatDims = getDimensions(fmt.id, selectedOrientation);

                return (
                  <button
                    key={fmt.id}
                    type="button"
                    data-testid={`change-format-option-${fmt.id}`}
                    onClick={() => setSelectedFormatId(fmt.id)}
                    className={`min-h-[44px] p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {ratioLabel}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                      {formatDims.width} × {formatDims.height}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Orientation toggle (for 16:9 orientable format) */}
            {selectedFormatId === 'r_16_9' && (
              <div className="pt-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('design.changeFormat.orientation')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="change-orientation-landscape"
                    onClick={() => setSelectedOrientation('landscape')}
                    className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      selectedOrientation === 'landscape'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>▭</span>
                    <span>{t('design.changeFormat.landscape')}</span>
                  </button>
                  <button
                    type="button"
                    data-testid="change-orientation-portrait"
                    onClick={() => setSelectedOrientation('portrait')}
                    className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      selectedOrientation === 'portrait'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>▯</span>
                    <span>{t('design.changeFormat.portrait')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Relayout Live Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-500 mb-3">
              {t('design.changeFormat.preview')}
            </span>

            {previewSlide && (
              <div
                data-testid="change-format-preview-stage"
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.35)',
                  background: palette.bg,
                  transition: 'width 0.2s, height 0.2s',
                }}
              >
                <div
                  style={{
                    width: `${dims.width}px`,
                    height: `${dims.height}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  <SlideRenderer
                    slide={previewSlide}
                    palette={palette}
                    aspectClass={aspect}
                    textDir={project.textDir === 'auto' ? (locale === 'ar' ? 'rtl' : 'ltr') : project.textDir}
                    brand={settings}
                    slideIndex={0}
                    totalSlides={project.slides.length}
                    showCounter={project.contentType !== 'post'}
                    showSafeZones={isStory}
                    isStory={isStory}
                    templateId={project.templateId}
                    dimensions={dims}
                  />
                </div>
              </div>
            )}

            <span className="text-[10px] font-mono text-slate-400 mt-2">
              {dims.width} × {dims.height} px
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            data-testid="cancel-change-format-btn"
            onClick={onClose}
            className="min-h-[44px] py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t('design.changeFormat.cancel')}
          </button>

          <button
            type="button"
            data-testid="apply-change-format-btn"
            onClick={handleApply}
            className="min-h-[44px] py-2 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <span>✓</span>
            <span>{t('design.changeFormat.apply')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
