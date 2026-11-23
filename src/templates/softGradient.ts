import type { TemplateDef } from './types';
import { SoftGradientBackground } from './SoftGradientBackground';

export const softGradientTemplate: TemplateDef = {
  id: 'soft-gradient',
  className: 'soft',
  nameKey: 'wizard.template.soft-gradient',
  previewUrl: new URL('./starters/soft-gradient/preview.webp', import.meta.url).href,
  fonts: { display: 'IBM Plex Sans, sans-serif', body: 'IBM Plex Sans, IBM Plex Sans Arabic, sans-serif', mono: 'JetBrains Mono, monospace' },
  typeScale: { h1: 108, h2: 72, body: 42, small: 28, mono: 32 },
  radius: { card: 36, chip: 9999 },
  Background: SoftGradientBackground,
};
