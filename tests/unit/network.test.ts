import { describe, it, expect } from 'vitest';
import {
  generateCarouselNetwork,
  generateNetwork,
  mulberry32,
  NETWORK_BASE_MAX_DISTANCE,
  NETWORK_NODES_PER_SLIDE,
} from '../../src/core/network';

describe('Network Algorithm & Cross-Slide Continuity (Spec §7.1)', () => {
  it('mulberry32 PRNG is strictly deterministic', () => {
    const rng1 = mulberry32(7);
    const rng2 = mulberry32(7);

    for (let i = 0; i < 50; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('generates exactly 8 nodes per slide width', () => {
    const slideWidth = 1080;
    const slideHeight = 1350;

    const singleSlide = generateCarouselNetwork(slideWidth, slideHeight, 1, 7);
    expect(singleSlide.nodes.length).toBe(NETWORK_NODES_PER_SLIDE * 1); // 8 nodes

    const threeSlides = generateCarouselNetwork(slideWidth, slideHeight, 3, 7);
    expect(threeSlides.nodes.length).toBe(NETWORK_NODES_PER_SLIDE * 3); // 24 nodes

    const sevenSlides = generateCarouselNetwork(slideWidth, slideHeight, 7, 7);
    expect(sevenSlides.nodes.length).toBe(NETWORK_NODES_PER_SLIDE * 7); // 56 nodes
  });

  it('marks every 5th node as an accent ring node', () => {
    const network = generateCarouselNetwork(1080, 1350, 5, 7);

    network.nodes.forEach((node, idx) => {
      if (idx % 5 === 0) {
        expect(node.isAccent).toBe(true);
      } else {
        expect(node.isAccent).toBe(false);
      }
    });
  });

  it('respects the maximum connection distance threshold (< 560px scaled)', () => {
    const width = 1080;
    const height = 1350;
    const scale = Math.min(width, height) / 1080; // 1.0
    const maxDist = NETWORK_BASE_MAX_DISTANCE * scale;

    const network = generateCarouselNetwork(width, height, 4, 7);

    expect(network.lines.length).toBeGreaterThan(0);

    for (const line of network.lines) {
      const dist = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
      expect(dist).toBeLessThanOrEqual(maxDist + 0.001);
    }
  });

  it('is completely deterministic across re-renders with the same seed', () => {
    const run1 = generateCarouselNetwork(1080, 1350, 4, 7);
    const run2 = generateCarouselNetwork(1080, 1350, 4, 7);

    expect(run1.nodes).toEqual(run2.nodes);
    expect(run1.lines).toEqual(run2.lines);
  });

  it('verifies cross-slide boundary continuity across adjacent slides', () => {
    const slideWidth = 1080;
    const slideHeight = 1350;
    const slideCount = 4;

    const network = generateCarouselNetwork(slideWidth, slideHeight, slideCount, 7);

    // Look for lines that cross the boundary between slide 0 and slide 1 (x = 1080)
    // or between slide 1 and slide 2 (x = 2160), etc.
    const boundaries = [slideWidth, slideWidth * 2, slideWidth * 3];

    const boundaryCrossingLines = network.lines.filter((line) => {
      return boundaries.some((boundary) => {
        const minX = Math.min(line.x1, line.x2);
        const maxX = Math.max(line.x1, line.x2);
        return minX < boundary && maxX > boundary;
      });
    });

    // In a multi-slide carousel, nodes connect across slide boundaries
    expect(boundaryCrossingLines.length).toBeGreaterThan(0);

    // Verify mathematical continuity at the boundary intersection
    for (const line of boundaryCrossingLines) {
      for (const boundary of boundaries) {
        const minX = Math.min(line.x1, line.x2);
        const maxX = Math.max(line.x1, line.x2);
        if (minX < boundary && maxX > boundary) {
          // Intersection y = y1 + (y2 - y1) * (boundary - x1) / (x2 - x1)
          const t = (boundary - line.x1) / (line.x2 - line.x1);
          const yAtBoundary = line.y1 + (line.y2 - line.y1) * t;

          // Must be within canvas height
          expect(yAtBoundary).toBeGreaterThanOrEqual(0);
          expect(yAtBoundary).toBeLessThanOrEqual(slideHeight);

          // In slide N (global coords [boundary - slideWidth, boundary]), local exit is at x = slideWidth, y = yAtBoundary
          // In slide N+1 (global coords [boundary, boundary + slideWidth]), local entrance is at x = 0, y = yAtBoundary
          // Because both slides share the continuous global coordinate space, lines seamlessly match.
        }
      }
    }
  });

  it('backward-compatible generateNetwork works for single slide spike', () => {
    const net = generateNetwork(1080, 1080, 20, 7);
    expect(net.nodes.length).toBe(20);
    expect(net.lines.length).toBeGreaterThan(0);
  });
});
