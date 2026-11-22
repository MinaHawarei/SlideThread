import type { TemplateDef } from './types';

export const boldTemplate: TemplateDef = {
  id: 'bold',
  nameKey: 'template.bold',
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
  Background: () => null,
};

