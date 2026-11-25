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
  opacity?: number;
  z: number;
  locked: boolean;
  hidden: boolean;
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

export function mergeTemplateSlotFrames(
  variant: LayoutVariant | undefined,
  slots?: Record<string, Omit<LayoutFrame, 'id'>>,
): LayoutVariant | undefined {
  if (!variant || !slots) return variant;
  const elements = variant.elements.map((frame) => slots[frame.id] ? { ...frame, ...slots[frame.id] } : frame);
  for (const [id, frame] of Object.entries(slots)) {
    if (!elements.some((item) => item.id === id)) elements.push({ id: id as LayoutFrame['id'], ...frame });
  }
  return { ...variant, elements };
}

export const SLOT_SELECTORS: Record<string, string> = {
  tag: '.slide-tag',
  title: '.slide-title-h1, .slide-title-h2',
  body: '.slide-sub, .explain-body-list, .slide-paragraph, .quote-text',
  media: '.slide-media-element, .slide-bg-media, .cta-avatar-ring, .media-placeholder',
  counter: '.sig-counter-badge',
  signature: '.slide-signature-container',
  code: '.code-container',
  value: '.stat-big-value',
  left: '.compare-card-bad',
  right: '.compare-card-ok',
  cond: '.rule-layout-landscape .rule-card:nth-child(1) .rule-card-text, .rule-layout-stacked .rule-card:nth-child(1) .rule-card-text',
  res: '.rule-layout-landscape .rule-card:nth-child(3) .rule-card-text, .rule-layout-stacked .rule-card:nth-child(3) .rule-card-text',
  note: '.rule-note',
  text: '.quote-text',
  author: '.quote-author',
  t1: '.compare-card-bad .compare-text',
  t2: '.compare-card-ok .compare-text',
  label: '.stat-label',
  source: '.quote-author',
};

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

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** Resize in slide pixels. Boundary policy: binary-search the drag distance to the last schema-valid size, preserving the opposite anchor and any locked ratio. */
export function resizeElementGeometryFromHandle(
  geometry: ElementGeometry, deltaX: number, deltaY: number, slideWidth: number, slideHeight: number,
  handle: ResizeHandle, lockAspect: boolean,
): ElementGeometry {
  if (![geometry.x, geometry.y, geometry.w, geometry.h, geometry.rotation, deltaX, deltaY, slideWidth, slideHeight].every(Number.isFinite) || slideWidth <= 0 || slideHeight <= 0) return geometry;
  const sx = handle.includes('w') ? -1 : handle.includes('e') ? 1 : 0;
  const sy = handle.includes('n') ? -1 : handle.includes('s') ? 1 : 0;
  if (!sx && !sy) return geometry;
  const radians = geometry.rotation * Math.PI / 180;
  const localDx = deltaX * Math.cos(radians) + deltaY * Math.sin(radians);
  const localDy = -deltaX * Math.sin(radians) + deltaY * Math.cos(radians);
  const oldW = geometry.w * slideWidth;
  const oldH = geometry.h * slideHeight;
  let dw = sx * localDx;
  let dh = sy * localDy;
  if (lockAspect && sx && sy) {
    const scale = (oldW * dw + oldH * dh) / (oldW * oldW + oldH * oldH);
    dw = oldW * scale;
    dh = oldH * scale;
  }
  const anchorLocalX = sx ? -sx * oldW / 2 : 0;
  const anchorLocalY = sy ? -sy * oldH / 2 : 0;
  const anchorX = (geometry.x + geometry.w / 2) * slideWidth + anchorLocalX * Math.cos(radians) - anchorLocalY * Math.sin(radians);
  const anchorY = (geometry.y + geometry.h / 2) * slideHeight + anchorLocalX * Math.sin(radians) + anchorLocalY * Math.cos(radians);
  const make = (t: number): ElementGeometry => {
    const w = Math.max(0.02 * slideWidth, Math.min(slideWidth, oldW + dw * t));
    const h = Math.max(0.02 * slideHeight, Math.min(slideHeight, oldH + dh * t));
    const localCenterX = sx ? sx * w / 2 : 0;
    const localCenterY = sy ? sy * h / 2 : 0;
    const centerX = anchorX + localCenterX * Math.cos(radians) - localCenterY * Math.sin(radians);
    const centerY = anchorY + localCenterX * Math.sin(radians) + localCenterY * Math.cos(radians);
    return { x: (centerX - w / 2) / slideWidth, y: (centerY - h / 2) / slideHeight, w: w / slideWidth, h: h / slideHeight, rotation: geometry.rotation };
  };
  const valid = (g: ElementGeometry) => g.x >= 0 && g.y >= 0 && g.w <= 1 && g.h <= 1 && g.x + g.w <= 1 && g.y + g.h <= 1;
  const proposed = make(1);
  if (valid(proposed)) return proposed;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i += 1) { const mid = (lo + hi) / 2; if (valid(make(mid))) lo = mid; else hi = mid; }
  return make(lo);
}

