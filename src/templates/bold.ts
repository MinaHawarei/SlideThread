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
    h1: 128,
    h2: 84,
    body: 48,
    small: 32,
    mono: 36,
  },
  radius: {
    card: 0,
    chip: 4,
  },
  Background: () => null,
};
