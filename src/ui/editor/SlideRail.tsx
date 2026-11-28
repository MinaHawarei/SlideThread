import React, { useState, useRef } from 'react';
import { Reorder, useDragControls, MotionConfig } from 'motion/react';
import { useT } from '../../i18n';
import { useProjectStore, useEffectiveBrand } from '../../store/projectStore';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { PasteSlidesDialog } from './PasteSlidesDialog';
import { SlideTypePicker } from './SlideTypePicker';
import type { SlideType, Slide, AspectClass } from '../../core/schema';
import { ChevronDownIcon, ChevronUpIcon, ClipboardIcon, TrashIcon, CollapseChevron } from '../common/icons';

export interface SlideRailProps {
  className?: string;
  /** Collapses the strip to a thin vertical rail (desktop redesign). */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

interface SlideRailItemProps {
  slide: Slide;
  idx: number;
  totalSlides: number;
  isActive: boolean;
  isPost: boolean;
  dims: { width: number; height: number };
  aspect: AspectClass;
  palette: ReturnType<typeof generatePalette>;
  thumbWidth: number;
  thumbHeight: number;
  thumbScale: number;
  effectiveBrand: ReturnType<typeof useEffectiveBrand>;
  locale: string;
  onSelect: (id: string) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const SlideRailItem: React.FC<SlideRailItemProps> = React.memo(({
  slide,
  idx,
  totalSlides,
  isActive,
  isPost,
  dims,
  aspect,
  palette,
  thumbWidth,
  thumbHeight,
  thumbScale,
  effectiveBrand,
  locale,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useT();
  const controls = useDragControls();
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideNumber = String(idx + 1).padStart(2, '0');
  const typeKey = `slideType.${slide.type}` as const;
  const typeLabel = t(typeKey);

  const handlePointerDown = (e: React.PointerEvent) => {
    // On touch pointers, use a 350ms hold delay before initiating drag to distinguish tap/scroll
    if (e.pointerType === 'touch') {
      holdTimerRef.current = setTimeout(() => {
        controls.start(e);
      }, 350);
    } else {
      controls.start(e);
    }
  };

  const handlePointerUpOrCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <Reorder.Item
      key={slide.id}
      value={slide}
      dragListener={false}
      dragControls={controls}
      data-testid={`rail-slide-${slide.id}`}
      role="button"
      tabIndex={0}
      aria-label={`${typeLabel} slide ${idx + 1}`}
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect(slide.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(slide.id);
        } else if (!isPost && (e.altKey || e.ctrlKey) && e.key === 'ArrowUp') {
          e.preventDefault();
          if (idx > 0) onMoveUp(idx);
        } else if (!isPost && (e.altKey || e.ctrlKey) && e.key === 'ArrowDown') {
          e.preventDefault();
          if (idx < totalSlides - 1) onMoveDown(idx);
        }
      }}
      whileDrag={{
        scale: 1.03,
        boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25)',
        zIndex: 50,
      }}
      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
      className={`group relative p-2.5 rounded-2xl border-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none select-none ${
        isActive
          ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm ring-1 ring-amber-500'
          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50 dark:bg-stone-950'
      }`}
    >
      {/* Card Meta & Header with Dedicated Drag Handle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {!isPost && (
            <button
              type="button"
              data-testid={`rail-drag-handle-${slide.id}`}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUpOrCancel}
              onPointerCancel={handlePointerUpOrCancel}
              onClick={(e) => e.stopPropagation()}
              className="cursor-grab active:cursor-grabbing p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 touch-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              aria-label={t('editor.dragHandle', { number: idx + 1 })}
              title={t('editor.dragHandle', { number: idx + 1 })}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3" r="1.5" />
                <circle cx="11" cy="3" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="13" r="1.5" />
                <circle cx="11" cy="13" r="1.5" />
              </svg>
            </button>
          )}
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            #{slideNumber}
          </span>
        </div>
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
              textDir={locale === 'ar' ? 'rtl' : 'ltr'}
              brand={effectiveBrand}
              slideIndex={idx}
              totalSlides={totalSlides}
              showCounter={!isPost}
              counterConfig={useProjectStore.getState().project.counter}
              signatureConfig={useProjectStore.getState().project.signature}
              showSafeZones={false}
              isStory={useProjectStore.getState().project.contentType === 'story'}
              templateId={useProjectStore.getState().project.templateId}
              templateSnapshot={useProjectStore.getState().project.templateSnapshot}
              themeMode={useProjectStore.getState().project.theme}
              dimensions={dims}
              projectBackground={useProjectStore((state) => state.project.background)}
            />
          </div>
        </div>
      </div>

      {/* Actions Row — hover/focus only, per the approved redesign */}
      <div
        data-testid={`rail-actions-${slide.id}`}
        className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
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
                if (idx > 0) onMoveUp(idx);
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none focus-visible:ring-1 focus-visible:ring-cyan-500"
              aria-label={t('editor.moveUp')}
              title={t('editor.moveUp')}
            >
              <ChevronUpIcon size={16} />
            </button>
            <button
              type="button"
              data-testid={`rail-move-down-${slide.id}`}
              disabled={idx === totalSlides - 1}
              onClick={(e) => {
                e.stopPropagation();
                if (idx < totalSlides - 1) onMoveDown(idx);
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none focus-visible:ring-1 focus-visible:ring-cyan-500"
              aria-label={t('editor.moveDown')}
              title={t('editor.moveDown')}
            >
              <ChevronDownIcon size={16} />
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
                onDuplicate(slide.id);
              }}
              className="p-1 rounded text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:ring-1 focus-visible:ring-cyan-500"
              aria-label={t('editor.duplicateSlide')}
              title={t('editor.duplicateSlide')}
            >
              ⎘
            </button>
          )}
          {totalSlides > 1 && (
            <button
              type="button"
              data-testid={`rail-delete-${slide.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(slide.id);
              }}
              className="p-1 rounded text-slate-500 hover:text-red-500 transition-colors focus-visible:ring-1 focus-visible:ring-cyan-500"
              aria-label={t('editor.deleteSlide')}
              title={t('editor.deleteSlide')}
            >
              <TrashIcon size={16} />
            </button>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
});

export const SlideRail: React.FC<SlideRailProps> = ({
  className = '',
  collapsed = false,
  onToggleCollapsed,
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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');

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

  const handleAddSlide = (type: SlideType = 'explain') => {
    addSlide(type);
  };

  const handleReorder = (newSlides: Slide[]) => {
    // Find the moved slide and announce position change
    const oldIndex = slides.findIndex((s, i) => s.id !== newSlides[i]?.id);
    if (oldIndex !== -1) {
      const movedSlide = slides[oldIndex];
      const newIndex = newSlides.findIndex((s) => s.id === movedSlide?.id);
      if (newIndex !== -1 && movedSlide) {
        setAnnouncement(
          t('editor.reordered', {
            number: oldIndex + 1,
            position: newIndex + 1,
            total: newSlides.length,
          })
        );
      }
    }

    // Set updated slides in project store with history recording
    useProjectStore.getState().setSlides(newSlides);
  };

  const handleMoveUp = (idx: number) => {
    if (idx > 0) {
      reorderSlides(idx, idx - 1);
      setAnnouncement(
        t('editor.reordered', {
          number: idx + 1,
          position: idx,
          total: slides.length,
        })
      );
    }
  };

  const handleMoveDown = (idx: number) => {
    if (idx < slides.length - 1) {
      reorderSlides(idx, idx + 1);
      setAnnouncement(
        t('editor.reordered', {
          number: idx + 1,
          position: idx + 2,
          total: slides.length,
        })
      );
    }
  };

  if (collapsed) {
    return (
      <aside
        data-testid="slide-rail"
        aria-label={t('editor.slideThumbnails')}
        className={`w-12 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center py-3 gap-3 shrink-0 select-none ${className}`}
      >
        <button
          type="button"
          data-testid="rail-expand-btn"
          onClick={onToggleCollapsed}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title={t('editor.mobileTabSlides')}
          aria-label={t('editor.mobileTabSlides')}
        >
          <CollapseChevron direction="right" size={14} />
        </button>
        <span
          className="text-[11px] font-bold uppercase tracking-[2px] text-stone-400 dark:text-stone-500"
          style={{ writingMode: 'vertical-rl' }}
        >
          {t('editor.mobileTabSlides')}
        </span>
        <span className="text-[10.5px] font-bold font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full px-1.5 py-0.5">
          {slides.length}
        </span>
      </aside>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <aside
        data-testid="slide-rail"
        aria-label={t('editor.slideThumbnails')}
        className={`w-64 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col h-full shrink-0 select-none ${className}`}
      >
        {/* Polite Live Region for screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="rail-live-region"
        >
          {announcement}
        </div>

        {/* Rail Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            {onToggleCollapsed && (
              <button
                type="button"
                data-testid="rail-collapse-btn"
                onClick={onToggleCollapsed}
                className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title={t('dock.collapse')}
                aria-label={t('dock.collapse')}
              >
                <CollapseChevron direction="left" size={13} />
              </button>
            )}
            {t('rail.slidesCount', { count: slides.length })}
          </span>

          {/* Actions are hidden for single-slide posts per Spec §4.4 */}
          {!isPost && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="rail-paste-slides-btn"
                onClick={() => setIsPasteOpen(true)}
                className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={t('paste.title')}
                title={t('paste.title')}
              >
                <ClipboardIcon size={16} />
              </button>
              <div className="relative flex items-center">
                <button
                  type="button"
                  data-testid="rail-add-slide-btn"
                  onClick={() => handleAddSlide('explain')}
                  className="text-xs font-semibold px-2 py-1.5 rounded-l-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1 shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={t('editor.addSlide')}
                  title={t('editor.addSlide')}
                >
                  <span>+</span>
                  <span>{t('editor.addSlide')}</span>
                </button>
                <button
                  type="button"
                  data-testid="rail-add-slide-type-btn"
                  onClick={() => setIsPickerOpen((prev) => !prev)}
                  className="text-xs font-semibold px-1.5 py-1.5 rounded-r-lg bg-amber-700 hover:bg-amber-600 text-white transition-colors border-l border-amber-800 flex items-center justify-center shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={t('editor.chooseSlideType')}
                  title={t('editor.chooseSlideType')}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 11L3 6h10l-5 5z" />
                  </svg>
                </button>
                {isPickerOpen && (
                  <div className="absolute top-full mt-2 left-0 z-50 w-72">
                    <SlideTypePicker
                      onSelectType={(type) => {
                        handleAddSlide(type);
                        setIsPickerOpen(false);
                      }}
                      onClose={() => setIsPickerOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Thumbnails List with Reorder.Group */}
        <Reorder.Group
          as="div"
          axis="y"
          values={slides}
          onReorder={handleReorder}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {slides.map((slide, idx) => (
            <SlideRailItem
              key={slide.id}
              slide={slide}
              idx={idx}
              totalSlides={slides.length}
              isActive={slide.id === activeSlideId}
              isPost={isPost}
              dims={dims}
              aspect={aspect}
              palette={palette}
              thumbWidth={thumbWidth}
              thumbHeight={thumbHeight}
              thumbScale={thumbScale}
              effectiveBrand={effectiveBrand}
              locale={locale}
              onSelect={setActiveSlideId}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDuplicate={duplicateSlide}
              onDelete={deleteSlide}
            />
          ))}
        </Reorder.Group>

        {/* Paste to Slides Dialog */}
        <PasteSlidesDialog
          isOpen={isPasteOpen}
          onClose={() => setIsPasteOpen(false)}
        />
      </aside>
    </MotionConfig>
  );
};
