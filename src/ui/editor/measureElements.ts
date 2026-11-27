import { SLOT_SELECTORS, type ElementGeometry } from '../../core/elementModel';

/** Slots whose selection frame should hug the visible text instead of the whole layout block. */
const TEXT_HUG_IDS = new Set(['title', 'sub', 'body', 'cond', 'res', 'text', 'author', 'label', 'note', 'rule', 'name', 'handle', 'code', 't1', 't2', 'l1', 'l2', 'caption', 'condLabel', 'resLabel', 'value', 'tag', 'action']);
/** Slots made of several child elements (their own box is a wide container). */
const CONTENT_UNION_IDS = new Set(['signature', 'counter']);

interface Box { left: number; top: number; right: number; bottom: number }

function union(boxes: Box[]): Box | undefined {
  const real = boxes.filter((b) => b.right - b.left > 0.5 && b.bottom - b.top > 0.5);
  if (real.length === 0) return undefined;
  return {
    left: Math.min(...real.map((b) => b.left)),
    top: Math.min(...real.map((b) => b.top)),
    right: Math.max(...real.map((b) => b.right)),
    bottom: Math.max(...real.map((b) => b.bottom)),
  };
}

function rectToBox(r: DOMRect): Box { return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }

function hasPaint(node: HTMLElement): boolean {
  const cs = getComputedStyle(node);
  const bg = cs.backgroundColor;
  const hasBg = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
  const hasImage = cs.backgroundImage !== 'none';
  const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some((side) => parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 && cs.getPropertyValue(`border-${side.toLowerCase()}-style`) !== 'none');
  return hasBg || hasImage || hasBorder || cs.boxShadow !== 'none';
}

function textBox(node: HTMLElement): Box | undefined {
  const range = document.createRange();
  range.selectNodeContents(node);
  const boxes = Array.from(range.getClientRects()).map(rectToBox);
  // Inline replaced content (images, svg, emoji) is not part of the text rects.
  for (const child of Array.from(node.querySelectorAll<HTMLElement>('img, svg, canvas, video'))) boxes.push(rectToBox(child.getBoundingClientRect()));
  return union(boxes);
}

function contentUnionBox(node: HTMLElement): Box | undefined {
  const boxes: Box[] = [];
  for (const child of Array.from(node.querySelectorAll<HTMLElement>('*'))) {
    if (child.children.length > 0 && !hasPaint(child)) continue;
    boxes.push(rectToBox(child.getBoundingClientRect()));
  }
  return union(boxes);
}

/** The tight visible box of a rendered slot, in viewport pixels. */
export function tightBox(id: string, node: HTMLElement): Box {
  const full = rectToBox(node.getBoundingClientRect());
  let tight: Box | undefined;
  if (CONTENT_UNION_IDS.has(id)) tight = contentUnionBox(node);
  else if (TEXT_HUG_IDS.has(id) && !hasPaint(node)) tight = textBox(node);
  if (!tight) return full;
  return { left: tight.left - 2, top: tight.top - 2, right: tight.right + 2, bottom: tight.bottom + 2 };
}

export interface MeasuredSlots {
  tight: Record<string, ElementGeometry>;
  full: Record<string, ElementGeometry>;
  /** Slot ids that were measured at least once, with a node in the DOM. */
  present: Set<string>;
}

export function measureSlots(canvas: HTMLElement, overlayRect: DOMRect): MeasuredSlots {
  const tight: Record<string, ElementGeometry> = {};
  const full: Record<string, ElementGeometry> = {};
  const present = new Set<string>();
  const toGeometry = (b: Box): ElementGeometry => ({
    x: (b.left - overlayRect.left) / overlayRect.width,
    y: (b.top - overlayRect.top) / overlayRect.height,
    w: (b.right - b.left) / overlayRect.width,
    h: (b.bottom - b.top) / overlayRect.height,
    rotation: 0,
  });
  for (const [id, selector] of Object.entries(SLOT_SELECTORS)) {
    const node = canvas.querySelector<HTMLElement>(selector);
    if (!node) continue;
    const fullRect = node.getBoundingClientRect();
    if (fullRect.width < 0.5 || fullRect.height < 0.5) continue;
    present.add(id);
    full[id] = toGeometry(rectToBox(fullRect));
    tight[id] = toGeometry(tightBox(id, node));
  }
  return { tight, full, present };
}
