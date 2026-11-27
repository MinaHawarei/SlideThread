import type { PathPoint } from './schema';

export interface Pt { x: number; y: number }

function perpendicularDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/** Ramer-Douglas-Peucker line simplification. */
export function simplify(points: Pt[], epsilon: number): Pt[] {
  if (points.length < 3) return points;
  let maxDistance = 0;
  let index = 0;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i]!, first, last);
    if (d > maxDistance) { maxDistance = d; index = i; }
  }
  if (maxDistance <= epsilon) return [first, last];
  const left = simplify(points.slice(0, index + 1), epsilon);
  const right = simplify(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

const r4 = (v: number) => Math.round(v * 10000) / 10000;

export interface FreehandResult {
  x: number; y: number; w: number; h: number;
  points: PathPoint[];
}

/**
 * Turns a raw pointer trail (slide fractions) into a smooth path inside its own bounding box.
 * Returns undefined for a stray tap that is too short to be a stroke.
 */
export function freehandToPath(trail: Pt[], minSize = 0.01): FreehandResult | undefined {
  if (trail.length < 2) return undefined;
  let simple = simplify(trail, 0.004);
  while (simple.length > 120) simple = simplify(simple, 0.004 * (simple.length / 120));
  const xs = simple.map((p) => p.x);
  const ys = simple.map((p) => p.y);
  let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  if (maxX - minX < minSize && maxY - minY < minSize) return undefined;
  const padX = Math.max(0, (minSize - (maxX - minX)) / 2);
  const padY = Math.max(0, (minSize - (maxY - minY)) / 2);
  minX = Math.max(0, minX - padX); maxX = Math.min(1, maxX + padX);
  minY = Math.max(0, minY - padY); maxY = Math.min(1, maxY + padY);
  const w = Math.max(maxX - minX, minSize);
  const h = Math.max(maxY - minY, minSize);
  const norm = simple.map((p) => ({ x: (p.x - minX) / w, y: (p.y - minY) / h }));
  const clamp = (v: number) => r4(Math.min(2, Math.max(-1, v)));
  const points: PathPoint[] = norm.map((p, i) => {
    const point: PathPoint = { x: r4(p.x), y: r4(p.y) };
    if (norm.length > 2) {
      const prev = norm[Math.max(0, i - 1)]!;
      const next = norm[Math.min(norm.length - 1, i + 1)]!;
      // Catmull-Rom tangents turned into bezier handles give a smooth pen stroke.
      const tx = (next.x - prev.x) / 6;
      const ty = (next.y - prev.y) / 6;
      if (i > 0) { point.inX = clamp(p.x - tx); point.inY = clamp(p.y - ty); }
      if (i < norm.length - 1) { point.outX = clamp(p.x + tx); point.outY = clamp(p.y + ty); }
    }
    return point;
  });
  return { x: r4(minX), y: r4(minY), w: r4(w), h: r4(h), points };
}
