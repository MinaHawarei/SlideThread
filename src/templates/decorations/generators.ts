import { mulberry32 } from '../../core/network';
import type { Palette } from '../../core/palette';

export type DecorationId = 'mesh' | 'dots-grid' | 'waves' | 'geometric' | 'blobs' | 'none';

export interface DecorationContext {
  tileIndex: number;
  tileCount: number;
  tileWidth: number;
  height: number;
  seed: number;
  params: Readonly<Record<string, unknown>>;
  palette: Palette;
  intensity: number;
}

export type DecorationPrimitive =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number; opacity: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string; opacity: number }
  | { kind: 'polyline'; points: readonly { x: number; y: number }[]; stroke: string; strokeWidth: number; opacity: number; fill?: string };

export type SvgFragment = readonly DecorationPrimitive[];
export type DecorationGenerator = (context: DecorationContext) => SvgFragment;

const MAX_INTENSITY = 1;

function validate(context: DecorationContext): void {
  if (!Number.isInteger(context.tileIndex) || context.tileIndex < 0) throw new RangeError('tileIndex must be a non-negative integer');
  if (!Number.isInteger(context.tileCount) || context.tileCount < 1 || context.tileIndex >= context.tileCount) throw new RangeError('tileIndex must be within a positive tileCount');
  if (!Number.isFinite(context.tileWidth) || context.tileWidth <= 0 || !Number.isFinite(context.height) || context.height <= 0) throw new RangeError('tile dimensions must be finite and positive');
  if (!Number.isInteger(context.seed)) throw new RangeError('seed must be an integer');
  if (!Number.isFinite(context.intensity) || context.intensity < 0 || context.intensity > MAX_INTENSITY) throw new RangeError('intensity must be between 0 and 1');
}

function param(context: DecorationContext, key: string, fallback: number, min: number, max: number): number {
  const value = context.params[key];
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function withIntensity(fragment: SvgFragment, intensity: number): SvgFragment {
  if (intensity === 0) return [];
  return fragment.map((primitive) => ({ ...primitive, opacity: primitive.opacity * intensity }));
}

function makeBoundary(boundaryIndex: number, context: DecorationContext) {
  const random = mulberry32((context.seed + Math.imul(boundaryIndex + 1, 0x9e3779b9)) | 0);
  const offsetA = Math.round((24 + random() * 72) * Math.min(context.tileWidth, context.height) / 1080 * 1000) / 1000;
  const offsetB = Math.round((24 + random() * 72) * Math.min(context.tileWidth, context.height) / 1080 * 1000) / 1000;
  const yA = 48 + random() * Math.max(1, context.height - 96);
  const yB = 48 + random() * Math.max(1, context.height - 96);
  return { offsetA, offsetB, yA, yB };
}

const mesh: DecorationGenerator = (context) => {
  const { tileWidth, height, tileIndex, seed, palette } = context;
  const random = mulberry32((seed + Math.imul(tileIndex + 1, 0x85ebca6b)) | 0);
  const count = Math.round(param(context, 'nodesPerTile', 8, 4, 16));
  const inset = Math.min(tileWidth * 0.12, height * 0.12, 64 * Math.min(tileWidth, height) / 1080);
  const nodes = Array.from({ length: count }, () => ({
    x: inset + random() * (tileWidth - inset * 2),
    y: inset + random() * (height - inset * 2),
  }));
  const maxDistance = Math.min(tileWidth, height) * 0.34;
  const lines: DecorationPrimitive[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const point = nodes[index]!;
    const nearest = nodes
      .map((next, nextIndex) => ({ next, nextIndex, distance: Math.hypot(next.x - point.x, next.y - point.y) }))
      .filter(({ nextIndex, distance }) => nextIndex !== index && distance <= maxDistance)
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 2);
    for (const neighbor of nearest) {
      if (index < neighbor.nextIndex) lines.push({ kind: 'line', x1: point.x, y1: point.y, x2: neighbor.next.x, y2: neighbor.next.y, stroke: palette.line, strokeWidth: Math.max(1, tileWidth * 0.0023), opacity: 0.65 });
    }
  }
  const leftBoundary = tileIndex > 0 ? makeBoundary(tileIndex - 1, context) : null;
  const rightBoundary = makeBoundary(tileIndex, context);
  if (leftBoundary) lines.push({ kind: 'line', x1: -leftBoundary.offsetA, y1: leftBoundary.yA, x2: leftBoundary.offsetB, y2: leftBoundary.yB, stroke: palette.line, strokeWidth: Math.max(1, tileWidth * 0.0023), opacity: 0.65 });
  lines.push({ kind: 'line', x1: tileWidth - rightBoundary.offsetA, y1: rightBoundary.yA, x2: tileWidth + rightBoundary.offsetB, y2: rightBoundary.yB, stroke: palette.line, strokeWidth: Math.max(1, tileWidth * 0.0023), opacity: 0.65 });
  const dots = nodes.map(({ x, y }, index): DecorationPrimitive => ({ kind: 'circle', cx: x, cy: y, r: index % 5 === 0 ? Math.max(4, tileWidth * 0.009) : Math.max(2, tileWidth * 0.004), fill: index % 5 === 0 ? palette.acc2 : palette.acc, opacity: index % 5 === 0 ? 0.9 : 0.5 }));
  return [...lines, ...dots];
};

