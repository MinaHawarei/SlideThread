import { describe, expect, it } from 'vitest';
import { NETWORK_DARK_PALETTE, NETWORK_LIGHT_PALETTE } from '../../src/core/palette';
import { DECORATION_GENERATORS, generateDecoration, type DecorationContext, type DecorationId, type DecorationPrimitive } from '../../src/templates/decorations/generators';

const kinds: DecorationId[] = ['mesh', 'dots-grid', 'waves', 'geometric', 'blobs', 'none'];
const base: DecorationContext = {
  tileIndex: 0,
  tileCount: 3,
  tileWidth: 360,
  height: 640,
  seed: 7,
  params: {},
  palette: NETWORK_DARK_PALETTE,
  intensity: 1,
};

function segmentForTile(fragment: ReturnType<typeof generateDecoration>, side: 'left' | 'right') {
  return fragment.find((element) => element.kind === 'line' && (side === 'left' ? element.x1 < 0 : element.x2 > base.tileWidth));
}

function verticalLines(fragment: ReturnType<typeof generateDecoration>, x: number) {
  return fragment.filter((shape): shape is Extract<DecorationPrimitive, { kind: 'line' }> => shape.kind === 'line' && shape.x1 === x && shape.x2 === x);
}

describe('decoration generators', () => {
  it('registers all required generators and returns finite primitives at all aspect classes', () => {
    expect(Object.keys(DECORATION_GENERATORS).sort()).toEqual([...kinds].sort());
    const dimensions = [
      { tileWidth: 1920, height: 1080 },
      { tileWidth: 1080, height: 1080 },
      { tileWidth: 1080, height: 1350 },
      { tileWidth: 1080, height: 1920 },
    ];
    for (const id of kinds) {
      for (const palette of [NETWORK_DARK_PALETTE, NETWORK_LIGHT_PALETTE]) {
        for (const size of dimensions) {
          const fragment = generateDecoration(id, { ...base, ...size, palette });
          expect(fragment.every((shape) => Object.values(shape).filter((value): value is number => typeof value === 'number').every(Number.isFinite))).toBe(true);
        }
      }
    }
  });

  it('is deterministic and prefix-stable for each tile-based generator', () => {
    for (const id of kinds.filter((kind) => kind !== 'none')) {
      const shortDeck = [0, 1, 2].map((tileIndex) => generateDecoration(id, { ...base, tileIndex, tileCount: 3 }));
      const longDeck = [0, 1, 2, 3, 4].map((tileIndex) => generateDecoration(id, { ...base, tileIndex, tileCount: 5 }));
      expect(longDeck.slice(0, 3)).toEqual(shortDeck);
      expect(generateDecoration(id, base)).toEqual(generateDecoration(id, base));
    }
  });

  it('continues shared mesh connectors and wave paths across tile edges', () => {
    const first = generateDecoration('mesh', { ...base, tileIndex: 0 });
    const second = generateDecoration('mesh', { ...base, tileIndex: 1 });
    const outgoing = segmentForTile(first, 'right');
    const incoming = segmentForTile(second, 'left');
    expect(outgoing?.kind).toBe('line');
    expect(incoming?.kind).toBe('line');
    if (outgoing?.kind !== 'line' || incoming?.kind !== 'line') throw new Error('Expected mesh boundary segments');
    expect([outgoing.x1, outgoing.y1, outgoing.x2, outgoing.y2]).toEqual([incoming.x1 + base.tileWidth, incoming.y1, incoming.x2 + base.tileWidth, incoming.y2]);

    const firstWave = generateDecoration('waves', { ...base, tileIndex: 0 }).filter((shape) => shape.kind === 'polyline');
    const secondWave = generateDecoration('waves', { ...base, tileIndex: 1 }).filter((shape) => shape.kind === 'polyline');
    for (let index = 0; index < firstWave.length; index += 1) {
      const left = firstWave[index]!;
      const right = secondWave[index]!;
      if (left.kind !== 'polyline' || right.kind !== 'polyline') throw new Error('Expected wave polylines');
      expect(left.points.at(-1)?.y).toBeCloseTo(right.points[0]!.y, 10);
    }
  });

  it('keeps dot-grid and geometric tile edges aligned', () => {
    const dots = generateDecoration('dots-grid', base);
    const leftDots = dots.filter((shape) => shape.kind === 'circle' && shape.cx === 0);
    const rightDots = dots.filter((shape) => shape.kind === 'circle' && shape.cx === base.tileWidth);
    expect(rightDots.map((shape) => shape.kind === 'circle' ? shape.cy : -1)).toEqual(leftDots.map((shape) => shape.kind === 'circle' ? shape.cy : -1));

    const first = generateDecoration('geometric', { ...base, tileIndex: 0 });
    const second = generateDecoration('geometric', { ...base, tileIndex: 1 });
    const firstLeft = verticalLines(first, 0);
    const firstRight = verticalLines(first, base.tileWidth);
    const secondLeft = verticalLines(second, 0);
    expect(firstRight.map((shape) => shape.y1)).toEqual(firstLeft.map((shape) => shape.y1));
    expect(secondLeft.map((shape) => shape.y1)).toEqual(firstLeft.map((shape) => shape.y1));
    expect(first.filter((shape) => shape.kind === 'line' && shape.x1 === 0 && shape.x2 === base.tileWidth)).toEqual(second.filter((shape) => shape.kind === 'line' && shape.x1 === 0 && shape.x2 === base.tileWidth));
  });

  it('supports off and intensity modes, and safely bounds numeric parameters', () => {
    expect(generateDecoration('mesh', base, false)).toEqual([]);
    expect(generateDecoration('dots-grid', { ...base, intensity: 0 })).toEqual([]);
    const full = generateDecoration('blobs', base);
    const dim = generateDecoration('blobs', { ...base, intensity: 0.5 });
    expect(dim[0]!.opacity).toBeCloseTo(full[0]!.opacity * 0.5);
    const sparse = generateDecoration('dots-grid', { ...base, params: { rows: 1_000_000 } });
    expect(sparse.length).toBeLessThan(1000);
  });

  it('rejects invalid tile positions, counts, dimensions, seed, and intensity', () => {
    expect(() => generateDecoration('mesh', { ...base, tileIndex: 3 })).toThrow(/tileIndex/);
    expect(() => generateDecoration('mesh', { ...base, tileCount: 0 })).toThrow(/tileIndex/);
    expect(() => generateDecoration('mesh', { ...base, tileWidth: Number.NaN })).toThrow(/dimensions/);
    expect(() => generateDecoration('mesh', { ...base, seed: 1.5 })).toThrow(/seed/);
    expect(() => generateDecoration('mesh', { ...base, intensity: 2 })).toThrow(/intensity/);
  });
});
