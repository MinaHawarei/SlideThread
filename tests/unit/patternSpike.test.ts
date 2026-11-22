import { describe, expect, it } from 'vitest';
import { generateCarouselNetwork } from '../../src/core/network';
import {
  createMeshTiles,
  globalizeSegment,
  renderMeshTileSvg,
  type MeshOptions,
} from '../fixtures/meshPatternPrototype';

const options: MeshOptions = { tileWidth: 360, height: 640, seed: 7 };

describe('R0-5 tile-based mesh prototype', () => {
  it('keeps every existing tile byte-for-byte stable when slides are appended', () => {
    const threeTiles = createMeshTiles(3, options);
    const fiveTiles = createMeshTiles(5, options);

    for (let index = 0; index < threeTiles.length; index += 1) {
      expect(fiveTiles[index]).toEqual(threeTiles[index]);
      expect(renderMeshTileSvg(fiveTiles[index]!)).toBe(renderMeshTileSvg(threeTiles[index]!));
    }
  });

  it('uses the same global line segment on both sides of each shared tile boundary', () => {
    const tiles = createMeshTiles(4, options);

    for (let index = 0; index < tiles.length - 1; index += 1) {
      const left = tiles[index]!;
      const right = tiles[index + 1]!;
      expect(left.rightBoundary.boundaryIndex).toBe(index);
      expect(right.leftBoundary?.boundaryIndex).toBe(index);
      expect(
        globalizeSegment(left.rightBoundary.leftTileSegment, index, options.tileWidth)
      ).toEqual(
        globalizeSegment(right.leftBoundary!.rightTileSegment, index + 1, options.tileWidth)
      );
    }
  });

  it('shows why the current whole-carousel graph is not prefix-stable', () => {
    const singleSlide = generateCarouselNetwork(1080, 1350, 1, 7);
    const twoSlides = generateCarouselNetwork(1080, 1350, 2, 7);

    expect(singleSlide.nodes[0]!.x).not.toBe(twoSlides.nodes[0]!.x);
  });
});