const dotsGrid: DecorationGenerator = (context) => {
  const { tileWidth, height, palette } = context;
  const rows = Math.round(param(context, 'rows', 8, 2, 24));
  const columns = Math.max(2, Math.round(tileWidth / (height / rows)));
  const spacingX = tileWidth / columns;
  const spacingY = height / rows;
  const radius = Math.min(tileWidth, height) * param(context, 'dotScale', 0.006, 0.002, 0.025);
  const result: DecorationPrimitive[] = [];
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      result.push({ kind: 'circle', cx: column * spacingX, cy: row * spacingY, r: radius, fill: palette.acc, opacity: 0.56 });
    }
  }
  return result;
};

const waves: DecorationGenerator = (context) => {
  const { tileWidth, height, tileIndex, palette } = context;
  const cycleCount = Math.round(param(context, 'cycles', 2, 1, 6));
  const amplitude = height * param(context, 'amplitude', 0.075, 0.02, 0.18);
  const steps = Math.round(param(context, 'steps', 48, 16, 128));
  const paths: DecorationPrimitive[] = [];
  for (let waveIndex = 0; waveIndex < 3; waveIndex += 1) {
    const baseY = height * (0.3 + waveIndex * 0.2);
    const phase = waveIndex * 0.52;
    const points = Array.from({ length: steps + 1 }, (_, index) => {
      const fraction = index / steps;
      const globalPhase = Math.PI * 2 * (cycleCount * (tileIndex + fraction) + phase);
      return { x: fraction * tileWidth, y: baseY + Math.sin(globalPhase) * amplitude };
    });
    paths.push({ kind: 'polyline', points, stroke: waveIndex % 2 === 0 ? palette.acc : palette.acc2, strokeWidth: Math.max(1, tileWidth * 0.003), opacity: 0.55 });
  }
  return paths;
};

const geometric: DecorationGenerator = (context) => {
  const { tileWidth, height, palette } = context;
  const rows = Math.round(param(context, 'rows', 5, 2, 12));
  const columns = Math.max(2, Math.round(param(context, 'columns', 6, 2, 16)));
  const dx = tileWidth / columns;
  const dy = height / rows;
  const lines: DecorationPrimitive[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const y = row * dy;
    lines.push({ kind: 'line', x1: 0, y1: y, x2: tileWidth, y2: y, stroke: palette.line, strokeWidth: Math.max(1, tileWidth * 0.0018), opacity: 0.7 });
  }
  for (let column = 0; column <= columns; column += 1) {
    const x = column * dx;
    lines.push({ kind: 'line', x1: x, y1: 0, x2: x, y2: height, stroke: palette.line, strokeWidth: Math.max(1, tileWidth * 0.0018), opacity: 0.7 });
  }
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = column * dx;
      const top = row * dy;
      const centerX = left + dx / 2;
      const centerY = top + dy / 2;
      // Original, non-religious eight-point geometry inspired by regional tessellation craft.
      const points = Array.from({ length: 16 }, (_, index) => {
        const outer = index % 2 === 0;
        const radius = outer ? 0.43 : 0.17;
        const angle = -Math.PI / 2 + (Math.PI * index) / 8;
        return { x: centerX + Math.cos(angle) * dx * radius, y: centerY + Math.sin(angle) * dy * radius };
      });
      for (let index = 0; index < points.length; index += 1) {
        const from = points[index]!;
        const to = points[(index + 1) % points.length]!;
        lines.push({ kind: 'line', x1: from.x, y1: from.y, x2: to.x, y2: to.y, stroke: palette.acc2, strokeWidth: Math.max(1, tileWidth * 0.0018), opacity: 0.52 });
        if (index % 2 === 0) lines.push({ kind: 'line', x1: centerX, y1: centerY, x2: from.x, y2: from.y, stroke: palette.acc, strokeWidth: Math.max(1, tileWidth * 0.0014), opacity: 0.38 });
      }
    }
  }
  return lines;
};

const blobs: DecorationGenerator = (context) => {
  const { tileWidth, height, tileIndex, seed, palette } = context;
  const random = mulberry32((seed + Math.imul(tileIndex + 1, 0x27d4eb2d)) | 0);
  const count = Math.round(param(context, 'count', 6, 2, 12));
  const paddingX = tileWidth * 0.18;
  const paddingY = height * 0.12;
  return Array.from({ length: count }, (_, index): DecorationPrimitive => {
    const radius = Math.min(tileWidth, height) * (0.025 + random() * 0.07);
    return {
      kind: 'circle',
      cx: paddingX + random() * Math.max(1, tileWidth - paddingX * 2),
      cy: paddingY + random() * Math.max(1, height - paddingY * 2),
      r: radius,
      fill: index % 2 === 0 ? palette.acc : palette.acc2,
      opacity: 0.24 + random() * 0.18,
    };
  });
};

export const DECORATION_GENERATORS: Readonly<Record<DecorationId, DecorationGenerator>> = {
  mesh,
  'dots-grid': dotsGrid,
  waves,
  geometric,
  blobs,
  none: () => [],
};

export function generateDecoration(id: DecorationId, context: DecorationContext, enabled = true): SvgFragment {
  validate(context);
  if (!enabled || id === 'none' || context.intensity === 0) return [];
  return withIntensity(DECORATION_GENERATORS[id](context), context.intensity);
}
