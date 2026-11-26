import React, { useState, useRef } from 'react';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useAvatarUpload } from '../common/useAvatarUpload';
import { Footer } from '../common/Footer';
import { LogoMark } from '../brand/LogoMark';
import { MobileNavDrawer } from '../common/MobileNavDrawer';
import { SocialIcon } from '../../slides/SignatureBar';
import { getAllTemplates } from '../../templates';
import { useUserTemplateLibrary } from '../../templates/useUserTemplateLibrary';
import {
  downloadAllUserData,
  importAllUserData,
  clearAllAppData,
} from '../../core/dataBackup';
import type {
  SocialPlatform,
  Anchor,
  SignatureConfig,
  CounterConfig,
} from '../../core/schema';
import {
  DEFAULT_COUNTER_CONFIG,
  DEFAULT_SIGNATURE_CONFIG,
} from '../../core/schema';
import './settings.css';

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

const ANCHOR_OPTIONS: { id: Anchor; label: string }[] = [
  { id: 'tl', label: 'Top Left' },
  { id: 'tc', label: 'Top Center' },
  { id: 'tr', label: 'Top Right' },
  { id: 'bl', label: 'Bottom Left' },
  { id: 'bc', label: 'Bottom Center' },
  { id: 'br', label: 'Bottom Right' },
];

const PRESET_COLORS = [
  '#0284c7', // Cyan / Sky
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#ea580c', // Orange
  '#16a34a', // Green
  '#e11d48', // Rose
  '#0d9488', // Teal
];

