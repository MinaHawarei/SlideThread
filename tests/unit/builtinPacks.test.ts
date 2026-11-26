import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadStarterTemplate } from '../../src/templates/starters';
import { templateRegistry as registry } from '../../src/templates/registry';

const PACKS = ['golden-hour-viral-full', 'neon-grid-process-full'] as const;
const ASPECTS = ['portrait', 'square', 'landscape', 'tall'];
const TYPES = ['cover', 'explain', 'rule', 'code', 'compare', 'stat', 'quote', 'image', 'cta'];

describe('built-in full-carousel packs', () => {
  for (const id of PACKS) {
    it(`${id} is registered, complete and ships all assets`, async () => {
      const entry = registry.templates.find((t) => t.id === id);
      expect(entry, 'registry entry').toBeTruthy();
      const dir = path.resolve(__dirname, '../../src/templates/starters', id);
      expect(fs.existsSync(path.join(dir, 'preview.webp'))).toBe(true);
      const manifest = await loadStarterTemplate(id);
      expect(manifest.id).toBe(id);
      for (const type of TYPES) for (const aspect of ASPECTS) {
        const elements = (manifest.composition as Record<string, Record<string, { elements?: unknown[] }>> | undefined)?.[type]?.[aspect]?.elements ?? [];
        expect(elements.length, `${type}/${aspect}`).toBeGreaterThan(0);
      }
      for (const [key, rel] of Object.entries(manifest.assets ?? {})) {
        expect(fs.existsSync(path.join(dir, rel as string)), `asset ${key}`).toBe(true);
      }
    });
  }
});
