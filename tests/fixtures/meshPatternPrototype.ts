import { mulberry32 } from '../../src/core/network';

export interface MeshPoint {
  x: number;
  y: number;
}

export interface MeshSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MeshBoundary {
  boundaryIndex: number;
  leftOffset: number;
  rightOffset: number;
  leftY: number;
  rightY: number;
  leftTileSegment: MeshSegment;
  rightTileSegment: MeshSegment;
}

export interface MeshTile {
  tileIndex: number;
  tileWidth: number;
  height: number;
  nodes: MeshPoint[];
  internalSegments: MeshSegment[];
  leftBoundary: MeshBoundary | null;
  rightBoundary: MeshBoundary;
}

export interface MeshOptions {
  tileWidth: number;
  height: number;
  seed: number;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function createBoundary(boundaryIndex: number, { tileWidth, height, seed }: MeshOptions): MeshBoundary {
  const boundarySeed = (seed + Math.imul(boundaryIndex + 1, 0x9e3779b9)) | 0;
  const random = mulberry32(boundarySeed);
  const leftOffset = round(24 + random() * 72);
  const rightOffset = round(24 + random() * 72);
  const leftY = round(48 + random() * (height - 96));
  const rightY = round(48 + random() * (height - 96));

  return {
    boundaryIndex,
    leftOffset,
    rightOffset,
    leftY,
    rightY,
    leftTileSegment: {
      x1: round(tileWidth - leftOffset),
      y1: leftY,
      x2: round(tileWidth + rightOffset),
      y2: rightY,
    },
    rightTileSegment: {
      x1: -leftOffset,
      y1: leftY,
      x2: rightOffset,
      y2: rightY,
    },
  };
}

export function createMeshTile(tileIndex: number, options: MeshOptions): MeshTile {
  if (!Number.isInteger(tileIndex) || tileIndex < 0) {
    throw new RangeError('tileIndex must be a non-negative integer');
  }
  if (options.tileWidth <= 0 || options.height <= 0) {
    throw new RangeError('tile dimensions must be positive');
  }

  const tileSeed = (options.seed + Math.imul(tileIndex + 1, 0x85ebca6b)) | 0;
  const random = mulberry32(tileSeed);
  const inset = Math.min(64, options.tileWidth * 0.12, options.height * 0.12);
  const usableWidth = options.tileWidth - inset * 2;
  const usableHeight = options.height - inset * 2;
  const nodes: MeshPoint[] = Array.from({ length: 8 }, () => ({
    x: round(inset + random() * usableWidth),
    y: round(inset + random() * usableHeight),
  }));
  const internalSegments: MeshSegment[] = [];
  const maximumDistance = Math.min(options.tileWidth, options.height) * 0.34;

  for (let i = 0; i < nodes.length; i += 1) {
    const from = nodes[i]!;
    const neighbors = nodes
      .map((to, index) => ({ to, index, distance: Math.hypot(to.x - from.x, to.y - from.y) }))
      .filter(({ index, distance }) => index !== i && distance <= maximumDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    for (const neighbor of neighbors) {
      if (i < neighbor.index) {
        internalSegments.push({ x1: from.x, y1: from.y, x2: neighbor.to.x, y2: neighbor.to.y });
      }
    }
  }

  return {
    tileIndex,
    tileWidth: options.tileWidth,
    height: options.height,
    nodes,
    internalSegments,
    leftBoundary: tileIndex > 0 ? createBoundary(tileIndex - 1, options) : null,
    rightBoundary: createBoundary(tileIndex, options),
  };
}

export function createMeshTiles(count: number, options: MeshOptions): MeshTile[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('count must be a positive integer');
  }
  return Array.from({ length: count }, (_, tileIndex) => createMeshTile(tileIndex, options));
}

export function renderMeshTileSvg(tile: MeshTile): string {
  const lines = [
    ...tile.internalSegments,
    ...(tile.leftBoundary ? [tile.leftBoundary.rightTileSegment] : []),
    tile.rightBoundary.leftTileSegment,
  ]
    .map(
      ({ x1, y1, x2, y2 }) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`
    )
    .join('');
  const nodes = tile.nodes
    .map(
      ({ x, y }, index) =>
        `<circle cx="${x}" cy="${y}" r="${index % 5 === 0 ? 7 : 3.5}" fill="${index % 5 === 0 ? '#5B49D6' : '#0B7FA6'}" />`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tile.tileWidth}" height="${tile.height}" viewBox="0 0 ${tile.tileWidth} ${tile.height}" style="display:block;overflow:hidden;background:#F2F6FB"><g fill="none" stroke="#0B7FA6" stroke-width="2" stroke-opacity="0.65">${lines}</g><g>${nodes}</g></svg>`;
}

export function globalizeSegment(segment: MeshSegment, tileIndex: number, tileWidth: number): MeshSegment {
  const xOffset = tileIndex * tileWidth;
  return {
    x1: round(segment.x1 + xOffset),
    y1: segment.y1,
    x2: round(segment.x2 + xOffset),
    y2: segment.y2,
  };
}
