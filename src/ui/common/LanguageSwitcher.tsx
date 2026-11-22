import React from 'react';
import { useT } from '../../i18n';

export interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { locale, setLocale, t } = useT();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold border transition-colors ${
        locale === 'ar'
          ? 'bg-sky-950 text-sky-400 border-sky-800 hover:bg-sky-900'
          : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
      } ${className}`.trim()}
      aria-label={`${t('common.language')}: ${locale === 'en' ? t('common.ar') : t('common.en')}`}
      data-testid="language-switcher"
    >
      <span aria-hidden="true">🌐</span>
      <span>{locale === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
};
