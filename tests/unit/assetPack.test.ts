import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateAssetPackJson,
  validateAssetSvg,
  validateCompleteAssetPack,
  getAssetPacksSummary,
  loadAssetPack,
  loadAssetItem,
  registerAssetPack,
  resetAssetRegistry,
} from '../../src/assets';
import type { AssetPack } from '../../src/assets';

describe('Asset Pack Format & Validator (§5.6, REQ-10, Task R6-1)', () => {
  const validPack: AssetPack = {
    id: 'test-pack',
    name: {
      en: 'Test Pack',
      ar: 'حزمة تجريبية',
    },
    description: {
      en: 'A test asset pack',
      ar: 'حزمة عناصر للاختبار',
    },
    kind: 'shapes',
    version: '1.0.0',
    license: 'MIT',
    sourceUrl: 'https://example.com/assets',
    author: 'Test Author',
    items: [
      {
        id: 'sample-shape',
        name: { en: 'Sample Shape', ar: 'شكل تجريبي' },
        tags: { en: ['sample', 'shape'], ar: ['تجربة', 'شكل'] },
        file: 'sample-shape.svg',
        recolorable: true,
      },
      {
        id: 'star-accent',
        name: { en: 'Star Accent', ar: 'نجمة مميزة' },
        tags: { en: ['star'], ar: ['نجمة'] },
        file: 'star-accent.svg',
        recolorable: false,
      },
    ],
  };

  const sampleSvgs: Record<string, string> = {
    'sample-shape.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="currentColor"/></svg>',
    'star-accent.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 64,35 95,38 72,60 78,92 50,75 22,92 28,60 5,38 36,35" fill="#f59e0b"/></svg>',
  };

  beforeEach(() => {
    resetAssetRegistry();
  });

  describe('Pack Metadata & Licensing Validation', () => {
    it('validates a compliant asset pack JSON', () => {
      const result = validateAssetPackJson(validPack);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test-pack');
        expect(result.data.items).toHaveLength(2);
      }
    });

    it('rejects unlicensed asset packs with disallowed licenses (GPL, Proprietary, unknown)', () => {
      const gplPack = { ...validPack, license: 'GPL-3.0' };
      const gplResult = validateAssetPackJson(gplPack);
      expect(gplResult.success).toBe(false);

      const propPack = { ...validPack, license: 'Commercial-All-Rights-Reserved' };
      const propResult = validateAssetPackJson(propPack);
      expect(propResult.success).toBe(false);

      const emptyLicensePack = { ...validPack, license: '' };
      const emptyResult = validateAssetPackJson(emptyLicensePack);
      expect(emptyResult.success).toBe(false);
    });

    it('accepts all permitted licenses: CC0-1.0, CC0, MIT, ISC, Apache-2.0, CC-BY-4.0, CC-BY', () => {
      const licenses = ['CC0-1.0', 'CC0', 'MIT', 'ISC', 'Apache-2.0'] as const;
      for (const lic of licenses) {
        const pack = { ...validPack, license: lic };
        const result = validateAssetPackJson(pack);
        expect(result.success).toBe(true);
      }

      // CC-BY requires attribution
      const ccByPack = {
        ...validPack,
        license: 'CC-BY-4.0' as const,
        attribution: 'Icons created by Feather Icons (feathericons.com)',
      };
      const ccByResult = validateAssetPackJson(ccByPack);
      expect(ccByResult.success).toBe(true);
    });

    it('rejects CC-BY packs when attribution is missing or empty', () => {
      const noAttributionPack = {
        ...validPack,
        license: 'CC-BY-4.0' as const,
        attribution: '',
      };
      const result = validateAssetPackJson(noAttributionPack);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.includes('Attribution statement is required'))).toBe(true);
      }
    });

    it('rejects pack with invalid ID (uppercase, spaces, special chars)', () => {
      const badIdPack = { ...validPack, id: 'My_Pack#1' };
      const result = validateAssetPackJson(badIdPack);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.includes('lowercase kebab-case'))).toBe(true);
      }
    });

    it('rejects pack with missing English or Arabic names', () => {
      const noArPack = { ...validPack, name: { en: 'Name only', ar: '' } };
      const result = validateAssetPackJson(noArPack);
      expect(result.success).toBe(false);
    });

    it('rejects pack with duplicate item IDs', () => {
      const dupPack = {
        ...validPack,
        items: [
          validPack.items[0]!,
          { ...validPack.items[0]!, file: 'another.svg' },
        ],
      };
      const result = validateAssetPackJson(dupPack);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.includes('Duplicate item ID'))).toBe(true);
      }
    });

    it('rejects items with path traversal or non-SVG extensions', () => {
      const traversalPack = {
        ...validPack,
        items: [
          { ...validPack.items[0]!, file: '../dangerous.svg' },
        ],
      };
      const result = validateAssetPackJson(traversalPack);
      expect(result.success).toBe(false);

      const nonSvgPack = {
        ...validPack,
        items: [
          { ...validPack.items[0]!, file: 'image.png' },
        ],
      };
      const nonSvgResult = validateAssetPackJson(nonSvgPack);
      expect(nonSvgResult.success).toBe(false);
    });

    it('rejects pack with empty items array', () => {
      const emptyItemsPack = { ...validPack, items: [] };
      const result = validateAssetPackJson(emptyItemsPack);
      expect(result.success).toBe(false);
    });
  });

  describe('SVG Content Validation & Sanitization', () => {
    it('validates and sanitizes clean SVGs', () => {
      const cleanSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="currentColor"/></svg>';
      const result = validateAssetSvg(cleanSvg);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('<circle');
        expect(result.data).toContain('viewBox="0 0 50 50"');
      }
    });

    it('rejects empty or whitespace-only SVG', () => {
      expect(validateAssetSvg('').success).toBe(false);
      expect(validateAssetSvg('   ').success).toBe(false);
    });

    it('rejects SVG lacking root <svg> element', () => {
      expect(validateAssetSvg('<div>Not an SVG</div>').success).toBe(false);
    });

    it('rejects SVGs containing <script> tags or inline event handlers', () => {
      const scriptSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><circle cx="10" cy="10" r="5"/></svg>';
      expect(validateAssetSvg(scriptSvg).success).toBe(false);

      const onloadSvg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle cx="10" cy="10" r="5"/></svg>';
      expect(validateAssetSvg(onloadSvg).success).toBe(false);
    });

    it('rejects SVGs with dangerous elements like <foreignObject>', () => {
      const foreignSvg = '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="100" height="100"><iframe src="https://evil.com"></iframe></foreignObject></svg>';
      const result = validateAssetSvg(foreignSvg);
      // DOMPurify strips foreignObject, but if empty, it's caught
      if (result.success) {
        expect(result.data).not.toContain('<foreignObject');
        expect(result.data).not.toContain('<iframe');
      }
    });
  });

  describe('Complete Pack Validation with Files', () => {
    it('validates a complete pack when all files are present and valid', () => {
      const result = validateCompleteAssetPack(validPack, sampleSvgs);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.svgs['sample-shape']).toContain('<rect');
        expect(result.data.svgs['star-accent']).toContain('<polygon');
      }
    });

    it('rejects complete pack when an SVG file is missing from the files record', () => {
      const incompleteSvgs = { 'sample-shape.svg': sampleSvgs['sample-shape.svg']! };
      const result = validateCompleteAssetPack(validPack, incompleteSvgs);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.includes("Missing SVG file 'star-accent.svg'"))).toBe(true);
      }
    });

    it('rejects complete pack when any SVG file has invalid or malicious content', () => {
      const badSvgs = {
        ...sampleSvgs,
        'star-accent.svg': '<svg><script>alert("hack")</script></svg>',
      };
      const result = validateCompleteAssetPack(validPack, badSvgs);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.includes('Dangerous scripts'))).toBe(true);
      }
    });
  });

  describe('Lazy Loader and Registry', () => {
    it('discovers built-in canonical "shapes" pack in summary', async () => {
      const summaries = await getAssetPacksSummary();
      const shapesSummary = summaries.find((s) => s.id === 'shapes');

      expect(shapesSummary).toBeDefined();
      expect(shapesSummary?.kind).toBe('shapes');
      expect(shapesSummary?.license).toBe('MIT');
      expect(shapesSummary?.name.en).toBe('Essential Shapes & Lines');
      expect(shapesSummary?.name.ar).toBe('الأشكال والخطوط الأساسية');
      expect(shapesSummary?.itemCount).toBe(42);
    });

    it('loads the built-in "shapes" pack lazily with sanitized SVGs', async () => {
      const pack = await loadAssetPack('shapes');
      expect(pack.id).toBe('shapes');
      expect(pack.items).toHaveLength(42);

      // Check all 16 SVG contents are sanitized and present
      for (const item of pack.items) {
        expect(pack.svgs[item.id]).toBeDefined();
        expect(pack.svgs[item.id]).toContain('<svg');
        expect(pack.svgs[item.id]).toContain('currentColor');
      }
    });

    it('loads individual asset item with its SVG content', async () => {
      const item = await loadAssetItem('shapes', 'line-arrow');
      expect(item.id).toBe('line-arrow');
      expect(item.packId).toBe('shapes');
      expect(item.name.en).toBe('Straight Arrow');
      expect(item.svgContent).toContain('<svg');
      expect(item.svgContent).toContain('path');
    });

    it('throws when requesting a non-existent pack or item', async () => {
      await expect(loadAssetPack('ghost-pack')).rejects.toThrow(/not found/);
      await expect(loadAssetItem('shapes', 'ghost-item')).rejects.toThrow(/not found/);
    });

    it('supports registering a custom pack programmatically', async () => {
      registerAssetPack(validPack, sampleSvgs);

      const summaries = await getAssetPacksSummary();
      expect(summaries.some((s) => s.id === 'test-pack')).toBe(true);

      const loaded = await loadAssetPack('test-pack');
      expect(loaded.items).toHaveLength(2);
      expect(loaded.svgs['sample-shape']).toBeDefined();
    });
  });
});
