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
      className={`app-language-switcher ${className}`.trim()}
      aria-label={`${t('common.language')}: ${locale === 'en' ? t('common.ar') : t('common.en')}`}
      data-testid="language-switcher"
    >
      <span aria-hidden="true">🌐</span>
      <span>{locale === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
};
