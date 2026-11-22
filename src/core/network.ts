/**
 * mulberry32 32-bit PRNG
 */
export function mulberry32(seed: number) {
  let s = seed | 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface NetworkNode {
  x: number;
  y: number;
  isAccent: boolean;
}

export interface NetworkLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  lines: NetworkLine[];
}

export const NETWORK_DEFAULT_SEED = 7;
export const NETWORK_BASE_SHORT_SIDE = 1080;
export const NETWORK_BASE_MAX_DISTANCE = 560; // Spec §7.1
export const NETWORK_NODES_PER_SLIDE = 8; // Spec §7.1

/**
 * Generates continuous carousel network graph across all slides.
 * Total canvas width = slideCount * slideWidth.
 * Spec §7.1:
 * - mulberry32 seed 7
 * - 8 nodes per slide width
 * - connect to 2 nearest neighbors if distance < 560px (scaled with slide size)
 * - every 5th node is an accent ring node
 */
export function generateCarouselNetwork(
  slideWidth: number,
  slideHeight: number,
  slideCount: number = 1,
  seed: number = NETWORK_DEFAULT_SEED
): NetworkGraph {
  const prng = mulberry32(seed);
  const count = Math.max(1, slideCount);
  const totalWidth = count * slideWidth;
  const totalHeight = slideHeight;
  const nodeCount = count * NETWORK_NODES_PER_SLIDE;

  // Scale max connection distance based on slide size (relative to 1080 base)
  const scale = Math.min(slideWidth, slideHeight) / NETWORK_BASE_SHORT_SIDE;
  const maxDist = NETWORK_BASE_MAX_DISTANCE * scale;

  const nodes: NetworkNode[] = [];
  const lines: NetworkLine[] = [];

  // Padding inside slide height and carousel width
  const padX = 40 * scale;
  const padY = 40 * scale;
  const usableWidth = totalWidth - padX * 2;
  const usableHeight = totalHeight - padY * 2;

  for (let i = 0; i < nodeCount; i++) {
    const x = padX + prng() * usableWidth;
    const y = padY + prng() * usableHeight;
    const isAccent = i % 5 === 0;
    nodes.push({ x, y, isAccent });
  }

  // Connect each node to its 2 nearest neighbors if distance < maxDist
  for (let i = 0; i < nodes.length; i++) {
    const from = nodes[i]!;
    const neighborsWithDist: { index: number; dist: number }[] = [];

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const to = nodes[j]!;
      const dx = from.x - to.x;
      const dy = from.y - to.y;
      const dist = Math.hypot(dx, dy);
      if (dist < maxDist) {
        neighborsWithDist.push({ index: j, dist });
      }
    }

    neighborsWithDist.sort((a, b) => a.dist - b.dist);
    const nearest2 = neighborsWithDist.slice(0, 2);

    for (const neighbor of nearest2) {
      const to = nodes[neighbor.index]!;
      const exists = lines.some(
        (l) =>
          (l.x1 === from.x && l.y1 === from.y && l.x2 === to.x && l.y2 === to.y) ||
          (l.x1 === to.x && l.y1 === to.y && l.x2 === from.x && l.y2 === from.y)
      );
      if (!exists) {
        lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
      }
    }
  }

  return { nodes, lines };
}

/**
 * Backward-compatible single slide generator for spike/tests.
 */
export function generateNetwork(
  width: number,
  height: number,
  nodeCount: number = 32,
  seed: number = NETWORK_DEFAULT_SEED
): NetworkGraph {
  const prng = mulberry32(seed);
  const nodes: NetworkNode[] = [];
  const lines: NetworkLine[] = [];

  const padding = 60;
  for (let i = 0; i < nodeCount; i++) {
    const x = padding + prng() * (width - padding * 2);
    const y = padding + prng() * (height - padding * 2);
    const isAccent = i % 5 === 0;
    nodes.push({ x, y, isAccent });
  }

  const maxDist = Math.max(width, height) * 0.45;

  for (let i = 0; i < nodes.length; i++) {
    const from = nodes[i]!;
    const distances: { index: number; dist: number }[] = [];

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const to = nodes[j]!;
      const dx = from.x - to.x;
      const dy = from.y - to.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        distances.push({ index: j, dist });
      }
    }

    distances.sort((a, b) => a.dist - b.dist);
    const neighbors = distances.slice(0, 2);

    for (const neighbor of neighbors) {
      const to = nodes[neighbor.index]!;
      const exists = lines.some(
        (l) =>
          (l.x1 === from.x && l.y1 === from.y && l.x2 === to.x && l.y2 === to.y) ||
          (l.x1 === to.x && l.y1 === to.y && l.x2 === from.x && l.y2 === from.y)
      );
      if (!exists) {
        lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
      }
    }
  }

  return { nodes, lines };
}
