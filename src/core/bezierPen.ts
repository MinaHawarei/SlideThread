import type { PathPoint } from './schema';

/** One anchor placed with the Bezier pen, in slide fractions. Handles are absolute positions. */
export interface PenAnchor {
  x: number;
  y: number;
  inX?: number;
  inY?: number;
  outX?: number;
  outY?: number;
}

export interface BezierPathResult {
  x: number; y: number; w: number; h: number;
  points: PathPoint[];
  closed: boolean;
}

const r4 = (v: number) => Math.round(v * 10000) / 10000;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Drops anchors that landed on top of the previous one (a double-click places two). */
export function dedupeAnchors(anchors: readonly PenAnchor[], epsilon = 0.004): PenAnchor[] {
  const out: PenAnchor[] = [];
  for (const anchor of anchors) {
    const last = out[out.length - 1];
    if (last && Math.hypot(anchor.x - last.x, anchor.y - last.y) < epsilon) {
      // Keep the later handles, they are the ones the user was dragging.
      out[out.length - 1] = { ...last, ...(anchor.outX !== undefined ? { outX: anchor.outX, outY: anchor.outY } : {}) };
      continue;
    }
    out.push(anchor);
  }
  return out;
}

/**
 * Builds an editable path from pen anchors. The box hugs anchors and handles (clamped to the slide) so
 * the path keeps its curve shape, and every coordinate is stored relative to that box.
 */
export function buildBezierPath(anchors: readonly PenAnchor[], closed: boolean, minSize = 0.01): BezierPathResult | undefined {
  const list = dedupeAnchors(anchors);
  if (list.length < 2) return undefined;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const a of list) {
    xs.push(a.x); ys.push(a.y);
    if (a.inX !== undefined && a.inY !== undefined) { xs.push(clamp01(a.inX)); ys.push(clamp01(a.inY)); }
    if (a.outX !== undefined && a.outY !== undefined) { xs.push(clamp01(a.outX)); ys.push(clamp01(a.outY)); }
  }
  let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const padX = Math.max(0, (minSize - (maxX - minX)) / 2);
  const padY = Math.max(0, (minSize - (maxY - minY)) / 2);
  minX = clamp01(minX - padX); maxX = clamp01(maxX + padX);
  minY = clamp01(minY - padY); maxY = clamp01(maxY + padY);
  const w = Math.max(maxX - minX, minSize);
  const h = Math.max(maxY - minY, minSize);
  const nx = (v: number) => r4((v - minX) / w);
  const ny = (v: number) => r4((v - minY) / h);
  const hx = (v: number) => r4(Math.min(2, Math.max(-1, (v - minX) / w)));
  const hy = (v: number) => r4(Math.min(2, Math.max(-1, (v - minY) / h)));
  const points: PathPoint[] = list.map((a) => {
    const p: PathPoint = { x: nx(a.x), y: ny(a.y) };
    if (a.inX !== undefined && a.inY !== undefined) { p.inX = hx(a.inX); p.inY = hy(a.inY); }
    if (a.outX !== undefined && a.outY !== undefined) { p.outX = hx(a.outX); p.outY = hy(a.outY); }
    return p;
  });
  return { x: r4(minX), y: r4(minY), w: r4(w), h: r4(h), points, closed: closed && points.length > 2 };
}
