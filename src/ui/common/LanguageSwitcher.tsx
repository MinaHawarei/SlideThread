import React from 'react';
import { useT } from '../../i18n';

export interface LanguageSwitcherProps {
  className?: string;
}

/** Text-only "EN | عربي" switch. The current language is emphasised. No icon font or emoji. */
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
      dir="ltr"
    >
      <span aria-hidden="true">
        {locale === 'en' ? <b>EN</b> : <span>EN</span>}
        {' | '}
        {locale === 'ar' ? <b>عربي</b> : <span>عربي</span>}
      </span>
    </button>
  );
};
