import { describe, it, expect } from 'vitest';
import { getTemplate, getAllTemplates } from '../../src/templates';

describe('Template package registry', () => {
  it('lists the five starter package IDs', () => {
    expect(getAllTemplates().map((template) => template.id).sort()).toEqual([
      'bold-marketing', 'clean-minimal', 'heritage-geometric', 'soft-gradient', 'tech-mesh',
    ]);
  });

  it('resolves package IDs and rejects unknown IDs', () => {
    expect(getTemplate('tech-mesh').id).toBe('tech-mesh');
    expect(getTemplate('heritage-geometric').id).toBe('heritage-geometric');
    expect(() => getTemplate('unknown')).toThrow('Unknown template package: unknown');
  });
});
