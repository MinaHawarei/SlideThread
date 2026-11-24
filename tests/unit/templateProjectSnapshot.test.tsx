import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDefaultProject } from '../../src/store/projectStore';
import { ProjectSchema } from '../../src/core/schema';
import { loadTemplateProjectSnapshot } from '../../src/templates/projectSnapshot';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import type { ExtraElement } from '../../src/core/schema';
import type { Palette } from '../../src/core/palette';

const replacement = 'data:image/svg+xml;base64,PHN2Zy8+';
const packageDir = resolve(process.cwd(), 'src/templates/starters/composition-test');
const packageBackup = `${packageDir}.independence-backup-${process.pid}`;
let packageMoved = false;

afterEach(async () => {
  if (packageMoved) {
    await rename(packageBackup, packageDir);
    packageMoved = false;
  }
});

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
    const snapshot = await loadTemplateProjectSnapshot('composition-test', '#35D0E6');
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
    await rename(packageDir, packageBackup);
    packageMoved = true;
    const afterRemoval = ProjectSchema.parse(JSON.parse(JSON.stringify(reloaded)));
    const afterRemovalMarkup = slideMarkup(afterRemoval, cover.id);
    expect(afterRemovalMarkup).toBe(beforeRemoval);
    expect(afterRemovalMarkup).toContain('EDITED LABEL');
    expect(afterRemovalMarkup).toContain(replacement);
  });
});
