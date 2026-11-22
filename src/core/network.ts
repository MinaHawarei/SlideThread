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

/**
 * Generates deterministic network nodes and lines for given dimensions and seed.
 * Spec §7.1:
 * - PRNG mulberry32 with seed 7
 * - ~8-12 nodes per slide scale (or ~30 nodes for ~100 SVG elements)
 * - connect to 2 nearest neighbors if distance < maxDist
 * - every 5th node is an accent ring node
 */
export function generateNetwork(
  width: number,
  height: number,
  nodeCount: number = 32,
  seed: number = 7
): NetworkGraph {
  const prng = mulberry32(seed);
  const nodes: NetworkNode[] = [];
  const lines: NetworkLine[] = [];

  // Generate nodes with padding
  const padding = 60;
  for (let i = 0; i < nodeCount; i++) {
    const x = padding + prng() * (width - padding * 2);
    const y = padding + prng() * (height - padding * 2);
    const isAccent = i % 5 === 0;
    nodes.push({ x, y, isAccent });
  }

  const maxDist = Math.max(width, height) * 0.45;

  // Connect each node to its 2 nearest neighbors
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
      // Avoid duplicate lines
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
