import { describe, expect, it } from 'vitest';
import { freehandToPath, simplify } from '../../src/core/freehand';
import { VectorPathSchema } from '../../src/core/schema';

describe('freehand pen conversion', () => {
  it('ignores a stray tap', () => {
    expect(freehandToPath([{ x: 0.5, y: 0.5 }])).toBeUndefined();
    expect(freehandToPath([{ x: 0.5, y: 0.5 }, { x: 0.5005, y: 0.5005 }])).toBeUndefined();
  });
  it('simplifies a straight run to its end points', () => {
    const line = Array.from({ length: 50 }, (_, i) => ({ x: i / 49, y: 0.5 }));
    expect(simplify(line, 0.004)).toHaveLength(2);
  });
  it('builds a schema-valid path inside its own bounding box', () => {
    const wave = Array.from({ length: 80 }, (_, i) => ({ x: 0.1 + i * 0.01, y: 0.5 + Math.sin(i / 6) * 0.2 }));
    const result = freehandToPath(wave)!;
    expect(result).toBeTruthy();
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.x + result.w).toBeLessThanOrEqual(1.0001);
    for (const p of result.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
    }
    expect(VectorPathSchema.safeParse({ closed: false, points: result.points }).success).toBe(true);
  });
  it('keeps a perfectly horizontal stroke at a usable height', () => {
    const result = freehandToPath([{ x: 0.1, y: 0.5 }, { x: 0.6, y: 0.5 }])!;
    expect(result.h).toBeGreaterThan(0);
  });
});
