import type { AspectClass, ExtraElement, Project, Slide } from '../core/schema';
import { ExtraElementSchema } from '../core/schema';
import { mergeTemplateSlotFrames } from '../core/elementModel';
import { getLayoutArchetype } from './layouts/registry';

/** Slot ids a template composition may place. */
const SLOT_KEYS = new Set(['title', 'body', 'media', 'counter', 'signature', 'code', 'value', 'left', 'right', 'source']);
const HIDDEN_KEYS = new Set(['tag', 'title', 'sub', 'rule', 'body', 'media', 'counter', 'signature', 'code', 'value', 'left', 'right', 'source']);

export interface CapturedSlot { x: number; y: number; w: number; h: number }
export type CapturedFrame = { blockStart: number; inlineStart: number; inlineSize: number; blockSize: number; align: 'start' | 'center' | 'end' };
export interface CapturedAspect { slots?: Record<string, CapturedFrame>; hiddenSlots?: string[]; elements?: ExtraElement[] }
export type CapturedComposition = Record<string, Record<string, CapturedAspect>>;

export interface SkippedExtra { slideNumber: number; slideType: string; id: string; reason: 'image' | 'asset' | 'kind' | 'invalid' }
export interface CaptureReport {
  aspect: AspectClass;
  /** One entry per slide type found in the project. `used` is the 1-based slide number whose design was captured. */
  types: Array<{ type: string; used: number; candidates: number[] }>;
  /** Extras that cannot travel inside a template package, with the reason. Nothing is dropped without being listed here. */
  skipped: SkippedExtra[];
  /** Slide types with a layout change: lists which captured element counts were kept. */
  capturedElementCount: number;
  capturedSlotCount: number;
  /** Built-in shape ids that are bundled into the package as SVG files so the template stays self-contained. */
  bundledAssets: string[];
}

/** Slide types in the order they first appear, with every slide number of that type. */
export function listCapturableSlides(slides: readonly Slide[]): Array<{ type: string; candidates: number[] }> {
  const order: string[] = [];
  const map = new Map<string, number[]>();
  slides.forEach((slide, index) => {
    if (!map.has(slide.type)) { map.set(slide.type, []); order.push(slide.type); }
    map.get(slide.type)!.push(index + 1);
  });
  return order.map((type) => ({ type, candidates: map.get(type)! }));
}

function assetKeyForDataUrl(project: Pick<Project, 'templateSnapshot'>, dataUrl: string): string | undefined {
  const entries = Object.entries(project.templateSnapshot?.assets ?? {}).filter(([, value]) => value === dataUrl);
  return (entries.find(([key]) => !key.includes('/')) ?? entries[0])?.[0];
}
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Capture the design of a project for one aspect class as template composition.
 * `chosen` maps a slide type to the 1-based slide number to capture (default: the first slide of that type).
 * Slot frames are only written where they differ from the base layout, so everything else keeps inheriting.
 * Extras that reference images, user assets or bundled packs cannot be packaged; they are listed in the report.
 */
export function captureDesign(project: Pick<Project, 'slides' | 'templateSnapshot'>, aspect: AspectClass, chosen: Record<string, number> = {}, canBundle: (assetId: string) => boolean = () => false): { composition: CapturedComposition; report: CaptureReport } {
  const slides = (project.slides ?? []) as Slide[];
  const composition: CapturedComposition = {};
  const report: CaptureReport = { aspect, types: [], skipped: [], capturedElementCount: 0, capturedSlotCount: 0, bundledAssets: [] };

  for (const group of listCapturableSlides(slides)) {
    const wanted = chosen[group.type];
    const used = wanted && group.candidates.includes(wanted) ? wanted : group.candidates[0]!;
    report.types.push({ type: group.type, used, candidates: group.candidates });
    const slide = slides[used - 1]!;
    const base = project.templateSnapshot?.composition[group.type]?.[aspect];
    const layout = getLayoutArchetype(`${group.type}-centered`);
    const baseVariant = mergeTemplateSlotFrames(layout?.variants[aspect], base?.slots);
    const aspectOut: CapturedAspect = {};

    // Slot frames that the user moved or resized.
    const overrides = slide.overrides?.[aspect] ?? {};
    const slots: Record<string, CapturedFrame> = {};
    for (const frame of baseVariant?.elements ?? []) {
      const o = overrides[frame.id];
      if (!o || !SLOT_KEYS.has(frame.id)) continue;
      const x = frame.inlineStart + (o.dx ?? 0);
      const y = frame.blockStart + (o.dy ?? 0);
      const w = o.w ?? frame.inlineSize * (o.scale ?? 1);
      const h = o.h ?? frame.blockSize * (o.scale ?? 1);
      if (near(x, frame.inlineStart) && near(y, frame.blockStart) && near(w, frame.inlineSize) && near(h, frame.blockSize)) continue;
      slots[frame.id] = {
        inlineStart: clamp01(x), blockStart: clamp01(y),
        inlineSize: Math.min(1, Math.max(0.02, w)), blockSize: Math.min(1, Math.max(0.02, h)),
        align: frame.align,
      };
    }
    if (Object.keys(slots).length) { aspectOut.slots = slots; report.capturedSlotCount += Object.keys(slots).length; }

    // Slots hidden by the template or by the user on this slide.
    const hidden = new Set<string>(base?.hiddenSlots ?? []);
    for (const [id, o] of Object.entries(overrides)) if (o?.hidden && HIDDEN_KEYS.has(id)) hidden.add(id);
    if (hidden.size) aspectOut.hiddenSlots = [...hidden];

    // Extras: keep what is self-contained, list the rest.
    const elements: ExtraElement[] = [];
    for (const original of slide.extras ?? []) {
      // Project snapshots store a template's bundled assets as data URLs; map them back to the asset name.
      const extra = original.assetId?.startsWith('data:') ? { ...original, assetId: assetKeyForDataUrl(project, original.assetId) ?? original.assetId } : original;
      if (extra.kind === 'icon' || extra.kind === 'sticker') { report.skipped.push({ slideNumber: used, slideType: group.type, id: extra.id, reason: 'kind' }); continue; }
      if (extra.kind === 'image' || extra.media) { report.skipped.push({ slideNumber: used, slideType: group.type, id: extra.id, reason: 'image' }); continue; }
      if (extra.assetId && extra.kind === 'shape' && canBundle(extra.assetId)) {
        if (!report.bundledAssets.includes(extra.assetId)) report.bundledAssets.push(extra.assetId);
      } else if (extra.assetId) { report.skipped.push({ slideNumber: used, slideType: group.type, id: extra.id, reason: 'asset' }); continue; }
      const parsed = ExtraElementSchema.safeParse(extra);
      if (!parsed.success) { report.skipped.push({ slideNumber: used, slideType: group.type, id: extra.id, reason: 'invalid' }); continue; }
      const clone = structuredClone(parsed.data);
      // Template element ids must be lowercase slugs and unique inside one slide type.
      let slug = clone.id.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^[^a-z0-9]+/, '') || 'element';
      while (elements.some((item) => item.id === slug)) slug += '-x';
      clone.id = slug;
      elements.push(clone);
    }
    // An explicit empty list is kept when the base had elements, so a deliberately removed element stays removed.
    if (elements.length || (base?.elements?.length ?? 0) > 0) { aspectOut.elements = elements; report.capturedElementCount += elements.length; }

    if (Object.keys(aspectOut).length) composition[group.type] = { [aspect]: aspectOut };
  }
  return { composition, report };
}
