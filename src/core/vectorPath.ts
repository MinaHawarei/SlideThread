import type { PathPoint, VectorPath } from './schema';

export const MIN_POINTS = 2;
export const MAX_POINTS = 200;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number) => Math.round(v * 10000) / 10000;

export function hasHandles(p: PathPoint): boolean {
  return p.inX !== undefined || p.outX !== undefined;
}

/** Default open path: a gentle curve across the box. */
export function createDefaultPath(): VectorPath {
  return {
    closed: false,
    points: [
      { x: 0.08, y: 0.8 },
      { x: 0.35, y: 0.2, inX: 0.2, inY: 0.2, outX: 0.5, outY: 0.2 },
      { x: 0.65, y: 0.8, inX: 0.5, inY: 0.8, outX: 0.8, outY: 0.8 },
      { x: 0.92, y: 0.2 },
    ],
  };
}

/** SVG path data in a width x height pixel box. Straight segments when neither end has a handle. */
export function pathToD(path: VectorPath, width: number, height: number): string {
  const f = (n: number) => String(round(n));
  const X = (x: number) => f(x * width);
  const Y = (y: number) => f(y * height);
  const pts = path.points;
  if (pts.length === 0) return '';
  const first = pts[0]!;
  let d = `M ${X(first.x)} ${Y(first.y)}`;
  const seg = (a: PathPoint, b: PathPoint) => {
    const hasOut = a.outX !== undefined && a.outY !== undefined;
    const hasIn = b.inX !== undefined && b.inY !== undefined;
    if (!hasOut && !hasIn) return ` L ${X(b.x)} ${Y(b.y)}`;
    const c1x = hasOut ? a.outX! : a.x, c1y = hasOut ? a.outY! : a.y;
    const c2x = hasIn ? b.inX! : b.x, c2y = hasIn ? b.inY! : b.y;
    return ` C ${X(c1x)} ${Y(c1y)} ${X(c2x)} ${Y(c2y)} ${X(b.x)} ${Y(b.y)}`;
  };
  for (let i = 0; i < pts.length - 1; i++) d += seg(pts[i]!, pts[i + 1]!);
  if (path.closed && pts.length > 2) d += seg(pts[pts.length - 1]!, first) + ' Z';
  return d;
}

export function movePoint(path: VectorPath, index: number, x: number, y: number): VectorPath {
  const points = path.points.map((p, i) => {
    if (i !== index) return p;
    const nx = round(clamp(x, 0, 1)), ny = round(clamp(y, 0, 1));
    const dx = nx - p.x, dy = ny - p.y;
    // Handles travel with their anchor.
    const out: PathPoint = { ...p, x: nx, y: ny };
    if (p.inX !== undefined && p.inY !== undefined) { out.inX = round(clamp(p.inX + dx, -1, 2)); out.inY = round(clamp(p.inY + dy, -1, 2)); }
    if (p.outX !== undefined && p.outY !== undefined) { out.outX = round(clamp(p.outX + dx, -1, 2)); out.outY = round(clamp(p.outY + dy, -1, 2)); }
    return out;
  });
  return { ...path, points };
}

/** kind 'out' or 'in'. With `mirror`, the opposite handle is reflected through the anchor (smooth node). */
export function moveHandle(path: VectorPath, index: number, kind: 'in' | 'out', x: number, y: number, mirror = true): VectorPath {
  const points = path.points.map((p, i) => {
    if (i !== index) return p;
    const hx = round(clamp(x, -1, 2)), hy = round(clamp(y, -1, 2));
    const next: PathPoint = { ...p };
    if (kind === 'out') { next.outX = hx; next.outY = hy; } else { next.inX = hx; next.inY = hy; }
    if (mirror) {
      const mx = round(clamp(2 * p.x - hx, -1, 2)), my = round(clamp(2 * p.y - hy, -1, 2));
      if (kind === 'out') { next.inX = mx; next.inY = my; } else { next.outX = mx; next.outY = my; }
    }
    return next;
  });
  return { ...path, points };
}

export function insertPoint(path: VectorPath, x: number, y: number, afterIndex?: number): VectorPath {
  if (path.points.length >= MAX_POINTS) return path;
  const pt: PathPoint = { x: round(clamp(x, 0, 1)), y: round(clamp(y, 0, 1)) };
  const at = afterIndex === undefined ? path.points.length : clamp(afterIndex + 1, 0, path.points.length);
  const points = [...path.points.slice(0, at), pt, ...path.points.slice(at)];
  return { ...path, points };
}

export function removePoint(path: VectorPath, index: number): VectorPath {
  if (path.points.length <= MIN_POINTS) return path;
  const points = path.points.filter((_, i) => i !== index);
  return { closed: points.length > 2 ? path.closed : false, points };
}

/** Turn a corner node into a smooth one (handles along the neighbour direction) or back into a corner. */
export function toggleSmooth(path: VectorPath, index: number): VectorPath {
  const pts = path.points;
  const p = pts[index];
  if (!p) return path;
  if (hasHandles(p)) {
    const { inX: _i, inY: _j, outX: _o, outY: _p, ...corner } = p;
    void _i; void _j; void _o; void _p;
    return { ...path, points: pts.map((q, i) => (i === index ? corner : q)) };
  }
  const prev = pts[index - 1] ?? (path.closed ? pts[pts.length - 1]! : p);
  const next = pts[index + 1] ?? (path.closed ? pts[0]! : p);
  let tx = next.x - prev.x, ty = next.y - prev.y;
  const len = Math.hypot(tx, ty) || 1;
  const reach = Math.min(0.2, Math.hypot(next.x - p.x, next.y - p.y) / 3 || 0.1);
  tx = (tx / len) * reach; ty = (ty / len) * reach;
  const smooth: PathPoint = {
    ...p,
    inX: round(clamp(p.x - tx, -1, 2)), inY: round(clamp(p.y - ty, -1, 2)),
    outX: round(clamp(p.x + tx, -1, 2)), outY: round(clamp(p.y + ty, -1, 2)),
  };
  return { ...path, points: pts.map((q, i) => (i === index ? smooth : q)) };
}

export function setClosed(path: VectorPath, closed: boolean): VectorPath {
  return { ...path, closed: closed && path.points.length > 2 };
}
