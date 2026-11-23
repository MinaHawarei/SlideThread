import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useEffectiveBrand } from '../../store/projectStore';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { PasteSlidesDialog } from './PasteSlidesDialog';
import type { SlideType } from '../../core/schema';

export interface MobileThumbnailStripProps {
  className?: string;
}

export const MobileThumbnailStrip: React.FC<MobileThumbnailStripProps> = ({
  className = '',
}) => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlideId = useProjectStore((state) => state.activeSlideId);
  const setActiveSlideId = useProjectStore((state) => state.setActiveSlideId);
  const addSlide = useProjectStore((state) => state.addSlide);
  const duplicateSlide = useProjectStore((state) => state.duplicateSlide);
  const deleteSlide = useProjectStore((state) => state.deleteSlide);
  const reorderSlides = useProjectStore((state) => state.reorderSlides);
  const effectiveBrand = useEffectiveBrand();

  const [isPasteOpen, setIsPasteOpen] = useState(false);

  const isPost = project.contentType === 'post';
  const slides = project.slides;
  const activeIndex = slides.findIndex((s) => s.id === activeSlideId);
  const validIndex = activeIndex >= 0 ? activeIndex : 0;

  // Calculate scaled thumbnail dimensions (height 56px for clear visibility and touch hit)
  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const palette = generatePalette(project.primaryColor, project.theme);

  const thumbHeight = 56;
  const thumbScale = thumbHeight / dims.height;
  const thumbWidth = dims.width * thumbScale;

  const handleAddSlide = (type: SlideType = 'explain') => {
    addSlide(type);
  };

  const handleDuplicate = () => {
    if (activeSlideId) {
      duplicateSlide(activeSlideId);
    }
  };

  const handleDelete = () => {
    if (activeSlideId && slides.length > 1) {
      deleteSlide(activeSlideId);
    }
  };

  const handleMoveEarlier = () => {
    if (validIndex > 0) {
      reorderSlides(validIndex, validIndex - 1);
    }
  };

  const handleMoveLater = () => {
    if (validIndex < slides.length - 1) {
      reorderSlides(validIndex, validIndex + 1);
    }
  };

  return (
    <div
      data-testid="mobile-thumbnail-strip"
      className={`border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1.5 flex flex-col gap-1.5 shrink-0 select-none ${className}`}
    >
      {/* Horizontal Thumbnails Row */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none">
        {slides.map((slide, idx) => {
          const isActive = slide.id === activeSlideId;
          const slideNumber = String(idx + 1).padStart(2, '0');

          return (
            <div
              key={slide.id}
              role="button"
              tabIndex={0}
              data-testid={`mobile-thumb-${slide.id}`}
              onClick={() => setActiveSlideId(slide.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveSlideId(slide.id);
                } else if (!isPost && (e.altKey || e.ctrlKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
                  e.preventDefault();
                  if (idx > 0) reorderSlides(idx, idx - 1);
                } else if (!isPost && (e.altKey || e.ctrlKey) && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
                  e.preventDefault();
                  if (idx < slides.length - 1) reorderSlides(idx, idx + 1);
                }
              }}
              aria-label={`Slide ${idx + 1}`}
              aria-current={isActive ? 'true' : undefined}
              className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center p-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                isActive
                  ? 'border-cyan-500 shadow-md ring-2 ring-cyan-500/30'
                  : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
              }`}
              style={{
                width: `${Math.max(44, Math.round(thumbWidth) + 6)}px`,
                height: `${thumbHeight + 6}px`,
              }}
            >
              {/* Scaled Preview Box */}
              <div
                style={{
                  width: `${Math.round(thumbWidth)}px`,
                  height: `${thumbHeight}px`,
                  overflow: 'hidden',
                  position: 'relative',
                  pointerEvents: 'none',
                  background: palette.bg,
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    width: `${dims.width}px`,
                    height: `${dims.height}px`,
                    transform: `scale(${thumbScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  <SlideRenderer
                    slide={slide}
                    palette={palette}
                    aspectClass={aspect}
                    textDir={project.textDir === 'auto' ? (locale === 'ar' ? 'rtl' : 'ltr') : project.textDir}
                    brand={effectiveBrand}
                    slideIndex={idx}
                    totalSlides={slides.length}
                    showCounter={!isPost}
                    counterConfig={project.counter}
                    signatureConfig={project.signature}
                    showSafeZones={false}
                    isStory={project.contentType === 'story'}
                    templateId={project.templateId}
                    themeMode={project.theme}
                    dimensions={dims}
                  />
                </div>
              </div>

              {/* Number Badge */}
              <span
                className={`absolute bottom-1 end-1 text-[10px] font-mono font-bold px-1 rounded shadow-xs ${
                  isActive
                    ? 'bg-cyan-600 text-white'
                    : 'bg-black/60 text-white'
                }`}
              >
                {slideNumber}
              </span>
            </div>
          );
        })}

        {/* Add slide button inline in the strip if not single-slide post */}
        {!isPost && (
          <>
            <button
              type="button"
              data-testid="mobile-add-slide-btn"
              onClick={() => handleAddSlide('explain')}
              aria-label={t('editor.addSlide')}
              className="shrink-0 min-h-[44px] min-w-[44px] h-[60px] w-12 rounded-lg border-2 border-dashed border-cyan-400 dark:border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 flex flex-col items-center justify-center font-bold text-lg hover:bg-cyan-100 transition-colors"
            >
              <span>+</span>
            </button>
            <button
              type="button"
              data-testid="mobile-paste-slides-btn"
              onClick={() => setIsPasteOpen(true)}
              aria-label={t('paste.title')}
              title={t('paste.title')}
              className="shrink-0 min-h-[44px] min-w-[44px] h-[60px] w-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 flex flex-col items-center justify-center font-bold text-sm hover:bg-slate-100 transition-colors"
            >
              <span>📋</span>
            </button>
          </>
        )}
      </div>

      {/* Slide Operations Toolbar (Duplicate, Delete, Move Earlier, Move Later) */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-[11px] font-mono">
          {validIndex + 1} / {slides.length}
        </span>

        <div className="flex items-center gap-1">
          {/* Accessible Reorder Earlier */}
          {!isPost && (
            <button
              type="button"
              data-testid="mobile-move-earlier-btn"
              disabled={validIndex === 0}
              onClick={handleMoveEarlier}
              aria-label={t('editor.moveUp')}
              title={t('editor.moveUp')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              ←
            </button>
          )}

          {/* Accessible Reorder Later */}
          {!isPost && (
            <button
              type="button"
              data-testid="mobile-move-later-btn"
              disabled={validIndex === slides.length - 1}
              onClick={handleMoveLater}
              aria-label={t('editor.moveDown')}
              title={t('editor.moveDown')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              →
            </button>
          )}

          {/* Duplicate Slide */}
          {!isPost && (
            <button
              type="button"
              data-testid="mobile-duplicate-slide-btn"
              onClick={handleDuplicate}
              aria-label={t('editor.duplicateSlide')}
              title={t('editor.duplicateSlide')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {/* Delete Slide */}
          {!isPost && (
            <button
              type="button"
              data-testid="mobile-delete-slide-btn"
              disabled={slides.length <= 1}
              onClick={handleDelete}
              aria-label={t('editor.deleteSlide')}
              title={t('editor.deleteSlide')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Paste to Slides Dialog */}
      <PasteSlidesDialog
        isOpen={isPasteOpen}
        onClose={() => setIsPasteOpen(false)}
      />
    </div>
  );
};
