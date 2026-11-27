import { openCreateDialog } from '../store/createDialogStore';
import React, { useState, useEffect } from 'react';
import type { AspectClass, SlideType, ThemeMode, TextDir, TemplateProjectSnapshot } from '../core/schema';
import { generatePalette } from '../core/palette';
import { SlideRenderer } from '../slides/SlideRenderer';
import { SAMPLE_SLIDES } from '../slides/sampleSlides';
import { getAllTemplates } from '../templates';
import { useT } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { Footer } from '../ui/common/Footer';
import { LogoMark } from '../ui/brand/LogoMark';
import { MobileNavDrawer } from '../ui/common/MobileNavDrawer';
import { FORMAT_REGISTRY, type FormatId } from '../core/formats';
import { FALLBACK_PRIMARY_COLOR } from '../templates/defaults';
import { loadTemplateProjectSnapshot, templateDefinitionFromSnapshot } from '../templates/projectSnapshot';
import { useUserTemplateLibrary } from '../templates/useUserTemplateLibrary';

const SLIDE_TYPES: SlideType[] = [
  'cover',
  'explain',
  'rule',
  'compare',
  'code',
  'stat',
  'quote',
  'image',
  'cta',
];

const ASPECT_CLASSES: AspectClass[] = ['landscape', 'square', 'portrait', 'tall'];

const ASPECT_DIMENSIONS: Record<AspectClass, { width: number; height: number; formatId: string }> = {
  landscape: { width: 1920, height: 1080, formatId: 'r_16_9' },
  square: { width: 1080, height: 1080, formatId: 'r_1_1' },
  portrait: { width: 1080, height: 1350, formatId: 'r_4_5' },
  tall: { width: 1080, height: 1920, formatId: 'r_9_16' },
};

export interface TemplatePreviewPageProps {
  onNavigate?: (path: string) => void;
}

