import { describe, expect, it } from 'vitest';
import { createDefaultPath, insertPoint, moveHandle, movePoint, pathToD, removePoint, setClosed, toggleSmooth } from '@/core/vectorPath';
import { ExtraElementSchema, type VectorPath } from '@/core/schema';

const line: VectorPath = { closed: false, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };

describe('vectorPath', () => {
  it('writes straight segments as L and curves as C', () => {
    expect(pathToD(line, 100, 50)).toBe('M 0 0 L 100 50');
    const d = pathToD(createDefaultPath(), 100, 100);
    expect(d.startsWith('M 8 80')).toBe(true);
    expect(d).toContain(' C ');
    expect(d.endsWith(' 92 20')).toBe(true);
  });
  it('closes only with 3+ points', () => {
    expect(setClosed(line, true).closed).toBe(false);
    const tri = insertPoint(line, 0.5, 0.1);
    expect(setClosed(tri, true).closed).toBe(true);
    expect(pathToD(setClosed(tri, true), 10, 10).endsWith(' Z')).toBe(true);
  });
  it('moves a point with its handles and clamps to the box', () => {
    const p = movePoint(createDefaultPath(), 1, 0.45, 0.3);
    expect(p.points[1]!).toMatchObject({ x: 0.45, y: 0.3 });
    expect(p.points[1]!.outX).toBeCloseTo(0.6, 4);
    expect(movePoint(line, 0, -4, 9).points[0]!).toMatchObject({ x: 0, y: 1 });
  });
  it('mirrors the opposite handle for smooth nodes', () => {
    const p = moveHandle(createDefaultPath(), 1, 'out', 0.55, 0.1);
    expect(p.points[1]!.inX).toBeCloseTo(0.15, 4);
    expect(p.points[1]!.inY).toBeCloseTo(0.3, 4);
  });
  it('inserts, removes, and refuses to go below 2 points', () => {
    const three = insertPoint(line, 0.4, 0.2, 0);
    expect(three.points.map((q) => q.x)).toEqual([0, 0.4, 1]);
    expect(removePoint(three, 1).points).toHaveLength(2);
    expect(removePoint(line, 0)).toEqual(line);
  });
  it('toggles smooth on and off', () => {
    const tri = insertPoint(line, 0.5, 0.1, 0);
    const smooth = toggleSmooth(tri, 1);
    expect(smooth.points[1]!.outX).toBeDefined();
    const back = toggleSmooth(smooth, 1);
    expect(back.points[1]!.outX).toBeUndefined();
  });
  it('is accepted by the extra schema only as a path shape', () => {
    const base = { id: 'p', kind: 'shape', x: 0.1, y: 0.1, w: 0.4, h: 0.3, rotation: 0, z: 1, locked: false };
    expect(ExtraElementSchema.safeParse({ ...base, shape: 'path', path: createDefaultPath() }).success).toBe(true);
    expect(ExtraElementSchema.safeParse({ ...base, shape: 'path' }).success).toBe(false);
    expect(ExtraElementSchema.safeParse({ ...base, shape: 'rectangle', path: createDefaultPath() }).success).toBe(false);
    expect(ExtraElementSchema.safeParse({ ...base, shape: 'path', path: { closed: false, points: [{ x: 0, y: 0 }] } }).success).toBe(false);
  });
});
