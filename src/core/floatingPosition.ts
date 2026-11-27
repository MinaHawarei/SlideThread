import type { AspectClass, ElementOverride, FloatingOffsets } from './schema';

export type FloatingElementId = 'counter' | 'signature';
export const FLOATING_ELEMENT_IDS: readonly FloatingElementId[] = ['counter', 'signature'];
export const FLOATING_SAFE_INSET_PX = 24;

export function isFloatingElementId(id: string): id is FloatingElementId {
  return id === 'counter' || id === 'signature';
}

export interface ResolvedFloatingOffset {
  dx: number;
  dy: number;
  /** Where the position comes from: this slide's own override, the project-wide position, or the template anchor. */
  source: 'slide' | 'project' | 'anchor';
}

/** A slide has its own position for the element when its override moves it away from the anchor. */
export function hasOwnPosition(override: Pick<ElementOverride, 'dx' | 'dy'> | undefined): boolean {
  return Boolean(override && (override.dx !== 0 || override.dy !== 0));
}

/**
 * One resolver for the editor canvas and export: slide override, then project position, then the template anchor.
 * Offsets are fractions of the slide, so they scale with every export size.
 */
export function resolveFloatingOffset(
  projectOffsets: FloatingOffsets | undefined,
  slideOverride: Pick<ElementOverride, 'dx' | 'dy'> | undefined,
  aspect: AspectClass,
): ResolvedFloatingOffset {
  if (hasOwnPosition(slideOverride)) return { dx: slideOverride!.dx, dy: slideOverride!.dy, source: 'slide' };
  const project = projectOffsets?.[aspect];
  if (project && (project.dx !== 0 || project.dy !== 0)) return { dx: project.dx, dy: project.dy, source: 'project' };
  return { dx: 0, dy: 0, source: 'anchor' };
}

/** Keeps the element's box (in slide pixels, before the translation) inside the slide minus the safe inset. */
export function clampFloatingTranslate(
  box: { left: number; top: number; width: number; height: number },
  slide: { width: number; height: number },
  tx: number,
  ty: number,
  inset = FLOATING_SAFE_INSET_PX,
): { tx: number; ty: number } {
  const clampAxis = (start: number, size: number, total: number, move: number) => {
    const min = inset - start;
    const max = total - inset - size - start;
    if (max < min) return (min + max) / 2; // element larger than the safe area: center it
    return Math.min(max, Math.max(min, move));
  };
  return { tx: clampAxis(box.left, box.width, slide.width, tx), ty: clampAxis(box.top, box.height, slide.height, ty) };
}

/** The slide as it is drawn: counter/signature carry the project-wide position when the slide has no own position. */
export function slideWithProjectFloating<S extends { overrides?: Partial<Record<AspectClass, Record<string, ElementOverride>>> }>(
  slide: S,
  project: { counter?: { offset?: FloatingOffsets }; signature?: { offset?: FloatingOffsets } },
  aspect: AspectClass,
): S {
  const own = slide.overrides?.[aspect];
  const merged: Record<string, ElementOverride> = { ...(own ?? {}) };
  let changed = false;
  for (const id of FLOATING_ELEMENT_IDS) {
    const resolved = resolveFloatingOffset(project[id]?.offset, own?.[id], aspect);
    if (resolved.source === 'project') {
      merged[id] = { ...(own?.[id] ?? { dx: 0, dy: 0, scale: 1 }), dx: resolved.dx, dy: resolved.dy };
      changed = true;
    }
  }
  return changed ? { ...slide, overrides: { ...(slide.overrides ?? {}), [aspect]: merged } } : slide;
}
