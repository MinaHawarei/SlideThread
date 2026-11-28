import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide, useEffectiveBrand } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { undo, redo, useHistoryStore } from '../../store/history';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { MobileThumbnailStrip } from './MobileThumbnailStrip';
import { MobileBottomSheet } from './MobileBottomSheet';
import { SlideInspector } from './SlideInspector';
import { DesignInspector } from './DesignInspector';
import { BrandInspector } from './BrandInspector';
import { AssetsPanel } from './AssetsPanel';
import { StorageQuotaBanner } from '../common/StorageQuotaBanner';
import { handleExportProject } from '../../core/projectIO';
import { SizeWarningModal } from '../common/SizeWarningModal';
import { CanvasManipulationLayer } from './CanvasManipulationLayer';
import { ElementPropertiesPanel } from './ElementPropertiesPanel';
import { LayersPanel } from './LayersPanel';
import { DirectionalNavButton } from '../common/SlideNavControls';
import type { ExportFormat } from '../../export/pipeline';
import {
  CollapseChevron,
  ChevronLeftIcon,
  CodeIcon,
  DownloadIcon,
  ImageIcon,
  PageIcon,
  PencilIcon,
  PenIcon,
  ShapesIcon,
  ShieldIcon,
  SlidersIcon,
  SlidesIcon,
  TemplateIcon,
  TextIcon,
  UndoIcon,
  RedoIcon,
} from '../common/icons';

export type MobileTool = 'templates' | 'elements' | 'draw' | 'text' | 'media' | 'edit' | 'export';

export interface EditorMobileProps {
  onHome?: () => void;
  onOpenExport?: (format?: ExportFormat) => void;
}

/* --- Small collapsible card, same language as the desktop dock --- */
interface MobileCardProps {
  title: string;
  hint?: string;
  testId: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const MobileCard: React.FC<MobileCardProps> = ({ title, hint, testId, collapsed, onToggle, children }) => (
  <section
    data-testid={testId}
    className="mx-3 mb-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 overflow-hidden"
  >
    <button
      type="button"
      data-testid={`${testId}-head`}
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2.5 text-left hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
    >
      <CollapseChevron
        direction={collapsed ? 'right' : 'down'}
        size={13}
        className="text-stone-400 shrink-0"
      />
      <span className="flex-1 text-[10.5px] font-bold uppercase tracking-[1.4px] text-stone-800 dark:text-stone-100 whitespace-nowrap">
        {title}
      </span>
      {collapsed && hint && (
        <span className="text-[10.5px] text-stone-400 dark:text-stone-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[45%] text-right">
          {hint}
        </span>
      )}
    </button>
    {!collapsed && <div className="pb-1">{children}</div>}
  </section>
);

const mobileTabClass = (active: boolean) =>
  `flex-1 py-1.5 min-h-[40px] rounded-lg text-xs font-bold transition-all ${
    active
      ? 'bg-stone-100 dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
  }`;

export const EditorMobile: React.FC<EditorMobileProps> = ({
  onHome,
  onOpenExport,
}) => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlideId = useProjectStore((state) => state.activeSlideId);
  const setActiveSlideId = useProjectStore((state) => state.setActiveSlideId);
  const updateProjectMeta = useProjectStore((state) => state.updateProjectMeta);
  const effectiveBrand = useEffectiveBrand();
  const selectedElementId = useSelectionStore((state) => state.selectedElementId);
  const penMode = useSelectionStore((state) => state.penMode);
  const setPenMode = useSelectionStore((state) => state.setPenMode);
  const canUndo = useHistoryStore((state) => state.canUndo);
  const canRedo = useHistoryStore((state) => state.canRedo);

  const activeSlide = useActiveSlide();
  const slides = project.slides;
  const activeIndex = slides.findIndex((s) => s.id === activeSlideId);
  const validIndex = activeIndex >= 0 ? activeIndex : 0;
  const currentSlide = activeSlide || slides[0];

