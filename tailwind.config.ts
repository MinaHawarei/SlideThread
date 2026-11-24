import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        atelier: {
          paper: 'hsl(var(--atelier-paper) / <alpha-value>)',
          panel: 'hsl(var(--atelier-panel) / <alpha-value>)',
          ink: 'hsl(var(--atelier-ink) / <alpha-value>)',
          muted: 'hsl(var(--atelier-muted) / <alpha-value>)',
          line: 'hsl(var(--atelier-line) / <alpha-value>)',
          accent: 'hsl(var(--atelier-accent) / <alpha-value>)',
        },
      },
      borderRadius: {
        atelier: 'var(--atelier-radius)',
        'atelier-small': 'var(--atelier-radius-small)',
      },
      boxShadow: {
        atelier: 'var(--atelier-shadow)',
      },
    },
  },
  plugins: [],
} satisfies Config;
