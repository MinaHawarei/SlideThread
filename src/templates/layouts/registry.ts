import { SlideTypeSchema, AspectClassSchema, type AspectClass } from '../../core/schema';
import type { z } from 'zod';

export const LAYOUT_ELEMENT_IDS = [
  'title', 'body', 'media', 'counter', 'signature', 'code', 'value', 'left', 'right', 'source',
  'tag', 'rule', 'cond', 'res', 'condLabel', 'resLabel', 'note', 'l1', 't1', 'l2', 't2', 'label', 'text', 'author', 'caption', 'name', 'handle', 'action',
] as const;
export type LayoutElementId = (typeof LAYOUT_ELEMENT_IDS)[number];
export type LayoutSlideType = z.infer<typeof SlideTypeSchema>;
export type LayoutAspectClass = z.infer<typeof AspectClassSchema>;

export interface LayoutFrame {
  id: LayoutElementId;
  inlineStart: number;
  blockStart: number;
  inlineSize: number;
  blockSize: number;
  align: 'start' | 'center' | 'end';
}

export interface LayoutVariant {
  aspectClass: AspectClass;
  elements: readonly LayoutFrame[];
}

export interface LayoutArchetype {
  id: string;
  slideType: LayoutSlideType;
  name: { en: string; ar: string };
  variants: Record<LayoutAspectClass, LayoutVariant>;
}

const ASPECTS = AspectClassSchema.options;
const SLIDE_TYPES = SlideTypeSchema.options;
/**
 * Every element each built-in slide type actually renders, so each one can be selected, moved, resized and edited.
 * (Earlier versions listed generic ids such as `body` for slides that do not render them, which left real elements
 * like the rule slide's IF/THEN cards and the stat label uncontrollable.)
 */
const SLOT_IDS: Record<LayoutSlideType, readonly LayoutElementId[]> = {
  cover: ['tag', 'title', 'body', 'rule', 'signature', 'counter'],
  explain: ['title', 'body', 'media', 'signature', 'counter'],
  rule: ['title', 'condLabel', 'cond', 'resLabel', 'res', 'note', 'signature', 'counter'],
  code: ['title', 'code', 'note', 'signature', 'counter'],
  compare: ['title', 'l1', 't1', 'l2', 't2', 'counter'],
  stat: ['value', 'label', 'note', 'counter'],
  quote: ['text', 'author', 'signature', 'counter'],
  image: ['media', 'caption', 'counter'],
  cta: ['media', 'name', 'handle', 'title', 'body', 'action'],
};

/** Relative heights of the elements stacked in the content band of each non-cover slide type. */
const STACK_WEIGHTS: Partial<Record<LayoutSlideType, Array<[LayoutElementId, number]>>> = {
  rule: [['condLabel', 0.5], ['cond', 2], ['resLabel', 0.5], ['res', 2], ['note', 1]],
  code: [['code', 4], ['note', 1]],
  compare: [['l1', 0.6], ['t1', 2], ['l2', 0.6], ['t2', 2]],
  stat: [['value', 3], ['label', 1], ['note', 1]],
  quote: [['text', 4], ['author', 1]],
  cta: [['media', 2.2], ['name', 0.6], ['handle', 0.5], ['title', 1.6], ['body', 1.4], ['action', 1]],
};

type FrameBox = Omit<LayoutFrame, 'id'>;
type BoxMap = Partial<Record<LayoutElementId, FrameBox>>;

function box(blockStart: number, inlineStart: number, inlineSize: number, blockSize: number, align: FrameBox['align'] = 'start'): FrameBox {
  return { blockStart, inlineStart, inlineSize, blockSize, align };
}

