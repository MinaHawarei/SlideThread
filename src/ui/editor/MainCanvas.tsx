import React, { useEffect, useState } from 'react';
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
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);

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
      className={`flex-1 flex flex-col justify-between overflow-hidden bg-slate-100 dark:bg-slate-950 relative ${className}`}
    >
      {/* Canvas Top Bar: Quick status & controls */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
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
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                effectiveSafeZones
                  ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                  : 'border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {effectiveSafeZones ? '🛡️ Safe Zones ON' : 'Safe Zones'}
            </button>
          )}

          {/* Zoom Level Selector */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.3, z - 0.05))}
              className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold focus-visible:ring-1 focus-visible:ring-cyan-500"
              aria-label="Zoom out"
              title="Zoom out"
            >
              -
            </button>
            <span className="w-10 text-center font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(0.8, z + 0.05))}
              className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold focus-visible:ring-1 focus-visible:ring-cyan-500"
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Centered Scaled Stage */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div
          data-testid="scaled-slide-container"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4)',
            background: palette.bg,
            transition: 'width 0.2s, height 0.2s',
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between z-10">
        <button
          type="button"
          data-testid="canvas-prev-btn"
          disabled={validIndex <= 0}
          onClick={() => setActiveSlideId(slides[validIndex - 1]!.id)}
          aria-label={t('editor.prevSlide')}
          className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          ← {locale === 'ar' ? 'التالي' : 'Previous'}
        </button>

        <span data-testid="canvas-counter-label" className="text-xs font-bold text-slate-600 dark:text-slate-400">
          {t('editor.slideCounter', { current: validIndex + 1, total: slides.length })}
        </span>

        <button
          type="button"
          data-testid="canvas-next-btn"
          disabled={validIndex >= slides.length - 1}
          onClick={() => setActiveSlideId(slides[validIndex + 1]!.id)}
          aria-label={t('editor.nextSlide')}
          className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          {locale === 'ar' ? 'السابق' : 'Next'} →
        </button>
      </div>
    </main>
  );
};
