import type { AspectClass, ElementOverride, ExtraElement, Slide } from './schema';
import type { LayoutFrame, LayoutVariant } from '../templates/layouts/registry';

export interface ResolvedElement {
  id: string;
  kind: 'slot' | ExtraElement['kind'];
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  z: number;
  locked: boolean;
  frame?: LayoutFrame;
  extra?: ExtraElement;
}

export interface ElementGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

export interface SnapResult {
  geometry: ElementGeometry;
  guides: Array<{ axis: 'x' | 'y'; at: number }>;
}

/** Snap a moved element to slide edges and center lines within a design-scale threshold. */
export function snapElementGeometry(geometry: ElementGeometry, threshold: number): SnapResult {
  const result = { ...geometry };
  const guides: SnapResult['guides'] = [];
  const candidates: Array<{ axis: 'x' | 'y'; value: number; edge: number; guide: number }> = [
    { axis: 'x', value: geometry.x, edge: 0, guide: 0 },
    { axis: 'x', value: geometry.x + geometry.w, edge: 1, guide: 1 },
    { axis: 'x', value: geometry.x + geometry.w / 2, edge: 0.5, guide: 0.5 },
    { axis: 'y', value: geometry.y, edge: 0, guide: 0 },
    { axis: 'y', value: geometry.y + geometry.h, edge: 1, guide: 1 },
    { axis: 'y', value: geometry.y + geometry.h / 2, edge: 0.5, guide: 0.5 },
  ];
  for (const candidate of candidates) {
    if (Math.abs(candidate.value - candidate.edge) > threshold) continue;
    if (candidate.axis === 'x') result.x += candidate.edge - candidate.value;
    else result.y += candidate.edge - candidate.value;
    guides.push({ axis: candidate.axis, at: candidate.guide });
  }
  return { geometry: result, guides };
}

export function resizeElementGeometry(geometry: ElementGeometry, dx: number, dy: number, lockAspect: boolean): ElementGeometry {
  const w = Math.max(0.02, geometry.w + dx);
  const h = Math.max(0.02, geometry.h + (lockAspect ? dx * (geometry.h / geometry.w) : dy));
  return { ...geometry, w, h };
}

export function rotateElementGeometry(geometry: ElementGeometry, degrees: number): ElementGeometry {
  return { ...geometry, rotation: ((degrees % 360) + 360) % 360 };
}

function resolveFrame(frame: LayoutFrame, override?: ElementOverride): ResolvedElement {
  return {
    id: frame.id,
    kind: 'slot',
    x: frame.inlineStart + (override?.dx ?? 0),
    y: frame.blockStart + (override?.dy ?? 0),
    w: override?.w ?? frame.inlineSize * (override?.scale ?? 1),
    h: override?.h ?? frame.blockSize * (override?.scale ?? 1),
    rotation: 0,
    z: 0,
    locked: false,
    frame,
  };
}

/** Resolve template slots and user extras into one stable, bottom-to-top layer list. */
export function resolveSlideElements(slide: Slide, variant: LayoutVariant, aspect: AspectClass): ResolvedElement[] {
  const overrides = slide.overrides?.[aspect] ?? {};
  const slots = variant.elements.map((frame) => resolveFrame(frame, overrides[frame.id]));
  const extras: ResolvedElement[] = (slide.extras ?? []).map((extra) => ({
    id: extra.id,
    kind: extra.kind,
    x: extra.x,
    y: extra.y,
    w: extra.w,
    h: extra.h,
    rotation: extra.rotation,
    z: extra.z,
    locked: extra.locked,
    extra,
  }));
  return [...slots, ...extras].sort((a, b) => a.z - b.z);
}

/** Return the topmost unlocked element at normalized logical canvas coordinates. */
export function hitTestElements(elements: readonly ResolvedElement[], x: number, y: number): ResolvedElement | undefined {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (!element || element.locked) continue;
    const centerX = element.x + element.w / 2;
    const centerY = element.y + element.h / 2;
    const radians = (-element.rotation * Math.PI) / 180;
    const dx = x - centerX;
    const dy = y - centerY;
    const localX = dx * Math.cos(radians) - dy * Math.sin(radians) + centerX;
    const localY = dx * Math.sin(radians) + dy * Math.cos(radians) + centerY;
    if (localX >= element.x && localX <= element.x + element.w && localY >= element.y && localY <= element.y + element.h) return element;
  }
  return undefined;
}
