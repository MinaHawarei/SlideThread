import { describe, it, expect } from 'vitest';
import { getTemplate } from '../../src/templates';

describe('Bold Marketing package metadata', () => {
  it('has a package-backed gallery entry and canonical ID', () => {
    const template = getTemplate('bold-marketing');
    expect(template.id).toBe('bold-marketing');
    expect(template.className).toBe('bold');
    expect(template.nameKey).toBe('wizard.template.bold-marketing');
  });
});
