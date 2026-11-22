import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { en, type TranslationKey } from './en';
import { ar } from './ar';
import type { Locale, TextDirection, I18nStoreState } from './types';

export { en } from './en';
export { ar } from './ar';
export type { TranslationKey } from './en';
export type { Locale, TextDirection, I18nStoreState } from './types';

export const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = {
  en,
  ar,
};

export const useI18nStore = create<I18nStoreState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale: Locale) => {
        set({ locale });
        if (typeof document !== 'undefined') {
          const dir: TextDirection = locale === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = locale;
          document.documentElement.dir = dir;
          if (dir === 'rtl') {
            document.documentElement.classList.add('rtl');
          } else {
            document.documentElement.classList.remove('rtl');
          }
        }
      },
    }),
    {
      name: 'slidethread:locale',
    }
  )
);

/**
 * Pure translation function with optional parameter interpolation.
 * Example: t('editor.slideCounter', { current: 1, total: 5 }) -> "Slide 1 of 5"
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dictionary = DICTIONARIES[locale] || DICTIONARIES.en;
  let text = dictionary[key] || DICTIONARIES.en[key] || (key as string);

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  return text;
}

/**
 * React hook for using translations in components.
 */
export function useT() {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);
  const dir: TextDirection = locale === 'ar' ? 'rtl' : 'ltr';

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    return translate(locale, key, params);
  };

  return {
    t,
    locale,
    dir,
    setLocale,
  };
}
