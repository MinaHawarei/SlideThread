import { describe, it, expect } from 'vitest';
import { generateNetwork } from '@/core/network';
import { SPIKE_FORMATS } from '@/spike/types';

describe('Export Spike configuration and network generator', () => {
  it('defines the 4 required spike formats per P0-4', () => {
    const dimensions = SPIKE_FORMATS.map((f) => `${f.width}x${f.height}`);
    expect(dimensions).toContain('1080x1350');
    expect(dimensions).toContain('1080x1080');
    expect(dimensions).toContain('1080x1920');
    expect(dimensions).toContain('1920x1080');
  });

  it('generates deterministic network graph with ~100 elements', () => {
    const graph1 = generateNetwork(1080, 1350, 32, 7);
    const graph2 = generateNetwork(1080, 1350, 32, 7);

    expect(graph1.nodes.length).toBe(32);
    expect(graph1.nodes).toEqual(graph2.nodes);
    expect(graph1.lines).toEqual(graph2.lines);

    const totalElements = graph1.nodes.length + graph1.lines.length;
    expect(totalElements).toBeGreaterThanOrEqual(70);
  });
});
