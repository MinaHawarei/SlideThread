import React from 'react';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { MobileNavDrawer } from './MobileNavDrawer';
import { LanguageSwitcher } from './LanguageSwitcher';
import './editorial.css';

export type AppNavPath = '/' | '/gallery' | '/settings';

export interface AppNavProps {
  current: AppNavPath;
  onNavigate?: (path: string) => void;
}

/** Runs a short, global colour crossfade for a theme change. Skipped when the user prefers reduced motion. */
export function applyThemeWithFade(next: 'light' | 'dark', setAppTheme: (theme: 'light' | 'dark') => void): void {
  const root = document.documentElement;
  const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    root.classList.add('theme-fade');
    window.setTimeout(() => root.classList.remove('theme-fade'), 320);
  }
  setAppTheme(next);
}

const SunIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MoonIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const AppNav: React.FC<AppNavProps> = ({ current, onNavigate }) => {
  const { t, dir } = useT();
  const appTheme = useSettingsStore((state) => state.settings.appTheme) === 'dark' ? 'dark' : 'light';
  const setAppTheme = useSettingsStore((state) => state.setAppTheme);
  const isDark = appTheme === 'dark';

  const go = (event: React.MouseEvent, path: string) => {
    if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onNavigate(path);
  };

  const links: Array<{ path: AppNavPath; label: string }> = [
    { path: '/', label: t('nav.home') },
    { path: '/gallery', label: t('nav.gallery') },
    { path: '/settings', label: t('nav.settings') },
  ];

  return (
    <header data-testid="app-nav" className="ed-nav">
      <div className="flex items-center gap-2">
        <MobileNavDrawer currentPath={current} onNavigate={onNavigate} />
        <a href="/" onClick={(e) => go(e, '/')} aria-label={t('nav.home')} dir="ltr" className="ed-logo">
          <span data-testid="start-app-title">SlideThread</span>
        </a>
      </div>
      <div className="ed-nav-right">
        <nav aria-label={t('nav.primary')} dir={dir} className="ed-nav-links">
          {links.map((link) => (
            <a
              key={link.path}
              href={link.path}
              onClick={(e) => go(e, link.path)}
              aria-current={current === link.path ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <LanguageSwitcher className="ed-lang" />
        {/* Desktop only: on mobile the theme lives in Settings under Appearance. */}
        <button
          type="button"
          data-testid="nav-theme-toggle"
          aria-pressed={isDark}
          aria-label={isDark ? t('nav.themeToLight') : t('nav.themeToDark')}
          title={isDark ? t('nav.themeToLight') : t('nav.themeToDark')}
          onClick={() => applyThemeWithFade(isDark ? 'light' : 'dark', setAppTheme)}
          className="ed-toggle"
          dir="ltr"
        >
          <span className={isDark ? 'on' : ''}><MoonIcon /></span>
          <span className={isDark ? '' : 'on'}><SunIcon /></span>
        </button>
      </div>
    </header>
  );
};
