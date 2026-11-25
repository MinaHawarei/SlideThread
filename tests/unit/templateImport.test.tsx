import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import JSZip from 'jszip';
import { importTemplateZip } from '../../src/templates/importZip';
import { deleteUserTemplatePackage, getUserTemplatePackage, listUserTemplatePackages } from '../../src/templates/userLibrary';
import { loadTemplateProjectSnapshot, templateDefinitionFromSnapshot } from '../../src/templates/projectSnapshot';
import { invalidateTemplatePackage } from '../../src/templates/starters';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { plainTextFieldsToRichText } from '../../src/core/schema';
import { generatePalette } from '../../src/core/palette';
import { createDefaultProject } from '../../src/store/projectStore';
import { exportProjectToJSON, importProjectFromJSON } from '../../src/core/projectIO';
import { useProjectStore } from '../../src/store/projectStore';

const svgAsset = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z" fill="#ff0000"/></svg>';

function manifestFor(id: string, additions: Record<string, unknown> = {}) {
  return {
    schema: 1,
    id,
    name: { en: 'Imported Example', ar: 'قالب مستورد' },
    description: { en: 'A private package', ar: 'حزمة خاصة' },
    author: { name: 'Local designer' },
    license: 'MIT',
    categories: ['general'],
    tags: ['imported'],
    colorFlexible: true,
    theme: { fonts: { display: 'ibm-plex-sans', body: 'ibm-plex-sans-arabic', mono: 'jetbrains-mono' } },
    layouts: { cover: 'cover-centered' },
    formats: ['post', 'carousel'],
    ...additions,
  };
}

async function makeZip(id: string, files: Record<string, string | Uint8Array> = {}, manifestOverrides: Record<string, unknown> = {}, options: { includeManifest?: boolean; symlink?: boolean } = {}): Promise<File> {
  const zip = new JSZip();
  if (options.includeManifest !== false) zip.file(`${id}/template.json`, JSON.stringify(manifestFor(id, manifestOverrides)));
  for (const [path, value] of Object.entries(files)) {
    zip.file(`${id}/${path}`, value, options.symlink && path.endsWith('.svg') ? { unixPermissions: 0o120777 } : undefined);
  }
  const bytes = await zip.generateAsync({ type: 'uint8array', platform: 'UNIX', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  return new File([bytes.buffer as ArrayBuffer], `${id}.zip`, { type: 'application/zip' });
}

function replaceBytes(input: File, before: string, after: string): Promise<File> {
  return input.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    const from = new TextEncoder().encode(before);
    const to = new TextEncoder().encode(after);
    expect(from.length).toBe(to.length);
    let found = 0;
    for (let i = 0; i <= bytes.length - from.length; i += 1) {
      if (from.every((value, offset) => bytes[i + offset] === value)) {
        bytes.set(to, i);
        found += 1;
        i += from.length - 1;
      }
    }
    expect(found).toBeGreaterThan(0);
    return new File([bytes.buffer as ArrayBuffer], input.name, { type: input.type });
  });
}

