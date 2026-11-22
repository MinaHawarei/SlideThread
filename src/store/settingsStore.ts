import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BrandSettings, SocialPlatform, ThemeMode } from '../core/schema';
import { useI18nStore } from '../i18n';
import { STORAGE_KEYS, createSafeStorage } from '../core/storage';

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  displayName: 'Mina Hawarei',
  handle: '@minahawarei',
  photoDataUrl: undefined,
  showSignature: true,
  showSocials: false,
  showCounter: true,
  socials: [
    { platform: 'linkedin', handle: 'in/minahawarei' },
    { platform: 'github', handle: 'minahawarei' },
    { platform: 'instagram', handle: '@minahawarei' },
  ],
  language: 'en',
  defaultTemplateId: 'network',
  defaultPrimaryColor: '#35D0E6',
  defaultTheme: 'dark',
};

export interface SettingsState {
  settings: BrandSettings;
  updateSettings: (partial: Partial<BrandSettings>) => void;
  setDisplayName: (displayName: string) => void;
  setHandle: (handle: string) => void;
  setPhotoDataUrl: (photoDataUrl?: string) => void;
  toggleSignature: (show?: boolean) => void;
  toggleSocials: (show?: boolean) => void;
  toggleCounter: (show?: boolean) => void;
  setSocials: (socials: { platform: SocialPlatform; handle: string }[]) => void;
  addSocial: (platform: SocialPlatform, handle: string) => void;
  removeSocial: (platform: SocialPlatform) => void;
  setLanguage: (language: 'en' | 'ar') => void;
  setDefaultTemplate: (templateId: string) => void;
  setDefaultColor: (color: string) => void;
  setDefaultTheme: (theme: ThemeMode) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_BRAND_SETTINGS },

      updateSettings: (partial) => {
        set((state) => {
          const next = { ...state.settings, ...partial };
          if (partial.language && partial.language !== state.settings.language) {
            useI18nStore.getState().setLocale(partial.language);
          }
          return { settings: next };
        });
      },

      setDisplayName: (displayName) => {
        get().updateSettings({ displayName });
      },

      setHandle: (handle) => {
        get().updateSettings({ handle });
      },

      setPhotoDataUrl: (photoDataUrl) => {
        get().updateSettings({ photoDataUrl });
      },

      toggleSignature: (show) => {
        const current = get().settings.showSignature;
        get().updateSettings({ showSignature: show !== undefined ? show : !current });
      },

      toggleSocials: (show) => {
        const current = get().settings.showSocials;
        get().updateSettings({ showSocials: show !== undefined ? show : !current });
      },

      toggleCounter: (show) => {
        const current = get().settings.showCounter !== false;
        get().updateSettings({ showCounter: show !== undefined ? show : !current });
      },

      setSocials: (socials) => {
        get().updateSettings({ socials });
      },

      addSocial: (platform, handle) => {
        const filtered = get().settings.socials.filter((s) => s.platform !== platform);
        get().updateSettings({ socials: [...filtered, { platform, handle }] });
      },

      removeSocial: (platform) => {
        const filtered = get().settings.socials.filter((s) => s.platform !== platform);
        get().updateSettings({ socials: filtered });
      },

      setLanguage: (language) => {
        get().updateSettings({ language });
        useI18nStore.getState().setLocale(language);
      },

      setDefaultTemplate: (defaultTemplateId) => {
        get().updateSettings({ defaultTemplateId });
      },

      setDefaultColor: (defaultPrimaryColor) => {
        get().updateSettings({ defaultPrimaryColor });
      },

      setDefaultTheme: (defaultTheme) => {
        get().updateSettings({ defaultTheme });
      },

      resetSettings: () => {
        set({ settings: { ...DEFAULT_BRAND_SETTINGS } });
        useI18nStore.getState().setLocale(DEFAULT_BRAND_SETTINGS.language);
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      version: 1,
      storage: createJSONStorage(() => createSafeStorage()),
    }
  )
);
