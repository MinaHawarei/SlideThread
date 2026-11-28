import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ThemeMode } from '../core/schema';
import { generatePalette } from '../core/palette';
import { useT } from '../i18n';
import { AppNav } from '../ui/common/AppNav';
import { openCreateDialog } from '../store/createDialogStore';
import { FALLBACK_PRIMARY_COLOR } from '../templates/defaults';
import { useSettingsStore } from '../store/settingsStore';
import { deleteUserTemplatePackage } from '../templates/userLibrary';
import { useUserTemplateLibrary } from '../templates/useUserTemplateLibrary';
import { importTemplateZip } from '../templates/importZip';
import { exportUserTemplateZip } from '../templates/portable';
import { TemplateBuilderDialog } from './TemplateBuilderDialog';
import { invalidateTemplatePackage } from '../templates/starters';
import { Footer } from '../ui/common/Footer';
import { SearchIcon, StarIcon, FolderIcon, DownloadIcon, TrashIcon } from '../ui/common/icons';
import '../ui/common/editorial.css';
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

const PAGE_SIZE = 24;

export interface GalleryPageProps {
  onNavigate?: (path: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onNavigate }) => {
  const { t, locale } = useT();
  const appTheme = useSettingsStore((state) => state.settings.appTheme);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readTemplateFavorites());
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [simulatedState, setSimulatedState] = useState<'templates' | 'empty' | 'loading' | 'error'>('templates');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { templates: userTemplates, loading: userTemplatesLoading, error: userLibraryError } = useUserTemplateLibrary();
  const [packageError, setPackageError] = useState<string>();
  const [packageNotice, setPackageNotice] = useState<string>();
  const [packageAction, setPackageAction] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [userPreviewUrls, setUserPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const urls: Record<string, string> = {};
    if (typeof URL.createObjectURL === 'function') {
      for (const template of userTemplates) if (template.preview) urls[template.id] = URL.createObjectURL(template.preview);
    }
    setUserPreviewUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [userTemplates]);

  const handleImportPackage = async (file?: File) => {
    if (!file) return;
    setPackageAction(true);
    setPackageError(undefined);
    setPackageNotice(undefined);
    try {
      const manifest = await importTemplateZip(file);
      setPackageNotice(`“${manifest.name[locale]}” was added to Your templates.`);
    } catch (reason) {
      setPackageError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setPackageAction(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportPackage = async (id: string) => {
    setPackageError(undefined);
    try {
      const file = await exportUserTemplateZip(id);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setPackageNotice(`Exported ${file.name}. It contains the template and everything it builds on.`);
    } catch (reason) {
      setPackageError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const handleDeletePackage = async (id: string) => {
    const template = userTemplates.find((item) => item.id === id);
    if (!template || !window.confirm(`Delete “${template.manifest.name[locale]}” from your template library? Existing projects keep their own snapshot.`)) return;
    setPackageError(undefined);
    try {
      await deleteUserTemplatePackage(id);
      invalidateTemplatePackage(id);
      setPackageNotice(`“${template.manifest.name[locale]}” was deleted from Your templates.`);
    } catch (reason) {
      setPackageError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  useEffect(() => {
    const syncFavorites = (event: StorageEvent) => {
      if (event.key === TEMPLATE_FAVORITES_KEY || event.key === null) {
        setFavoriteIds(readTemplateFavorites());
      }
    };
    window.addEventListener('storage', syncFavorites);
    return () => window.removeEventListener('storage', syncFavorites);
  }, []);

  const theme: ThemeMode = appTheme === 'dark' ? 'dark' : 'light';
  const effectivePrimaryColor = theme === 'dark' ? FALLBACK_PRIMARY_COLOR : '#0B7FA6';

  generatePalette(effectivePrimaryColor, theme);
  const availableCategories = getAvailableCategories(TEMPLATE_CATEGORIES, TEMPLATE_GALLERY_INDEX.templates);

  const visibleTemplates = useMemo(() => {
    // Gallery order (approved): higher priority number first, ties fall back to id
    // for a stable order. Templates without a priority count as 1.
    // Edit priority per template in src/templates/starters/<id>/template.json.
    const ordered = [...TEMPLATE_GALLERY_INDEX.templates].sort((a, b) => {
      const byPriority = (b.priority ?? 1) - (a.priority ?? 1);
      return byPriority !== 0 ? byPriority : a.id.localeCompare(b.id);
    });
    return filterGalleryTemplates(ordered, {
      query,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      language: locale,
      favoritesOnly,
      favoriteIds,
    });
  }, [query, categoryId, locale, favoritesOnly, favoriteIds]);

  // Numbered pagination (approved redesign): PAGE_SIZE cards per page
  const totalPages = Math.max(1, Math.ceil(visibleTemplates.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const displayedTemplates = useMemo(() => {
    return visibleTemplates.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [visibleTemplates, safePage]);

  // Page numbers with ellipsis: 1 ... c-1 c c+1 ... N
  const pageItems: (number | 'ellipsis')[] = useMemo(() => {
    const items: (number | 'ellipsis')[] = [];
    for (let n = 1; n <= totalPages; n++) {
      if (n === 1 || n === totalPages || Math.abs(n - safePage) <= 1) {
        items.push(n);
      } else if (items[items.length - 1] !== 'ellipsis') {
        items.push('ellipsis');
      }
    }
    return items;
  }, [totalPages, safePage]);

  const updateFavorite = (id: string) => setFavoriteIds(toggleTemplateFavorite(id));

  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Choosing a template runs the same wizard (platform, content type, format) with the template already picked.
  const handleUseTemplate = (tmplId: string) => {
    openCreateDialog({ templateId: tmplId });
  };

  const handlePreviewTemplate = (tmplId: string) => {
    navigateTo(`/preview?template=${encodeURIComponent(tmplId)}`);
  };

  const clearFilters = () => {
    setQuery('');
    setCategoryId('all');
    setFavoritesOnly(false);
    setPage(1);
    setSimulatedState('templates');
  };

  const titleWords = t('ux.gallery.title');
  const lastSpace = titleWords.lastIndexOf(' ');
  const titleLead = lastSpace > 0 ? titleWords.slice(0, lastSpace) : titleWords;
  const titleEm = lastSpace > 0 ? titleWords.slice(lastSpace + 1) : '';
  const modeLabel = (modes: string[]) => modes.map((m) => (m === 'dark' ? t('gallery.modeDark') : m === 'light' ? t('gallery.modeLight') : m)).join(' / ');

  const emptyBox = (testId: string, body: string) => (
    <div data-testid={testId} className="mx-auto max-w-md space-y-4 rounded-3xl border p-12 text-center" style={{ borderColor: 'var(--ed-card2)', background: 'var(--ed-card)' }}>
      <FolderIcon size={32} className="mx-auto" />
      <h3 className="ed-serif text-xl">{t('ux.gallery.emptyTitle')}</h3>
      <p className="text-sm" style={{ color: 'var(--ed-mut)' }}>{body}</p>
      <button type="button" data-testid="clear-filters-btn" onClick={clearFilters} className="hm-btn" style={{ padding: '12px 22px', fontSize: 14 }}>
        {t('ux.gallery.clearFilters')}
      </button>
    </div>
  );

  return (
    <div data-testid="gallery-page" className="ed-page flex flex-col justify-between">
      <div>
        <AppNav current="/gallery" onNavigate={navigateTo} />

        <div className="ed-head">
          <div className="gl-head">
            <div>
              <p className="ed-eyebrow">{t('ux.gallery.eyebrow')}</p>
              <h1 className="ed-title" aria-label={titleWords}>
                {titleLead} {titleEm && <em>{titleEm}</em>}
              </h1>
              <p className="ed-lead" style={{ maxWidth: 420 }}>{t('ux.gallery.body')}</p>
            </div>
            <div className="gl-acts">
              <input ref={fileInputRef} type="file" accept=".zip,application/zip" className="hidden" data-testid="template-zip-input" onChange={(event) => void handleImportPackage(event.currentTarget.files?.[0])} />
              <button type="button" data-testid="import-template-zip" disabled={packageAction} onClick={() => fileInputRef.current?.click()}>
                {packageAction ? t('gallery.validatingZip') : t('gallery.importZip')}
              </button>
              <button type="button" data-testid="open-template-builder" onClick={() => setBuilderOpen(true)}>
                {t('gallery.createTemplate')}
              </button>
            </div>
          </div>
        </div>

        <main className="ed-head" style={{ paddingBottom: 40 }}>
          {builderOpen && <TemplateBuilderDialog onClose={() => setBuilderOpen(false)} onCreated={(name) => { setBuilderOpen(false); setPackageError(undefined); setPackageNotice(`“${name}” was added to Your templates.`); }} />}
          {(packageError || userLibraryError) && <p role="alert" data-testid="template-import-error" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{packageError ?? userLibraryError}</p>}
          {packageNotice && <p role="status" data-testid="template-import-notice" className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">{packageNotice}</p>}

          {(userTemplatesLoading || userTemplates.length > 0) && (
            <section aria-label="Your imported templates" data-testid="user-template-library" className="gl-section">
              <h2>Your templates</h2>
              <p>Private to this browser</p>
              {userTemplatesLoading ? <p>Loading your templates…</p> : (
                <div className="gl-grid">
                  {userTemplates.map((item) => {
                    const activeKey = `user:${item.id}`;
                    const userCategoryLabels = item.manifest.categories
                      .map((id) => TEMPLATE_CATEGORIES.find((cat) => cat.id === id)?.name[locale])
                      .filter(Boolean)
                      .join(' · ');
                    const userModes = (['dark', 'light'] as const).filter((mode) => item.manifest.theme.modes[mode]);
                    const sub = [userCategoryLabels, modeLabel(userModes), 'Imported'].filter(Boolean).join(' · ');
                    return (
                      <article
                        key={item.id}
                        data-testid={`user-template-card-${item.id}`}
                        data-template-id={item.id}
                        data-active={activeCardId === activeKey}
                        onClick={() => setActiveCardId((current) => (current === activeKey ? null : activeKey))}
                        className="gl-card"
                      >
                        <div className="gl-im">
                          {userPreviewUrls[item.id] ? (
                            <img data-testid={`user-template-poster-${item.id}`} src={userPreviewUrls[item.id]} alt={item.manifest.name[locale]} loading="lazy" />
                          ) : (
                            <span className="grid h-full place-items-center text-sm" style={{ color: 'var(--ed-mut)' }}>No preview included</span>
                          )}
                          <div data-testid={`card-overlay-user-${item.id}`} className="gl-ov">
                            <button
                              type="button"
                              data-testid={`use-user-template-${item.id}`}
                              className="use"
                              aria-label={`${t('ux.gallery.use')}: ${item.manifest.name[locale]}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseTemplate(item.id);
                              }}
                            >
                              {t('gallery.cardUse')}
                            </button>
                            <button
                              type="button"
                              data-testid={`preview-user-template-${item.id}`}
                              className="pre"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewTemplate(item.id);
                              }}
                            >
                              {t('gallery.cardPreview')}
                            </button>
                            <div className="gl-act">
                              <button
                                type="button"
                                data-testid={`export-user-template-${item.id}`}
                                aria-label={`Export ZIP: ${item.manifest.name[locale]}`}
                                title="Export ZIP"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleExportPackage(item.id);
                                }}
                              >
                                <DownloadIcon size={16} />
                              </button>
                              <button
                                type="button"
                                data-testid={`delete-user-template-${item.id}`}
                                className="danger"
                                aria-label={`Delete: ${item.manifest.name[locale]}`}
                                title="Delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeletePackage(item.id);
                                }}
                              >
                                <TrashIcon size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="gl-nm" data-testid={`card-name-user-${item.id}`}>
                            <h3>{item.manifest.name[locale]}</h3>
                            <small>{sub}</small>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          {!userTemplatesLoading && userTemplates.length === 0 && <section data-testid="user-template-library" className="hidden" aria-hidden="true" />}

          <section className="gl-bar" style={{ marginTop: 34 }}>
            <div className="gl-search">
              <SearchIcon size={16} />
              <input
                data-testid="gallery-search"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={t('gallery.searchPlaceholder')}
                aria-label={t('gallery.searchPlaceholder')}
              />
            </div>
            <label className="sr-only-select">
              <span>{t('gallery.category')}</span>
              <select data-testid="gallery-category" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
                <option value="all">{t('gallery.allCategories')}</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name[locale]}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              data-testid="favorites-filter"
              aria-pressed={favoritesOnly}
              onClick={() => {
                setFavoritesOnly(!favoritesOnly);
                setPage(1);
              }}
              className="gl-pill"
            >
              <StarIcon size={14} className={favoritesOnly ? 'fill-current' : ''} />
              <span>{t('gallery.favorites')}</span>
            </button>
            <span data-testid="gallery-template-count" className="gl-count">
              {t('gallery.templateCount', { count: visibleTemplates.length })}
            </span>
          </section>

          <div className="flex flex-wrap gap-2" role="toolbar" aria-label={t('gallery.category')}>
            <button type="button" className="gl-pill" aria-pressed={categoryId === 'all'} onClick={() => { setCategoryId('all'); setPage(1); }}>
              {t('gallery.allCategories')}
            </button>
            {availableCategories.map((category) => (
              <button key={category.id} type="button" className="gl-pill" aria-pressed={categoryId === category.id} onClick={() => { setCategoryId(category.id); setPage(1); }}>
                {category.name[locale]}
              </button>
            ))}
          </div>

          {(import.meta.env.DEV || import.meta.env.MODE === 'test') && !import.meta.env.PROD && (
            <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: 'var(--ed-mut)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider">{t('ux.gallery.stateLabel')}:</span>
              {(['templates', 'empty', 'loading', 'error'] as const).map((st) => (
                <button key={st} type="button" onClick={() => setSimulatedState(st)} className={`gl-pill ${simulatedState === st ? 'on' : ''}`} style={{ padding: '3px 10px', fontSize: 11 }}>
                  {t(`ux.gallery.state.${st}` as never)}
                </button>
              ))}
            </div>
          )}

          {simulatedState === 'loading' && (
            <div className="gl-grid" data-testid="gallery-skeleton">
              {[1, 2, 3].map((n) => (
                <div key={n} className="gl-im animate-pulse" style={{ background: 'var(--ed-card2)' }} />
              ))}
            </div>
          )}

          {simulatedState === 'error' && (
            <div data-testid="gallery-error-state" className="mx-auto mt-8 max-w-lg space-y-4 rounded-3xl border border-red-300 p-10 text-center dark:border-red-900/50">
              <h3 className="text-lg font-bold">{t('ux.gallery.errorTitle')}</h3>
              <p className="text-sm" style={{ color: 'var(--ed-mut)' }}>{t('ux.gallery.errorBody')}</p>
              <button type="button" onClick={() => setSimulatedState('templates')} className="hm-btn" style={{ padding: '10px 20px', fontSize: 14 }}>
                {t('ux.gallery.retry')}
              </button>
            </div>
          )}

          {simulatedState === 'empty' && <div className="mt-8">{emptyBox('gallery-empty-state', t('ux.gallery.emptyBody'))}</div>}

          {simulatedState === 'templates' && (
            <section aria-label={t('gallery.templateChoices')} data-testid="gallery-template-choices">
              {visibleTemplates.length === 0 ? (
                <div className="mt-8">{emptyBox('gallery-empty-state', t('gallery.noTemplates'))}</div>
              ) : (
                <>
                  <div className="gl-grid">
                    {displayedTemplates.map((item) => {
                      const isFav = favoriteIds.includes(item.id);
                      const previewUrl = getTemplatePreviewUrl(item.id);
                      const categoryLabels = item.categories
                        .map((id) => availableCategories.find((cat) => cat.id === id)?.name[locale])
                        .filter(Boolean)
                        .join(' · ');
                      const sub = [categoryLabels, modeLabel(item.modes)].filter(Boolean).join(' · ');

                      return (
                        <article
                          key={item.id}
                          data-testid="gallery-template-card"
                          data-template-id={item.id}
                          data-active={activeCardId === item.id}
                          onClick={() => setActiveCardId((current) => (current === item.id ? null : item.id))}
                          className="gl-card"
                        >
                          <div className="gl-im">
                            <img src={previewUrl} alt={item.name[locale]} loading="lazy" />
                            <button
                              type="button"
                              data-testid={`favorite-${item.id}`}
                              className="gl-star"
                              aria-label={`${isFav ? t('gallery.removeFavorite') : t('gallery.addFavorite')} ${item.name[locale]}`}
                              aria-pressed={isFav}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateFavorite(item.id);
                              }}
                            >
                              <StarIcon size={15} />
                            </button>
                            <div data-testid={`card-overlay-${item.id}`} className="gl-ov">
                              <button
                                type="button"
                                data-testid={`use-template-${item.id}`}
                                className="use"
                                aria-label={`${t('ux.gallery.use')}: ${item.name[locale]}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUseTemplate(item.id);
                                }}
                              >
                                {t('gallery.cardUse')}
                              </button>
                              <button
                                type="button"
                                data-testid={`preview-template-${item.id}`}
                                className="pre"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewTemplate(item.id);
                                }}
                              >
                                {t('gallery.cardPreview')}
                              </button>
                            </div>
                            <div className="gl-nm" data-testid={`card-name-${item.id}`}>
                              <h3>{item.name[locale]}</h3>
                              <small>{sub}</small>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <nav data-testid="gallery-pagination" aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 pt-8">
                      <button
                        type="button"
                        data-testid="gallery-page-prev"
                        disabled={safePage === 1}
                        onClick={() => setPage(safePage - 1)}
                        className="gl-pill"
                        aria-label={t('gallery.prevPage')}
                      >
                        ‹
                      </button>
                      {pageItems.map((item, idx) =>
                        item === 'ellipsis' ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-sm" style={{ color: 'var(--ed-mut)' }} aria-hidden="true">…</span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            data-testid={`gallery-page-${item}`}
                            aria-current={item === safePage ? 'page' : undefined}
                            aria-label={t('gallery.goToPage', { page: item })}
                            onClick={() => setPage(item)}
                            className={`gl-pill${item === safePage ? ' on' : ''}`}
                            style={{ minWidth: 40, justifyContent: 'center' }}
                          >
                            {item}
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        data-testid="gallery-page-next"
                        disabled={safePage === totalPages}
                        onClick={() => setPage(safePage + 1)}
                        className="gl-pill"
                        aria-label={t('gallery.nextPage')}
                      >
                        ›
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default GalleryPage;
