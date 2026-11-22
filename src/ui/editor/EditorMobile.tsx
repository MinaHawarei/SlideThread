import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { MobileThumbnailStrip } from './MobileThumbnailStrip';
import { MobileBottomSheet } from './MobileBottomSheet';
import { SlideInspector } from './SlideInspector';
import { DesignInspector } from './DesignInspector';
import { BrandInspector } from './BrandInspector';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export type MobileTab = 'slides' | 'edit' | 'design' | 'export';

export interface EditorMobileProps {
  onHome?: () => void;
  onOpenExport?: () => void;
}

export const EditorMobile: React.FC<EditorMobileProps> = ({
  onHome,
  onOpenExport,
}) => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlideId = useProjectStore((state) => state.activeSlideId);
  const setActiveSlideId = useProjectStore((state) => state.setActiveSlideId);
  const updateProjectMeta = useProjectStore((state) => state.updateProjectMeta);
  const settings = useSettingsStore((state) => state.settings);

  const activeSlide = useActiveSlide();
  const slides = project.slides;
  const activeIndex = slides.findIndex((s) => s.id === activeSlideId);
  const validIndex = activeIndex >= 0 ? activeIndex : 0;
  const currentSlide = activeSlide || slides[0];

  // Mobile navigation & bottom-sheet state
  const [activeTab, setActiveTab] = useState<MobileTab>('slides');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [designSubTab, setDesignSubTab] = useState<'design' | 'brand'>('design');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);

  // Measure container for responsive slide auto-fit
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 360, height: 400 });

  const updateContainerDimensions = useCallback(() => {
    const el = canvasContainerRef.current;
    if (el && el.clientWidth > 0 && el.clientHeight > 0) {
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    }
  }, []);

  useEffect(() => {
    updateContainerDimensions();
    const el = canvasContainerRef.current;
    if (!el) return;

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        updateContainerDimensions();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [updateContainerDimensions]);

  // Dimensions & scaling
  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const palette = generatePalette(project.primaryColor, project.theme);
  const isStory = project.contentType === 'story' || project.formatId === 'r_9_16';

  // Compute scale to fit inside mobile canvas with comfortable margin
  const paddingHorizontal = 24;
  const paddingVertical = 24;
  const availW = Math.max(100, containerSize.width - paddingHorizontal);
  const availH = Math.max(100, containerSize.height - paddingVertical);
  const scale = Math.min(availW / dims.width, availH / dims.height);
  const scaledWidth = dims.width * scale;
  const scaledHeight = dims.height * scale;

  // Slide navigation
  const prevSlide = () => {
    if (validIndex > 0) {
      setActiveSlideId(slides[validIndex - 1]!.id);
    }
  };

  const nextSlide = () => {
    if (validIndex < slides.length - 1) {
      setActiveSlideId(slides[validIndex + 1]!.id);
    }
  };

  // Swipe gesture handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0]!.clientX;
      touchStartY.current = e.touches[0]!.clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0]!.clientX;
    const touchEndY = e.changedTouches[0]!.clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Threshold: at least 40px horizontal swipe
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      const isRtl = locale === 'ar';
      if (deltaX < 0) {
        // Swipe left
        if (isRtl) {
          prevSlide();
        } else {
          nextSlide();
        }
      } else {
        // Swipe right
        if (isRtl) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }
  };

  // Tab switching
  const handleTabClick = (tab: MobileTab) => {
    setActiveTab(tab);
    if (tab === 'slides') {
      setIsSheetOpen(false);
    } else {
      setIsSheetOpen(true);
    }
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setActiveTab('slides');
  };

  return (
    <div
      data-testid="editor-mobile"
      className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none"
    >
      {/* Mobile Top Navigation Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 flex items-center justify-between shrink-0 z-20">
        {/* Left: Home & Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            data-testid="mobile-editor-home-btn"
            onClick={onHome}
            aria-label="Return to Start Screen"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              S
            </div>
          </button>

          {/* Project Title Input */}
          <input
            data-testid="mobile-editor-project-title"
            type="text"
            value={project.title}
            onChange={(e) => updateProjectMeta({ title: e.target.value })}
            placeholder="Untitled Presentation"
            className="min-h-[44px] flex-1 min-w-0 font-semibold text-xs sm:text-sm py-1.5 px-2 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-cyan-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors truncate"
          />
        </div>

        {/* Right: Quick Story Safe-Zones & Language */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isStory && (
            <button
              type="button"
              data-testid="mobile-safe-zones-btn"
              onClick={() => setShowSafeZones(!showSafeZones)}
              aria-label="Toggle story safe zones"
              title="Safe Zones (14%)"
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border text-xs transition-colors ${
                showSafeZones
                  ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                  : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              🛡️
            </button>
          )}

          <div className="min-h-[44px] flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Horizontal Thumbnail Strip */}
      <MobileThumbnailStrip />

      {/* Main Mobile Canvas with Swipe Gesture */}
      <main
        ref={canvasContainerRef}
        data-testid="mobile-canvas"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 flex flex-col items-center justify-center p-3 relative overflow-hidden bg-slate-100 dark:bg-slate-950"
      >
        {/* Scaled Slide Box */}
        {currentSlide && (
          <div
            data-testid="mobile-scaled-slide-container"
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px',
              boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.35)',
              background: palette.bg,
              transition: 'width 0.2s, height 0.2s',
            }}
          >
            <div
              style={{
                width: `${dims.width}px`,
                height: `${dims.height}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <SlideRenderer
                slide={currentSlide}
                palette={palette}
                aspectClass={aspect}
                textDir={project.textDir === 'auto' ? (locale === 'ar' ? 'rtl' : 'ltr') : project.textDir}
                brand={settings}
                slideIndex={validIndex}
                totalSlides={slides.length}
                showCounter={project.contentType !== 'post'}
                showSafeZones={showSafeZones}
                isStory={isStory}
                templateId={project.templateId}
                dimensions={dims}
              />
            </div>
          </div>
        )}

        {/* Floating Bottom Canvas Nav Pill (Previous / Counter / Next) */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              data-testid="mobile-prev-slide-btn"
              disabled={validIndex === 0}
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold text-sm"
            >
              ‹
            </button>

            <span
              data-testid="mobile-slide-counter"
              className="font-mono text-xs font-semibold px-2 text-slate-700 dark:text-slate-300"
            >
              {validIndex + 1} / {slides.length}
            </span>

            <button
              type="button"
              data-testid="mobile-next-slide-btn"
              disabled={validIndex >= slides.length - 1}
              onClick={nextSlide}
              aria-label="Next Slide"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold text-sm"
            >
              ›
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Tab Bar (Slides | Edit | Design | Export) */}
      <nav
        data-testid="mobile-bottom-tabs"
        role="tablist"
        aria-label="Mobile Navigation Tabs"
        className="h-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-stretch shrink-0 z-30"
      >
        {/* Slides Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'slides'}
          data-testid="mobile-tab-slides"
          onClick={() => handleTabClick('slides')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-xs transition-colors ${
            activeTab === 'slides'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50/50 dark:bg-cyan-950/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>{t('editor.mobileTabSlides')}</span>
        </button>

        {/* Edit Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'edit'}
          data-testid="mobile-tab-edit"
          onClick={() => handleTabClick('edit')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-xs transition-colors ${
            activeTab === 'edit'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50/50 dark:bg-cyan-950/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>{t('editor.mobileTabEdit')}</span>
        </button>

        {/* Design Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'design'}
          data-testid="mobile-tab-design"
          onClick={() => handleTabClick('design')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-xs transition-colors ${
            activeTab === 'design'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50/50 dark:bg-cyan-950/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.772 0 1.5.216 2.118.59l6.293-6.293a3 3 0 114.242 4.242l-6.293 6.293A4 4 0 017 21z" />
          </svg>
          <span>{t('editor.mobileTabDesign')}</span>
        </button>

        {/* Export Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'export'}
          data-testid="mobile-tab-export"
          onClick={() => handleTabClick('export')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-xs transition-colors ${
            activeTab === 'export'
              ? 'text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50/50 dark:bg-cyan-950/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{t('editor.mobileTabExport')}</span>
        </button>
      </nav>

      {/* Bottom-Sheet Inspector */}
      <MobileBottomSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        title={
          activeTab === 'edit'
            ? t('editor.tabSlide')
            : activeTab === 'design'
            ? t('editor.tabDesign')
            : t('editor.mobileTabExport')
        }
      >
        {activeTab === 'edit' && <SlideInspector />}

        {activeTab === 'design' && (
          <div className="flex flex-col">
            {/* Sub-tab segmented switcher: Design vs Brand */}
            <div className="px-4 pt-2">
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  data-testid="mobile-design-subtab-design"
                  onClick={() => setDesignSubTab('design')}
                  className={`min-h-[44px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    designSubTab === 'design'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t('editor.tabDesign')}
                </button>
                <button
                  type="button"
                  data-testid="mobile-design-subtab-brand"
                  onClick={() => setDesignSubTab('brand')}
                  className={`min-h-[44px] py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    designSubTab === 'brand'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t('editor.tabBrand')}
                </button>
              </div>
            </div>

            {designSubTab === 'design' ? <DesignInspector /> : <BrandInspector />}
          </div>
        )}

        {activeTab === 'export' && (
          <div data-testid="mobile-export-sheet" className="p-4 space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('export.title')} ({slides.length} slides)
            </p>

            <button
              type="button"
              data-testid="mobile-start-export-btn"
              onClick={() => {
                handleCloseSheet();
                onOpenExport?.();
              }}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>↓</span>
              <span>{t('editor.export')}</span>
            </button>
          </div>
        )}
      </MobileBottomSheet>
    </div>
  );
};
