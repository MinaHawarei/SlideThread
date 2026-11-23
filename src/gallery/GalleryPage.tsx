import React, { useEffect, useMemo, useState } from 'react';
import type { AspectClass, SlideType, ThemeMode, TextDir, TemplateId } from '../core/schema';
import { generatePalette } from '../core/palette';
import { SlideRenderer } from '../slides/SlideRenderer';
import { SAMPLE_SLIDES, SAMPLE_BRAND_EN, SAMPLE_BRAND_AR } from '../slides/sampleSlides';
import { getAllTemplates, getTemplate } from '../templates';
import { useT } from '../i18n';
import { LanguageSwitcher } from '../ui/common/LanguageSwitcher';
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

export const GalleryPage: React.FC = () => {
  const { t, dir, locale } = useT();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAspect, setSelectedAspect] = useState<string>('all');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [textDir, setTextDir] = useState<TextDir>('auto');
  const [templateId, setTemplateId] = useState<TemplateId>('tech-mesh');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(0.22);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readTemplateFavorites());

  useEffect(() => {
    const syncFavorites = (event: StorageEvent) => {
      if (event.key === TEMPLATE_FAVORITES_KEY || event.key === null) setFavoriteIds(readTemplateFavorites());
    };
    window.addEventListener('storage', syncFavorites);
    return () => window.removeEventListener('storage', syncFavorites);
  }, []);

  const palette = generatePalette(theme === 'dark' ? '#35D0E6' : '#0B7FA6', theme);
  const selectedTemplate = getTemplate(templateId);
  const availableCategories = getAvailableCategories(TEMPLATE_CATEGORIES, TEMPLATE_GALLERY_INDEX.templates);
  const visibleTemplates = useMemo(() => filterGalleryTemplates(TEMPLATE_GALLERY_INDEX.templates, {
    query,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    language: lang,
    mode: theme,
    formatId: selectedAspect === 'all' ? undefined : ASPECT_DIMENSIONS[selectedAspect as AspectClass].formatId,
    favoritesOnly,
    favoriteIds,
  }), [query, categoryId, lang, theme, selectedAspect, favoritesOnly, favoriteIds]);

  const updateFavorite = (id: string) => setFavoriteIds(toggleTemplateFavorite(id));

  const typesToRender = selectedType === 'all' ? SLIDE_TYPES : [selectedType as SlideType];
  const aspectsToRender = selectedAspect === 'all' ? ASPECT_CLASSES : [selectedAspect as AspectClass];

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#0b0f19', color: '#f3f4f6', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header & Controls */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #1f293d', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
              SlideThread Component Gallery
            </h1>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Dev gallery rendering all 9 slide types × 4 aspect classes × dark/light themes × bilingual RTL/LTR
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href="/"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#1e293b',
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid #334155',
              }}
            >
              ← {t('nav.home')}
            </a>
            <a href="/settings" style={{ color: '#94a3b8', textDecoration: 'none', padding: '8px 12px' }}>{t('nav.settings')}</a>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
            {t('gallery.search')}
            <input data-testid="gallery-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('gallery.searchPlaceholder')} style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '7px 10px', borderRadius: 6 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
            {t('gallery.category')}
            <select data-testid="gallery-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '7px 10px', borderRadius: 6 }}>
              <option value="all">{t('gallery.allCategories')}</option>
              {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name[locale]}</option>)}
            </select>
          </label>
          <button type="button" data-testid="favorites-filter" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)} style={{ background: favoritesOnly ? '#7c3aed' : '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '7px 12px', borderRadius: 6, cursor: 'pointer' }}>{favoritesOnly ? '★' : '☆'} {t('gallery.favorites')}</button>
          <span data-testid="gallery-template-count" style={{ color: '#94a3b8', fontSize: 13 }}>{t('gallery.templateCount', { count: visibleTemplates.length })}</span>
        </div>

        <section aria-label={t('gallery.templateChoices')} data-testid="gallery-template-choices" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          {visibleTemplates.map((item) => {
            const active = templateId === item.id;
            return (
              <article key={item.id} data-testid="gallery-template-card" data-template-id={item.id} style={{ width: 190, border: `1px solid ${active ? '#38bdf8' : '#334155'}`, borderRadius: 10, overflow: 'hidden', background: '#111827' }}>
                <button type="button" aria-pressed={active} onClick={() => setTemplateId(item.id)} style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', color: '#f8fafc', textAlign: 'start', cursor: 'pointer' }}>
                  <img src={getTemplatePreviewUrl(item.id)} alt="" width="190" height="150" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                  <span style={{ display: 'block', padding: '9px 10px 2px', fontWeight: 700 }}>{item.name[locale]}</span>
                  <span style={{ display: 'block', padding: '2px 10px 10px', color: '#94a3b8', fontSize: 12 }}>{item.categories.map((id) => availableCategories.find((category) => category.id === id)?.name[locale]).filter(Boolean).join(' · ')}</span>
                </button>
                <button type="button" data-testid={`favorite-${item.id}`} aria-label={`${favoriteIds.includes(item.id) ? t('gallery.removeFavorite') : t('gallery.addFavorite')} ${item.name[locale]}`} aria-pressed={favoriteIds.includes(item.id)} onClick={() => updateFavorite(item.id)} style={{ width: '100%', border: 0, borderTop: '1px solid #334155', background: 'transparent', color: '#fbbf24', padding: 7, cursor: 'pointer' }}>{favoriteIds.includes(item.id) ? '★' : '☆'} {favoriteIds.includes(item.id) ? t('gallery.removeFavorite') : t('gallery.addFavorite')}</button>
              </article>
            );
          })}
          {visibleTemplates.length === 0 && <p data-testid="gallery-empty-state" style={{ color: '#cbd5e1' }}>{t('gallery.noTemplates')}</p>}
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', alignItems: 'center' }}>
          {/* Slide Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              data-testid="type-select"
              style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '6px 12px', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="all">All 9 Types</option>
              {SLIDE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Aspect Class Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Aspect:</label>
            <select
              value={selectedAspect}
              onChange={(e) => setSelectedAspect(e.target.value)}
              data-testid="aspect-select"
              style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '6px 12px', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="all">All 4 Aspects</option>
              {ASPECT_CLASSES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Template Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Template:</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as TemplateId)}
              data-testid="template-select"
              style={{
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '13px',
              }}
            >
              {getAllTemplates().map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div data-testid="template-preview-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', border: '1px solid #334155', borderRadius: '10px', background: '#111827' }}>
            <img src={selectedTemplate.previewUrl} alt="" width="36" height="45" style={{ objectFit: 'cover', borderRadius: '5px' }} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{t(selectedTemplate.nameKey as Parameters<typeof t>[0])}</span>
          </div>

          {/* Theme Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Theme:</label>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              data-testid="toggle-theme"
              style={{
                background: theme === 'dark' ? '#0284c7' : '#f59e0b',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>

          {/* Safe Zones Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowSafeZones(!showSafeZones)}
              style={{
                background: showSafeZones ? '#dc2626' : '#1e293b',
                color: showSafeZones ? '#ffffff' : '#f87171',
                border: '1px solid #ef4444',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="toggle-safe-zones"
            >
              {showSafeZones ? '🛡️ Safe Zones: ON' : '🛡️ Safe Zones: OFF'}
            </button>
          </div>

          {/* Language Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Content:</label>
            <button
              type="button"
              onClick={() => {
                const nextLang = lang === 'en' ? 'ar' : 'en';
                setLang(nextLang);
                setTextDir(nextLang === 'ar' ? 'rtl' : 'ltr');
              }}
              data-testid="toggle-lang"
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #0284c7',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {lang === 'en' ? 'English (LTR)' : 'العربية (RTL)'}
            </button>
          </div>

          {/* Scale Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Zoom: {Math.round(previewScale * 100)}%</label>
            <input
              type="range"
              min="0.15"
              max="0.4"
              step="0.01"
              value={previewScale}
              onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Slide Previews */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {typesToRender.map((type) => {
          const sampleKey = `${type}_${lang}`;
          const slide = SAMPLE_SLIDES[sampleKey] || SAMPLE_SLIDES[`${type}_en`];
          if (!slide) return null;

          return (
            <div key={type} style={{ background: '#111827', borderRadius: '16px', padding: '24px', border: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, textTransform: 'capitalize', color: '#e2e8f0' }}>
                  {type} Slide
                </h2>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  4 layout variants
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
                {aspectsToRender.map((aspect) => {
                  const dims = ASPECT_DIMENSIONS[aspect];
                  const scaledWidth = dims.width * previewScale;
                  const scaledHeight = dims.height * previewScale;

                  return (
                    <div key={aspect} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                        {aspect} ({dims.width}×{dims.height})
                      </span>
                      <div
                        style={{
                          width: `${scaledWidth}px`,
                          height: `${scaledHeight}px`,
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: '12px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                          border: '1px solid #334155',
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
                          }}
                        >
                          <SlideRenderer
                            slide={slide}
                            palette={palette}
                            aspectClass={aspect}
                            textDir={textDir}
                            brand={lang === 'ar' ? SAMPLE_BRAND_AR : SAMPLE_BRAND_EN}
                            slideIndex={2}
                            totalSlides={7}
                            showCounter={true}
                            showSafeZones={showSafeZones}
                            templateId={templateId}
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
      </div>
    </div>
  );
};
