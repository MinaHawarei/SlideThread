// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest';
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const startersDir = path.resolve(__dirname, '../../src/templates/starters');
const dropIn = path.join(startersDir, 'zz-drop-in-test');

describe('drop-in built-in templates', () => {
  afterAll(() => { fs.rmSync(dropIn, { recursive: true, force: true }); });

  it('a new folder under src/templates/starters appears everywhere with no code edits, and disappears when removed', async () => {
    const source = JSON.parse(fs.readFileSync(path.join(startersDir, 'tech-mesh/template.json'), 'utf8'));
    fs.mkdirSync(dropIn, { recursive: true });
    fs.writeFileSync(path.join(dropIn, 'template.json'), JSON.stringify({ ...source, id: 'zz-drop-in-test', name: { en: 'Drop In Test', ar: 'تجربة' }, description: { en: 'Added by dropping a folder.', ar: 'أضيف بإسقاط مجلد.' } }));
    // A fresh Vite server re-runs the build-time folder glob, exactly like a rebuild does.
    const discovered = async (module: string, read: (m: Record<string, any>) => unknown) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const vite = await createServer({ configFile: path.resolve(__dirname, '../../vite.config.ts'), logLevel: 'silent', server: { middlewareMode: true, watch: null }, appType: 'custom' });
      try { return read(await vite.ssrLoadModule(module)); } finally { await vite.close(); }
    };
    const ids = (m: Record<string, any>) => m.templateRegistry.templates.map((t: { id: string }) => t.id); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(await discovered('/src/templates/registry/index.ts', ids)).toContain('zz-drop-in-test');
    expect(await discovered('/src/gallery/data.ts', (m) => m.TEMPLATE_GALLERY_INDEX.templates.map((t: { id: string }) => t.id))).toContain('zz-drop-in-test');
    expect(await discovered('/src/templates/index.ts', (m) => m.getAllTemplates().map((t: { id: string }) => t.id))).toContain('zz-drop-in-test');
    expect(await discovered('/src/i18n/index.ts', (m) => [m.translate('en', 'wizard.template.zz-drop-in-test'), m.translate('ar', 'wizard.template.zz-drop-in-test')])).toEqual(['Drop In Test', 'تجربة']);

    fs.rmSync(dropIn, { recursive: true, force: true });
    expect(await discovered('/src/templates/registry/index.ts', ids)).not.toContain('zz-drop-in-test');
  });
});
