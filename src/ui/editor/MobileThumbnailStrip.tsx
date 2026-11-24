import React, { useState, useRef } from 'react';
import { Reorder, useDragControls, MotionConfig } from 'motion/react';
import { useT } from '../../i18n';
import { useProjectStore, useEffectiveBrand } from '../../store/projectStore';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { PasteSlidesDialog } from './PasteSlidesDialog';
import { SlideTypePicker } from './SlideTypePicker';
import { MobileBottomSheet } from './MobileBottomSheet';
import type { SlideType, Slide, CounterConfig, SignatureConfig, ThemeMode, AspectClass } from '../../core/schema';

export interface MobileThumbnailStripProps {
  className?: string;
}

interface MobileThumbItemProps {
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
  textDir: 'ltr' | 'rtl' | 'auto';
  counterConfig?: CounterConfig;
  signatureConfig?: SignatureConfig;
  templateId: string;
  themeMode: ThemeMode;
  onSelect: (id: string) => void;
  onMoveEarlier: (idx: number) => void;
  onMoveLater: (idx: number) => void;
}

const MobileThumbItem: React.FC<MobileThumbItemProps> = React.memo(({
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
  textDir,
  counterConfig,
  signatureConfig,
  templateId,
  themeMode,
  onSelect,
  onMoveEarlier,
  onMoveLater,
}) => {
  const controls = useDragControls();
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideNumber = String(idx + 1).padStart(2, '0');

  const handlePointerDown = (e: React.PointerEvent) => {
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
      data-testid={`mobile-thumb-${slide.id}`}
      role="button"
      tabIndex={0}
      aria-label={`Slide ${idx + 1}`}
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect(slide.id)}
      onPointerDown={!isPost ? handlePointerDown : undefined}
      onPointerUp={!isPost ? handlePointerUpOrCancel : undefined}
      onPointerCancel={!isPost ? handlePointerUpOrCancel : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(slide.id);
        } else if (!isPost && (e.altKey || e.ctrlKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
          e.preventDefault();
          if (idx > 0) onMoveEarlier(idx);
        } else if (!isPost && (e.altKey || e.ctrlKey) && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
          e.preventDefault();
          if (idx < totalSlides - 1) onMoveLater(idx);
        }
      }}
      whileDrag={{
        scale: 1.08,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        zIndex: 40,
      }}
      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
      className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center p-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none select-none ${isActive
        ? 'border-amber-500 shadow-md ring-2 ring-amber-500/30'
        : 'border-stone-200 dark:border-stone-700 opacity-80 hover:opacity-100'
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
            textDir={textDir === 'auto' ? (locale === 'ar' ? 'rtl' : 'ltr') : textDir}
            brand={effectiveBrand}
            slideIndex={idx}
            totalSlides={totalSlides}
            showCounter={!isPost}
            counterConfig={counterConfig}
            signatureConfig={signatureConfig}
            showSafeZones={false}
            isStory={false}
            templateId={templateId}
            themeMode={themeMode}
            dimensions={dims}
          />
        </div>
      </div>

      {/* Number Badge */}
      <span
        className={`absolute bottom-1 end-1 text-[10px] font-mono font-bold px-1 rounded shadow-xs ${isActive
          ? 'bg-cyan-600 text-white'
          : 'bg-black/60 text-white'
          }`}
      >
        {slideNumber}
      </span>
    </Reorder.Item>
  );
});

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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');

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

  const handleReorder = (newSlides: Slide[]) => {
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

    useProjectStore.getState().setSlides(newSlides);
  };

  const handleMoveEarlier = () => {
    if (validIndex > 0) {
      reorderSlides(validIndex, validIndex - 1);
      setAnnouncement(
        t('editor.reordered', {
          number: validIndex + 1,
          position: validIndex,
          total: slides.length,
        })
      );
    }
  };

  const handleMoveLater = () => {
    if (validIndex < slides.length - 1) {
      reorderSlides(validIndex, validIndex + 1);
      setAnnouncement(
        t('editor.reordered', {
          number: validIndex + 1,
          position: validIndex + 2,
          total: slides.length,
        })
      );
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-testid="mobile-thumbnail-strip"
        className={`border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm px-2 py-1.5 flex flex-col gap-1.5 shrink-0 select-none ${className}`}
      >
        {/* Screen Reader Announcement */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="mobile-live-region"
        >
          {announcement}
        </div>

        {/* Horizontal Thumbnails Row with Reorder.Group */}
        <Reorder.Group
          as="div"
          axis="x"
          values={slides}
          onReorder={handleReorder}
          className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none"
        >
          {slides.map((slide, idx) => (
            <MobileThumbItem
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
              textDir={project.textDir}
              counterConfig={project.counter}
              signatureConfig={project.signature}
              templateId={project.templateId}
              themeMode={project.theme}
              onSelect={setActiveSlideId}
              onMoveEarlier={() => handleMoveEarlier()}
              onMoveLater={() => handleMoveLater()}
            />
          ))}

          {/* Add slide button inline in the strip if not single-slide post */}
          {!isPost && (
            <>
              <button
                type="button"
                data-testid="mobile-add-slide-btn"
                onClick={() => handleAddSlide('explain')}
                aria-label={t('editor.addSlide')}
                className="shrink-0 min-h-[44px] min-w-[44px] h-[60px] w-12 rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-600 bg-amber-500/10 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center font-bold text-lg hover:bg-amber-500/20 transition-colors"
              >
                <span>+</span>
              </button>
              <button
                type="button"
                data-testid="mobile-add-slide-type-btn"
                onClick={() => setIsPickerOpen(true)}
                aria-label="Choose slide type"
                title="Choose slide type"
                className="shrink-0 min-h-[44px] min-w-[36px] h-[60px] w-9 rounded-xl border-2 border-dashed border-amber-400/60 dark:border-amber-700/60 bg-amber-500/5 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center text-xs hover:bg-amber-500/15 transition-colors"
              >
                <span>✨</span>
              </button>
              <button
                type="button"
                data-testid="mobile-paste-slides-btn"
                onClick={() => setIsPasteOpen(true)}
                aria-label={t('paste.title')}
                title={t('paste.title')}
                className="shrink-0 min-h-[44px] min-w-[44px] h-[60px] w-12 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-100/50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 flex flex-col items-center justify-center font-bold text-sm hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-colors"
              >
                <span>📋</span>
              </button>
            </>
          )}
        </Reorder.Group>

        {/* Slide Operations Toolbar (Duplicate, Delete, Move Earlier, Move Later) */}
        <div className="flex items-center justify-between px-1 text-xs text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-[11px] font-mono text-stone-600 dark:text-stone-300">
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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

        {/* Visual Slide Type Picker Bottom Sheet */}
        <MobileBottomSheet
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          title={t('editor.addSlide')}
        >
          <SlideTypePicker
            onSelectType={(type) => {
              handleAddSlide(type);
              setIsPickerOpen(false);
            }}
            onClose={() => setIsPickerOpen(false)}
          />
        </MobileBottomSheet>
      </div>
    </MotionConfig>
  );
};