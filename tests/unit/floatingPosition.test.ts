import { describe, it, expect, beforeEach } from 'vitest';
import { resolveFloatingOffset, clampFloatingTranslate, hasOwnPosition } from '../../src/core/floatingPosition';
import { useProjectStore } from '../../src/store/projectStore';

describe('floating position resolver', () => {
  it('prefers the slide position, then the project position, then the anchor', () => {
    const offsets = { r_4_5: { dx: 0.1, dy: 0.2 } } as never;
    expect(resolveFloatingOffset(offsets, { dx: 0.3, dy: 0 }, 'r_4_5' as never)).toEqual({ dx: 0.3, dy: 0, source: 'slide' });
    expect(resolveFloatingOffset(offsets, undefined, 'r_4_5' as never)).toEqual({ dx: 0.1, dy: 0.2, source: 'project' });
    expect(resolveFloatingOffset(undefined, { dx: 0, dy: 0 }, 'r_4_5' as never).source).toBe('anchor');
  });
  it('clamps into the 24 px safe area', () => {
    const box = { left: 100, top: 100, width: 50, height: 50 };
    const slide = { width: 400, height: 500 };
    expect(clampFloatingTranslate(box, slide, -1000, -1000)).toEqual({ tx: -76, ty: -76 });
    expect(clampFloatingTranslate(box, slide, 1000, 1000)).toEqual({ tx: 400 - 24 - 50 - 100, ty: 500 - 24 - 50 - 100 });
    expect(clampFloatingTranslate(box, slide, 10, 10)).toEqual({ tx: 10, ty: 10 });
  });
  it('hasOwnPosition is false for zero offsets', () => {
    expect(hasOwnPosition({ dx: 0, dy: 0 })).toBe(false);
    expect(hasOwnPosition({ dx: 0, dy: 0.01 })).toBe(true);
    expect(hasOwnPosition(undefined)).toBe(false);
  });
});

describe('projectStore counter/signature routing', () => {
  let slideId: string;
  let aspect: never;
  type Ov = { dx: number; dy: number } | undefined;
  beforeEach(() => {
    const st = useProjectStore.getState();
    const project = st.project;
    slideId = project.slides[0]!.id;
    aspect = 'portrait' as never;
    useProjectStore.setState({
      project: { ...project, counter: { ...project.counter, scope: undefined, offset: undefined }, slides: project.slides.map((s) => ({ ...s, overrides: {} })) },
    } as never);
  });
  const slideOv = (): Ov => (useProjectStore.getState().project.slides[0]!.overrides as Record<string, Record<string, Ov>> | undefined)?.[aspect as string]?.counter;
  const offset = () => (useProjectStore.getState().project.counter?.offset as Record<string, unknown> | undefined)?.[aspect as string];

  it('scope all (default): a drag moves the project position, not the slide', () => {
    useProjectStore.getState().updateSlotOverride(slideId, aspect, 'counter', { dx: 0.1, dy: 0.05, scale: 1 } as never);
    expect(offset()).toEqual({ dx: 0.1, dy: 0.05 });
    expect(slideOv()).toBeUndefined();
  });
  it('scope slide: a drag stays on this slide and keeps the project position', () => {
    useProjectStore.getState().updateSlotOverride(slideId, aspect, 'counter', { dx: 0.1, dy: 0, scale: 1 } as never);
    useProjectStore.getState().setFloatingScope('counter', 'slide');
    useProjectStore.getState().updateSlotOverride(slideId, aspect, 'counter', { dx: 0.05, dy: 0, scale: 1 } as never);
    expect(offset()).toEqual({ dx: 0.1, dy: 0 });
    expect(slideOv()!.dx).toBeCloseTo(0.15);
  });
  it('reset to project clears the slide position', () => {
    useProjectStore.getState().setFloatingScope('counter', 'slide');
    useProjectStore.getState().updateSlotOverride(slideId, aspect, 'counter', { dx: 0.2, dy: 0.1, scale: 1 } as never);
    expect(hasOwnPosition(slideOv())).toBe(true);
    useProjectStore.getState().resetFloatingToProject(slideId, aspect, 'counter');
    expect(hasOwnPosition(slideOv())).toBe(false);
  });
});