export const SettingsPage: React.FC = () => {
  const { t, dir, locale, setLocale } = useT();
  const settings = useSettingsStore((state) => state.settings);
  const setDisplayName = useSettingsStore((state) => state.setDisplayName);
  const setHandle = useSettingsStore((state) => state.setHandle);
  const setPhotoDataUrl = useSettingsStore((state) => state.setPhotoDataUrl);
  const addSocial = useSettingsStore((state) => state.addSocial);
  const removeSocial = useSettingsStore((state) => state.removeSocial);
  const setDefaultTemplate = useSettingsStore((state) => state.setDefaultTemplate);
  const setDefaultColor = useSettingsStore((state) => state.setDefaultColor);
  const setDefaultTheme = useSettingsStore((state) => state.setDefaultTheme);
  const setAppTheme = useSettingsStore((state) => state.setAppTheme);
  const updateDefaultCounter = useSettingsStore((state) => state.updateDefaultCounter);
  const updateDefaultSignature = useSettingsStore((state) => state.updateDefaultSignature);

  const { fileInputRef, handleFileChange, triggerUpload } = useAvatarUpload();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('x');
  const [newSocialHandle, setNewSocialHandle] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const { templates: importedTemplates } = useUserTemplateLibrary();
  const templates = [
    ...getAllTemplates().map((template) => ({ id: template.id, nameKey: template.nameKey, name: undefined as string | undefined })),
    ...importedTemplates.map((template) => ({ id: template.id, nameKey: template.id, name: template.manifest.name[locale] })),
  ];
  const defaultCounter: CounterConfig = settings.defaultCounter ?? DEFAULT_COUNTER_CONFIG;
  const defaultSignature: SignatureConfig =
    settings.defaultSignature ?? DEFAULT_SIGNATURE_CONFIG;

  const handleAddSocial = () => {
    if (!newSocialHandle.trim()) return;
    addSocial(newPlatform, newSocialHandle.trim());
    setNewSocialHandle('');
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

  return (
    <div className="settings-shell" dir={dir}>
      {/* Header Navigation */}
      <header className="settings-header">
        <MobileNavDrawer currentPath="/settings" />
        <a className="settings-brand" href="/" aria-label={t('nav.home')} dir="ltr">
          <LogoMark size={24} />
          <span>SlideThread</span>
        </a>
        <nav aria-label={t('nav.primary')} dir={dir} className="hidden md:flex">
          <a href="/">{t('nav.home')}</a>
          <a href="/gallery">{t('nav.gallery')}</a>
          <a href="/settings" aria-current="page">
            {t('nav.settings')}
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="settings-main">
        <p className="settings-eyebrow">{t('settings.eyebrow')}</p>
        <h1>{t('settings.title')}</h1>
        <p className="settings-description">{t('settings.description')}</p>

        {feedbackMessage && (
          <div
            role="status"
            className={`my-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200 border border-red-300 dark:border-red-700'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-sm font-bold opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* CARD 1: Profile Defaults */}
        <section
          className="settings-card"
          aria-labelledby="settings-profile-title"
          data-testid="settings-profile-section"
        >
          <div className="settings-card-mark" aria-hidden="true">
            ✳
          </div>
          <h2 id="settings-profile-title">{t('settings.profileTitle')}</h2>
          <p>{t('settings.profileDescription')}</p>

          <div className="settings-form-group mt-6">
            {/* Avatar Photo with Square Crop */}
            <div className="flex items-center gap-4 my-2">
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
                    <span className="avatar-camera-badge" aria-hidden="true">
                      📷
                    </span>
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
                  className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
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

            {/* Display Name Input */}
            <div className="settings-field">
              <label htmlFor="settings-name-input" className="settings-field-label">
                {t('settings.displayName')}
              </label>
              <input
                id="settings-name-input"
                data-testid="settings-display-name-input"
                type="text"
                value={settings.displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. user name"
                className="settings-text-input"
              />
            </div>

            {/* Primary Handle Input */}
            <div className="settings-field">
              <label htmlFor="settings-handle-input" className="settings-field-label">
                {t('settings.handle')}
              </label>
              <input
                id="settings-handle-input"
                data-testid="settings-handle-input"
                type="text"
                value={settings.handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. @username"
                className="settings-text-input"
              />
            </div>
          </div>
        </section>

        {/* CARD 2: Social Accounts */}
        <section
          className="settings-card"
          aria-labelledby="settings-socials-title"
          data-testid="settings-socials-section"
        >
          <div className="settings-card-mark" aria-hidden="true">
            🌐
          </div>
          <h2 id="settings-socials-title">{t('settings.socialsTitle')}</h2>
          <p>{t('settings.socialsDescription')}</p>

          <div className="space-y-3 mt-5">
            {/* Existing Social Accounts */}
            <div className="space-y-2">
              {settings.socials.map((s) => (
                <div
                  key={s.platform}
                  data-testid={`settings-social-item-${s.platform}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs"
                >
                  <div className="flex items-center gap-2.5 font-medium">
                    <SocialIcon platform={s.platform} size={18} />
                    <span className="capitalize font-bold text-slate-700 dark:text-slate-300">
                      {s.platform}:
                    </span>
                    <span className="text-slate-500 font-mono">{s.handle}</span>
                  </div>

                  <button
                    type="button"
                    data-testid={`settings-remove-social-${s.platform}`}
                    onClick={() => removeSocial(s.platform)}
                    className="py-1 px-2 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold transition-colors"
                  >
                    {t('settings.removeSocial')}
                  </button>
                </div>
              ))}
            </div>

            {/* Add Social Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <select
                data-testid="settings-social-platform-select"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                className="settings-select-input"
                aria-label={t('settings.platform')}
              >
                {ALL_SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>

              <input
                type="text"
                data-testid="settings-new-social-handle"
                value={newSocialHandle}
                onChange={(e) => setNewSocialHandle(e.target.value)}
                placeholder="handle or username"
                className="settings-text-input flex-1 min-w-[140px]"
                aria-label={t('settings.handle')}
              />

              <button
                type="button"
                data-testid="settings-add-social-btn"
                onClick={handleAddSocial}
                disabled={!newSocialHandle.trim()}
                className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-xs"
              >
                + {t('settings.addSocial')}
              </button>
            </div>
          </div>
        </section>

        {/* CARD 3: Design & Signature Defaults */}
        <section
          className="settings-card"
          aria-labelledby="settings-defaults-title"
          data-testid="settings-defaults-section"
        >
          <div className="settings-card-mark" aria-hidden="true">
            🎨
          </div>
          <h2 id="settings-defaults-title">{t('settings.defaultsTitle')}</h2>
          <p>{t('settings.defaultsDescription')}</p>

          <div className="space-y-5 mt-5">
            {/* Default Template */}
            <div className="settings-field">
              <label
                htmlFor="settings-default-template"
                className="settings-field-label"
              >
                {t('settings.defaultTemplate')}
              </label>
              <select
                id="settings-default-template"
                data-testid="settings-default-template-select"
                value={settings.defaultTemplateId}
                onChange={(e) => setDefaultTemplate(e.target.value)}
                className="settings-select-input w-full"
              >
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name ?? (t(tmpl.nameKey as Parameters<typeof t>[0]) || tmpl.id)} ({tmpl.id})
                  </option>
                ))}
              </select>
            </div>

            {/* App UI Theme (Light / Dark) */}
            <div className="settings-field">
              <span className="settings-field-label">App Theme</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="settings-app-theme-light"
                  onClick={() => setAppTheme('light')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    (settings.appTheme || 'light') === 'light'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  data-testid="settings-app-theme-dark"
                  onClick={() => setAppTheme('dark')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    settings.appTheme === 'dark'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🌙 Dark
                </button>
              </div>
            </div>

            {/* Default Theme */}
            <div className="settings-field">
              <span className="settings-field-label">{t('settings.defaultTheme')}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="settings-theme-dark"
                  onClick={() => setDefaultTheme('dark')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    settings.defaultTheme === 'dark'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🌙 Dark Mode
                </button>
                <button
                  type="button"
                  data-testid="settings-theme-light"
                  onClick={() => setDefaultTheme('light')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    settings.defaultTheme === 'light'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ☀️ Light Mode
                </button>
              </div>
            </div>

            {/* Default Primary Color */}
            <div className="settings-field">
              <label
                htmlFor="settings-default-color"
                className="settings-field-label"
              >
                {t('settings.defaultColor')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="settings-default-color"
                  data-testid="settings-default-color-input"
                  type="color"
                  value={settings.defaultPrimaryColor || '#0284c7'}
                  onChange={(e) => setDefaultColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-800 p-0.5 bg-transparent"
                />
                <span className="font-mono text-xs text-slate-500">
                  {settings.defaultPrimaryColor}
                </span>

                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDefaultColor(color)}
                      style={{ backgroundColor: color }}
                      className="w-6 h-6 rounded-full border border-white/40 shadow-xs hover:scale-110 transition-transform"
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Counter Defaults */}
            <div className="settings-field pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="settings-field-label mb-0 font-bold">
                  {t('settings.defaultCounter')}
                </span>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="settings-counter-toggle"
                    checked={defaultCounter.show}
                    onChange={(e) =>
                      updateDefaultCounter({ show: e.target.checked })
                    }
                    className="rounded text-cyan-600"
                  />
                  <span>{t('counter.show')}</span>
                </label>
              </div>

              {defaultCounter.show && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">
                      {t('counter.anchor')}
                    </label>
                    <select
                      data-testid="settings-counter-anchor-select"
                      value={defaultCounter.anchor}
                      onChange={(e) =>
                        updateDefaultCounter({ anchor: e.target.value as Anchor })
                      }
                      className="settings-select-input w-full mt-1"
                    >
                      {ANCHOR_OPTIONS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">
                      {t('counter.style')}
                    </label>
                    <select
                      data-testid="settings-counter-style-select"
                      value={defaultCounter.style}
                      onChange={(e) =>
                        updateDefaultCounter({
                          style: e.target.value as 'number' | 'bar' | 'dots',
                        })
                      }
                      className="settings-select-input w-full mt-1"
                    >
                      <option value="number">Number</option>
                      <option value="bar">Progress Bar</option>
                      <option value="dots">Step Dots</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Signature Defaults */}
            <div className="settings-field pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="settings-field-label mb-0 font-bold">
                  {t('settings.defaultSignature')}
                </span>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="settings-signature-toggle"
                    checked={defaultSignature.show}
                    onChange={(e) =>
                      updateDefaultSignature({ show: e.target.checked })
                    }
                    className="rounded text-cyan-600"
                  />
                  <span>{t('brand.showSignature')}</span>
                </label>
              </div>

              {defaultSignature.show && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">
                      {t('sig.anchor')}
                    </label>
                    <select
                      data-testid="settings-signature-anchor-select"
                      value={defaultSignature.anchor}
                      onChange={(e) =>
                        updateDefaultSignature({
                          anchor: e.target.value as Anchor | 'free',
                        })
                      }
                      className="settings-select-input w-full mt-1"
                    >
                      {ANCHOR_OPTIONS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                      <option value="free">Free Placement</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">
                      {t('sig.arrangement')}
                    </label>
                    <select
                      data-testid="settings-signature-arrangement-select"
                      value={defaultSignature.arrangement}
                      onChange={(e) =>
                        updateDefaultSignature({
                          arrangement: e.target.value as 'inline' | 'stacked',
                        })
                      }
                      className="settings-select-input w-full mt-1"
                    >
                      <option value="inline">Inline</option>
                      <option value="stacked">Stacked</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">
                      {t('sig.size')}
                    </label>
                    <select
                      data-testid="settings-signature-size-select"
                      value={defaultSignature.size}
                      onChange={(e) =>
                        updateDefaultSignature({
                          size: e.target.value as 'sm' | 'md' | 'lg',
                        })
                      }
                      className="settings-select-input w-full mt-1"
                    >
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">
                      {t('sig.photoShape')}
                    </label>
                    <select
                      data-testid="settings-signature-shape-select"
                      value={defaultSignature.photoShape}
                      onChange={(e) =>
                        updateDefaultSignature({
                          photoShape: e.target.value as
                            | 'circle'
                            | 'rounded'
                            | 'square',
                        })
                      }
                      className="settings-select-input w-full mt-1"
                    >
                      <option value="circle">Circle</option>
                      <option value="rounded">Rounded</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Language row */}
            <div className="settings-language-row">
              <span>{t('settings.language')}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="settings-lang-en-btn"
                  onClick={() => setLocale('en')}
                  className={`py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                    locale === 'en'
                      ? 'bg-cyan-600 text-white'
                      : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  data-testid="settings-lang-ar-btn"
                  onClick={() => setLocale('ar')}
                  className={`py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                    locale === 'ar'
                      ? 'bg-cyan-600 text-white'
                      : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CARD 4: Data Management */}
        <section
          className="settings-card"
          aria-labelledby="settings-data-title"
          data-testid="settings-data-section"
        >
          <div className="settings-card-mark" aria-hidden="true">
            💾
          </div>
          <h2 id="settings-data-title">{t('settings.dataTitle')}</h2>
          <p>{t('settings.dataDescription')}</p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            {/* Export All Data */}
            <button
              type="button"
              data-testid="settings-export-all-btn"
              onClick={handleExportData}
              className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>📥</span>
              <span>{t('settings.exportAll')}</span>
            </button>

            {/* Import Backup */}
            <button
              type="button"
              data-testid="settings-import-all-btn"
              onClick={() => importInputRef.current?.click()}
              className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>📤</span>
              <span>{t('settings.importAll')}</span>
            </button>
            <input
              ref={importInputRef}
              data-testid="settings-import-input"
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />

            {/* Clear All Data */}
            <button
              type="button"
              data-testid="settings-clear-all-btn"
              onClick={handleClearData}
              className="py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-colors ml-auto shadow-xs"
            >
              <span>⚠️</span>
              <span>{t('settings.clearAll')}</span>
            </button>
          </div>
        </section>
      </main>

      {/* Unobtrusive Footer per Spec §10.3 */}
      <Footer />
    </div>
  );
};

export default SettingsPage;
