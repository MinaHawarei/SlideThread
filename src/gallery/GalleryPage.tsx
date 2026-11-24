import React, { useEffect, useMemo, useState } from 'react';
import type { ThemeMode } from '../core/schema';
import { generatePalette } from '../core/palette';
import { useT } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { useProjectStore } from '../store/projectStore';
import { useRecentStore } from '../store/recentStore';
import { Footer } from '../ui/common/Footer';
import { LogoMark } from '../ui/brand/LogoMark';
import { MobileNavDrawer } from '../ui/common/MobileNavDrawer';
import {
  filterGalleryTemplates,
  getTemplatePreviewUrl,
  getAvailableCategories,
  readTemplateFavorites,
  TEMPLATE_CATEGORIES,
  TEMPLATE_FAVORITES_KEY,
  TEMPLATE_GALLERY_INDEX,
  toggleTemplateFavorite,
} from './data';

const CATEGORY_ICONS: Record<string, string> = {
  all: '🌐',
  coding: '💻',
  marketing: '📣',
  education: '📚',
  lifestyle: '✨',
  'personal-brand': '👤',
  general: '▦',
  'arabic-heritage': '🏛️',
  coptic: '☦️',
  islamic: '🕌',
};

const PAGE_SIZE = 24;

export interface GalleryPageProps {
  onNavigate?: (path: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onNavigate }) => {
  const { t, dir, locale } = useT();
  const brandSettings = useSettingsStore((state) => state.settings);
  const createProject = useProjectStore((state) => state.createProject);
  const saveProject = useRecentStore((state) => state.saveProject);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readTemplateFavorites());
  const [previewWithBrand, setPreviewWithBrand] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [simulatedState, setSimulatedState] = useState<'templates' | 'empty' | 'loading' | 'error'>('templates');

  useEffect(() => {
    const syncFavorites = (event: StorageEvent) => {
      if (event.key === TEMPLATE_FAVORITES_KEY || event.key === null) {
        setFavoriteIds(readTemplateFavorites());
      }
    };
    window.addEventListener('storage', syncFavorites);
    return () => window.removeEventListener('storage', syncFavorites);
  }, []);

  const theme: ThemeMode = brandSettings.defaultTheme || 'light';
  const effectivePrimaryColor = previewWithBrand && brandSettings.defaultPrimaryColor
    ? brandSettings.defaultPrimaryColor
    : (theme === 'dark' ? '#35D0E6' : '#0B7FA6');

  generatePalette(effectivePrimaryColor, theme);
  const availableCategories = getAvailableCategories(TEMPLATE_CATEGORIES, TEMPLATE_GALLERY_INDEX.templates);

  const visibleTemplates = useMemo(() => {
    return filterGalleryTemplates(TEMPLATE_GALLERY_INDEX.templates, {
      query,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      language: locale,
      mode: theme,
      favoritesOnly,
      favoriteIds,
    });
  }, [query, categoryId, locale, theme, favoritesOnly, favoriteIds]);

  const displayedTemplates = useMemo(() => {
    return visibleTemplates.slice(0, visibleCount);
  }, [visibleTemplates, visibleCount]);

  const updateFavorite = (id: string) => setFavoriteIds(toggleTemplateFavorite(id));

  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleUseTemplate = (tmplId: string) => {
    const newProj = createProject({
      title: 'Untitled Presentation',
      templateId: tmplId,
      primaryColor: effectivePrimaryColor,
      theme,
      textDir: locale === 'ar' ? 'rtl' : 'ltr',
    });
    saveProject(newProj);
    navigateTo('/editor');
  };

  const handlePreviewTemplate = (tmplId: string) => {
    navigateTo(`/preview?template=${encodeURIComponent(tmplId)}`);
  };

  const clearFilters = () => {
    setQuery('');
    setCategoryId('all');
    setFavoritesOnly(false);
    setVisibleCount(PAGE_SIZE);
    setSimulatedState('templates');
  };

  return (
    <div
      dir={dir}
      data-testid="gallery-page"
      className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200"
    >
      {/* Top Header & Navigation */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={36} />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white font-serif">
                SlideThread Component Gallery
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
                {t('ux.gallery.eyebrow')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium px-3 py-1.5 rounded-lg border border-stone-300/50 dark:border-stone-700/50 transition-colors"
            >
              ← {t('nav.home')}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/settings')}
              className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium px-3 py-1.5 rounded-lg border border-stone-300/50 dark:border-stone-700/50 transition-colors"
            >
              {t('nav.settings')}
            </button>
          </div>

          {/* Mobile Side Drawer Navigation */}
          <MobileNavDrawer currentPath="/gallery" onNavigate={navigateTo} />
        </div>
      </header>

      {/* Hero Intro & "Preview With Brand" */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 space-y-10">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              {t('ux.gallery.eyebrow')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-50 leading-tight">
              {t('ux.gallery.title')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {t('ux.gallery.body')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="preview-brand-toggle"
              aria-pressed={previewWithBrand}
              onClick={() => setPreviewWithBrand(!previewWithBrand)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 shadow-xs ${
                previewWithBrand
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-amber-500'
              }`}
            >
              <span>{previewWithBrand ? '✦' : '✧'}</span>
              <span>{t('ux.gallery.brand')}</span>
              {previewWithBrand && (
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: brandSettings.defaultPrimaryColor }} />
              )}
            </button>
          </div>
        </section>

        {/* Search & Category Filter Chips */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <span className="absolute inset-y-0 start-3 flex items-center text-stone-400 pointer-events-none text-sm">
                🔍
              </span>
              <input
                data-testid="gallery-search"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder={t('gallery.searchPlaceholder')}
                className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>

            {/* Hidden/Select element for category compatibility with e2e tests */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <span>{t('gallery.category')}:</span>
                <select
                  data-testid="gallery-category"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">{t('gallery.allCategories')}</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name[locale]}
                    </option>
                  ))}
                </select>
              </label>

              {/* Favorites filter toggle button */}
              <button
                type="button"
                data-testid="favorites-filter"
                aria-pressed={favoritesOnly}
                onClick={() => {
                  setFavoritesOnly(!favoritesOnly);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                  favoritesOnly
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-amber-500'
                }`}
              >
                <span>{favoritesOnly ? '★' : '☆'}</span>
                <span>{t('gallery.favorites')}</span>
              </button>

              <span data-testid="gallery-template-count" className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                {t('gallery.templateCount', { count: visibleTemplates.length })}
              </span>
            </div>
          </div>

          {/* Interactive Category Chips */}
          <div className="flex flex-wrap gap-2 pt-1" role="toolbar" aria-label={t('gallery.category')}>
            <button
              type="button"
              onClick={() => {
                setCategoryId('all');
                setVisibleCount(PAGE_SIZE);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                categoryId === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                  : 'bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
              }`}
            >
              <span>{CATEGORY_ICONS.all}</span>
              <span>{t('gallery.allCategories')}</span>
            </button>

            {availableCategories.map((category) => {
              const icon = CATEGORY_ICONS[category.id] || '▦';
              const isActive = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(category.id);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                      : 'bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{category.name[locale]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* State Preview Switches (dev / demo modes) */}
        {(import.meta.env.DEV || import.meta.env.MODE === 'test') && !import.meta.env.PROD && (
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">{t('ux.gallery.stateLabel')}:</span>
            {(['templates', 'empty', 'loading', 'error'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSimulatedState(st)}
                className={`px-2.5 py-1 rounded-md transition-all font-mono text-[11px] ${
                  simulatedState === st
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                }`}
              >
                {t(`ux.gallery.state.${st}` as never)}
              </button>
            ))}
          </div>
        )}

        {/* Template Grid / State Views */}
        {simulatedState === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="gallery-skeleton">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-4 animate-pulse"
              >
                <div className="w-full h-48 bg-stone-200 dark:bg-stone-800 rounded-xl" />
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-2/3" />
                <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {simulatedState === 'error' && (
          <div
            data-testid="gallery-error-state"
            className="rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-10 text-center space-y-4 max-w-lg mx-auto"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-2xl flex items-center justify-center mx-auto">
              !
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              {t('ux.gallery.errorTitle')}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {t('ux.gallery.errorBody')}
            </p>
            <button
              type="button"
              onClick={() => setSimulatedState('templates')}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold shadow-sm hover:opacity-90"
            >
              {t('ux.gallery.retry')}
            </button>
          </div>
        )}

        {simulatedState === 'empty' && (
          <div
            data-testid="gallery-empty-state"
            className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-12 text-center space-y-4 max-w-md mx-auto shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-3xl mx-auto">
              📂
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
              {t('ux.gallery.emptyTitle')}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('ux.gallery.emptyBody')}
            </p>
            <button
              type="button"
              data-testid="clear-filters-btn"
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              {t('ux.gallery.clearFilters')}
            </button>
          </div>
        )}

        {simulatedState === 'templates' && (
          <section
            aria-label={t('gallery.templateChoices')}
            data-testid="gallery-template-choices"
            className="space-y-6"
          >
            {visibleTemplates.length === 0 ? (
              <div
                data-testid="gallery-empty-state"
                className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-12 text-center space-y-4 max-w-md mx-auto shadow-sm"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-3xl mx-auto">
                  📂
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
                  {t('ux.gallery.emptyTitle')}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {t('gallery.noTemplates')}
                </p>
                <button
                  type="button"
                  data-testid="clear-filters-btn"
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {t('ux.gallery.clearFilters')}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedTemplates.map((item) => {
                    const isFav = favoriteIds.includes(item.id);
                    const previewUrl = getTemplatePreviewUrl(item.id);
                    const categoryLabels = item.categories
                      .map((id) => availableCategories.find((cat) => cat.id === id)?.name[locale])
                      .filter(Boolean)
                      .join(' · ');

                    return (
                      <article
                        key={item.id}
                        data-testid="gallery-template-card"
                        data-template-id={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleUseTemplate(item.id)}
                        onKeyDown={(e) => {
                          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleUseTemplate(item.id);
                          }
                        }}
                        className="group relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900 transition-all duration-300 hover:shadow-xl flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                      >
                        {/* Preview Image with click to use template */}
                        <div
                          className="relative aspect-[4/3] bg-stone-100 dark:bg-stone-800 overflow-hidden"
                        >
                          <img
                            src={previewUrl}
                            alt={item.name[locale]}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                              {t('ux.template.slides', { count: 5 })}
                            </span>

                            {item.colorFlexible && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-600/90 text-white text-[10px] font-bold">
                                {previewWithBrand ? t('gallery.brandApplied') : t('gallery.colorFlexible')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Metadata & Actions */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  {item.name[locale]}
                                </h3>
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                  {categoryLabels}
                                </p>
                              </div>

                              <button
                                type="button"
                                data-testid={`favorite-${item.id}`}
                                aria-label={`${isFav ? t('gallery.removeFavorite') : t('gallery.addFavorite')} ${item.name[locale]}`}
                                aria-pressed={isFav}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateFavorite(item.id);
                                }}
                                className={`p-2 rounded-lg text-sm transition-colors ${
                                  isFav
                                    ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                                    : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                                }`}
                              >
                                {isFav ? '★' : '☆'}
                              </button>
                            </div>

                            {item.description?.[locale] && (
                              <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2">
                                {item.description[locale]}
                              </p>
                            )}
                          </div>

                          {/* Bottom Actions Row: One Preview action, One Use template action */}
                          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                            <button
                              type="button"
                              data-testid={`preview-template-${item.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewTemplate(item.id);
                              }}
                              className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:underline"
                            >
                              {t('common.preview')}
                            </button>

                            <button
                              type="button"
                              data-testid={`use-template-${item.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseTemplate(item.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-600 hover:text-white dark:bg-stone-800 dark:hover:bg-amber-600 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                              {t('ux.gallery.use')}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination / Load More for 1000+ templates */}
                {visibleCount < visibleTemplates.length && (
                  <div className="flex justify-center pt-6">
                    <button
                      type="button"
                      data-testid="gallery-load-more"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-200 transition-colors shadow-xs"
                    >
                      Load More Templates ({visibleTemplates.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      {/* Consistent Footer */}
      <Footer />
    </div>
  );
};

export default GalleryPage;
