import React, { useRef, useState } from 'react';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { processBrandPhoto } from '../../core/media';
import { SocialIcon } from '../../slides/SignatureBar';
import type { SocialPlatform } from '../../core/schema';

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

export const BrandInspector: React.FC = () => {
  const { t } = useT();
  const settings = useSettingsStore((state) => state.settings);
  const setDisplayName = useSettingsStore((state) => state.setDisplayName);
  const setHandle = useSettingsStore((state) => state.setHandle);
  const setPhotoDataUrl = useSettingsStore((state) => state.setPhotoDataUrl);
  const toggleSignature = useSettingsStore((state) => state.toggleSignature);
  const toggleSocials = useSettingsStore((state) => state.toggleSocials);
  const toggleCounter = useSettingsStore((state) => state.toggleCounter);
  const addSocial = useSettingsStore((state) => state.addSocial);
  const removeSocial = useSettingsStore((state) => state.removeSocial);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const resetSettings = useSettingsStore((state) => state.resetSettings);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('x');
  const [newHandle, setNewHandle] = useState<string>('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await processBrandPhoto(file, 400);
      setPhotoDataUrl(dataUrl);
    } catch {
      // Fallback: direct FileReader
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoDataUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSocial = () => {
    if (!newHandle.trim()) return;
    addSocial(newPlatform, newHandle.trim());
    setNewHandle('');
  };

  const existingPlatforms = new Set(settings.socials.map((s) => s.platform));
  const availablePlatforms = ALL_SOCIAL_PLATFORMS.filter((p) => !existingPlatforms.has(p));

  return (
    <div data-testid="brand-inspector" className="p-4 space-y-6 select-none">
      {/* Avatar Photo (Square Crop 400x400 Downscaled) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('brand.avatar')}
        </label>
        <div className="flex items-center gap-4">
          {settings.photoDataUrl ? (
            <img
              data-testid="brand-avatar-preview"
              src={settings.photoDataUrl}
              alt={settings.displayName || 'Avatar'}
              className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500 shadow-md shrink-0"
            />
          ) : (
            <div
              data-testid="brand-avatar-placeholder"
              className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xl shrink-0"
            >
              {settings.displayName.trim().charAt(0).toUpperCase() || 'M'}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              data-testid="brand-upload-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>📷</span>
              <span>{t('brand.uploadPhoto')}</span>
            </button>

            {settings.photoDataUrl && (
              <button
                type="button"
                data-testid="brand-remove-photo-btn"
                onClick={() => setPhotoDataUrl(undefined)}
                className="min-h-[44px] py-1.5 px-3 rounded-xl text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-center transition-colors"
              >
                {t('brand.removePhoto')}
              </button>
            )}

            <input
              ref={fileInputRef}
              data-testid="brand-photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Display Name & Handle */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('brand.name')}
          </label>
          <input
            data-testid="brand-name-input"
            type="text"
            value={settings.displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('brand.handle')}
          </label>
          <input
            data-testid="brand-handle-input"
            type="text"
            value={settings.handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle"
            className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Signature & Counter Toggles */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <label className="min-h-[44px] flex items-center justify-between cursor-pointer p-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('brand.showSignature')}
          </span>
          <input
            data-testid="brand-signature-toggle"
            type="checkbox"
            checked={settings.showSignature}
            onChange={() => toggleSignature()}
            className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
        </label>

        <label className="min-h-[44px] flex items-center justify-between cursor-pointer p-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('brand.showCounter')}
          </span>
          <input
            data-testid="brand-counter-toggle"
            type="checkbox"
            checked={settings.showCounter !== false}
            onChange={() => toggleCounter()}
            className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
        </label>

        <label className="min-h-[44px] flex items-center justify-between cursor-pointer p-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('brand.showSocials')}
          </span>
          <input
            data-testid="brand-socials-toggle"
            type="checkbox"
            checked={settings.showSocials}
            onChange={() => toggleSocials()}
            className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Social Accounts Section (When showSocials is enabled) */}
      {settings.showSocials && (
        <div data-testid="brand-socials-section" className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('brand.socialsTitle')}
            </label>
            <span className="text-[10px] text-slate-400">
              Max 3 in bar
            </span>
          </div>

          {/* Existing Social Accounts List */}
          <div className="space-y-2">
            {settings.socials.map((s) => (
              <div
                key={s.platform}
                data-testid={`social-item-${s.platform}`}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <div className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <SocialIcon platform={s.platform} size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono font-medium truncate block">
                    {s.handle}
                  </span>
                </div>

                <button
                  type="button"
                  data-testid={`remove-social-${s.platform}`}
                  onClick={() => removeSocial(s.platform)}
                  aria-label={`Remove ${s.platform}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add New Social Platform */}
          {availablePlatforms.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <select
                  data-testid="add-social-platform-select"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                  className="col-span-5 min-h-[44px] py-1.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium capitalize"
                >
                  {availablePlatforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <input
                  data-testid="add-social-handle-input"
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="@handle"
                  className="col-span-7 min-h-[44px] py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <button
                type="button"
                data-testid="add-social-btn"
                disabled={!newHandle.trim()}
                onClick={handleAddSocial}
                className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>+</span>
                <span>{t('brand.addSocial')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Language Selector */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          UI Language
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="brand-lang-en"
            onClick={() => setLanguage('en')}
            className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
              settings.language === 'en'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            English (LTR)
          </button>
          <button
            type="button"
            data-testid="brand-lang-ar"
            onClick={() => setLanguage('ar')}
            className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
              settings.language === 'ar'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            العربية (RTL)
          </button>
        </div>
      </div>

      {/* Reset Settings to Defaults */}
      <div className="pt-2">
        <button
          type="button"
          data-testid="brand-reset-btn"
          onClick={() => resetSettings()}
          className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
        >
          Reset Brand to Default
        </button>
      </div>
    </div>
  );
};
