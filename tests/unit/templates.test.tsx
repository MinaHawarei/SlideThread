import { describe, it, expect } from 'vitest';
import { getTemplate, getAllTemplates } from '../../src/templates';

describe('Template package registry', () => {
  it('lists the seven original built-ins plus the ten group 1 (dt-*) templates', () => {
    expect(getAllTemplates().map((template) => template.id).sort()).toEqual([
      'bold-marketing', 'clean-minimal', 'dt-arabic-green', 'dt-arabic-navy', 'dt-emerald-portal', 'dt-lime-steps', 'dt-magenta-noir', 'dt-mint-swipe', 'dt-phosphor-terminal', 'dt-purple-code', 'dt-signal-red', 'dt-teal-lab', 'golden-hour-viral', 'heritage-geometric', 'neon-grid-process', 'soft-gradient', 'tech-mesh',
    ]);
  });

  it('resolves package IDs and rejects unknown IDs', () => {
    expect(getTemplate('tech-mesh').id).toBe('tech-mesh');
    expect(getTemplate('heritage-geometric').id).toBe('heritage-geometric');
    expect(() => getTemplate('unknown')).toThrow('Unknown template package: unknown');
  });
});
