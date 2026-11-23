import { describe, expect, it } from 'vitest';
import { LAYOUT_ARCHETYPES, LAYOUT_ELEMENT_IDS } from '../../src/templates/layouts/registry';
import { SlideTypeSchema, AspectClassSchema } from '../../src/core/schema';

describe('layout archetype registry', () => {
  it('provides two archetypes for every slide type and all four aspect classes', () => {
    expect(LAYOUT_ARCHETYPES).toHaveLength(SlideTypeSchema.options.length * 2);
    for (const slideType of SlideTypeSchema.options) {
      expect(LAYOUT_ARCHETYPES.filter((layout) => layout.slideType === slideType)).toHaveLength(2);
    }
    for (const layout of LAYOUT_ARCHETYPES) {
      expect(Object.keys(layout.variants).sort()).toEqual([...AspectClassSchema.options].sort());
    }
  });

  it('keeps stable element ids across aspect classes and uses normalized logical geometry', () => {
    for (const layout of LAYOUT_ARCHETYPES) {
      const ids = layout.variants.landscape.elements.map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => LAYOUT_ELEMENT_IDS.includes(id))).toBe(true);
      for (const variant of Object.values(layout.variants)) {
        expect(variant.elements.map(({ id }) => id)).toEqual(ids);
        for (const element of variant.elements) {
          expect(element.inlineStart).toBeGreaterThanOrEqual(0);
          expect(element.blockStart).toBeGreaterThanOrEqual(0);
          expect(element.inlineStart + element.inlineSize, `${layout.id}/${variant.aspectClass}/${element.id} inline`).toBeLessThanOrEqual(1);
          expect(element.blockStart + element.blockSize, `${layout.id}/${variant.aspectClass}/${element.id} block`).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('offers materially different centered and editorial compositions for each slide type', () => {
    for (const slideType of SlideTypeSchema.options) {
      const pair = LAYOUT_ARCHETYPES.filter((layout) => layout.slideType === slideType);
      expect(pair[0]!.variants.square.elements).not.toEqual(pair[1]!.variants.square.elements);
    }
  });

  it('keeps distinct element frames from overlapping within every archetype variant', () => {
    for (const layout of LAYOUT_ARCHETYPES) {
      for (const variant of Object.values(layout.variants)) {
        for (let firstIndex = 0; firstIndex < variant.elements.length; firstIndex += 1) {
          const first = variant.elements[firstIndex]!;
          for (const second of variant.elements.slice(firstIndex + 1)) {
            const overlapsInline = first.inlineStart < second.inlineStart + second.inlineSize && second.inlineStart < first.inlineStart + first.inlineSize;
            const overlapsBlock = first.blockStart < second.blockStart + second.blockSize && second.blockStart < first.blockStart + first.blockSize;
            expect(overlapsInline && overlapsBlock, `${layout.id}/${variant.aspectClass} overlaps ${first.id} and ${second.id}`).toBe(false);
          }
        }
      }
    }
  });
});
