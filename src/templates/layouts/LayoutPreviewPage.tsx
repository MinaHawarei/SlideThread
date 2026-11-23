import React, { useState } from 'react';
import { useT } from '../../i18n';
import { LAYOUT_ARCHETYPES } from './registry';
import './layouts.css';

const ASPECT_LABELS = ['landscape', 'square', 'portrait', 'tall'] as const;

export const LayoutPreviewPage: React.FC = () => {
  const { t, dir } = useT();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(dir);

  return (
    <main className={`layout-gallery theme-${theme}`} dir={direction} data-theme={theme} data-testid="layout-gallery">
      <header className="layout-gallery-header">
        <div>
          <p className="layout-gallery-eyebrow">SlideThread · R2-2</p>
          <h1>{t('layoutGallery.title')}</h1>
          <p>{t('layoutGallery.description')}</p>
        </div>
        <div className="layout-gallery-controls">
          <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} data-testid="layout-theme-toggle">{t(theme === 'light' ? 'layoutGallery.dark' : 'layoutGallery.light')}</button>
          <button type="button" onClick={() => setDirection(direction === 'rtl' ? 'ltr' : 'rtl')} data-testid="layout-direction-toggle">{t('layoutGallery.direction')}</button>
        </div>
      </header>
      <p className="layout-gallery-count">{t('layoutGallery.count', { count: LAYOUT_ARCHETYPES.length })}</p>
      <section className="layout-archetype-grid" aria-label={t('layoutGallery.title')}>
        {LAYOUT_ARCHETYPES.map((archetype) => (
          <article className="layout-archetype-card" key={archetype.id} data-archetype-id={archetype.id}>
            <header className="layout-archetype-heading">
              <h2>{archetype.name[direction === 'rtl' ? 'ar' : 'en']}</h2>
              <code>{archetype.id}</code>
            </header>
            <div className="layout-variant-grid">
              {ASPECT_LABELS.map((aspectClass) => {
                const variant = archetype.variants[aspectClass];
                return (
                  <div className="layout-variant" key={aspectClass} data-aspect-class={aspectClass}>
                    <div className={`layout-stage aspect-${aspectClass}`}>
                      {variant.elements.map((element) => (
                        <span
                          className={`layout-frame frame-${element.id}`}
                          key={element.id}
                          data-element-id={element.id}
                          style={{
                            insetInlineStart: `${element.inlineStart * 100}%`,
                            insetBlockStart: `${element.blockStart * 100}%`,
                            inlineSize: `${element.inlineSize * 100}%`,
                            blockSize: `${element.blockSize * 100}%`,
                            textAlign: element.align,
                          }}
                        ><i>{element.id}</i></span>
                      ))}
                    </div>
                    <span className="layout-aspect-label">{aspectClass}</span>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};
