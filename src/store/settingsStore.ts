import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BrandSettings, SocialPlatform } from '../core/schema';
import { stripLegacyDesignDefaults } from '../core/schema';
import { useI18nStore } from '../i18n';
import { STORAGE_KEYS, createSafeStorage } from '../core/storage';
import { recordHistoryChange, registerHistoryChannel } from './history';

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  displayName: 'user name',
  handle: '',
  photoDataUrl: undefined,
  showSignature: true,
  showSocials: false,
  showCounter: true,
  socials: [],
  language: 'en',
  appTheme: 'light',
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
  setSocialHandle: (platform: SocialPlatform, handle: string) => void;
  setLanguage: (language: 'en' | 'ar') => void;
  setAppTheme: (appTheme: 'light' | 'dark') => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (setRaw, get) => {
      let pendingCoalesceKey: string | undefined;
      const set = (partial: Parameters<typeof setRaw>[0], replace?: boolean) => {
        const before = get().settings;
        const coalesceKey = pendingCoalesceKey;
        pendingCoalesceKey = undefined;
        setRaw(partial, replace);
        const after = get().settings;
        if (after !== before) recordHistoryChange('settings', before, after, coalesceKey);
      };
      return {
        settings: { ...DEFAULT_BRAND_SETTINGS },

        updateSettings: (partial) => {
          const changedKeys = Object.keys(partial).sort();
          pendingCoalesceKey =
            changedKeys.length === 1 && ['displayName', 'handle'].includes(changedKeys[0]!)
              ? `setting:${changedKeys[0]}`
              : undefined;
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

        setSocialHandle: (platform, handle) => {
          get().updateSettings({
            socials: get().settings.socials.map((s) => (s.platform === platform ? { ...s, handle } : s)),
          });
        },

        removeSocial: (platform) => {
          const filtered = get().settings.socials.filter((s) => s.platform !== platform);
          get().updateSettings({ socials: filtered });
        },

        setLanguage: (language) => {
          get().updateSettings({ language });
          useI18nStore.getState().setLocale(language);
        },

        setAppTheme: (appTheme) => {
          get().updateSettings({ appTheme });
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', appTheme === 'dark');
          }
        },

        resetSettings: () => {
          set({ settings: { ...DEFAULT_BRAND_SETTINGS } });
          useI18nStore.getState().setLocale(DEFAULT_BRAND_SETTINGS.language);
        },
      };
    },
    {
      name: STORAGE_KEYS.SETTINGS,
      version: 3,
      migrate: (persistedState: unknown) => {
        if (typeof persistedState !== 'object' || persistedState === null)
          return { settings: { ...DEFAULT_BRAND_SETTINGS } };
        const state = persistedState as { settings?: Partial<BrandSettings> };
        // Design defaults (template, color, theme, counter, signature) now belong to the template, so old saved values are dropped.
        return { settings: { ...DEFAULT_BRAND_SETTINGS, ...stripLegacyDesignDefaults(state.settings || {}) } };
      },
      storage: createJSONStorage(() => createSafeStorage()),
    }
  )
);

registerHistoryChannel('settings', useSettingsStore.getState().settings, (settings) => {
  const restoredSettings = settings as BrandSettings;
  useSettingsStore.setState({ settings: restoredSettings });
  useI18nStore.getState().setLocale(restoredSettings.language);
});
