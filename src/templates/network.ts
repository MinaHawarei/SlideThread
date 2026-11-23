import type { TemplateDef } from './types';
import { NetworkBackground } from './NetworkBackground';

export const networkTemplate: TemplateDef = {
  id: 'tech-mesh',
  className: 'network',
  nameKey: 'wizard.template.tech-mesh',
  previewUrl: new URL('./starters/tech-mesh/preview.webp', import.meta.url).href,
  fonts: {
    display: 'IBM Plex Sans, sans-serif',
    body: 'IBM Plex Sans, IBM Plex Sans Arabic, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  typeScale: {
    h1: 112,
    h2: 76,
    body: 44,
    small: 30,
    mono: 34,
  },
  radius: {
    card: 24,
    chip: 9999,
  },
  counter: { styles: ['number', 'bar', 'dots'], defaultStyle: 'number' },
  Background: NetworkBackground,
};
