import React, { useState, useEffect, useRef } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide, useEffectiveBrand } from '../../store/projectStore';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import {
  getBaseSlug,
  canWebShare,
  captureSlideElement,
  exportSinglePng,
  exportZipArchive,
  exportPdfDocument,
  type ExportFormat,
  type ExportRange,
  type ExportProgress,
} from '../../export/pipeline';
import type { Slide } from '../../core/schema';
import { CheckIcon, CloseIcon, DownloadIcon, ImageIcon, LinkIcon, PackageIcon, PageIcon } from '../common/icons';

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlide = useActiveSlide();
  const effectiveBrand = useEffectiveBrand();

  const slides = project.slides;
  const isSingleSlide = slides.length <= 1 || project.contentType === 'post';

  const [format, setFormat] = useState<ExportFormat>(isSingleSlide ? 'png' : 'pdf');
  const [range, setRange] = useState<ExportRange>(isSingleSlide ? 'current' : 'all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Hidden stage rendering state
  const [renderSlide, setRenderSlide] = useState<Slide | null>(null);
  const [renderIndex, setRenderIndex] = useState<number>(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // Auto-align range when format changes
  const handleFormatChange = (newFormat: ExportFormat) => {
    setFormat(newFormat);
    setSuccess(false);
    setError(null);
    if (newFormat === 'png') {
      setRange('current');
    } else {
      setRange('all');
    }
  };

  // Reset dialog state when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setProgress(null);
      setIsExporting(false);
    }
  }, [isOpen]);

  // Close on Escape key when not exporting
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  // Dimensions & palette
  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const palette = generatePalette(project.primaryColor, project.theme);
  const isStory = project.contentType === 'story' || project.formatId === 'r_9_16';
  const baseSlug = getBaseSlug(project.title);

  const startExport = async (isShare = false) => {
    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const targetSlides: { slide: Slide; index: number }[] = [];

      if (range === 'current' || format === 'png') {
        const curIndex = slides.findIndex((s) => s.id === activeSlide?.id);
        const validIndex = curIndex >= 0 ? curIndex : 0;
        targetSlides.push({ slide: slides[validIndex]!, index: validIndex });
      } else {
        slides.forEach((slide, index) => {
          targetSlides.push({ slide, index });
        });
      }

      const total = targetSlides.length;
      const capturedPngs: { dataUrl: string; width: number; height: number; index: number }[] = [];

      for (let i = 0; i < total; i++) {
        const item = targetSlides[i]!;
        setProgress({
          current: i + 1,
          total,
          message: t('export.progress', { current: i + 1, total }),
        });

        // Mount slide to offscreen stage
        setRenderSlide(item.slide);
        setRenderIndex(item.index);

        // Allow React to commit the DOM update
        await new Promise((resolve) => setTimeout(resolve, 60));

        const stageEl = stageRef.current;
        if (!stageEl) {
          throw new Error('Export staging container is not available');
        }

        const dataUrl = await captureSlideElement(stageEl, dims, false);
        capturedPngs.push({
          dataUrl,
          width: dims.width,
          height: dims.height,
          index: item.index,
        });
      }

      setProgress({
        current: total,
        total,
        message: t('export.preparing'),
      });

      // Package and trigger download
      if (format === 'png') {
        const singlePng = capturedPngs[0]!;
        const slideNum = String(singlePng.index + 1).padStart(2, '0');
        const filename = `${baseSlug}-slide-${slideNum}.png`;
        await exportSinglePng(singlePng.dataUrl, filename, isShare, project.title);
      } else if (format === 'zip') {
        const dataUrls = capturedPngs.map((c) => c.dataUrl);
        await exportZipArchive(dataUrls, baseSlug);
      } else if (format === 'pdf') {
        await exportPdfDocument(capturedPngs, baseSlug, project.title);
      }

      setSuccess(true);
      setProgress({
        current: total,
        total,
        message: t('export.success'),
      });

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : t('export.failed'));
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      data-testid="export-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isExporting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-lg">
              ↓
            </div>
            <div>
              <h2
                id="export-dialog-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {t('export.title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {project.title || 'Untitled'} • {dims.width}×{dims.height}px
              </p>
            </div>
          </div>

          {!isExporting && (
            <button
              type="button"
              data-testid="export-close-btn"
              onClick={onClose}
              aria-label={t('common.close')}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('export.format')}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Single PNG */}
              <button
                type="button"
                data-testid="export-format-png"
                disabled={isExporting}
                onClick={() => handleFormatChange('png')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'png'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <ImageIcon size={20} />
                <span className="text-xs font-bold">{t('export.pngSingle')}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">.png</span>
              </button>

              {/* ZIP Archive */}
              <button
                type="button"
                data-testid="export-format-zip"
                disabled={isExporting}
                onClick={() => handleFormatChange('zip')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'zip'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <PackageIcon size={20} />
                <span className="text-xs font-bold">{t('export.pngZip')}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">.zip</span>
              </button>

              {/* PDF Document */}
              <button
                type="button"
                data-testid="export-format-pdf"
                disabled={isExporting}
                onClick={() => handleFormatChange('pdf')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'pdf'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <PageIcon size={20} />
                <span className="text-xs font-bold">{t('export.pdf')}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">.pdf</span>
              </button>
            </div>
          </div>

          {/* Range Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('export.range')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                data-testid="export-range-all"
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-medium transition-all ${
                  range === 'all'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="export-range"
                  value="all"
                  checked={range === 'all'}
                  disabled={isExporting}
                  onChange={() => setRange('all')}
                  className="text-cyan-600 focus:ring-cyan-500"
                />
                <span>{t('export.rangeAll', { count: slides.length })}</span>
              </label>

              <label
                data-testid="export-range-current"
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-medium transition-all ${
                  range === 'current'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="export-range"
                  value="current"
                  checked={range === 'current'}
                  disabled={isExporting}
                  onChange={() => setRange('current')}
                  className="text-cyan-600 focus:ring-cyan-500"
                />
                <span>{t('export.rangeCurrent')}</span>
              </label>
            </div>
          </div>

          {/* Progress / Status feedback */}
          {isExporting && progress && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700 dark:text-stone-200 font-serif">
                  {progress.message}
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round((progress.current / progress.total) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden p-0.5"
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              {success && (
                <div className="flex items-center gap-2 pt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in slide-in-from-bottom-1 duration-200">
                  <CheckIcon size={16} />
                  <span>{t('export.success')}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              data-testid="export-error"
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs"
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            data-testid="export-cancel-btn"
            disabled={isExporting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {t('common.cancel')}
          </button>

          {canWebShare() && format === 'png' && (
            <button
              type="button"
              data-testid="export-share-btn"
              disabled={isExporting}
              onClick={() => startExport(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <LinkIcon size={16} />
              <span>{t('export.share')}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="export-start-btn"
            disabled={isExporting || success}
            onClick={() => startExport(false)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isExporting ? (
              <>
                <span className="animate-spin text-sm">⏳</span>
                <span>{progress?.message || t('export.preparing')}</span>
              </>
            ) : success ? (
              <>
                <CheckIcon size={16} />
                <span>{t('export.success')}</span>
              </>
            ) : (
              <>
                <DownloadIcon size={16} />
                <span>{t('export.startBtn')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hidden Staging Renderer for full-resolution offscreen capture */}
      <div
        id="export-render-stage"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0.001,
          zIndex: -9999,
        }}
      >
        {renderSlide && (
          <div
            ref={stageRef}
            data-testid="export-slide-element"
            style={{
              width: `${dims.width}px`,
              height: `${dims.height}px`,
              position: 'relative',
              background: palette.bg,
            }}
          >
            <SlideRenderer
              slide={renderSlide}
              palette={palette}
              aspectClass={aspect}
              textDir={project.textDir === 'auto' ? (locale === 'ar' ? 'rtl' : 'ltr') : project.textDir}
              brand={effectiveBrand}
              slideIndex={renderIndex}
              totalSlides={slides.length}
              showCounter={project.contentType !== 'post'}
              counterConfig={project.counter}
              signatureConfig={project.signature}
              showSafeZones={false}
              isStory={isStory}
              templateId={project.templateId}
              templateSnapshot={project.templateSnapshot}
              themeMode={project.theme}
              dimensions={dims}
              projectBackground={project.background}
            />
          </div>
        )}
      </div>
    </div>
  );
};
