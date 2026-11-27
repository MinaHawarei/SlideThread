import type { ExtraElement, PathPoint, VectorPath } from './schema';

const K = 0.5522847498;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

export function rectanglePath(): VectorPath {
  return { closed: true, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }] };
}

export function ellipsePath(): VectorPath {
  const a = 0.5 * K;
  return {
    closed: true,
    points: [
      { x: 0.5, y: 0, inX: 0.5 - a, inY: 0, outX: 0.5 + a, outY: 0 },
      { x: 1, y: 0.5, inX: 1, inY: 0.5 - a, outX: 1, outY: 0.5 + a },
      { x: 0.5, y: 1, inX: 0.5 + a, inY: 1, outX: 0.5 - a, outY: 1 },
      { x: 0, y: 0.5, inX: 0, inY: 0.5 + a, outX: 0, outY: 0.5 - a },
    ],
  };
}

export function arrowPath(): VectorPath {
  const raw: Array<[number, number]> = [[0, 35], [60, 35], [60, 10], [100, 50], [60, 90], [60, 65], [0, 65]];
  return { closed: true, points: raw.map(([x, y]) => ({ x: x / 100, y: y / 100 })) };
}

export function linePath(): VectorPath {
  return { closed: false, points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }] };
}

type Seg = { x: number; y: number; c1?: [number, number]; c2?: [number, number] };

/** Converts an SVG elliptical arc to cubic segments (endpoint parameterisation, SVG spec F.6). */
function arcToCubics(x1: number, y1: number, rx: number, ry: number, phiDeg: number, fa: number, fs: number, x2: number, y2: number): Seg[] {
  if (rx === 0 || ry === 0) return [{ x: x2, y: y2 }];
  const phi = (phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { const s = Math.sqrt(lambda); rx *= s; ry *= s; }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dth > 0) dth -= 2 * Math.PI;
  if (fs && dth < 0) dth += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dth) / (Math.PI / 2) - 1e-9));
  const step = dth / n;
  const t = (4 / 3) * Math.tan(step / 4);
  const out: Seg[] = [];
  let a1 = th1;
  for (let i = 0; i < n; i++) {
    const a2 = a1 + step;
    const p = (a: number): [number, number] => {
      const ex = rx * Math.cos(a), ey = ry * Math.sin(a);
      return [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy];
    };
    const d = (a: number): [number, number] => {
      const ex = -rx * Math.sin(a), ey = ry * Math.cos(a);
      return [cos * ex - sin * ey, sin * ex + cos * ey];
    };
    const [sx, sy] = p(a1), [ex, ey] = i === n - 1 ? [x2, y2] : p(a2);
    const [d1x, d1y] = d(a1), [d2x, d2y] = d(a2);
    out.push({ x: ex, y: ey, c1: [sx + t * d1x, sy + t * d1y], c2: [ex - t * d2x, ey - t * d2y] });
    a1 = a2;
  }
  return out;
}

/** Parses one SVG path `d` string (M L H V C S Q A Z, absolute or relative) into absolute segments. Returns undefined when unsupported or multi-subpath. */
export function parseSvgPathD(d: string): { segs: Seg[]; closed: boolean } | undefined {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tokens) return undefined;
  let i = 0;
  let cmd = '';
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let lastC2: [number, number] | undefined;
  const segs: Seg[] = [];
  let closed = false;
  let started = false;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i]!)) cmd = tokens[i++]!;
    const rel = cmd === cmd.toLowerCase();
    const up = cmd.toUpperCase();
    if (up === 'M') {
      if (started) return undefined;
      started = true;
      const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
      cx = sx = x; cy = sy = y; segs.push({ x, y });
      cmd = rel ? 'l' : 'L';
      lastC2 = undefined;
    } else if (up === 'L') {
      const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
      segs.push({ x, y }); cx = x; cy = y; lastC2 = undefined;
    } else if (up === 'H') {
      const x = num() + (rel ? cx : 0); segs.push({ x, y: cy }); cx = x; lastC2 = undefined;
    } else if (up === 'V') {
      const y = num() + (rel ? cy : 0); segs.push({ x: cx, y }); cy = y; lastC2 = undefined;
    } else if (up === 'C') {
      const c1: [number, number] = [num() + (rel ? cx : 0), num() + (rel ? cy : 0)];
      const c2: [number, number] = [num() + (rel ? cx : 0), num() + (rel ? cy : 0)];
      const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
      segs.push({ x, y, c1, c2 }); cx = x; cy = y; lastC2 = c2;
    } else if (up === 'S') {
      const c1: [number, number] = lastC2 ? [2 * cx - lastC2[0], 2 * cy - lastC2[1]] : [cx, cy];
      const c2: [number, number] = [num() + (rel ? cx : 0), num() + (rel ? cy : 0)];
      const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
      segs.push({ x, y, c1, c2 }); cx = x; cy = y; lastC2 = c2;
    } else if (up === 'Q') {
      const q: [number, number] = [num() + (rel ? cx : 0), num() + (rel ? cy : 0)];
      const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
      segs.push({ x, y, c1: [cx + (2 / 3) * (q[0] - cx), cy + (2 / 3) * (q[1] - cy)], c2: [x + (2 / 3) * (q[0] - x), y + (2 / 3) * (q[1] - y)] });
      cx = x; cy = y; lastC2 = undefined;
    } else if (up === 'A') {
      const rx = num(), ry = num(), rot = num(), fa = num(), fs = num();
      const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
      segs.push(...arcToCubics(cx, cy, rx, ry, rot, fa, fs, x, y));
      cx = x; cy = y; lastC2 = undefined;
    } else if (up === 'Z') {
      closed = true; cx = sx; cy = sy; lastC2 = undefined;
      if (i < tokens.length) return undefined; // more subpaths follow
    } else {
      return undefined;
    }
    if (segs.some((s) => Number.isNaN(s.x) || Number.isNaN(s.y))) return undefined;
  }
  return segs.length >= 2 ? { segs, closed } : undefined;
}

