// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from 'vite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The drop-in folder is created inside a throwaway copy of the project, never inside the real
// src tree. Other test files load the template registry in parallel workers, and a transient
// folder in the shared tree made templateQA fail at random.
const realRoot = path.resolve(__dirname, '../..');
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'slidethread-dropin-'));
const startersDir = path.join(sandbox, 'src/templates/starters');
const dropIn = path.join(startersDir, 'zz-drop-in-test');

describe('drop-in built-in templates', () => {
  beforeAll(() => {
    fs.cpSync(path.join(realRoot, 'src'), path.join(sandbox, 'src'), { recursive: true });
    for (const name of ['assets', 'public']) if (fs.existsSync(path.join(realRoot, name))) fs.symlinkSync(path.join(realRoot, name), path.join(sandbox, name), 'dir');
    fs.symlinkSync(path.join(realRoot, 'node_modules'), path.join(sandbox, 'node_modules'), 'dir');
    for (const name of ['vite.config.ts', 'package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html']) if (fs.existsSync(path.join(realRoot, name))) fs.copyFileSync(path.join(realRoot, name), path.join(sandbox, name));
  });
  afterAll(() => { fs.rmSync(sandbox, { recursive: true, force: true }); });

  it('a new folder under src/templates/starters appears everywhere with no code edits, and disappears when removed', async () => {
    const source = JSON.parse(fs.readFileSync(path.join(startersDir, 'tech-mesh/template.json'), 'utf8'));
    fs.mkdirSync(dropIn, { recursive: true });
    fs.writeFileSync(path.join(dropIn, 'template.json'), JSON.stringify({ ...source, id: 'zz-drop-in-test', name: { en: 'Drop In Test', ar: 'تجربة' }, description: { en: 'Added by dropping a folder.', ar: 'أضيف بإسقاط مجلد.' } }));
    // A fresh Vite server re-runs the build-time folder glob, exactly like a rebuild does.
    const discovered = async (module: string, read: (m: Record<string, any>) => unknown) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const vite = await createServer({ root: sandbox, configFile: path.join(sandbox, 'vite.config.ts'), logLevel: 'silent', server: { middlewareMode: true, watch: null }, appType: 'custom' });
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
