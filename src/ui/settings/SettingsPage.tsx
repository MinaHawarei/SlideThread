import React from 'react';
import { useT } from '../../i18n';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import './settings.css';

export const SettingsPage: React.FC = () => {
  const { t, dir } = useT();
  return (
    <div className="settings-shell" dir={dir}>
      <header className="settings-header">
        <a className="settings-brand" href="/" aria-label={t('nav.home')}><span className="settings-mark">S</span><span>SlideThread</span></a>
        <nav aria-label={t('nav.primary')} dir={dir}>
          <a href="/">{t('nav.home')}</a><a href="/gallery">{t('nav.gallery')}</a><a href="/settings" aria-current="page">{t('nav.settings')}</a>
        </nav>
        <LanguageSwitcher />
      </header>
      <main className="settings-main">
        <p className="settings-eyebrow">{t('settings.eyebrow')}</p>
        <h1>{t('settings.title')}</h1>
        <p className="settings-description">{t('settings.description')}</p>
        <section className="settings-card" aria-labelledby="settings-profile-title">
          <div className="settings-card-mark" aria-hidden="true">✳</div>
          <h2 id="settings-profile-title">{t('settings.profileTitle')}</h2>
          <p>{t('settings.profileDescription')}</p>
          <div className="settings-language-row"><span>{t('settings.language')}</span><strong>{t('settings.languageSaved')}</strong></div>
        </section>
        <p className="settings-note">{t('settings.availableSoon')}</p>
      </main>
    </div>
  );
};

export default SettingsPage;