function segsToPath(segs: Seg[], closed: boolean, vbX: number, vbY: number, vbW: number, vbH: number): VectorPath {
  // Drop a final point that only repeats the start of a closed path.
  const list = [...segs];
  let closingSeg: Seg | undefined;
  if (closed && list.length > 2) {
    const first = list[0]!, last = list[list.length - 1]!;
    if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-6) closingSeg = list.pop();
  }
  const nx = (x: number) => r4((x - vbX) / vbW);
  const ny = (y: number) => r4((y - vbY) / vbH);
  const points: PathPoint[] = list.map((s) => ({ x: nx(s.x), y: ny(s.y) }));
  for (let k = 1; k < list.length; k++) {
    const s = list[k]!;
    if (s.c1) { points[k - 1]!.outX = nx(s.c1[0]); points[k - 1]!.outY = ny(s.c1[1]); }
    if (s.c2) { points[k]!.inX = nx(s.c2[0]); points[k]!.inY = ny(s.c2[1]); }
  }
  if (closingSeg?.c1 && closingSeg.c2) {
    const lastIdx = points.length - 1;
    points[lastIdx]!.outX = nx(closingSeg.c1[0]); points[lastIdx]!.outY = ny(closingSeg.c1[1]);
    points[0]!.inX = nx(closingSeg.c2[0]); points[0]!.inY = ny(closingSeg.c2[1]);
  }
  const clamp = (v: number | undefined) => (v === undefined ? undefined : Math.min(2, Math.max(-1, v)));
  for (const p of points) {
    for (const key of ['inX', 'inY', 'outX', 'outY'] as const) { const c = clamp(p[key]); if (c === undefined) delete p[key]; else p[key] = c; }
  }
  return { closed, points };
}

/** Converts the drawable content of a simple SVG (single primitive or single path) to an editable path. */
export function svgToPath(svg: string): VectorPath | undefined {
  if (typeof DOMParser === 'undefined') return undefined;
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') return undefined;
  const vb = (root.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  const [vbX, vbY, vbW, vbH] = vb.length === 4 && vb.every((n) => Number.isFinite(n)) && vb[2]! > 0 && vb[3]! > 0 ? vb as [number, number, number, number] : [0, 0, 100, 100];
  const shapes = Array.from(root.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line'));
  if (shapes.length !== 1) return undefined;
  const el = shapes[0]!;
  const n = (name: string, fallback = 0) => Number(el.getAttribute(name) ?? fallback);
  const tag = el.nodeName.toLowerCase();
  if (tag === 'path') {
    const parsed = parseSvgPathD(el.getAttribute('d') ?? '');
    return parsed ? segsToPath(parsed.segs, parsed.closed, vbX, vbY, vbW, vbH) : undefined;
  }
  if (tag === 'rect' && !el.getAttribute('rx') && !el.getAttribute('ry')) {
    const x = n('x'), y = n('y'), w = n('width'), h = n('height');
    return segsToPath([{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }], true, vbX, vbY, vbW, vbH);
  }
  if (tag === 'rect') {
    const x = n('x'), y = n('y'), w = n('width'), h = n('height');
    const rx = Math.min(n('rx', n('ry')), w / 2), ry = Math.min(n('ry', n('rx')), h / 2);
    const d = `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    const parsed = parseSvgPathD(d);
    return parsed ? segsToPath(parsed.segs, true, vbX, vbY, vbW, vbH) : undefined;
  }
  if (tag === 'circle' || tag === 'ellipse') {
    const cx = n('cx'), cy = n('cy');
    const rx = tag === 'circle' ? n('r') : n('rx'), ry = tag === 'circle' ? n('r') : n('ry');
    const d = `M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx} ${cy - ry}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}A${rx} ${ry} 0 0 1 ${cx} ${cy + ry}A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}Z`;
    const parsed = parseSvgPathD(d);
    return parsed ? segsToPath(parsed.segs, true, vbX, vbY, vbW, vbH) : undefined;
  }
  if (tag === 'polygon' || tag === 'polyline') {
    const nums = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).map(Number);
    const pts: Seg[] = [];
    for (let k = 0; k + 1 < nums.length; k += 2) pts.push({ x: nums[k]!, y: nums[k + 1]! });
    return pts.length >= 2 ? segsToPath(pts, tag === 'polygon', vbX, vbY, vbW, vbH) : undefined;
  }
  if (tag === 'line') {
    return segsToPath([{ x: n('x1'), y: n('y1') }, { x: n('x2'), y: n('y2') }], false, vbX, vbY, vbW, vbH);
  }
  return undefined;
}

/** Whether Convert to path can handle this element, and the resulting path. Cards that are template slots are not extras and are never convertible. */
export function extraToPath(extra: ExtraElement, resolveAssetSvg: (id: string) => string | undefined): VectorPath | undefined {
  if (extra.kind !== 'shape' || extra.shape === 'path') return undefined;
  if (extra.assetId) {
    const svg = resolveAssetSvg(extra.assetId);
    return svg ? svgToPath(svg) : undefined;
  }
  switch (extra.shape ?? 'rectangle') {
    case 'rectangle': return rectanglePath();
    case 'ellipse': return ellipsePath();
    case 'arrow': return arrowPath();
    case 'line': return linePath();
    default: return undefined;
  }
}
