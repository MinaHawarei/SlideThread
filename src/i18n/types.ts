export type Locale = 'en' | 'ar';
export type TextDirection = 'ltr' | 'rtl';

export interface I18nStoreState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}
