import { describe, expect, it } from 'vitest';
import { hitTestElements, resolveSlideElements } from '@/core/elementModel';
import { useSelectionStore } from '@/store/selectionStore';
import type { Slide } from '@/core/schema';
import type { LayoutVariant } from '@/templates/layouts/registry';

const slide: Slide = {
  id: 's1', type: 'cover', fields: {},
  overrides: {
    square: { title: { dx: 0.1, dy: -0.05, scale: 2 } },
    portrait: { title: { dx: -0.1, dy: 0, scale: 1 } },
  },
  extras: [
    { id: 'locked', kind: 'shape', x: 0.2, y: 0.2, w: 0.2, h: 0.2, rotation: 0, z: 2, locked: true, shape: 'rectangle' },
    { id: 'sticker', kind: 'sticker', x: 0.2, y: 0.2, w: 0.2, h: 0.2, rotation: 45, z: 3, locked: false, assetId: 'star' },
  ],
};
const variant: LayoutVariant = { aspectClass: 'square', elements: [
  { id: 'title', inlineStart: 0.1, blockStart: 0.2, inlineSize: 0.3, blockSize: 0.1, align: 'start' },
  { id: 'body', inlineStart: 0.1, blockStart: 0.6, inlineSize: 0.8, blockSize: 0.2, align: 'start' },
] };

describe('element model plumbing', () => {
  it('applies only the active aspect class override and falls back to layout on format change', () => {
    const square = resolveSlideElements(slide, variant, 'square');
    const title = square.find((element) => element.id === 'title');
    expect(title?.x).toBeCloseTo(0.2);
    expect(title?.y).toBeCloseTo(0.15);
    expect(title?.w).toBeCloseTo(0.6);
    expect(title?.h).toBeCloseTo(0.2);
    const portrait = resolveSlideElements(slide, variant, 'portrait').find((element) => element.id === 'title');
    expect(portrait).toMatchObject({ x: 0, y: 0.2, w: 0.3, h: 0.1 });
    const tall = resolveSlideElements(slide, variant, 'tall').find((element) => element.id === 'title');
    expect(tall).toMatchObject({ x: 0.1, y: 0.2, w: 0.3, h: 0.1 });
  });

  it('orders slots and extras by z and hit-tests the topmost rotated, unlocked element', () => {
    const elements = resolveSlideElements(slide, variant, 'square');
    expect(elements.map(({ id }) => id)).toEqual(['title', 'body', 'locked', 'sticker']);
    expect(hitTestElements(elements, 0.3, 0.3)?.id).toBe('sticker');
    expect(hitTestElements(elements, 0.1, 0.1)).toBeUndefined();
  });

  it('keeps selection transient and supports clearing it', () => {
    useSelectionStore.getState().selectElement('title');
    expect(useSelectionStore.getState().selectedElementId).toBe('title');
    useSelectionStore.getState().selectElement();
    expect(useSelectionStore.getState().selectedElementId).toBeUndefined();
  });
});
