import React, { useEffect, useState, useRef } from 'react';
import { useT } from '../../i18n';
import { useProjectStore, useActiveSlide, useEffectiveBrand } from '../../store/projectStore';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import { generatePalette } from '../../core/palette';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { CanvasManipulationLayer } from './CanvasManipulationLayer';
import { useSelectionStore } from '../../store/selectionStore';
import { useRecentAssetsStore } from '../../store/recentAssetsStore';
import type { ExtraElement } from '../../core/schema';

export interface MainCanvasProps {
  className?: string;
  showSafeZonesOverride?: boolean;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({
  className = '',
  showSafeZonesOverride,
}) => {
  const { t, locale } = useT();
  const project = useProjectStore((state) => state.project);
  const activeSlideId = useProjectStore((state) => state.activeSlideId);
  const setActiveSlideId = useProjectStore((state) => state.setActiveSlideId);
  const effectiveBrand = useEffectiveBrand();
  const addExtraElement = useProjectStore((state) => state.addExtraElement);
  const selectElement = useSelectionStore((state) => state.selectElement);
  const addRecent = useRecentAssetsStore((state) => state.addRecent);

  const activeSlide = useActiveSlide();
  const [zoomLevel, setZoomLevel] = useState<number>(0.48);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  const handleFit = () => {
    setZoomLevel(0.48);
    setPan({ x: 0, y: 0 });
  };

  const handle100 = () => {
    setZoomLevel(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleStagePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      !target.closest('[data-testid^="element-hit-"]') &&
      !target.closest('[data-testid="element-context-toolbar"]') &&
      !target.closest('[data-testid="element-numeric-inspector"]') &&
      !target.closest('[data-testid="layers-toggle"]') &&
      !target.closest('[data-testid="canvas-layers-panel"]')
    ) {
      selectElement(undefined);
    }
    if ((e.target as HTMLElement).closest('[data-testid="scaled-slide-container"]')) return;
    isPanningRef.current = true;
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    isPanningRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const slides = project.slides;
  const currentIndex = slides.findIndex((s) => s.id === activeSlideId);
  const validIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentSlide = activeSlide || slides[0];

  const dims = getDimensions(project.formatId, project.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const palette = generatePalette(project.primaryColor, project.theme);

  const isStory = project.contentType === 'story' || project.formatId === 'r_9_16';
  const effectiveSafeZones = showSafeZonesOverride !== undefined ? showSafeZonesOverride : showSafeZones;

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (validIndex > 0) {
          setActiveSlideId(slides[validIndex - 1]!.id);
        }
      } else if (e.key === 'ArrowRight') {
        if (validIndex < slides.length - 1) {
          setActiveSlideId(slides[validIndex + 1]!.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [validIndex, slides, setActiveSlideId]);

  if (!currentSlide) {
    return (
      <main className="flex-1 flex items-center justify-center p-8 bg-slate-100 dark:bg-slate-950">
        <p className="text-slate-500">No active slide found.</p>
      </main>
    );
  }

  const scaledWidth = dims.width * zoomLevel;
  const scaledHeight = dims.height * zoomLevel;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!currentSlide) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;

      const data = JSON.parse(dataStr);
      if (data.type !== 'slidethread-asset' || !data.assetId || !data.packId) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const normX = Math.max(0.05, Math.min(0.85, clientX / rect.width));
      const normY = Math.max(0.05, Math.min(0.85, clientY / rect.height));

      let baseWidth = 0.2;
      let baseHeight = 0.2;

      if (data.packId === 'emoji') {
        baseWidth = 0.12;
        baseHeight = 0.12;
      } else if (data.packId === 'stickers') {
        baseWidth = 0.28;
        baseHeight = 0.1;
      } else if (data.packId === 'icons') {
        baseWidth = 0.15;
        baseHeight = 0.15;
      }

      const newExtra: ExtraElement = {
        id: `${data.packId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        kind: 'shape',
        assetId: data.assetId,
        x: Math.max(0.02, normX - baseWidth / 2),
        y: Math.max(0.02, normY - baseHeight / 2),
        w: baseWidth,
        h: baseHeight,
        rotation: 0,
        z: (currentSlide.extras?.length ?? 0) + 1,
        locked: false,
        fill: data.packId === 'shapes' || data.packId === 'icons' ? (project.primaryColor || '#0891b2') : undefined,
      };

      addExtraElement(currentSlide.id, newExtra);
      selectElement(newExtra.id);
      addRecent(data.packId, data.assetId);
    } catch {
      // Ignored
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <main
      data-testid="main-canvas"
      aria-label="Slide preview canvas"
      className={`flex-1 flex flex-col justify-between overflow-hidden bg-stone-100/70 dark:bg-stone-950 relative ${className}`}
    >
      {/* Canvas Top Bar: Quick status & controls */}
      <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 bg-white/70 dark:bg-stone-900/70 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-stone-700 dark:text-stone-200">
            {dims.width} × {dims.height} px
          </span>
          <span>•</span>
          <span className="capitalize">{aspect}</span>
          <span>•</span>
          <span className="capitalize">{project.templateId}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Safe Zones Toggle */}
          {isStory && (
            <button
              type="button"
              data-testid="canvas-safe-zones-btn"
              onClick={() => setShowSafeZones(!showSafeZones)}
              aria-label={t('design.safeZones')}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${effectiveSafeZones
                ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                : 'border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
            >
              {effectiveSafeZones ? '🛡️ Safe Zones ON' : 'Safe Zones'}
            </button>
          )}

          {/* Zoom Level & Fit Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="canvas-zoom-out-btn"
              onClick={() => setZoomLevel((z) => Math.max(0.2, Math.round((z - 0.05) * 100) / 100))}
              className="w-6 h-6 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300 focus-visible:ring-1 focus-visible:ring-amber-500 cursor-pointer"
              aria-label="Zoom out"
              title="Zoom out"
            >
              -
            </button>
            <span data-testid="canvas-zoom-label" className="w-10 text-center font-mono text-stone-700 dark:text-stone-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              data-testid="canvas-zoom-in-btn"
              onClick={() => setZoomLevel((z) => Math.min(1.5, Math.round((z + 0.05) * 100) / 100))}
              className="w-6 h-6 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300 focus-visible:ring-1 focus-visible:ring-amber-500 cursor-pointer"
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>

            <button
              type="button"
              data-testid="canvas-fit-btn"
              onClick={handleFit}
              className="px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 font-semibold text-[11px] text-stone-700 dark:text-stone-300 transition-colors"
              title="Fit to Screen"
            >
              Fit
            </button>

            <button
              type="button"
              data-testid="canvas-100-btn"
              onClick={handle100}
              className="px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 font-semibold text-[11px] text-stone-700 dark:text-stone-300 transition-colors"
              title="100% Size"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Centered Scaled Stage with Pan & Paper Lift */}
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
      >
        <div
          data-testid="scaled-slide-container"
          onPointerDown={(e) => {
            const target = e.target as HTMLElement;
            if (
              !target.closest('[data-testid^="element-hit-"]') &&
              !target.closest('[data-testid="element-context-toolbar"]') &&
              !target.closest('[data-testid="element-numeric-inspector"]') &&
              !target.closest('[data-testid="brand-override-popover"]')
            ) {
              selectElement(undefined);
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
            background: palette.bg,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition: isPanningRef.current ? 'none' : 'width 0.2s, height 0.2s, transform 0.2s',
          }}
        >
          <div
            style={{
              width: `${dims.width}px`,
              height: `${dims.height}px`,
              transform: `scale(${zoomLevel})`,
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
              showSafeZones={effectiveSafeZones}
              isStory={isStory}
              templateId={project.templateId}
              themeMode={project.theme}
              dimensions={dims}
            />
            <CanvasManipulationLayer slide={currentSlide} aspect={aspect} width={dims.width} height={dims.height} zoom={zoomLevel} />
          </div>
        </div>
      </div>

      {/* Canvas Bottom Navigation Bar */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between z-10">
        <button
          type="button"
          data-testid="canvas-prev-btn"
          disabled={validIndex <= 0}
          onClick={() => setActiveSlideId(slides[validIndex - 1]!.id)}
          aria-label={t('editor.prevSlide')}
          className="py-1.5 px-3 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          {locale === 'ar' ? 'السابق →' : '← Previous'}
        </button>

        <span data-testid="canvas-counter-label" className="text-xs font-bold text-stone-600 dark:text-stone-400">
          {t('editor.slideCounter', { current: validIndex + 1, total: slides.length })}
        </span>

        <button
          type="button"
          data-testid="canvas-next-btn"
          disabled={validIndex >= slides.length - 1}
          onClick={() => setActiveSlideId(slides[validIndex + 1]!.id)}
          aria-label={t('editor.nextSlide')}
          className="py-1.5 px-3 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          {locale === 'ar' ? '← التالي' : 'Next →'}
        </button>
      </div>
    </main>
  );
};
