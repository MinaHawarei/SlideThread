import type { TemplateDef } from './types';
import { HeritageGeometricBackground } from './HeritageGeometricBackground';
import heritageTemplateData from './starters/heritage-geometric/template.json';
import type { Palette } from '../core/palette';

const heritagePalettes = {
  dark: heritageTemplateData.theme.modes.dark as Palette,
  light: heritageTemplateData.theme.modes.light as Palette,
};

export const heritageGeometricTemplate: TemplateDef = {
  id: 'heritage-geometric',
  className: 'heritage',
  nameKey: 'wizard.template.heritage-geometric',
  previewUrl: new URL('./starters/heritage-geometric/preview.webp', import.meta.url).href,
  fonts: { display: 'IBM Plex Sans Arabic, sans-serif', body: 'IBM Plex Sans Arabic, sans-serif', mono: 'JetBrains Mono, monospace' },
  typeScale: { h1: 104, h2: 72, body: 42, small: 28, mono: 32 },
  radius: { card: 20, chip: 12 },
  counter: { styles: ['number', 'dots'], defaultStyle: 'number' },
  paletteByMode: heritagePalettes,
  Background: HeritageGeometricBackground,
};
