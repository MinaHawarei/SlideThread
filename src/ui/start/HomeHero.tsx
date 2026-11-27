import React, { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import { TEMPLATE_GALLERY_INDEX, getTemplatePreviewUrl } from '../../gallery/data';
import { openCreateDialog } from '../../store/createDialogStore';

const FEATURED_IDS = ['tech-mesh', 'golden-hour-viral', 'pk-electric-blue', 'dt-purple-code', 'pk-sunny-pop'];
const SWAP_MS = 3800;

export interface HomeHeroProps {
  onNavigate: (path: string) => void;
}

function featuredTemplates() {
  const all = TEMPLATE_GALLERY_INDEX.templates;
  const picked = FEATURED_IDS.map((id) => all.find((item) => item.id === id)).filter((item): item is (typeof all)[number] => Boolean(item) && Boolean(getTemplatePreviewUrl(item!.id)));
  const pool = picked.length >= 3 ? picked : all.filter((item) => getTemplatePreviewUrl(item.id)).slice(0, 5);
  return pool;
}

/** Home A: editorial headline and a stack of real template previews. Clicking the top card opens the create dialog with that template. */
export const HomeHero: React.FC<HomeHeroProps> = ({ onNavigate }) => {
  const { t, locale } = useT();
  const templates = React.useMemo(featuredTemplates, []);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || paused || templates.length < 2) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % templates.length), SWAP_MS);
    return () => window.clearInterval(id);
  }, [paused, templates.length]);

  const count = templates.length;
  const current = templates[active];

  return (
    <section data-testid="hero-section" className="hm-hero">
      <div>
        <p className="ed-eyebrow">{t('home.eyebrow')}</p>
        <h1 className="hm-h1" aria-label={t('start.heroTitle')}>
          {t('home.titleA')}
          <br />
          {t('home.titleB')} <em>{t('home.titleEm')}</em>
          <br />
          {t('home.titleC')}
        </h1>
        <p className="hm-sub">{t('start.heroSubtitle')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" data-testid="hero-start-btn" onClick={() => openCreateDialog()} className="hm-btn">
            {t('start.heroStartCreating')}
          </button>
          <button type="button" data-testid="hero-gallery-btn" onClick={() => onNavigate('/gallery')} className="hm-btn ghost">
            {t('start.heroExploreTemplates')}
          </button>
        </div>
      </div>

      <div className="hm-stack" data-testid="hero-card-stack" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <span className="hm-cap">{t('home.cardHint')}</span>
        {templates.map((item, index) => {
          const offset = (index - active + count) % count;
          const position = offset < 3 ? String(offset) : 'hidden';
          return (
            <div key={item.id} aria-hidden={offset !== 0} data-testid={`hero-card-${item.id}`} data-position={position} className="hm-card">
              <button
                type="button"
                tabIndex={offset === 0 ? 0 : -1}
                onClick={() => (offset === 0 ? openCreateDialog({ templateId: item.id }) : setActive(index))}
                aria-label={`${t('ux.gallery.use')}: ${item.name[locale]}`}
              >
                <img src={getTemplatePreviewUrl(item.id)} alt={item.name[locale]} />
              </button>
            </div>
          );
        })}
        <div className="hm-dots" role="group" aria-label={current ? current.name[locale] : ''}>
          {templates.map((item, index) => (
            <button key={item.id} type="button" aria-current={index === active} aria-label={t('home.templateOf', { index: index + 1, count })} onClick={() => setActive(index)} />
          ))}
        </div>
      </div>
    </section>
  );
};
