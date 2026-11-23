import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BrandSettings, SocialPlatform, ThemeMode, SignatureConfig, CounterConfig } from '../core/schema';
import { useI18nStore } from '../i18n';
import { STORAGE_KEYS, createSafeStorage } from '../core/storage';
import { DEFAULT_COUNTER_CONFIG, DEFAULT_SIGNATURE_CONFIG } from '../core/schema';
import { recordHistoryChange, registerHistoryChannel } from './history';

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  displayName: 'Mina Hawarei',
  handle: '@minahawarei',
  photoDataUrl: undefined,
  showSignature: true,
  showSocials: false,
  showCounter: true,
  defaultCounter: { ...DEFAULT_COUNTER_CONFIG },
  defaultSignature: { ...DEFAULT_SIGNATURE_CONFIG },
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
  updateDefaultCounter: (counter: Partial<CounterConfig>) => void;
  updateDefaultSignature: (signature: Partial<SignatureConfig>) => void;
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

        updateDefaultCounter: (counter) => {
          const current = get().settings.defaultCounter ?? DEFAULT_COUNTER_CONFIG;
          get().updateSettings({
            defaultCounter: { ...current, ...counter },
          });
        },

        updateDefaultSignature: (signature) => {
          const current = get().settings.defaultSignature ?? DEFAULT_SIGNATURE_CONFIG;
          get().updateSettings({
            defaultSignature: { ...current, ...signature },
          });
        },

        resetSettings: () => {
          set({ settings: { ...DEFAULT_BRAND_SETTINGS } });
          useI18nStore.getState().setLocale(DEFAULT_BRAND_SETTINGS.language);
        },
      };
    },
    {
      name: STORAGE_KEYS.SETTINGS,
      version: 2,
      migrate: (persistedState: unknown) => {
        if (typeof persistedState !== 'object' || persistedState === null)
          return { settings: { ...DEFAULT_BRAND_SETTINGS } };
        const state = persistedState as { settings?: Partial<BrandSettings> };
        return { settings: { ...DEFAULT_BRAND_SETTINGS, ...(state.settings || {}) } };
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
