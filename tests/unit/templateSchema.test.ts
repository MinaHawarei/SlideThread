import { describe, expect, it } from 'vitest';
import { TemplateSchema, resolveTemplate, resolveTemplatePalette, type TemplateData } from '../../src/templates/schema';
import { CATEGORY_REGISTRY } from '../../src/templates/categories';
import { generatePalette } from '../../src/core/palette';

const base: TemplateData = {
  schema: 1,
  id: 'base-theme',
  name: { en: 'Base', ar: 'أساس' },
  author: { name: 'SlideThread' },
  license: 'MIT',
  categories: ['coding'],
  tags: ['minimal'],
  colorFlexible: true,
  theme: { fonts: { display: 'ibm-plex-sans', body: 'ibm-plex-sans-arabic' }, typeScale: { h1: 88 }, radius: { card: 20 } },
  layouts: { cover: 'centered' },
  formats: 'all',
};

describe('template schema and resolution', () => {
  it('validates the bilingual category registry and schema-shaped templates', () => {
    expect(CATEGORY_REGISTRY.map(({ id }) => id)).toEqual(['coding', 'marketing', 'education', 'lifestyle', 'arabic-heritage', 'coptic', 'islamic']);
    expect(TemplateSchema.parse(base).name.ar).toBe('أساس');
    expect(TemplateSchema.safeParse({ ...base, name: { en: 'Missing Arabic' } }).success).toBe(false);
    expect(TemplateSchema.safeParse({ ...base, categories: ['unlisted'] }).success).toBe(false);
    expect(TemplateSchema.safeParse({ ...base, theme: { ...base.theme, fonts: { display: 'remote-font', body: 'ibm-plex-sans' } } }).success).toBe(false);
    expect(TemplateSchema.safeParse({ ...base, unexpected: true }).success).toBe(false);
  });

  it('inherits and overrides theme tokens, layouts, and declarations', () => {
    const child: TemplateData = {
      ...base,
      id: 'child-theme',
      extends: 'base-theme',
      categories: ['marketing'],
      theme: { fonts: { display: 'jetbrains-mono', body: 'ibm-plex-sans-arabic' }, typeScale: { body: 40 } },
      layouts: { cover: 'split', cta: 'profile' },
    };
    const resolved = resolveTemplate(child.id, [base, child]);
    expect(resolved.extends).toBeUndefined();
    expect(resolved.categories).toEqual(['marketing']);
    expect(resolved.theme.fonts.display).toBe('jetbrains-mono');
    expect(resolved.theme.typeScale).toEqual({ h1: 88, body: 40 });
    expect(resolved.theme.radius).toEqual({ card: 20 });
    expect(resolved.layouts).toEqual({ cover: 'split', cta: 'profile' });
  });

  it('rejects unknown parents, cycles, and duplicate ids', () => {
    expect(() => resolveTemplate('child', [{ ...base, id: 'child', extends: 'missing' }])).toThrow('Unknown template: missing');
    expect(() => resolveTemplate('cycle-a', [{ ...base, id: 'cycle-a', extends: 'cycle-b' }, { ...base, id: 'cycle-b', extends: 'cycle-a' }])).toThrow(/inheritance cycle/);
    expect(() => resolveTemplate('base-theme', [base, base])).toThrow('Duplicate template id: base-theme');
  });

  it('uses generated palettes for flexible templates and fixed tokens for fixed templates', () => {
    const flexible = TemplateSchema.parse(base);
    expect(resolveTemplatePalette(flexible, 'dark', '#ef4433')).toEqual(generatePalette('#ef4433', 'dark'));
    const fixed = TemplateSchema.parse({ ...base, colorFlexible: false, theme: { ...base.theme, modes: { dark: { bg: '#101010' } } } });
    expect(() => resolveTemplatePalette(fixed, 'dark', '#ef4433')).toThrow(/missing/);
    expect(() => resolveTemplatePalette(fixed, 'light', '#ef4433')).toThrow(/no fixed light palette/);
  });
});
