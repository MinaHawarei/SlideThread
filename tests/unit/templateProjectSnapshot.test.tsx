import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import JSZip from 'jszip';
import { createDefaultProject } from '../../src/store/projectStore';
import { ProjectSchema } from '../../src/core/schema';
import { loadTemplateProjectSnapshot } from '../../src/templates/projectSnapshot';
import { importTemplateZip } from '../../src/templates/importZip';
import { deleteUserTemplatePackage } from '../../src/templates/userLibrary';
import { invalidateTemplatePackage } from '../../src/templates/starters';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import type { ExtraElement } from '../../src/core/schema';
import type { Palette } from '../../src/core/palette';

const replacement = 'data:image/svg+xml;base64,PHN2Zy8+';
const testPackageId = 'snapshot-independence-fixture';

afterEach(async () => {
  await deleteUserTemplatePackage(testPackageId).catch(() => { });
  invalidateTemplatePackage(testPackageId);
});

async function seedFixturePackage(): Promise<void> {
  const zip = new JSZip();
  zip.file(`${testPackageId}/template.json`, JSON.stringify({
    schema: 1,
    id: testPackageId,
    name: { en: 'Snapshot Fixture', ar: 'قالب اختبار' },
    description: { en: 'Fixture for snapshot independence', ar: 'قالب اختبار' },
    author: { name: 'SlideThread' },
    license: 'MIT',
    categories: ['general'],
    tags: ['fixture'],
    colorFlexible: true,
    theme: { fonts: { display: 'ibm-plex-sans', body: 'ibm-plex-sans-arabic', mono: 'jetbrains-mono' } },
    assets: { coverArt: 'assets/cover.svg' },
    layouts: { cover: 'cover-centered' },
    composition: {
      cover: {
        portrait: {
          slots: { title: { inlineStart: 0.08, blockStart: 0.25, inlineSize: 0.84, blockSize: 0.3, align: 'start' } },
          elements: [
            { id: 'fixture-img', kind: 'image', x: 0.1, y: 0.1, w: 0.2, h: 0.2, rotation: 0, z: 1, locked: false, assetId: 'coverArt' },
            { id: 'fixture-txt', kind: 'text', x: 0.1, y: 0.6, w: 0.4, h: 0.1, rotation: 0, z: 2, locked: false, text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'STUDIO / 01' }] }] } },
          ],
        },
      },
    },
    formats: ['post', 'carousel'],
  }));
  zip.file(`${testPackageId}/assets/cover.svg`, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#35D0E6"/></svg>');
  const blob = await zip.generateAsync({ type: 'blob' });
  await importTemplateZip(new File([blob], 'fixture.zip', { type: 'application/zip' }));
}

function slideMarkup(project: ReturnType<typeof ProjectSchema.parse>, slideId: string): string {
  const slide = project.slides.find((candidate) => candidate.id === slideId)!;
  const snapshot = project.templateSnapshot!;
  const palette = snapshot.paletteByMode[project.theme] as unknown as Palette;
  return renderToStaticMarkup(<SlideRenderer
    slide={slide}
    palette={palette}
    aspectClass="portrait"
    textDir="ltr"
    templateId={project.templateId}
    templateSnapshot={snapshot}
    themeMode={project.theme}
    dimensions={{ width: 1080, height: 1350 }}
    slideIndex={0}
    totalSlides={project.slides.length}
  />);
}

describe('package project snapshots', () => {
  it('keeps edited text, replaced image bytes, rendering, and export source independent of the package folder', async () => {
    await seedFixturePackage();
    const snapshot = await loadTemplateProjectSnapshot(testPackageId, '#35D0E6');
    const project = createDefaultProject({ templateId: snapshot.id, templateSnapshot: snapshot });
    const cover = project.slides.find((slide) => slide.type === 'cover')!;
    const image = cover.extras!.find((element) => element.kind === 'image')!;
    const text = cover.extras!.find((element) => element.kind === 'text')!;

    expect(image.assetId).toMatch(/^data:image\/svg\+xml/);
    expect(text.text?.blocks[0]?.runs[0]?.text).toBe('STUDIO / 01');
    expect(Object.isFrozen(snapshot)).toBe(true);

    const editedSlides = project.slides.map((slide) => slide.id !== cover.id ? slide : {
      ...slide,
      extras: slide.extras!.map((element): ExtraElement => {
        if (element.id === text.id) return { ...element, text: { type: 'doc', blocks: [{ type: 'p', runs: [{ text: 'EDITED LABEL' }] }] } };
        if (element.id === image.id) return {
          ...element,
          assetId: replacement,
          media: element.media ? { ...element.media, assetId: replacement } : undefined,
        };
        return element;
      }),
    });
    const reloaded = ProjectSchema.parse(JSON.parse(JSON.stringify({ ...project, slides: editedSlides })));
    const reloadedCover = reloaded.slides.find((slide) => slide.type === 'cover')!;
    expect(reloadedCover.extras?.find((element) => element.id === text.id)?.text?.blocks[0]?.runs[0]?.text).toBe('EDITED LABEL');
    expect(reloadedCover.extras?.find((element) => element.id === image.id)?.assetId).toBe(replacement);
    expect(reloaded.templateSnapshot?.assets['assets/cover.svg']).toMatch(/^data:image\/svg\+xml/);
    expect(reloaded.templateSnapshot?.composition.cover?.portrait?.slots?.title).toEqual(expect.objectContaining({ inlineStart: 0.08 }));

    const beforeRemoval = slideMarkup(reloaded, cover.id);
    await deleteUserTemplatePackage(testPackageId);
    invalidateTemplatePackage(testPackageId);
    const afterRemoval = ProjectSchema.parse(JSON.parse(JSON.stringify(reloaded)));
    const afterRemovalMarkup = slideMarkup(afterRemoval, cover.id);
    expect(afterRemovalMarkup).toBe(beforeRemoval);
    expect(afterRemovalMarkup).toContain('EDITED LABEL');
    expect(afterRemovalMarkup).toContain(replacement);
  });
});