  // Mobile navigation & bottom-sheet state
  const [activeTool, setActiveTool] = useState<MobileTool | null>(null);
  const [isStripExpanded, setIsStripExpanded] = useState<boolean>(true);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);

  // Edit-sheet cards state
  const [cardCollapsed, setCardCollapsed] = useState({ props: false, design: false, layers: false });
  const [psTab, setPsTab] = useState<'properties' | 'slide'>('slide');
  const [dbTab, setDbTab] = useState<'design' | 'brand'>('design');

  // Open the Edit sheet automatically only when the branding element ('signature') is
  // selected/tapped (unchanged legacy behavior; other elements keep canvas focus)
  const prevSelectedIdRef = useRef<string | undefined>(selectedElementId);
  useEffect(() => {
    if (prevSelectedIdRef.current !== 'signature' && selectedElementId === 'signature') {
      setActiveTool('edit');
      setPsTab('properties');
      setCardCollapsed((prev) => ({ ...prev, props: false }));
    }
    prevSelectedIdRef.current = selectedElementId;
  }, [selectedElementId]);

  const [sizeWarning, setSizeWarning] = useState<{
    isOpen: boolean;
    sizeMB: string;
    proceed: () => void;
  }>({
    isOpen: false,
    sizeMB: '0',
    proceed: () => { },
  });

  const handleExportJson = async () => {
    await handleExportProject(project, (sizeMB, proceed) => {
      setSizeWarning({
        isOpen: true,
        sizeMB,
        proceed: () => {
          setSizeWarning((prev) => ({ ...prev, isOpen: false }));
          proceed();
        },
      });
    });
  };

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
  const isPost = project.contentType === 'post';
  const isSingleSlide = slides.length <= 1 || isPost;

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
      // The layout never mirrors: swipe-left is always "next", swipe-right "prev".
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Tool switching: tapping the active tool again closes its sheet
  const handleToolClick = (tool: MobileTool) => {
    if (tool === 'edit' && selectedElementId) {
      // With an element selected, Edit lands on its Properties tab (legacy behavior)
      setPsTab('properties');
      setCardCollapsed((prev) => ({ ...prev, props: false }));
    }
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  const handleCloseSheet = () => {
    setActiveTool(null);
  };

  const sheetTitle =
    activeTool === 'templates'
      ? t('rail.templates')
      : activeTool === 'elements'
        ? t('rail.elements')
        : activeTool === 'draw'
          ? t('rail.draw')
          : activeTool === 'text'
            ? t('rail.text')
            : activeTool === 'media'
              ? t('rail.media')
              : activeTool === 'edit'
                ? selectedElementId
                  ? t('editor.elementProperties')
                  : t('editor.mobileTabEdit')
                : t('editor.export');

  const toolBtnClass = (active: boolean) =>
    `flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[8.5px] font-semibold transition-colors border-t-2 ${
      active
        ? 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-500/10'
        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border-transparent'
    }`;

  return (
    <div
      data-testid="editor-mobile"
      className="h-screen w-screen flex flex-col bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden select-none"
    >
      <StorageQuotaBanner />
      {/* Mobile Top Navigation Header */}
      <header className="h-14 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 px-2 flex items-center justify-between shrink-0 z-20 pt-[env(safe-area-inset-top,0px)] gap-1">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button
            type="button"
            data-testid="mobile-editor-home-btn"
            onClick={onHome}
            aria-label={t('editor.returnHome')}
            className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors shrink-0 text-stone-700 dark:text-stone-300"
          >
            <ChevronLeftIcon size={20} />
          </button>

          {/* Project Title Input */}
          <input
            data-testid="mobile-editor-project-title"
            type="text"
            value={project.title}
            onChange={(e) => updateProjectMeta({ title: e.target.value })}
            placeholder="Untitled Presentation"
            className="min-h-[44px] flex-1 min-w-0 font-serif font-bold text-xs sm:text-sm py-1.5 px-2 rounded-lg border border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 bg-transparent focus:bg-stone-50 dark:focus:bg-stone-800 focus:outline-none transition-colors truncate text-center"
          />
        </div>

        {/* Right: Undo/Redo & Export */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-testid="mobile-editor-undo-btn"
            disabled={!canUndo}
            onClick={() => undo()}
            aria-label={t('editor.undo')}
            title={t('editor.undo')}
            className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <UndoIcon size={17} />
          </button>
          <button
            type="button"
            data-testid="mobile-editor-redo-btn"
            disabled={!canRedo}
            onClick={() => redo()}
            aria-label={t('editor.redo')}
            title={t('editor.redo')}
            className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <RedoIcon size={17} />
          </button>
          <button
            type="button"
            data-testid="mobile-export-btn"
            onClick={() => handleToolClick('export')}
            className="min-h-[40px] px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <DownloadIcon size={15} />
            <span>{t('editor.export')}</span>
          </button>
        </div>
      </header>

      {/* Horizontal Thumbnail Strip (collapsible) */}
      <MobileThumbnailStrip
        collapsed={!isStripExpanded}
        onToggleCollapsed={() => setIsStripExpanded((prev) => !prev)}
      />

      {/* Main Mobile Canvas with Swipe Gesture */}
      <main
        ref={canvasContainerRef}
        data-testid="mobile-canvas"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('[data-testid^="element-hit-"]') && !target.closest('[data-testid="mobile-selection-toolbar"]')) {
            useSelectionStore.getState().selectElement(undefined);
          }
        }}
        style={selectedElementId ? { paddingBottom: 88 } : undefined}
        className="flex-1 flex flex-col items-center justify-center p-3 relative overflow-hidden bg-stone-100 dark:bg-stone-950"
      >
        {/* Floating Safe-Zones toggle (story formats only) */}
        {isStory && (
          <button
            type="button"
            data-testid="mobile-safe-zones-btn"
            onClick={() => setShowSafeZones(!showSafeZones)}
            aria-label="Toggle story safe zones"
            title="Safe Zones (14%)"
            className={`absolute top-2 end-2 z-10 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border backdrop-blur-md transition-colors ${showSafeZones
              ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
              : 'bg-stone-50/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400'
              }`}
          >
            <ShieldIcon size={15} />
          </button>
        )}

        {/* Scaled Slide Box */}
        {currentSlide && (
          <div
            data-testid="mobile-scaled-slide-container"
            className="relative"
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              position: 'relative',
              overflow: 'visible',
              borderRadius: '12px',
              boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.4), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
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
                brand={effectiveBrand}
                slideIndex={validIndex}
                totalSlides={slides.length}
                showCounter={project.contentType !== 'post'}
                counterConfig={project.counter}
                signatureConfig={project.signature}
                showSafeZones={showSafeZones}
                isStory={isStory}
                templateId={project.templateId}
                templateSnapshot={project.templateSnapshot}
                themeMode={project.theme}
                dimensions={dims}
                projectBackground={project.background}
              />
            </div>
            <CanvasManipulationLayer slide={currentSlide} aspect={aspect} width={scaledWidth} height={scaledHeight} zoom={scale} hideBrandPopover />
          </div>
        )}

        {/* Floating Bottom Canvas Nav Pill (Previous / Counter / Next) */}
        {!selectedElementId && <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
          <div className="bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-md px-2 py-1 rounded-full shadow-lg border border-stone-200/80 dark:border-stone-800 flex items-center gap-1.5 pointer-events-auto">
            <DirectionalNavButton
              roleType="prev"
              variant="chevron"
              data-testid="mobile-prev-slide-btn"
              disabled={validIndex === 0}
              onClick={prevSlide}
              aria-label={t('editor.prevSlide')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold text-sm text-stone-700 dark:text-stone-300"
            />

            <span
              data-testid="mobile-slide-counter"
              className="font-mono text-xs font-semibold px-2 text-stone-700 dark:text-stone-300"
            >
              <bdi dir="ltr">{validIndex + 1} / {slides.length}</bdi>
            </span>

            <DirectionalNavButton
              roleType="next"
              variant="chevron"
              data-testid="mobile-next-slide-btn"
              disabled={validIndex >= slides.length - 1}
              onClick={nextSlide}
              aria-label={t('editor.nextSlide')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold text-sm text-stone-700 dark:text-stone-300"
            />
          </div>
        </div>}
      </main>

      {/* Bottom Tool Bar (Slides | Templates | Elements | Draw | Text | Media | Edit) */}
      <nav
        data-testid="mobile-bottom-tabs"
        role="tablist"
        aria-label="Mobile Navigation Tabs"
        className="h-16 border-t border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-stretch shrink-0 z-30 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTool === null && isStripExpanded}
          data-testid="mobile-tab-slides"
          onClick={() => {
            if (activeTool !== null) {
              setActiveTool(null);
              setIsStripExpanded(true);
            } else {
              setIsStripExpanded((prev) => !prev);
            }
          }}
          className={toolBtnClass(activeTool === null && isStripExpanded)}
        >
          <SlidesIcon size={19} />
          <span>{t('editor.mobileTabSlides')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTool === 'templates'}
          data-testid="mobile-tab-templates"
          onClick={() => handleToolClick('templates')}
          className={toolBtnClass(activeTool === 'templates')}
        >
          <TemplateIcon size={19} />
          <span>{t('rail.templates')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTool === 'elements'}
          data-testid="mobile-tab-elements"
          onClick={() => handleToolClick('elements')}
          className={toolBtnClass(activeTool === 'elements')}
        >
          <ShapesIcon size={19} />
          <span>{t('rail.elements')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTool === 'draw' || penMode !== 'off'}
          data-testid="mobile-tab-draw"
          onClick={() => handleToolClick('draw')}
          className={toolBtnClass(activeTool === 'draw' || penMode !== 'off')}
        >
          <PencilIcon size={19} />
          <span>{t('rail.draw')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTool === 'text'}
          data-testid="mobile-tab-text"
          onClick={() => handleToolClick('text')}
          className={toolBtnClass(activeTool === 'text')}
        >
          <TextIcon size={19} />
          <span>{t('rail.text')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTool === 'media'}
          data-testid="mobile-tab-media"
          onClick={() => handleToolClick('media')}
          className={toolBtnClass(activeTool === 'media')}
        >
          <ImageIcon size={19} />
          <span>{t('rail.media')}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTool === 'edit'}
          data-testid="mobile-tab-edit"
          onClick={() => handleToolClick('edit')}
          className={toolBtnClass(activeTool === 'edit')}
        >
          <SlidersIcon size={19} />
          <span>{t('editor.mobileTabEdit')}</span>
        </button>
      </nav>

      {/* Bottom-Sheet per tool */}
      <MobileBottomSheet
        isOpen={activeTool !== null}
        onClose={handleCloseSheet}
        halfHeight={activeTool === 'edit' && Boolean(selectedElementId)}
        title={sheetTitle}
      >
        {activeTool === 'templates' && <DesignInspector />}

        {activeTool === 'elements' && (
          <AssetsPanel initialCategory="shapes" onAssetAdded={handleCloseSheet} />
        )}

        {activeTool === 'media' && (
          <AssetsPanel initialCategory="all" onAssetAdded={handleCloseSheet} />
        )}

        {activeTool === 'draw' && (
          <div className="p-4 flex flex-col gap-2.5">
            <button
              type="button"
              data-testid="mobile-draw-pencil"
              aria-pressed={penMode === 'pencil'}
              onClick={() => {
                setPenMode(penMode === 'pencil' ? 'off' : 'pencil');
                handleCloseSheet();
              }}
              className={`min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-colors ${
                penMode === 'pencil'
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200'
              }`}
            >
              <PencilIcon size={18} />
              <span>
                Pencil
                <span className="block text-[11px] font-normal text-stone-400 dark:text-stone-500">
                  {t('rail.pencilHint')}
                </span>
              </span>
            </button>
            <button
              type="button"
              data-testid="mobile-draw-pen"
              aria-pressed={penMode === 'pen'}
              onClick={() => {
                setPenMode(penMode === 'pen' ? 'off' : 'pen');
                handleCloseSheet();
              }}
              className={`min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-colors ${
                penMode === 'pen'
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200'
              }`}
            >
              <PenIcon size={18} />
              <span>
                Pen
                <span className="block text-[11px] font-normal text-stone-400 dark:text-stone-500">
                  {t('rail.penHint')}
                </span>
              </span>
            </button>
          </div>
        )}

        {activeTool === 'text' && <SlideInspector />}

        {activeTool === 'edit' && (
          <div className="pt-3">
            {/* Card 1: Properties | Slide */}
            <MobileCard
              title={t('dock.propsSlide')}
              hint={selectedElementId ? selectedElementId : currentSlide ? t(`slideType.${currentSlide.type}`) : ''}
              testId="mobile-card-props"
              collapsed={cardCollapsed.props}
              onToggle={() => setCardCollapsed((prev) => ({ ...prev, props: !prev.props }))}
            >
              <div className="px-3 pt-1 pb-2 grid grid-cols-2 gap-1.5 p-1" role="tablist" aria-label={t('dock.propsSlide')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={psTab === 'properties'}
                  data-testid="mobile-tab-properties"
                  onClick={() => setPsTab('properties')}
                  className={mobileTabClass(psTab === 'properties')}
                >
                  {t('dock.properties')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={psTab === 'slide'}
                  data-testid="mobile-tab-slide"
                  onClick={() => setPsTab('slide')}
                  className={mobileTabClass(psTab === 'slide')}
                >
                  {t('editor.tabSlide')}
                </button>
              </div>
              {psTab === 'properties' ? (
                selectedElementId ? (
                  <ElementPropertiesPanel onClose={handleCloseSheet} inlineBrandOverride />
                ) : (
                  <p
                    data-testid="mobile-properties-empty-hint"
                    className="px-4 py-6 text-center text-xs text-stone-400 dark:text-stone-500"
                  >
                    {t('dock.selectElementHint')}
                  </p>
                )
              ) : (
                <SlideInspector />
              )}
            </MobileCard>

            {/* Card 2: Design | Brand */}
            <MobileCard
              title={t('dock.designBrand')}
              hint={`${project.theme === 'dark' ? t('design.theme.dark') : t('design.theme.light')} · ${project.primaryColor}`}
              testId="mobile-card-design"
              collapsed={cardCollapsed.design}
              onToggle={() => setCardCollapsed((prev) => ({ ...prev, design: !prev.design }))}
            >
              <div className="px-3 pt-1 pb-2 grid grid-cols-2 gap-1.5 p-1" role="tablist" aria-label={t('dock.designBrand')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={dbTab === 'design'}
                  data-testid="mobile-design-subtab-design"
                  onClick={() => setDbTab('design')}
                  className={mobileTabClass(dbTab === 'design')}
                >
                  {t('editor.tabDesign')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={dbTab === 'brand'}
                  data-testid="mobile-design-subtab-brand"
                  onClick={() => setDbTab('brand')}
                  className={mobileTabClass(dbTab === 'brand')}
                >
                  {t('editor.tabBrand')}
                </button>
              </div>
              {dbTab === 'design' ? <DesignInspector /> : <BrandInspector />}
            </MobileCard>

            {/* Card 3: Layers */}
            <MobileCard
              title={t('editor.tabLayers')}
              hint={currentSlide ? t(`slideType.${currentSlide.type}`) : ''}
              testId="mobile-card-layers"
              collapsed={cardCollapsed.layers}
              onToggle={() => setCardCollapsed((prev) => ({ ...prev, layers: !prev.layers }))}
            >
              <LayersPanel
                onSelectLayer={() => {
                  setPsTab('properties');
                  setCardCollapsed((prev) => ({ ...prev, props: false }));
                }}
              />
            </MobileCard>
          </div>
        )}

        {activeTool === 'export' && (
          <div data-testid="mobile-export-sheet" className="p-4 flex flex-col gap-2.5">
            <p className="text-xs text-stone-500 dark:text-stone-400 px-1">
              {t('export.title')} ({slides.length} slides)
            </p>

            <button
              type="button"
              data-testid="mobile-export-images"
              onClick={() => {
                handleCloseSheet();
                onOpenExport?.(isSingleSlide ? 'png' : 'zip');
              }}
              className="min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-left text-sm font-semibold text-stone-800 dark:text-stone-100 transition-colors"
            >
              <ImageIcon size={18} className="text-stone-400 shrink-0" />
              <span>
                {t('export.menuImages')}
                <span className="block text-[11px] font-normal text-stone-400 dark:text-stone-500">
                  {t('export.menuImagesHint')}
                </span>
              </span>
            </button>

            <button
              type="button"
              data-testid="mobile-export-pdf"
              onClick={() => {
                handleCloseSheet();
                onOpenExport?.('pdf');
              }}
              className="min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-left text-sm font-semibold text-stone-800 dark:text-stone-100 transition-colors"
            >
              <PageIcon size={18} className="text-stone-400 shrink-0" />
              <span>
                {t('export.menuPdf')}
                <span className="block text-[11px] font-normal text-stone-400 dark:text-stone-500">
                  {t('export.menuPdfHint')}
                </span>
              </span>
            </button>

            <button
              type="button"
              data-testid="mobile-export-json"
              onClick={() => {
                handleCloseSheet();
                handleExportJson();
              }}
              className="min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-left text-sm font-semibold text-stone-800 dark:text-stone-100 transition-colors"
            >
              <CodeIcon size={18} className="text-stone-400 shrink-0" />
              <span>
                {t('export.menuJson')}
                <span className="block text-[11px] font-normal text-stone-400 dark:text-stone-500">
                  {t('export.menuJsonHint')}
                </span>
              </span>
            </button>
          </div>
        )}
      </MobileBottomSheet>

      {/* Size Warning Modal */}
      <SizeWarningModal
        isOpen={sizeWarning.isOpen}
        sizeMB={sizeWarning.sizeMB}
        onConfirm={sizeWarning.proceed}
        onCancel={() => setSizeWarning((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
