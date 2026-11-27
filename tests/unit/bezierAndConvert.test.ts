import { describe, expect, it } from 'vitest';
import { buildBezierPath, dedupeAnchors } from '../../src/core/bezierPen';
import { extraToPath, parseSvgPathD, svgToPath, rectanglePath } from '../../src/core/convertToPath';
import { VectorPathSchema, type ExtraElement } from '../../src/core/schema';
import { getShapeSvg, SHAPES_ITEMS } from '../../src/assets';

describe('bezier pen path builder', () => {
  it('needs two anchors', () => {
    expect(buildBezierPath([{ x: 0.5, y: 0.5 }], false)).toBeUndefined();
  });
  it('merges anchors a double click put on the same spot', () => {
    expect(dedupeAnchors([{ x: 0.2, y: 0.2 }, { x: 0.5, y: 0.5 }, { x: 0.5005, y: 0.5 }])).toHaveLength(2);
  });
  it('stores points relative to a box that hugs anchors and handles', () => {
    const result = buildBezierPath([
      { x: 0.2, y: 0.5, outX: 0.3, outY: 0.2 },
      { x: 0.6, y: 0.5, inX: 0.5, inY: 0.8 },
    ], false)!;
    expect(result.x).toBeCloseTo(0.2);
    expect(result.y).toBeCloseTo(0.2);
    expect(result.points[0]).toMatchObject({ x: 0, y: 0.5 });
    expect(result.points[0]!.outX).toBeCloseTo(0.25);
    expect(result.points[0]!.outY).toBeCloseTo(0);
    expect(result.points[1]!.inY).toBeCloseTo(1);
    expect(VectorPathSchema.safeParse({ closed: result.closed, points: result.points }).success).toBe(true);
  });
  it('only closes with three or more anchors', () => {
    expect(buildBezierPath([{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }], true)!.closed).toBe(false);
    expect(buildBezierPath([{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.5, y: 0.5 }], true)!.closed).toBe(true);
  });
});

describe('convert to path', () => {
  const base = { x: 0.1, y: 0.1, w: 0.3, h: 0.3, rotation: 0, z: 1, locked: false } as const;
  it('converts rectangles, ellipses, arrows and lines', () => {
    for (const shape of ['rectangle', 'ellipse', 'arrow', 'line'] as const) {
      const path = extraToPath({ ...base, id: shape, kind: 'shape', shape } as ExtraElement, () => undefined);
      expect(path, shape).toBeTruthy();
      expect(VectorPathSchema.safeParse(path).success, shape).toBe(true);
    }
    expect(rectanglePath().points).toHaveLength(4);
  });
  it('does not convert a path again or non-shapes', () => {
    expect(extraToPath({ ...base, id: 'a', kind: 'text' } as ExtraElement, () => undefined)).toBeUndefined();
  });
  it('parses arcs and relative commands', () => {
    const parsed = parseSvgPathD('M10 10h20v20h-20z');
    expect(parsed?.closed).toBe(true);
    expect(parsed?.segs.at(-1)).toMatchObject({ x: 10, y: 30 });
    expect(parseSvgPathD('M0 0a5 5 0 0 1 10 0z')?.segs.length).toBeGreaterThan(2);
    expect(parseSvgPathD('M0 0L5 5M9 9L3 3')).toBeUndefined();
  });
  it('converts single-primitive library SVGs and reports the rest as unsupported', () => {
    const circle = svgToPath('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="32"/></svg>')!;
    expect(circle.closed).toBe(true);
    expect(circle.points).toHaveLength(4);
    expect(circle.points[0]!.outX).toBeDefined();
    expect(svgToPath('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="4" cy="4" r="2"/><rect width="3" height="3"/></svg>')).toBeUndefined();
  });
  it('converts most built-in library shapes to valid paths', () => {
    const converted = SHAPES_ITEMS.filter((item) => {
      const svg = getShapeSvg(item.id);
      const path = svg ? svgToPath(svg) : undefined;
      if (path) expect(VectorPathSchema.safeParse(path).success, item.id).toBe(true);
      return Boolean(path);
    });
    expect(converted.length).toBeGreaterThan(25);
  });
});
