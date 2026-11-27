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
