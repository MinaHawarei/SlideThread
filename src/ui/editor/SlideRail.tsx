import React, { useState } from 'react';
import { useT } from '../../i18n';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import type { SlideType } from '../../core/schema';

export interface SlideRailProps {
  className?: string;
}

export const SlideRail: React.FC<SlideRailProps> = ({ className = '' }) => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlideId = useProjectStore((state) => state.activeSlideId);
  const setActiveSlideId = useProjectStore((state) => state.setActiveSlideId);
  const addSlide = useProjectStore((state) => state.addSlide);
  const duplicateSlide = useProjectStore((state) => state.duplicateSlide);
  const deleteSlide = useProjectStore((state) => state.deleteSlide);
  const reorderSlides = useProjectStore((state) => state.reorderSlides);
  const settings = useSettingsStore((state) => state.settings);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isPost = project.contentType === 'post';
  const slides = project.slides;

  // Calculate scaled thumbnail dimensions
  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const palette = generatePalette(project.primaryColor, project.theme);

  // Thumbnail scaling (fit within 100px wide rail)
  const thumbScale = 90 / dims.width;
  const thumbWidth = dims.width * thumbScale;
  const thumbHeight = dims.height * thumbScale;

  // Handle Drag & Drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderSlides(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const handleAddSlide = (type: SlideType = 'explain') => {
    addSlide(type);
  };

  return (
    <aside
      data-testid="slide-rail"
      aria-label="Slide thumbnails"
      className={`w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 select-none ${className}`}
    >
      {/* Rail Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Slides ({slides.length})
        </span>

        {/* Add slide button is hidden for single-slide posts per Spec §4.4 */}
        {!isPost && (
          <button
            data-testid="rail-add-slide-btn"
            onClick={() => handleAddSlide('explain')}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1 shadow-sm"
            title={t('editor.addSlide')}
          >
            <span>+</span>
            <span>{t('editor.addSlide')}</span>
          </button>
        )}
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {slides.map((slide, idx) => {
          const isActive = slide.id === activeSlideId;
          const slideNumber = String(idx + 1).padStart(2, '0');
          const typeKey = `slideType.${slide.type}` as const;
          const typeLabel = t(typeKey);

          return (
            <div
              key={slide.id}
              data-testid={`rail-slide-${slide.id}`}
              draggable={!isPost}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              onClick={() => setActiveSlideId(slide.id)}
              className={`group relative p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950'
              }`}
            >
              {/* Card Meta & Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  #{slideNumber}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                  {typeLabel}
                </span>
              </div>

              {/* Scaled Thumbnail Stage */}
              <div className="flex justify-center">
                <div
                  style={{
                    width: `${thumbWidth}px`,
                    height: `${thumbHeight}px`,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    background: palette.bg,
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
                      pointerEvents: 'none',
                    }}
                  >
                    <SlideRenderer
                      slide={slide}
                      palette={palette}
                      aspectClass={aspect}
                      textDir={project.textDir === 'auto' ? (locale === 'ar' ? 'rtl' : 'ltr') : project.textDir}
                      brand={settings}
                      slideIndex={idx}
                      totalSlides={slides.length}
                      showCounter={!isPost}
                      showSafeZones={false}
                      isStory={project.contentType === 'story'}
                      templateId={project.templateId}
                      dimensions={dims}
                    />
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div
                data-testid={`rail-actions-${slide.id}`}
                className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs"
              >
                {/* Keyboard Reordering (Accessible per Spec §10.1 & §10.2) */}
                {!isPost && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`rail-move-up-${slide.id}`}
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx > 0) reorderSlides(idx, idx - 1);
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      title={t('editor.moveUp')}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      data-testid={`rail-move-down-${slide.id}`}
                      disabled={idx === slides.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx < slides.length - 1) reorderSlides(idx, idx + 1);
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      title={t('editor.moveDown')}
                    >
                      ▼
                    </button>
                  </div>
                )}

                {/* Duplicate & Delete Actions */}
                <div className="flex items-center gap-1 ml-auto">
                  {!isPost && (
                    <button
                      type="button"
                      data-testid={`rail-duplicate-${slide.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(slide.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      title={t('editor.duplicateSlide')}
                    >
                      ⎘
                    </button>
                  )}
                  {slides.length > 1 && (
                    <button
                      type="button"
                      data-testid={`rail-delete-${slide.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(slide.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-red-500 transition-colors"
                      title={t('editor.deleteSlide')}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
