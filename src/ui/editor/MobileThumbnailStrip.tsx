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
import { ClipboardIcon, SparkleIcon, CollapseChevron } from '../common/icons';

export interface MobileThumbnailStripProps {
  className?: string;
  /** Collapses the strip to a thin bar (mobile redesign). */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
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
  canDelete: boolean;
  onSelect: (id: string) => void;
  onMoveEarlier: (idx: number) => void;
  onMoveLater: (idx: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
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
  canDelete,
  onSelect,
  onMoveEarlier,
  onMoveLater,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useT();
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
                templateSnapshot={useProjectStore.getState().project.templateSnapshot}
            themeMode={themeMode}
            dimensions={dims}
            projectBackground={useProjectStore((state) => state.project.background)}
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

      {/* Touch has no hover: the selected card carries its actions inline */}
      {isActive && !isPost && (
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-0.5 p-0.5 bg-gradient-to-t from-black/80 to-transparent">
          <button
            type="button"
            data-testid="mobile-move-earlier-btn"
            disabled={idx === 0}
            onClick={(e) => { e.stopPropagation(); onMoveEarlier(idx); }}
            aria-label={t('editor.moveUp')}
            title={t('editor.moveUp')}
            className="h-5.5 min-h-[22px] rounded-md bg-white/90 text-stone-800 flex items-center justify-center disabled:opacity-30"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
          </button>
          <button
            type="button"
            data-testid="mobile-move-later-btn"
            disabled={idx === totalSlides - 1}
            onClick={(e) => { e.stopPropagation(); onMoveLater(idx); }}
            aria-label={t('editor.moveDown')}
            title={t('editor.moveDown')}
            className="h-5.5 min-h-[22px] rounded-md bg-white/90 text-stone-800 flex items-center justify-center disabled:opacity-30"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </button>
          <button
            type="button"
            data-testid="mobile-duplicate-slide-btn"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            aria-label={t('editor.duplicateSlide')}
            title={t('editor.duplicateSlide')}
            className="h-5.5 min-h-[22px] rounded-md bg-white/90 text-stone-800 flex items-center justify-center"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
          </button>
          <button
            type="button"
            data-testid="mobile-delete-slide-btn"
            disabled={!canDelete}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label={t('editor.deleteSlide')}
            title={t('editor.deleteSlide')}
            className="h-5.5 min-h-[22px] rounded-md bg-white/90 text-red-600 flex items-center justify-center disabled:opacity-30"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7" /><path d="M10 11v5M14 11v5" /></svg>
          </button>
        </div>
      )}
    </Reorder.Item>
  );
});

export const MobileThumbnailStrip: React.FC<MobileThumbnailStripProps> = ({
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

  if (collapsed) {
    return (
      <div
        data-testid="mobile-thumbnail-strip"
        className={`border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm px-3 flex items-center justify-between h-8 shrink-0 select-none ${className}`}
      >
        <span className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[1.4px] text-stone-500 dark:text-stone-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9.5h16M9.5 9.5V20" /></svg>
          {t('editor.mobileTabSlides')}
          <span className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-full px-2 py-px text-[10px] tracking-normal">
            {slides.length}
          </span>
        </span>
        <button
          type="button"
          data-testid="mobile-strip-expand-btn"
          onClick={onToggleCollapsed}
          className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          aria-label={t('dock.expand')}
        >
          <CollapseChevron direction="down" size={14} />
        </button>
      </div>
    );
  }

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

        {/* Horizontal Thumbnails Row with Reorder.Group + collapse chevron */}
        <div className="flex items-center gap-1">
        <Reorder.Group
          as="div"
          axis="x"
          values={slides}
          onReorder={handleReorder}
          className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none"
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
              canDelete={slides.length > 1}
              onMoveEarlier={() => handleMoveEarlier()}
              onMoveLater={() => handleMoveLater()}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
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
                aria-label={t('editor.chooseSlideType')}
                title={t('editor.chooseSlideType')}
                className="shrink-0 min-h-[44px] min-w-[36px] h-[60px] w-9 rounded-xl border-2 border-dashed border-amber-400/60 dark:border-amber-700/60 bg-amber-500/5 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center text-xs hover:bg-amber-500/15 transition-colors"
              >
                <SparkleIcon size={16} />
              </button>
              <button
                type="button"
                data-testid="mobile-paste-slides-btn"
                onClick={() => setIsPasteOpen(true)}
                aria-label={t('paste.title')}
                title={t('paste.title')}
                className="shrink-0 min-h-[44px] min-w-[44px] h-[60px] w-12 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-100/50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 flex flex-col items-center justify-center font-bold text-sm hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-colors"
              >
                <ClipboardIcon size={16} />
              </button>
            </>
          )}
        </Reorder.Group>

        {onToggleCollapsed && (
          <button
            type="button"
            data-testid="mobile-strip-collapse-btn"
            onClick={onToggleCollapsed}
            className="shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('dock.collapse')}
          >
            <CollapseChevron direction="up" size={14} />
          </button>
        )}
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
