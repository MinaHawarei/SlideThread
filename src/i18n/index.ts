import { templateRegistry } from '../templates/registry';
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
          document.documentElement.lang = locale;
          // The UI layout never mirrors: panels keep their physical positions in
          // both languages; only text content follows the language direction.
          document.documentElement.dir = 'ltr';
          document.documentElement.classList.remove('rtl');
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
/** Built-in templates added by dropping a folder carry their own names; no dictionary entry is needed. */
function builtinTemplateText(locale: Locale, key: string): string | undefined {
  const match = /^wizard\.(template|templateDesc)\.(.+)$/.exec(key);
  if (!match) return undefined;
  const entry = templateRegistry.templates.find((template) => template.id === match[2]);
  if (!entry) return undefined;
  const text = match[1] === 'template' ? entry.name : entry.description;
  return text[locale as 'en' | 'ar'] ?? text.en;
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dictionary = DICTIONARIES[locale] || DICTIONARIES.en;
  let text = dictionary[key] || DICTIONARIES.en[key] || builtinTemplateText(locale, key as string) || (key as string);

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
