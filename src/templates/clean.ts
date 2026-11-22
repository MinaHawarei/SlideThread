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
    h1: 104,
    h2: 72,
    body: 42,
    small: 28,
    mono: 32,
  },
  radius: {
    card: 16,
    chip: 8,
  },
  Background: () => null,
};
