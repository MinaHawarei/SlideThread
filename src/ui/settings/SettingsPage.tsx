import React from 'react';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useAvatarUpload } from '../common/useAvatarUpload';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import './settings.css';

export const SettingsPage: React.FC = () => {
  const { t, dir } = useT();
  const settings = useSettingsStore((state) => state.settings);
  const setPhotoDataUrl = useSettingsStore((state) => state.setPhotoDataUrl);
  const { fileInputRef, handleFileChange, triggerUpload } = useAvatarUpload();

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

          {/* Profile Avatar with click-to-upload & crop */}
          <div className="flex items-center gap-4 my-4">
            <div
              role="button"
              tabIndex={0}
              onClick={triggerUpload}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerUpload();
                }
              }}
              aria-label={settings.photoDataUrl ? t('brand.changePhoto') : t('brand.addPhoto')}
              className="relative group cursor-pointer rounded-full shrink-0"
            >
              {settings.photoDataUrl ? (
                <img
                  data-testid="settings-avatar-preview"
                  src={settings.photoDataUrl}
                  alt={settings.displayName || 'Avatar'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500 shadow-md block"
                />
              ) : (
                <div
                  data-testid="settings-avatar-placeholder"
                  className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xl"
                >
                  {settings.displayName.trim().charAt(0).toUpperCase() || 'M'}
                  <span className="avatar-camera-badge" aria-hidden="true">📷</span>
                </div>
              )}

              <div className="avatar-hover-overlay" aria-hidden="true">
                <span className="avatar-hover-icon">📷</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-testid="settings-upload-photo-btn"
                onClick={triggerUpload}
                className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>📷</span>
                <span>{t('brand.uploadPhoto')}</span>
              </button>

              {settings.photoDataUrl && (
                <button
                  type="button"
                  data-testid="settings-remove-photo-btn"
                  onClick={() => setPhotoDataUrl(undefined)}
                  className="py-1 px-2.5 rounded-lg text-xs font-semibold text-red-500 hover:text-red-700 text-start"
                >
                  {t('brand.removePhoto')}
                </button>
              )}

              <input
                ref={fileInputRef}
                data-testid="settings-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="settings-language-row"><span>{t('settings.language')}</span><strong>{t('settings.languageSaved')}</strong></div>
        </section>
        <p className="settings-note">{t('settings.availableSoon')}</p>
      </main>
    </div>
  );
};

export default SettingsPage;