export const TemplatePreviewPage: React.FC<TemplatePreviewPageProps> = ({ onNavigate }) => {
  const { t, dir, locale } = useT();
  const brandSettings = useSettingsStore((state) => state.settings);
  const { templates: importedTemplates } = useUserTemplateLibrary();

  const getInitialTemplateId = (): string => {
    if (typeof window === 'undefined') return 'tech-mesh';
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('template') || params.get('id');
    if (paramId) return paramId;
    if (window.location.pathname.startsWith('/preview/')) {
      return window.location.pathname.replace('/preview/', '').trim();
    }
    return 'tech-mesh';
  };

  const [templateId, setTemplateId] = useState<string>(getInitialTemplateId);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAspect, setSelectedAspect] = useState<string>('all');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [textDir, setTextDir] = useState<TextDir>('auto');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(0.22);
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [packageSnapshot, setPackageSnapshot] = useState<TemplateProjectSnapshot>();
  const [packageLoadError, setPackageLoadError] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allTemplates = getAllTemplates();
  useEffect(() => {
    let cancelled = false;
    setPackageSnapshot(undefined);
    setPackageLoadError(false);
    loadTemplateProjectSnapshot(templateId, FALLBACK_PRIMARY_COLOR)
      .then((snapshot) => { if (!cancelled) setPackageSnapshot(snapshot); })
      .catch(() => { if (!cancelled) setPackageLoadError(true); });
    return () => { cancelled = true; };
  }, [templateId]);
  const isKnownTemplate = packageSnapshot?.id === templateId;

  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleUseThisTemplate = () => {
    openCreateDialog({ templateId });
  };

  const handleTemplateChange = (newId: string) => {
    setTemplateId(newId);
    if (typeof window !== 'undefined') {
      const newUrl = `/preview?template=${newId}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  if (!isKnownTemplate && !packageLoadError) {
    return <div data-testid="template-package-loading" className="min-h-screen grid place-items-center">Loading template package…</div>;
  }
  if (!isKnownTemplate) {
    return (
      <div
        dir={dir}
        data-testid="template-preview-unknown"
        className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between"
      >
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <h1 className="text-xl font-bold font-serif">SlideThread</h1>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/gallery')}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              ← {t('nav.gallery')}
            </button>
          </div>
        </header>

        <main className="max-w-md mx-auto w-full p-8 text-center space-y-4 my-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-3xl mx-auto">
            ⚠️
          </div>
          <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            {t('gallery.templateNotFound')}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {t('gallery.templateNotFoundDesc', { templateId })}
          </p>
          <div className="pt-2">
            <button
              type="button"
              data-testid="back-to-gallery-btn"
              onClick={() => navigateTo('/gallery')}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all"
            >
              ← {t('nav.gallery')}
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const selectedTemplate = packageSnapshot ? templateDefinitionFromSnapshot(packageSnapshot) : undefined;
  const selectedTemplateName = allTemplates.find((template) => template.id === templateId)
    ? t(selectedTemplate!.nameKey as Parameters<typeof t>[0])
    : importedTemplates.find((template) => template.id === templateId)?.manifest.name[locale] ?? packageSnapshot?.name?.[locale] ?? templateId;
  const effectivePrimaryColor =
    (theme === 'dark' ? '#35D0E6' : '#0B7FA6');
  const palette = packageSnapshot
    ? packageSnapshot.paletteByMode[theme] as unknown as ReturnType<typeof generatePalette>
    : generatePalette(effectivePrimaryColor, theme);

  // F3: sample content uses "user name" placeholder
  const previewBrand = {
    ...brandSettings,
    displayName: brandSettings.displayName || 'user name',
    handle: brandSettings.handle || '',
    showSignature: true,
    showSocials: false,
    showCounter: true,
    socials: [],
  };

  const typesToRender = selectedType === 'all' ? SLIDE_TYPES : [selectedType as SlideType];
  const aspectsToRender = selectedAspect === 'all' ? ASPECT_CLASSES : [selectedAspect as AspectClass];

  return (
    <div
      dir={dir}
      data-testid="template-preview-page"
      className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Mobile Top Row: Hamburger on start, Logo on end */}
          <div className="flex md:hidden items-center justify-between w-full gap-3">
            <MobileNavDrawer currentPath="/preview" onNavigate={navigateTo} />
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/');
              }}
              dir="ltr"
              className="flex items-center gap-2 text-stone-900 dark:text-white"
            >
              <LogoMark size={24} />
              <span className="font-serif font-bold text-base">SlideThread</span>
            </a>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              data-testid="preview-back-gallery"
              onClick={() => navigateTo('/gallery')}
              className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium px-3 py-1.5 rounded-lg border border-stone-300/50 dark:border-stone-700/50 transition-colors flex items-center gap-1 shrink-0"
            >
              <span>←</span>
              <span>{t('nav.gallery')}</span>
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-white flex items-center gap-2 truncate">
                <span>{selectedTemplateName}</span>
                <span className="text-xs font-mono font-normal text-stone-400">({selectedTemplate!.id})</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="preview-use-btn"
              onClick={handleUseThisTemplate}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              <span>✨</span>
              <span>{t('ux.gallery.use')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Preview Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Controls Toolbar */}
        <section
          data-testid="template-inspector-toolbar"
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Template dropdown */}
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <span>{t('preview.templateLabel')}</span>
                <select
                  value={templateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  data-testid="template-select"
                  className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs rounded-lg px-2.5 py-1.5"
                >
                  {allTemplates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {t(tmpl.nameKey as Parameters<typeof t>[0])} ({tmpl.id})
                    </option>
                  ))}
                  {importedTemplates.map((tmpl) => <option key={tmpl.id} value={tmpl.id}>{tmpl.manifest.name[locale]} ({tmpl.id})</option>)}
                </select>
              </label>

              {/* Slide Type filter */}
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <span>{t('preview.typeLabel')}</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  data-testid="slide-type-filter"
                  className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs rounded-lg px-2.5 py-1.5 capitalize"
                >
                  <option value="all">{t('preview.allTypes', { count: SLIDE_TYPES.length })}</option>
                  {SLIDE_TYPES.map((type) => (
                    <option key={type} value={type} className="capitalize">
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              {/* Aspect filter */}
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <span>{t('preview.aspectLabel')}</span>
                <select
                  value={selectedAspect}
                  onChange={(e) => setSelectedAspect(e.target.value)}
                  data-testid="aspect-filter"
                  className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs rounded-lg px-2.5 py-1.5 capitalize"
                >
                  <option value="all">{t('preview.allAspects', { count: ASPECT_CLASSES.length })}</option>
                  {ASPECT_CLASSES.map((aspect) => (
                    <option key={aspect} value={aspect} className="capitalize">
                      {aspect} ({FORMAT_REGISTRY[ASPECT_DIMENSIONS[aspect].formatId as FormatId]?.label || aspect})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                data-testid="toggle-theme"
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 transition-colors"
              >
                {theme === 'dark' ? t('preview.themeDark') : t('preview.themeLight')}
              </button>

              {/* Safe zones toggle */}
              <button
                type="button"
                onClick={() => setShowSafeZones(!showSafeZones)}
                data-testid="toggle-safe-zones"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  showSafeZones
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white dark:bg-stone-900 text-red-600 border-red-300 dark:border-red-900'
                }`}
              >
                {showSafeZones ? t('preview.safeZonesOn') : t('preview.safeZonesOff')}
              </button>

              {/* Language toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextLang = lang === 'en' ? 'ar' : 'en';
                  setLang(nextLang);
                  setTextDir(nextLang === 'ar' ? 'rtl' : 'ltr');
                }}
                data-testid="toggle-lang"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:border-amber-500 transition-colors"
              >
                {lang === 'en' ? 'English (LTR)' : 'العربية (RTL)'}
              </button>

              {/* Zoom scale slider */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500">
                <span>{t('preview.zoom', { percent: Math.round(previewScale * 100) })}</span>
                <input
                  type="range"
                  min="0.15"
                  max="0.4"
                  step="0.01"
                  value={previewScale}
                  onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                  className="w-20 accent-amber-600"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Grid of Slide Previews - Wrapped and scaled to strictly prevent horizontal overflow */}
        <section aria-label="Archetype slide previews" className="space-y-8 w-full max-w-full overflow-hidden">
          {typesToRender.map((type) => {
            const sampleKey = `${type}_${lang}`;
            const slide = SAMPLE_SLIDES[sampleKey] || SAMPLE_SLIDES[`${type}_en`];
            if (!slide) return null;

            return (
              <div
                key={type}
                className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 w-full max-w-full overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 capitalize">
                    {t('preview.slideHeading', { type })}
                  </h2>
                  <span className="text-xs text-stone-500">
                    {t('preview.variantsCount', { count: aspectsToRender.length })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-6 items-start justify-center sm:justify-start w-full max-w-full overflow-hidden">
                  {aspectsToRender.map((aspect) => {
                    const dims = ASPECT_DIMENSIONS[aspect];

                    // Rule 2.2: Scale down so preview NEVER exceeds available width
                    const availableWidth = Math.max(260, containerWidth - 64);
                    const fitScale = Math.min(previewScale, (availableWidth * 0.95) / dims.width);
                    const scaledWidth = dims.width * fitScale;
                    const scaledHeight = dims.height * fitScale;

                    return (
                      <div
                        key={aspect}
                        className="flex flex-col items-center gap-2 max-w-full overflow-hidden"
                        style={{ maxWidth: '100%' }}
                      >
                        <span className="text-[11px] font-mono font-semibold uppercase text-stone-500">
                          {aspect} ({dims.width}×{dims.height})
                        </span>
                        <div
                          style={{
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                            maxWidth: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '12px',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                            border: '1px solid #334155',
                            background: palette.bg,
                          }}
                        >
                          <div
                            style={{
                              width: `${dims.width}px`,
                              height: `${dims.height}px`,
                              transform: `scale(${fitScale})`,
                              transformOrigin: 'top left',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                            }}
                          >
                            <SlideRenderer
                              slide={packageSnapshot ? {
                                ...slide,
                                extras: packageSnapshot.composition[slide.type]?.[aspect]?.elements ?? [],
                              } : slide}
                              palette={palette}
                              aspectClass={aspect}
                              textDir={textDir}
                              brand={previewBrand}
                              slideIndex={2}
                              totalSlides={7}
                              showCounter={true}
                              showSafeZones={showSafeZones}
                              templateId={templateId}
                              templateSnapshot={packageSnapshot}
                              themeMode={theme}
                              dimensions={dims}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <Footer />
    </div>
  );
};
