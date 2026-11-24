import React, { useState } from 'react';
import { useT } from '../../i18n';
import { getDemoProjectEn, getDemoProjectAr } from '../../store/seedProjects';
import { SlideRenderer } from '../../slides/SlideRenderer';
import { generatePalette } from '../../core/palette';
import { getDimensions, aspectClass as calcAspectClass } from '../../core/formats';
import type { Project } from '../../core/schema';

export interface HeroCarouselProps {
  onOpenProject?: (project: Project) => void;
  className?: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  onOpenProject,
  className = '',
}) => {
  const { t, locale } = useT();
  const demoProject = locale === 'ar' ? getDemoProjectAr() : getDemoProjectEn();
  const slides = demoProject.slides;

  const [activeIndex, setActiveIndex] = useState(0);

  const dims = getDimensions(demoProject.formatId, demoProject.orientation);
  const aspect = calcAspectClass(dims.width, dims.height);
  const palette = generatePalette(demoProject.primaryColor, demoProject.theme);

  // Scaled dimensions to fit hero card (around 320x400)
  const previewScale = 320 / dims.width;
  const scaledWidth = dims.width * previewScale;
  const scaledHeight = dims.height * previewScale;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const currentSlide = slides[activeIndex]!;

  return (
    <div
      data-testid="hero-carousel"
      className={`relative flex flex-col items-center select-none ${className}`}
    >
      {/* Decorative Orbits & Highlights */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/10 to-transparent rounded-3xl blur-xl -z-10" />

      {/* Slide Container */}
      <div
        data-testid="hero-slide-stage"
        onClick={() => onOpenProject?.(demoProject)}
        className="cursor-pointer group relative overflow-hidden rounded-2xl shadow-2xl border-2 border-slate-200/80 dark:border-slate-800 transition-transform duration-300 hover:scale-[1.02]"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          background: palette.bg,
        }}
      >
        <div
          style={{
            width: `${dims.width}px`,
            height: `${dims.height}px`,
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        >
          <SlideRenderer
            slide={currentSlide}
            palette={palette}
            aspectClass={aspect}
            textDir={demoProject.textDir}
            brand={undefined}
            slideIndex={activeIndex}
            totalSlides={slides.length}
            showCounter={true}
            counterConfig={demoProject.counter}
            signatureConfig={demoProject.signature}
            showSafeZones={false}
            isStory={false}
            templateId={demoProject.templateId}
            themeMode={demoProject.theme}
            dimensions={dims}
          />
        </div>

        {/* Floating badge */}
        <div className="absolute top-3 end-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
          {activeIndex + 1} / {slides.length}
        </div>

        {/* Hover Click affordance */}
        <div className="absolute inset-0 bg-cyan-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-xs font-bold text-slate-900 dark:text-white shadow-md">
            {t('start.openProject')} ↗
          </span>
        </div>
      </div>

      {/* Swipe & Navigation Controls */}
      <div className="flex items-center gap-4 mt-4" dir="ltr">
        <button
          type="button"
          data-testid="hero-prev-btn"
          onClick={handlePrev}
          aria-label={t('editor.prevSlide')}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          {locale === 'ar' ? '→' : '←'}
        </button>

        {/* Slide Dots Indicator */}
        <div className="flex items-center gap-1.5" data-testid="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              data-testid={`hero-dot-${i}`}
              aria-label={`Slide ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(i);
              }}
              className={`h-2 rounded-full transition-all ${
                activeIndex === i
                  ? 'w-6 bg-cyan-600 dark:bg-cyan-400'
                  : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          data-testid="hero-next-btn"
          onClick={handleNext}
          aria-label={t('editor.nextSlide')}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          {locale === 'ar' ? '←' : '→'}
        </button>
      </div>
    </div>
  );
};
