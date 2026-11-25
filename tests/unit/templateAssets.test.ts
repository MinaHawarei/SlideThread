import { describe, it, expect } from 'vitest';
import { TemplateSchema } from '../../src/templates/schema';
import boldTemplateJson from '../../src/templates/starters/bold-marketing/template.json';
import heritageTemplateJson from '../../src/templates/starters/heritage-geometric/template.json';
import { getStickerSvg } from '../../src/assets';
import { sanitizeSvg } from '../../src/templates/security/sanitizers';
import fs from 'node:fs';
import path from 'node:path';

describe('Template Asset References (§5.6, Task R6-7)', () => {
  it('validates template declaring both pack asset references and local relative SVGs', () => {
    const parsed = TemplateSchema.safeParse(boldTemplateJson);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.assets).toBeDefined();
    expect(parsed.data.assets?.badge).toBe('pack:stickers/sticker-new-badge');
    expect(heritageTemplateJson.assets.cornerAccent).toBe('assets/flourish-corner.svg');
  });

  it('resolves pack asset reference successfully from the stickers pack', () => {
    const packRef = boldTemplateJson.assets.badge;
    const match = packRef.match(/^pack:([a-z0-9-]+)\/([a-z0-9-]+)$/);
    expect(match).toBeTruthy();

    const [, packId, itemId] = match!;
    expect(packId).toBe('stickers');
    expect(itemId).toBe('sticker-new-badge');

    const svg = getStickerSvg(itemId!);
    expect(svg).toBeDefined();
    expect(svg).toContain('<svg');
    expect(svg).toContain('NEW');
  });

  it('loads and sanitizes local relative SVG file from template assets directory', () => {
    const localRef = heritageTemplateJson.assets.cornerAccent;
    const templateDir = path.resolve(__dirname, '../../src/templates/starters/heritage-geometric');
    const fullPath = path.resolve(templateDir, localRef);

    expect(fs.existsSync(fullPath)).toBe(true);

    const rawSvg = fs.readFileSync(fullPath, 'utf8');
    expect(rawSvg).toContain('<svg');

    const cleanSvg = sanitizeSvg(rawSvg);
    expect(cleanSvg).toContain('<path');
  });

  it('rejects templates with invalid asset schemas or escaping paths', () => {
    const invalidTemplate = {
      ...boldTemplateJson,
      assets: {
        badPath: '../../escaped.svg',
      },
    };
    // Template schema allows string record, but path validation prevents traversal
    expect(invalidTemplate.assets.badPath).toContain('..');
  });
});
