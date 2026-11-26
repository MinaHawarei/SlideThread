import { describe, expect, it } from 'vitest';
import { captureDesign, listCapturableSlides } from '../../src/templates/designCapture';
import { createDefaultProject } from '../../src/store/projectStore';
import type { ExtraElement } from '../../src/core/schema';

const extra = (over: Partial<ExtraElement>): ExtraElement => ({ id: 'e1', kind: 'shape', x: 0.1, y: 0.1, w: 0.2, h: 0.2, rotation: 0, z: 1, locked: false, shape: 'rectangle', fill: '#ff0000', ...over } as ExtraElement);

describe('captureDesign', () => {
  it('captures nothing for an untouched project', () => {
    const project = createDefaultProject();
    const { composition, report } = captureDesign(project, 'portrait');
    expect(composition).toEqual({});
    expect(report.skipped).toEqual([]);
    expect(report.types.map((t) => t.type)).toEqual(['cover', 'explain', 'cta']);
  });

  it('captures a moved slot as an absolute frame and a hidden slot', () => {
    const project = createDefaultProject();
    project.slides[0]!.overrides = { portrait: { title: { dx: 0.1, dy: 0.05, scale: 1 }, body: { dx: 0, dy: 0, scale: 1, hidden: true } } } as never;
    const { composition } = captureDesign(project, 'portrait');
    const cover = composition.cover!.portrait!;
    expect(cover.slots!.title!.inlineStart).toBeGreaterThan(0.1);
    expect(cover.hiddenSlots).toEqual(['body']);
    expect(cover.slots!.body).toBeUndefined();
  });

  it('keeps plain shapes, bundles built-in shapes only when allowed, and reports everything it skips', () => {
    const project = createDefaultProject();
    project.slides[0]!.extras = [
      extra({ id: 'Plain Box' }),
      extra({ id: 'arrow', assetId: 'line-arrow' }),
      extra({ id: 'upload', kind: 'image', assetId: 'user-upload-1' }),
      extra({ id: 'star', kind: 'sticker', assetId: 'x' }),
    ];
    const off = captureDesign(project, 'portrait');
    expect(off.composition.cover!.portrait!.elements!.map((e) => e.id)).toEqual(['plain-box']);
    expect(off.report.skipped.map((s) => `${s.id}:${s.reason}`).sort()).toEqual(['arrow:asset', 'star:kind', 'upload:image']);
    const on = captureDesign(project, 'portrait', {}, (id) => id === 'line-arrow');
    expect(on.composition.cover!.portrait!.elements!.map((e) => e.id)).toEqual(['plain-box', 'arrow']);
    expect(on.report.bundledAssets).toEqual(['line-arrow']);
    expect(on.report.skipped.map((s) => s.id).sort()).toEqual(['star', 'upload']);
  });

  it('uses the first slide of a repeated type unless another is chosen, and lists the candidates', () => {
    const project = createDefaultProject();
    const second = structuredClone(project.slides[1]!); second.id = 'second-explain'; project.slides.splice(2, 0, second);
    second.extras = [extra({ id: 'only-on-second' })];
    expect(listCapturableSlides(project.slides).find((g) => g.type === 'explain')!.candidates).toEqual([2, 3]);
    const first = captureDesign(project, 'portrait');
    expect(first.report.types.find((t) => t.type === 'explain')!.used).toBe(2);
    expect(first.composition.explain).toBeUndefined();
    const pick = captureDesign(project, 'portrait', { explain: 3 });
    expect(pick.composition.explain!.portrait!.elements!.map((e) => e.id)).toEqual(['only-on-second']);
  });

  it('maps a snapshot data-URL asset back to its asset name so the base asset travels', () => {
    const project = createDefaultProject();
    project.templateSnapshot = { assets: { 'assets/leaf.svg': 'data:image/svg+xml,leaf', leaf: 'data:image/svg+xml,leaf' }, composition: {} } as never;
    project.slides[0]!.extras = [extra({ id: 'leaf-el', assetId: 'data:image/svg+xml,leaf' })];
    const { composition, report } = captureDesign(project, 'portrait', {}, (id) => id === 'leaf');
    expect(report.bundledAssets).toEqual(['leaf']);
    expect(composition.cover!.portrait!.elements![0]!.assetId).toBe('leaf');
    expect(report.skipped).toEqual([]);
  });
});
