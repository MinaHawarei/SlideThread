import type { TemplateDef } from './types';
import boldTemplateData from './starters/bold-marketing/template.json';

const boldPaletteOverrides = {
  dark: boldTemplateData.theme.modes.dark,
  light: boldTemplateData.theme.modes.light,
};

export const boldTemplate: TemplateDef = {
  id: 'bold-marketing',
  className: 'bold',
  nameKey: 'wizard.template.bold-marketing',
  previewUrl: new URL('./starters/bold-marketing/preview.webp', import.meta.url).href,
  fonts: {
    display: 'IBM Plex Sans, sans-serif',
    body: 'IBM Plex Sans, IBM Plex Sans Arabic, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  typeScale: {
    h1: 124,
    h2: 80,
    body: 44,
    small: 30,
    mono: 34,
  },
  radius: {
    card: 0,
    chip: 0,
  },
  counter: { styles: ['number', 'bar'], defaultStyle: 'number' },
  paletteOverridesByMode: boldPaletteOverrides,
  Background: () => null,
};