export function rotationAngleFromPointer(centerX: number, centerY: number, pointerX: number, pointerY: number): number {
  return Math.atan2(pointerY - centerY, pointerX - centerX);
}

export function rotateElementGeometry(geometry: ElementGeometry, degrees: number): ElementGeometry {
  return { ...geometry, rotation: ((degrees % 360) + 360) % 360 };
}

export function scaleElementGeometry(geometry: ElementGeometry, factor: number): ElementGeometry {
  const safeFactor = Math.max(0.1, Math.min(10, factor));
  return { ...geometry, w: Math.max(0.02, geometry.w * safeFactor), h: Math.max(0.02, geometry.h * safeFactor) };
}

function resolveFrame(frame: LayoutFrame, override?: ElementOverride, order = 0): ResolvedElement {
  return {
    id: frame.id,
    kind: 'slot',
    x: frame.inlineStart + (override?.dx ?? 0),
    y: frame.blockStart + (override?.dy ?? 0),
    w: override?.w ?? frame.inlineSize * (override?.scale ?? 1),
    h: override?.h ?? frame.blockSize * (override?.scale ?? 1),
    rotation: override?.rotation ?? 0,
    opacity: override?.opacity,
    z: override?.z ?? order,
    locked: override?.locked ?? false,
    hidden: override?.hidden ?? false,
    frame,
  };
}

/** Resolve template slots and user extras into one stable, bottom-to-top layer list. */
export function resolveSlideElements(slide: Slide, variant: LayoutVariant, aspect: AspectClass): ResolvedElement[] {
  const overrides = slide.overrides?.[aspect] ?? {};
  const boundSlots = new Set((slide.extras ?? []).flatMap((extra) => extra.binding === 'tag' ? ['tag'] : extra.binding === 'title' ? ['title'] : extra.binding === 'sub' ? ['body'] : []));
  const slots = variant.elements.filter((frame) => !boundSlots.has(frame.id)).map((frame, index) => resolveFrame(frame, overrides[frame.id], index));
  const extras: ResolvedElement[] = (slide.extras ?? []).map((extra) => ({
    id: extra.id,
    kind: extra.kind,
    x: extra.x,
    y: extra.y,
    w: extra.w,
    h: extra.h,
    rotation: extra.rotation,
    opacity: extra.opacity,
    z: variant.elements.length + extra.z,
    locked: extra.locked,
    hidden: extra.hidden ?? false,
    extra,
  }));
  return [...slots, ...extras].sort((a, b) => a.z - b.z);
}

/** Return the topmost unlocked element at normalized logical canvas coordinates. */
export function hitTestElements(elements: readonly ResolvedElement[], x: number, y: number): ResolvedElement | undefined {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (!element || element.locked || element.hidden) continue;
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
