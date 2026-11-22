import React, { useRef } from 'react';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';

export const BrandInspector: React.FC = () => {
  const { t } = useT();
  const settings = useSettingsStore((state) => state.settings);
  const setDisplayName = useSettingsStore((state) => state.setDisplayName);
  const setHandle = useSettingsStore((state) => state.setHandle);
  const setPhotoDataUrl = useSettingsStore((state) => state.setPhotoDataUrl);
  const toggleSignature = useSettingsStore((state) => state.toggleSignature);
  const toggleSocials = useSettingsStore((state) => state.toggleSocials);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div data-testid="brand-inspector" className="p-4 space-y-6">
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
            className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
            className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Avatar Photo Upload / Remove */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('brand.avatar')}
        </label>
        <div className="flex items-center gap-3">
          {settings.photoDataUrl ? (
            <img
              data-testid="brand-avatar-preview"
              src={settings.photoDataUrl}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500 shadow-sm"
            />
          ) : (
            <div
              data-testid="brand-avatar-placeholder"
              className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-base"
            >
              {settings.displayName.charAt(0) || 'M'}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              data-testid="brand-upload-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              className="py-1 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              {t('brand.uploadPhoto')}
            </button>
            {settings.photoDataUrl && (
              <button
                type="button"
                data-testid="brand-remove-photo-btn"
                onClick={() => setPhotoDataUrl(undefined)}
                className="text-xs text-red-500 hover:text-red-700 text-left transition-colors"
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

      {/* Toggles */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('brand.showSignature')}
          </span>
          <input
            data-testid="brand-signature-toggle"
            type="checkbox"
            checked={settings.showSignature}
            onChange={() => toggleSignature()}
            className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('brand.showSocials')}
          </span>
          <input
            data-testid="brand-socials-toggle"
            type="checkbox"
            checked={settings.showSocials}
            onChange={() => toggleSocials()}
            className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