const importedId = () => `custom-layout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

describe('browser template ZIP import', () => {
  afterEach(async () => {
    for (const template of await listUserTemplatePackages()) await deleteUserTemplatePackage(template.id);
    vi.restoreAllMocks();
  });

  it('imports a package with frames, editable text and image elements, and sanitized SVG; its project snapshot survives package deletion', async () => {
    const id = importedId();
    const manifest = manifestFor(id, {
      assets: { mark: 'assets/mark.svg' },
      composition: {
        cover: {
          portrait: {
            hiddenSlots: ['tag', 'title', 'sub', 'rule', 'body'],
            slots: { title: { blockStart: 0.2, inlineStart: 0.1, inlineSize: 0.8, blockSize: 0.2, align: 'start' } },
            elements: [
              { id: 'custom-tag', kind: 'text', binding: 'tag', x: 0.1, y: 0.65, w: 0.2, h: 0.06, rotation: 0, z: 4, locked: false, text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'ARCHITECTURE' }] }] } },
              { id: 'custom-chip', kind: 'text', x: 0.32, y: 0.65, w: 0.24, h: 0.06, rotation: 0, z: 5, locked: false, backgroundColor: '#123456', cornerRadius: 12, textStyle: { font: 'ibm-plex-serif', size: 18, weight: 600, italic: true }, text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'npm run build' }] }] } },
              { id: 'custom-text', kind: 'text', x: 0.1, y: 0.74, w: 0.5, h: 0.1, rotation: 0, z: 6, locked: false, text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'مرحبا mixed English long composition text' }] }] } },
              { id: 'custom-image', kind: 'image', x: 0.65, y: 0.65, w: 0.2, h: 0.2, rotation: 0, z: 7, locked: false, assetId: 'mark', filters: { grayscale: 10 } },
              { id: 'custom-shape', kind: 'shape', shape: 'rectangle', x: 0.75, y: 0.85, w: 0.12, h: 0.06, rotation: 0, z: 8, locked: false, fill: '#ff5500', cornerRadius: 6, strokeColor: '#ffffff', strokeWidth: 2 },
            ],
          },
        },
      },
    });
    const file = await makeZip(id, { 'assets/mark.svg': svgAsset }, { ...manifest, id });
    const imported = await importTemplateZip(file);
    expect(imported.id).toBe(id);
    const stored = await getUserTemplatePackage(id);
    expect(stored?.files['assets/mark.svg']?.type).toBe('image/svg+xml');
    expect(await stored?.files['assets/mark.svg']?.text()).toContain('<svg');

    const snapshot = await loadTemplateProjectSnapshot(id, '#35D0E6');
    const composition = snapshot.composition.cover?.portrait;
    expect(composition?.slots?.title?.blockStart).toBe(0.2);
    expect(composition?.elements).toHaveLength(5);
    expect(composition?.elements?.[3]?.assetId).toMatch(/^data:image\/svg\+xml;base64,/);

    const projectA = createDefaultProject({ templateId: id, templateSnapshot: snapshot });
    const projectB = createDefaultProject({ templateId: id, templateSnapshot: snapshot });
    const slideA = projectA.slides[0]!;
    const slideB = projectB.slides[0]!;
    expect(slideA.extras?.map(({ id: elementId }) => elementId)).toEqual(['custom-tag', 'custom-chip', 'custom-text', 'custom-image', 'custom-shape']);
    const editedChip = { ...slideA.extras![1]!, text: { type: 'doc' as const, blocks: [{ type: 'p' as const, runs: [{ text: 'Changed in project A' }] }] } };
    slideA.extras = slideA.extras!.map((element) => element.id === 'custom-chip' ? editedChip : element);
    expect(slideB.extras?.[1]?.text?.blocks[0]?.runs[0]?.text).toBe('npm run build');
    expect(snapshot.composition.cover?.portrait?.elements?.[1]?.text?.blocks[0]?.runs[0]?.text).toBe('npm run build');
    const projectRoundTrip = await exportProjectToJSON(projectA);
    const restored = await importProjectFromJSON(projectRoundTrip.json);
    expect(restored.templateSnapshot?.composition.cover?.portrait?.hiddenSlots).toEqual(['tag', 'title', 'sub', 'rule', 'body']);
    expect(restored.templateSnapshot?.assets['assets/mark.svg']).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(restored.slides[0]?.extras?.find((element) => element.id === 'custom-chip')?.text?.blocks[0]?.runs[0]?.text).toBe('Changed in project A');

    const priorStoreProject = useProjectStore.getState().project;
    useProjectStore.getState().setProject(projectB);
    useProjectStore.getState().deleteExtraElement(slideB.id, 'custom-chip');
    expect(useProjectStore.getState().project.slides[0]?.detachedElementIds).toContain('custom-chip');
    useProjectStore.getState().setSlideType(slideB.id, 'explain');
    useProjectStore.getState().setSlideType(slideB.id, 'cover');
    expect(useProjectStore.getState().project.slides[0]?.extras?.some((element) => element.id === 'custom-chip')).toBe(false);
    useProjectStore.getState().setProject(priorStoreProject);

    await deleteUserTemplatePackage(id);
    invalidateTemplatePackage(id);
    expect(await getUserTemplatePackage(id)).toBeUndefined();
    expect(snapshot.assets['assets/mark.svg']).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(templateDefinitionFromSnapshot(snapshot).id).toBe(id);

    const slide = {
      id: 'instance-slide', type: 'cover' as const,
      fields: plainTextFieldsToRichText({ title: 'Project copy' }),
      extras: composition?.elements ?? [],
    };
    const rendered = render(<SlideRenderer slide={slide} palette={generatePalette('#35D0E6', 'dark')} aspectClass="portrait" templateId={id} templateSnapshot={snapshot} />);
    expect(screen.getByTestId('extra-element-custom-image')).toBeInTheDocument();
    expect(document.querySelector('.slide-title-h1')).toBeNull();
    const legacySnapshot = structuredClone(snapshot);
    delete legacySnapshot.composition.cover!.portrait!.hiddenSlots;
    rendered.rerender(<SlideRenderer slide={slide} palette={generatePalette('#35D0E6', 'dark')} aspectClass="portrait" templateId={id} templateSnapshot={legacySnapshot} />);
    // Removing this optional field restores the original legacy slot with its stored text.
    expect(document.querySelector('.slide-title-h1')).toBeInTheDocument();
  });

  it('allows a missing preview and rejects a shipped ID collision without storing anything', async () => {
    const id = importedId();
    const imported = await importTemplateZip(await makeZip(id));
    expect(imported.id).toBe(id);
    expect((await getUserTemplatePackage(id))?.files['preview.webp']).toBeUndefined();
    await deleteUserTemplatePackage(id);
    await expect(importTemplateZip(await makeZip('tech-mesh'))).rejects.toThrow('already used by a shipped template');
    expect((await listUserTemplatePackages()).some((item) => item.id === 'tech-mesh')).toBe(false);
  });

  it('rejects an invalid schema and unknown font with the failing field named', async () => {
    await expect(importTemplateZip(await makeZip(importedId(), {}, { schema: 2 }))).rejects.toThrow('template.json failed schema validation at schema');
    await expect(importTemplateZip(await makeZip(importedId(), {}, { theme: { fonts: { display: 'unknown-font', body: 'ibm-plex-sans-arabic' } } }))).rejects.toThrow('theme.fonts.display');
    const badBinding = manifestFor(importedId(), { composition: { explain: { portrait: { elements: [{ id: 'bound-tag', kind: 'text', binding: 'tag', x: 0, y: 0, w: 0.2, h: 0.1, rotation: 0, z: 0, locked: false }] } } } });
    await expect(importTemplateZip(await makeZip(String(badBinding.id), {}, badBinding))).rejects.toThrow('Semantic field bindings are currently supported only on cover slides');
    expect(await listUserTemplatePackages()).toHaveLength(0);
  });

  it('rejects oversized ZIPs, too many files, suspicious ratios, and oversized asset totals', async () => {
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.zip');
    await expect(importTemplateZip(oversized)).rejects.toThrow('compressed-size limit');

    const many: Record<string, string> = {};
    for (let i = 0; i < 64; i += 1) many[`assets/${i}.json`] = '{}';
    await expect(importTemplateZip(await makeZip(importedId(), many))).rejects.toThrow('file-count limit');

    await expect(importTemplateZip(await makeZip(importedId(), { 'assets/repeat.json': 'A'.repeat(20_000) }))).rejects.toThrow('compression ratio');

    const randomBytes = new Uint8Array(300 * 1024 + 1);
    let seed = 101;
    for (let i = 0; i < randomBytes.length; i += 1) { seed = (seed * 16807) % 2147483647; randomBytes[i] = seed & 255; }
    await expect(importTemplateZip(await makeZip(importedId(), { 'assets/large.png': randomBytes }))).rejects.toThrow('total asset limit');
    expect(await listUserTemplatePackages()).toHaveLength(0);
  });

  it('rejects executable files, customCss, unsafe paths, duplicate entries, and symbolic links', async () => {
    await expect(importTemplateZip(await makeZip(importedId(), { 'script.js': 'alert(1)' }))).rejects.toThrow('code files are not allowed');
    await expect(importTemplateZip(await makeZip(importedId(), { 'assets/theme.css': '.slide{color:red}' }))).rejects.toThrow('code files are not allowed');
    await expect(importTemplateZip(await makeZip(importedId(), {}, { customCss: '.x { color: red }' }))).rejects.toThrow('customCss');

    const traversal = await makeZip(importedId(), { 'aa/payload.json': '{}' });
    await expect(importTemplateZip(await replaceBytes(traversal, 'aa/payload.json', '../payload.json'))).rejects.toThrow('parent-directory segment');
    const absoluteId = importedId();
    const absolute = await makeZip(absoluteId);
    await expect(importTemplateZip(await replaceBytes(absolute, absoluteId, `/${absoluteId.slice(1)}`))).rejects.toThrow('absolute');

    const duplicate = await makeZip(importedId(), { 'assets/aa.svg': svgAsset, 'assets/bb.svg': svgAsset });
    await expect(importTemplateZip(await replaceBytes(duplicate, 'bb.svg', 'aa.svg'))).rejects.toThrow('duplicate path');

    await expect(importTemplateZip(await makeZip(importedId(), { 'assets/link.svg': svgAsset }, {}, { symlink: true }))).rejects.toThrow('symbolic link');
    expect(await listUserTemplatePackages()).toHaveLength(0);
  });

  it('rejects control characters (0x00–0x1f) in ZIP entry names and allows adjacent 0x20 space', async () => {
    const nullByteZip = await makeZip(importedId(), { 'assets/a.json': '{}' });
    await expect(
      importTemplateZip(await replaceBytes(nullByteZip, 'assets/a.json', `assets/${String.fromCharCode(0x00)}.json`))
    ).rejects.toThrow('control character');

    const newlineZip = await makeZip(importedId(), { 'assets/b.json': '{}' });
    await expect(
      importTemplateZip(await replaceBytes(newlineZip, 'assets/b.json', `assets/${String.fromCharCode(0x0a)}.json`))
    ).rejects.toThrow('control character');

    const unitSepZip = await makeZip(importedId(), { 'assets/c.json': '{}' });
    await expect(
      importTemplateZip(await replaceBytes(unitSepZip, 'assets/c.json', `assets/${String.fromCharCode(0x1f)}.json`))
    ).rejects.toThrow('control character');

    expect(await listUserTemplatePackages()).toHaveLength(0);

    const spaceId = importedId();
    const spaceZip = await makeZip(spaceId, { [`assets/${String.fromCharCode(0x20)}.svg`]: svgAsset });
    const imported = await importTemplateZip(spaceZip);
    expect(imported.id).toBe(spaceId);
    expect(await getUserTemplatePackage(spaceId)).toBeDefined();
  });

  it('rejects a package root that does not match the manifest ID', async () => {
    await expect(importTemplateZip(await makeZip(importedId(), {}, { id: importedId() }))).rejects.toThrow('must match template.json id');
    expect(await listUserTemplatePackages()).toHaveLength(0);
  });

  it('rejects SVG external references and duplicate imported IDs with clear messages', async () => {
    await expect(importTemplateZip(await makeZip(importedId(), { 'assets/remote.svg': '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/x.png"/></svg>' }))).rejects.toThrow('external or linked resource reference');
    const id = importedId();
    await importTemplateZip(await makeZip(id));
    const storedBefore = await getUserTemplatePackage(id);
    await expect(importTemplateZip(await makeZip(id, {}, { name: { en: 'Replacement', ar: 'بديل' } }))).rejects.toThrow('already in your imported template library');
    expect((await getUserTemplatePackage(id))?.manifest.name.en).toBe(storedBefore?.manifest.name.en);
    await deleteUserTemplatePackage(id);
  });

  it('reports a simulated IndexedDB quota failure and leaves the library unchanged', async () => {
    const originalAdd = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function quotaError() { throw new DOMException('storage full', 'QuotaExceededError'); };
    try {
      const id = importedId();
      await expect(importTemplateZip(await makeZip(id))).rejects.toThrow('not enough browser storage space');
      expect((await listUserTemplatePackages()).some((item) => item.id === id)).toBe(false);
    } finally {
      IDBObjectStore.prototype.add = originalAdd;
    }
  });
});
