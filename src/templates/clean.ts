import type { TemplateDef } from './types';

export const cleanTemplate: TemplateDef = {
  id: 'clean',
  nameKey: 'template.clean',
  fonts: {
    display: 'IBM Plex Sans, sans-serif',
    body: 'IBM Plex Sans, IBM Plex Sans Arabic, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  typeScale: {
    h1: 96,
    h2: 64,
    body: 38,
    small: 26,
    mono: 30,
  },
  radius: {
    card: 12,
    chip: 6,
  },
  Background: () => null,
};

