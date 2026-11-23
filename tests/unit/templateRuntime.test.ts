import { describe, expect, it, vi } from 'vitest';
import { createTemplateRuntime, type TemplateDataLoader } from '../../src/templates/runtime';
import type { TemplateData } from '../../src/templates/schema';

const base: TemplateData = {
  schema: 1,
  id: 'base-theme',
  name: { en: 'Base', ar: 'أساس' },
  author: { name: 'SlideThread' },
  license: 'MIT',
  categories: ['coding'],
  tags: ['minimal'],
  colorFlexible: true,
  theme: {
    modes: { dark: { acc: '#f04' } },
    fonts: { display: 'ibm-plex-sans', body: 'ibm-plex-sans-arabic' },
    typeScale: { h1: 88 },
  },
  layouts: { cover: 'cover-centered' },
  decor: {
    background: { id: 'dots-grid', params: { rows: 3 }, intensity: 0.5 },
    overlay: [{ id: 'waves', params: { cycles: 1 }, intensity: 0.25 }],
  },
  formats: 'all',
};

const child: TemplateData = {
  ...base,
  id: 'child-theme',
  name: { en: 'Child', ar: 'فرعي' },
  extends: 'base-theme',
  layouts: { cover: 'missing-layout' },
  customCss: 'style.css',
};

function loader(data: TemplateData): TemplateDataLoader {
  return async () => ({ default: data });
}

const context = {
  tileIndex: 0,
  tileCount: 1,
  tileWidth: 1080,
  height: 1350,
  seed: 42,
};

describe('lazy template runtime', () => {
  it('loads only the requested manifest and caches its resolved data', async () => {
    const parentLoader = vi.fn(loader(base));
    const childLoader = vi.fn(loader(child));
    const runtime = createTemplateRuntime({ 'base-theme': parentLoader, 'child-theme': childLoader });

    expect(parentLoader).not.toHaveBeenCalled();
    const first = await runtime.load('child-theme');
    const second = await runtime.load('child-theme');

    expect(first.id).toBe('child-theme');
    expect(first.extends).toBeUndefined();
    expect(first.theme.typeScale).toEqual({ h1: 88 });
    expect(childLoader).toHaveBeenCalledTimes(1);
    expect(parentLoader).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('resolves palette and decoration, and falls back to a registered layout of the same slide type', async () => {
    const runtime = createTemplateRuntime({ 'base-theme': loader(base), 'child-theme': loader(child) });
    const result = await runtime.resolve({
      templateId: 'child-theme',
      mode: 'dark',
      primaryColor: '#1680e8',
      slideType: 'cover',
      aspectClass: 'portrait',
      decorationContext: context,
      customCssText: '.tpl-child-theme { color: #123; }',
    });

    expect(result.palette.acc).toBe('#f04');
    expect(result.tokens.fonts.display).toBe('ibm-plex-sans');
    expect(result.tokens.typeScale).toEqual({ h1: 88, h2: 76, body: 44, small: 30, mono: 34 });
    expect(result.tokens.radius).toEqual({ card: 24, chip: 9999 });
    expect(result.layout.id).toBe('cover-editorial');
    expect(result.layoutVariant.aspectClass).toBe('portrait');
    expect(result.layoutFallback).toBe(true);
    expect(result.decoration.length).toBeGreaterThan(0);
    expect(result.decoration.every((primitive) => primitive.opacity <= 0.5)).toBe(true);
    expect(result.decoration.some((primitive) => primitive.kind === 'polyline')).toBe(true);
    expect(result.customCss).toContain('.tpl-child-theme');
  });

  it('rejects unknown manifests and inheritance cycles without hanging', async () => {
    const cycleA: TemplateData = { ...base, id: 'cycle-a', extends: 'cycle-b' };
    const cycleB: TemplateData = { ...base, id: 'cycle-b', extends: 'cycle-a' };
    const runtime = createTemplateRuntime({ 'cycle-a': loader(cycleA), 'cycle-b': loader(cycleB) });
    await expect(runtime.load('missing')).rejects.toThrow('Unknown template: missing');
    await expect(runtime.load('cycle-a')).rejects.toThrow(/inheritance cycle/);
  });

  it('falls back when a registered layout belongs to another slide type', async () => {
    const mismatched: TemplateData = { ...base, layouts: { cover: 'explain-editorial' } };
    const runtime = createTemplateRuntime({ [mismatched.id]: loader(mismatched) });
    const result = await runtime.resolve({
      templateId: mismatched.id,
      mode: 'light',
      primaryColor: '#1680e8',
      slideType: 'cover',
      aspectClass: 'square',
      decorationContext: context,
      decorationsEnabled: false,
    });
    expect(result.layout.id).toBe('cover-editorial');
    expect(result.layoutFallback).toBe(true);
    expect(result.decoration).toEqual([]);
  });
});