function positions(slideType: LayoutSlideType, style: 'centered' | 'editorial', aspect: LayoutAspectClass): BoxMap {
  const isTall = aspect === 'tall';
  const isWide = aspect === 'landscape';
  const centered = style === 'centered';
  const title = isTall ? box(0.17, 0.09, 0.82, 0.12, centered ? 'center' : 'start')
    : isWide ? box(0.16, 0.08, centered ? 0.84 : 0.48, 0.2, centered ? 'center' : 'start')
      : box(0.13, 0.08, 0.84, 0.18, centered ? 'center' : 'start');
  const body = isTall ? box(0.34, 0.1, 0.8, 0.17, centered ? 'center' : 'start')
    : isWide ? box(0.43, 0.08, centered ? 0.84 : 0.43, 0.24, centered ? 'center' : 'start')
      : box(0.4, 0.08, 0.84, 0.22, centered ? 'center' : 'start');
  const coverTitle = isTall ? box(0.2, 0.09, 0.82, 0.14, centered ? 'center' : 'start')
    : isWide ? box(0.19, 0.08, centered ? 0.84 : 0.48, 0.2, centered ? 'center' : 'start')
      : box(0.19, 0.08, 0.84, 0.18, centered ? 'center' : 'start');
  const coverBody = isTall ? box(0.38, 0.1, 0.8, 0.17, centered ? 'center' : 'start')
    : isWide ? box(0.44, 0.08, centered ? 0.84 : 0.43, 0.24, centered ? 'center' : 'start')
      : box(0.42, 0.08, 0.84, 0.22, centered ? 'center' : 'start');
  const splitA = isTall ? box(0.52, 0.08, 0.84, 0.15) : isWide ? box(0.4, 0.08, 0.4, 0.34) : box(0.43, 0.08, 0.4, 0.28);
  const splitB = isTall ? box(0.7, 0.08, 0.84, 0.15) : isWide ? box(0.4, 0.52, 0.4, 0.34) : box(0.43, 0.52, 0.4, 0.28);
  const footer = isTall ? box(0.86, 0.08, 0.84, 0.06) : box(0.88, 0.08, 0.84, 0.07);
  const media = isTall ? box(0.52, 0.12, 0.76, 0.28) : isWide ? box(0.22, 0.57, 0.34, 0.57) : box(0.63, 0.18, 0.64, 0.23);

  const map: Record<LayoutSlideType, BoxMap> = {
    cover: { title: coverTitle, body: coverBody, signature: footer, counter: box(0.07, 0.08, 0.14, 0.04) },
    explain: { title: isWide ? box(0.15, 0.08, 0.84, 0.12, centered ? 'center' : 'start') : title, body: isWide ? { ...body, inlineStart: 0.08, inlineSize: 0.43, align: 'start' } : centered ? body : { ...body, inlineSize: 0.84 }, media: isWide ? box(0.32, 0.56, 0.34, 0.47) : media, signature: footer, counter: box(0.07, 0.08, 0.14, 0.04) },
    rule: { title, body: { ...body, blockSize: isTall ? 0.3 : 0.28 }, signature: footer, counter: box(0.07, 0.08, 0.14, 0.04) },
    code: { title, code: isWide ? box(0.4, 0.08, 0.84, 0.38) : box(0.42, 0.08, 0.84, 0.32), body: box(0.78, 0.08, 0.84, 0.08), signature: footer, counter: box(0.07, 0.08, 0.14, 0.04) },
    compare: { title, left: splitA, right: splitB, counter: box(0.07, 0.08, 0.14, 0.04) },
    stat: { title, value: isTall ? box(0.42, 0.1, 0.8, 0.22, 'center') : box(0.39, 0.15, 0.7, 0.3, 'center'), body: box(0.72, 0.12, 0.76, 0.1, 'center'), counter: box(0.07, 0.08, 0.14, 0.04) },
    quote: { body: isTall ? box(0.31, 0.09, 0.82, 0.34, centered ? 'center' : 'start') : box(0.28, 0.12, 0.76, 0.38, centered ? 'center' : 'start'), source: box(0.72, 0.16, 0.68, 0.08), signature: footer, counter: box(0.07, 0.08, 0.14, 0.04) },
    image: { media: { ...media, blockStart: isTall ? 0.25 : 0.16, blockSize: isTall ? 0.48 : 0.64, inlineStart: 0.1, inlineSize: 0.8 }, title: isTall ? box(0.13, 0.1, 0.8, 0.08) : box(0.81, 0.1, 0.8, 0.08), body: isTall ? box(0.79, 0.1, 0.8, 0.08) : box(0.9, 0.1, 0.8, 0.08), counter: box(0.07, 0.08, 0.14, 0.04) },
    cta: { media: isTall ? box(0.12, 0.34, 0.32, 0.18, 'center') : box(0.28, 0.08, 0.2, 0.28, 'center'), title: isTall ? box(0.38, 0.1, 0.8, 0.16, 'center') : box(0.27, 0.34, 0.58, 0.2, 'start'), body: isTall ? box(0.59, 0.12, 0.76, 0.13, 'center') : box(0.52, 0.34, 0.55, 0.16, 'start') },
  };

  // Rebuild the element boxes of every type that renders more than the generic title/body pair.
  const own = SLOT_IDS[slideType];
  const base = map[slideType];
  const result: BoxMap = {};
  for (const id of own) if (base[id]) result[id] = base[id];
  const stackWeights = STACK_WEIGHTS[slideType];
  const inlineStart = 0.08;
  const inlineSize = centered ? 0.84 : 0.78;
  if (stackWeights) {
    const titleBox = result.title;
    const top = slideType === 'cta' ? 0.08 : titleBox ? titleBox.blockStart + titleBox.blockSize + 0.02 : 0.14;
    const bottom = 0.85;
    const gap = 0.012;
    const total = stackWeights.reduce((sum, [, weight]) => sum + weight, 0);
    const room = bottom - top - gap * (stackWeights.length - 1);
    let cursor = top;
    for (const [id, weight] of stackWeights) {
      const blockSize = (room * weight) / total;
      result[id] = box(cursor, inlineStart, inlineSize, blockSize, id === 'media' ? 'center' : result[id]?.align ?? (centered ? 'center' : 'start'));
      cursor += blockSize + gap;
    }
    if (slideType === 'cta' && result.media) result.media = box(result.media.blockStart, 0.34, 0.32, result.media.blockSize, 'center');
  }
  if (slideType === 'cover') {
    result.tag = box(0.12, 0.08, 0.3, 0.05);
    result.rule = box(isTall ? 0.62 : 0.72, 0.08, 0.5, 0.06);
  }
  if (slideType === 'image') result.caption = base.body ?? box(0.9, 0.1, 0.8, 0.08);
  map[slideType] = result;

  if (style === 'centered') return map[slideType];
  const editorial: BoxMap = { ...map[slideType] };
  if (editorial.title) editorial.title = { ...editorial.title, inlineStart: 0.08, align: 'start', inlineSize: isWide ? 0.52 : 0.78 };
  if (editorial.body) editorial.body = { ...editorial.body, inlineStart: 0.08, align: 'start', inlineSize: isWide ? 0.46 : 0.78 };
  if (editorial.media && (slideType === 'explain' || slideType === 'image')) {
    const blockStart = slideType === 'image' ? (isTall ? 0.25 : 0.16) : isWide ? 0.32 : isTall ? 0.52 : 0.65;
    editorial.media = { ...editorial.media, inlineStart: isWide ? 0.56 : 0.12, inlineSize: isWide ? 0.34 : 0.76, blockStart, ...(slideType === 'image' && isTall ? { blockSize: 0.48 } : {}) };
  }
  if (slideType === 'stat' && editorial.value) editorial.value = { ...editorial.value, inlineStart: 0.1, inlineSize: 0.78, align: 'start' };
  if (slideType === 'quote' && editorial.body) editorial.body = { ...editorial.body, inlineStart: 0.08, inlineSize: 0.72, blockStart: isTall ? 0.24 : 0.22, align: 'start' };
  if (slideType === 'code' && editorial.code) editorial.code = { ...editorial.code, inlineStart: 0.08, inlineSize: 0.84 };
  return editorial;
}

function makeArchetype(slideType: LayoutSlideType, style: 'centered' | 'editorial'): LayoutArchetype {
  const id = `${slideType}-${style}`;
  return {
    id,
    slideType,
    name: style === 'centered'
      ? { en: 'Centered', ar: 'وسطي' }
      : { en: 'Editorial', ar: 'تحريري' },
    variants: Object.fromEntries(ASPECTS.map((aspectClass) => [
      aspectClass,
      { aspectClass, elements: SLOT_IDS[slideType].map((elementId) => ({ id: elementId, ...(positions(slideType, style, aspectClass)[elementId] ?? box(0.86, 0.08, 0.84, 0.06)) })) },
    ])) as unknown as Record<LayoutAspectClass, LayoutVariant>,
  };
}

export const LAYOUT_ARCHETYPES: readonly LayoutArchetype[] = SLIDE_TYPES.flatMap((type) => [makeArchetype(type, 'centered'), makeArchetype(type, 'editorial')]);

export function getLayoutArchetype(id: string): LayoutArchetype | undefined {
  return LAYOUT_ARCHETYPES.find((layout) => layout.id === id);
}
