import React, { useState, useRef, useEffect } from 'react';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useAvatarUpload } from '../common/useAvatarUpload';
import { Footer } from '../common/Footer';
import { AppNav } from '../common/AppNav';
import { applyThemeWithFade } from '../common/themeFade';
import { SocialIcon } from '../../slides/SignatureBar';
import {
  downloadAllUserData,
  importAllUserData,
  clearAllAppData,
} from '../../core/dataBackup';
import type { SocialPlatform } from '../../core/schema';
import './settings.css';
import '../common/editorial.css';
import { CameraIcon, DownloadIcon, UploadIcon, CloseIcon } from '../common/icons';

const ALL_SOCIAL_PLATFORMS: SocialPlatform[] = [
  'linkedin',
  'instagram',
  'x',
  'github',
  'facebook',
  'youtube',
  'tiktok',
  'website',
];

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X',
  github: 'GitHub',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  website: 'Website',
};

type SectionId = 'appearance' | 'profile' | 'socials' | 'language' | 'data';

export const SettingsPage: React.FC = () => {
  const { t, locale, setLocale } = useT();
  const settings = useSettingsStore((state) => state.settings);
  const setDisplayName = useSettingsStore((state) => state.setDisplayName);
  const setHandle = useSettingsStore((state) => state.setHandle);
  const setPhotoDataUrl = useSettingsStore((state) => state.setPhotoDataUrl);
  const addSocial = useSettingsStore((state) => state.addSocial);
  const removeSocial = useSettingsStore((state) => state.removeSocial);
  const setSocialHandle = useSettingsStore((state) => state.setSocialHandle);
  const setAppTheme = useSettingsStore((state) => state.setAppTheme);

  const { fileInputRef, handleFileChange, triggerUpload } = useAvatarUpload();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const [activeSection, setActiveSection] = useState<SectionId>('profile');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const ids: SectionId[] = ['profile', 'socials', 'language', 'data'];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.getAttribute('data-section') as SectionId);
      },
      { rootMargin: '-10% 0px -70% 0px' },
    );
    ids.forEach((id) => {
      const el = document.querySelector(`[data-section="${id}"]`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  const jump = (id: SectionId) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSection(id);
    document.querySelector(`[data-section="${id}"]`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  const handleExportData = () => {
    try {
      downloadAllUserData();
      setFeedbackMessage({ text: t('settings.importSuccess'), type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch {
      setFeedbackMessage({ text: t('settings.importError'), type: 'error' });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = importAllUserData(text, {
        confirmOverwrite: ({ removedProjects }) =>
          window.confirm(t('settings.importOverwriteConfirm').replace('{count}', String(removedProjects))),
      });
      if (success) {
        setFeedbackMessage({ text: t('settings.importSuccess'), type: 'success' });
      } else {
        setFeedbackMessage({ text: t('settings.importError'), type: 'error' });
      }
    } catch {
      setFeedbackMessage({ text: t('settings.importError'), type: 'error' });
    }
    // Reset file input
    e.target.value = '';
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleClearData = async () => {
    if (window.confirm(t('settings.clearConfirm'))) {
      await clearAllAppData();
      setFeedbackMessage({
        text: 'All local data has been cleared.',
        type: 'success',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const navItems: Array<{ id: SectionId; label: string; mobileOnly?: boolean }> = [
    { id: 'appearance', label: t('settings.appearance'), mobileOnly: true },
    { id: 'profile', label: t('settings.profileSection') },
    { id: 'socials', label: t('settings.socialsTitle') },
    { id: 'language', label: t('settings.language') },
    { id: 'data', label: t('settings.dataTitle') },
  ];
  const isDark = settings.appTheme === 'dark';

  return (
    <div className="ed-page">
      <AppNav current="/settings" />

      <div className="ed-head">
        <p className="ed-eyebrow">{t('settings.eyebrow')}</p>
        <h1 className="ed-title" aria-label={t('settings.title')}>
          {t('settings.titleLead')} <em>{t('settings.titleEm')}</em>
        </h1>
        <p className="ed-lead">{t('settings.description')}</p>
      </div>

      <main className="st-grid">
        <nav className="st-side" aria-label={t('settings.sectionsNav')} data-testid="settings-section-nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              data-testid={`settings-nav-${item.id}`}
              className={item.mobileOnly ? 'st-mob' : undefined}
              aria-current={activeSection === item.id ? 'true' : undefined}
              onClick={jump(item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div>
          <section
            className="st-sec st-appearance"
            data-section="appearance"
            aria-labelledby="settings-appearance-title"
            data-testid="settings-appearance-section"
          >
            <h2 id="settings-appearance-title">{t('settings.appearance')}</h2>
            <p className="st-d">{t('settings.appearanceDescription')}</p>
            <div className="st-theme" role="group" aria-label={t('nav.themeGroup')}>
              <button type="button" data-testid="settings-app-theme-dark" aria-pressed={isDark} onClick={() => applyThemeWithFade('dark', setAppTheme)}>
                <i style={{ background: '#0f172a' }} />
                <span>{t('settings.themeDark')}</span>
              </button>
              <button type="button" data-testid="settings-app-theme-light" aria-pressed={!isDark} onClick={() => applyThemeWithFade('light', setAppTheme)}>
                <i style={{ background: '#f4f1ea' }} />
                <span>{t('settings.themeLight')}</span>
              </button>
            </div>
          </section>

          <section
            className="st-sec st-first"
            data-section="profile"
            id="profile"
            aria-labelledby="settings-profile-title"
            data-testid="settings-profile-section"
          >
            <h2 id="settings-profile-title">{t('settings.profileSection')}</h2>
            <p className="st-d">{t('settings.profileShown')}</p>

            <div className="st-av">
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
                className="st-av-img cursor-pointer"
              >
                {settings.photoDataUrl ? (
                  <img data-testid="settings-avatar-preview" src={settings.photoDataUrl} alt={settings.displayName || 'Avatar'} />
                ) : (
                  <span data-testid="settings-avatar-placeholder">
                    {settings.displayName.trim().charAt(0).toUpperCase() || 'M'}
                  </span>
                )}
              </div>
              <button type="button" data-testid="settings-upload-photo-btn" onClick={triggerUpload} className="ed-btn">
                <CameraIcon size={16} />
                <span>{t('brand.uploadPhoto')}</span>
              </button>
              {settings.photoDataUrl && (
                <button type="button" data-testid="settings-remove-photo-btn" onClick={() => setPhotoDataUrl(undefined)} className="st-rm">
                  {t('brand.removePhoto')}
                </button>
              )}
              <input ref={fileInputRef} data-testid="settings-avatar-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            <div className="st-two">
              <div>
                <label htmlFor="settings-name-input" className="ed-label">{t('settings.displayName')}</label>
                <input
                  id="settings-name-input"
                  data-testid="settings-display-name-input"
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. user name"
                  className="ed-input"
                />
              </div>
              <div>
                <label htmlFor="settings-handle-input" className="ed-label">{t('settings.handle')}</label>
                <input
                  id="settings-handle-input"
                  data-testid="settings-handle-input"
                  type="text"
                  value={settings.handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. @username"
                  className="ed-input"
                />
              </div>
            </div>
          </section>

          <section
            className="st-sec"
            data-section="socials"
            id="socials"
            aria-labelledby="settings-socials-title"
            data-testid="settings-socials-section"
          >
            <h2 id="settings-socials-title">{t('settings.socialsTitle')}</h2>
            <p className="st-d">{t('settings.socialsPick')}</p>

            <div className="flex flex-wrap gap-2" role="group" aria-label={t('settings.socialsTitle')}>
              {ALL_SOCIAL_PLATFORMS.map((platform) => {
                const selected = settings.socials.some((s) => s.platform === platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    data-testid={`settings-social-chip-${platform}`}
                    aria-pressed={selected}
                    onClick={() => (selected ? removeSocial(platform) : addSocial(platform, ''))}
                    className="ed-chip"
                  >
                    <SocialIcon platform={platform} size={15} />
                    {SOCIAL_LABELS[platform]}
                  </button>
                );
              })}
            </div>

            {settings.socials.length > 0 && (
              <div className="st-hl">
                {settings.socials.map((s) => (
                  <div key={s.platform} data-testid={`settings-social-item-${s.platform}`} className="st-hr">
                    <label htmlFor={`settings-social-handle-${s.platform}`}>
                      <SocialIcon platform={s.platform} size={16} />
                      {SOCIAL_LABELS[s.platform]}
                    </label>
                    <input
                      id={`settings-social-handle-${s.platform}`}
                      type="text"
                      dir="ltr"
                      data-testid={`settings-social-handle-${s.platform}`}
                      value={s.handle}
                      onChange={(e) => setSocialHandle(s.platform, e.target.value)}
                      placeholder={t(s.platform === 'website' ? 'settings.socialHandlePlaceholder.website' : 'settings.socialHandlePlaceholder.default')}
                      aria-label={t('settings.socialHandle', { platform: SOCIAL_LABELS[s.platform] })}
                      className="ed-input"
                    />
                    <button
                      type="button"
                      data-testid={`settings-remove-social-${s.platform}`}
                      aria-label={`${t('settings.removeSocial')} ${SOCIAL_LABELS[s.platform]}`}
                      onClick={() => removeSocial(s.platform)}
                      className="st-rm"
                    >
                      {t('settings.removeSocial')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            className="st-sec"
            data-section="language"
            id="language"
            aria-labelledby="settings-language-title"
            data-testid="settings-language-section"
          >
            <h2 id="settings-language-title">{t('settings.language')}</h2>
            <p className="st-d">{t('settings.languageDescription')}</p>
            <div className="ed-seg">
              <button type="button" data-testid="settings-lang-en-btn" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>
                English
              </button>
              <button type="button" data-testid="settings-lang-ar-btn" aria-pressed={locale === 'ar'} onClick={() => setLocale('ar')}>
                العربية
              </button>
            </div>
          </section>

          <section
            className="st-sec"
            data-section="data"
            id="data"
            aria-labelledby="settings-data-title"
            data-testid="settings-data-section"
          >
            <h2 id="settings-data-title">{t('settings.dataTitle')}</h2>
            <p className="st-d">{t('settings.dataDescription')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" data-testid="settings-export-all-btn" onClick={handleExportData} className="ed-btn">
                <DownloadIcon size={16} />
                <span>{t('settings.exportAll')}</span>
              </button>
              <button type="button" data-testid="settings-import-all-btn" onClick={() => importInputRef.current?.click()} className="ed-btn">
                <UploadIcon size={16} />
                <span>{t('settings.importAll')}</span>
              </button>
              <input ref={importInputRef} data-testid="settings-import-input" type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
              <button type="button" data-testid="settings-clear-all-btn" onClick={handleClearData} className="ed-btn ed-btn-danger">
                <span>{t('settings.clearAll')}</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {feedbackMessage && (
        <div role="status" className={`st-toast ${feedbackMessage.type === 'error' ? 'err' : ''}`}>
          <span>{feedbackMessage.text}</span>
          <button type="button" onClick={() => setFeedbackMessage(null)} aria-label={t('common.close')}>
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SettingsPage;
