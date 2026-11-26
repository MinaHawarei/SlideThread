import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { buildManifest, buildTemplateZip, slugify, uniqueTemplateId, validateBuilderInput, type TemplateBuilderInput } from '@/templates/builder';
import { TemplateSchema } from '@/templates/schema';
import { STARTER_TEMPLATE_IDS } from '@/templates/starters';

const input: TemplateBuilderInput = { nameEn: 'My Serif Look', nameAr: '', baseId: STARTER_TEMPLATE_IDS[0]!, displayFont: 'ibm-plex-serif', bodyFont: 'ibm-plex-sans', cardRadius: 40, chipRadius: 9999 };

describe('template builder', () => {
  it('makes safe unique ids', () => {
    expect(slugify('  Héllo Wörld!! ')).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slugify('مرحبا')).toMatch(/^custom-/);
    expect(uniqueTemplateId('Look', [])).toBe('my-look');
    expect(uniqueTemplateId('Look', ['my-look', 'my-look-2'])).toBe('my-look-3');
  });
  it('validates input', () => {
    expect(validateBuilderInput(input)).toBeUndefined();
    expect(validateBuilderInput({ ...input, nameEn: '  ' })).toMatch(/name/i);
    expect(validateBuilderInput({ ...input, baseId: 'nope' })).toMatch(/base/i);
    expect(validateBuilderInput({ ...input, cardRadius: -1 })).toMatch(/radius/i);
  });
  it('builds a manifest accepted by the template schema, extending the base', () => {
    const m = buildManifest(input, 'my-serif-look');
    const parsed = TemplateSchema.parse(m);
    expect(parsed.extends).toBe(input.baseId);
    expect(parsed.theme.fonts.display).toBe('ibm-plex-serif');
    expect(parsed.theme.radius?.card).toBe(40);
    expect(parsed.name.ar).toBe('My Serif Look');
  });
  it('zips with a single root folder named after the id', async () => {
    const file = await buildTemplateZip(buildManifest(input, 'my-serif-look'));
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    expect(Object.keys(zip.files).filter((n) => !zip.files[n]!.dir)).toEqual(['my-serif-look/template.json']);
  });
});
